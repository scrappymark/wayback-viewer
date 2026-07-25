import { config } from './config.js';

let releases = [];
let currentReleaseIndex = -1;
let waybackItemsPromise = null;
const areaReleaseCache = new Map();

/**
 * Fetch the Wayback releases that contain imagery changes at a map location.
 */
export async function fetchReleases(point, zoom, options = {}) {
  if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
    throw new Error('A valid map location is required to load Wayback releases.');
  }

  const level = Math.max(config.map.minZoom, Math.min(config.map.maxZoom, Math.round(zoom)));
  const { column, row } = getTileCoordinates(point, level);
  const cacheKey = `${level}/${row}/${column}`;

  let availableReleases = areaReleaseCache.get(cacheKey);

  if (!availableReleases) {
    const waybackItems = await getWaybackItems();
    const candidates = await getLocalChangeCandidates(
      waybackItems,
      { column, row, level },
      options.signal
    );
    const releaseNumbers = new Set(
      filterDuplicateCandidates(candidates, level).map(candidate => candidate.releaseNumber)
    );

    availableReleases = waybackItems.filter(item => releaseNumbers.has(item.releaseNum));
    areaReleaseCache.set(cacheKey, availableReleases);
  }

  releases = availableReleases;
  currentReleaseIndex = releases.length ? 0 : -1;

  console.log(`Loaded ${releases.length} Wayback releases for tile ${cacheKey}`);
  return releases;
}

async function getWaybackItems() {
  if (!waybackItemsPromise) {
    waybackItemsPromise = loadWaybackConfig().catch(error => {
      waybackItemsPromise = null;
      throw error;
    });
  }

  return waybackItemsPromise;
}

async function loadWaybackConfig() {
  let response;

  try {
    response = await fetch(config.wayback.configUrl);
    if (!response.ok) {
      throw new Error(`Wayback configuration request failed (${response.status})`);
    }
  } catch (error) {
    response = await fetch('./waybackconfig.json');
    if (!response.ok) {
      throw new Error(`Local Wayback configuration request failed (${response.status})`);
    }
  }

  return normalizeWaybackConfig(await response.json());
}

/**
 * Convert the Wayback configuration object into releases used by the viewer.
 */
export function normalizeWaybackConfig(data) {
  return Object.entries(data)
    .map(([releaseNumber, item]) => {
      const releaseDateLabel = getReleaseDateLabel(item);
      const date = new Date(`${releaseDateLabel}T00:00:00Z`);

      return {
        id: item.itemID || item.layerIdentifier || releaseNumber,
        name: releaseDateLabel,
        url: item.itemURL,
        imageUrl: toLeafletTileUrl(item.itemURL),
        date,
        year: date.getUTCFullYear(),
        releaseNum: Number(releaseNumber),
        releaseDateLabel,
        itemTitle: item.itemTitle,
        metadataLayerUrl: item.metadataLayerUrl,
        layerIdentifier: item.layerIdentifier,
        provider: 'Esri World Imagery',
        resolution: 'Varies by location',
        captureDate: 'See imagery metadata'
      };
    })
    .filter(item => Number.isFinite(item.releaseNum) && !Number.isNaN(item.date.getTime()))
    .sort((a, b) => b.date - a.date);
}

function getReleaseDateLabel(item) {
  if (item.releaseDateLabel) return item.releaseDateLabel;

  const match = item.itemTitle?.match(/(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || '';
}

function toLeafletTileUrl(url = '') {
  return url
    .replace('{level}', '{z}')
    .replace('{row}', '{y}')
    .replace('{col}', '{x}');
}

/**
 * Convert latitude/longitude to the Web Mercator tile containing the point.
 */
export function getTileCoordinates(point, zoom) {
  const scale = 2 ** zoom;
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, point.latitude));
  const longitude = ((point.longitude + 180) % 360 + 360) % 360 - 180;
  const column = Math.floor(((longitude + 180) / 360) * scale);
  const latitudeRadians = latitude * Math.PI / 180;
  const row = Math.floor(
    (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2 * scale
  );

  return { column, row };
}

async function getLocalChangeCandidates(waybackItems, tile, signal) {
  if (!waybackItems.length) return [];

  const releaseIndex = new Map(
    waybackItems.map((item, index) => [item.releaseNum, index])
  );
  const candidates = [];
  let releaseNumber = waybackItems[0].releaseNum;
  const visited = new Set();

  while (releaseNumber && !visited.has(releaseNumber)) {
    if (signal?.aborted) {
      throw new DOMException('The area request was aborted.', 'AbortError');
    }

    visited.add(releaseNumber);

    const requestUrl = `${config.wayback.tilemapBaseUrl}/tilemap/${releaseNumber}/${tile.level}/${tile.row}/${tile.column}`;
    const response = await fetch(requestUrl, { signal });

    if (!response.ok) {
      throw new Error(`Wayback availability request failed (${response.status})`);
    }

    const tilemap = await response.json();
    if (!tilemap.data?.[0]) break;

    const changedReleaseNumber = Number(tilemap.select?.[0] || releaseNumber);
    candidates.push({
      releaseNumber: changedReleaseNumber,
      size: Number(tilemap.size?.[0] || 0)
    });

    const changedReleaseIndex = releaseIndex.get(changedReleaseNumber);
    releaseNumber = changedReleaseIndex === undefined
      ? null
      : waybackItems[changedReleaseIndex + 1]?.releaseNum;
  }

  return candidates;
}

/**
 * Remove consecutive candidates with identical tile sizes, keeping the oldest.
 * At low zoom levels every candidate is retained because tile sizes are less
 * useful for identifying duplicate imagery.
 */
export function filterDuplicateCandidates(candidates, zoom) {
  if (zoom <= 11 || candidates.length < 2) return candidates;

  const groups = [];

  candidates.forEach(candidate => {
    const group = groups[groups.length - 1];
    if (!group || group[0].size !== candidate.size) {
      groups.push([candidate]);
    } else {
      group.push(candidate);
    }
  });

  return groups.map(group => group[group.length - 1]);
}

/**
 * Get releases grouped by year.
 */
export function getReleasesByYear() {
  const grouped = {};

  releases.forEach(release => {
    if (!grouped[release.year]) {
      grouped[release.year] = [];
    }
    grouped[release.year].push(release);
  });

  return {
    years: Object.keys(grouped).sort((a, b) => b - a),
    grouped
  };
}

export function getCurrentRelease() {
  return currentReleaseIndex >= 0 && currentReleaseIndex < releases.length
    ? releases[currentReleaseIndex]
    : null;
}

export function setCurrentRelease(index) {
  if (index >= 0 && index < releases.length) {
    currentReleaseIndex = index;
    return releases[index];
  }
  return null;
}

export function getNextRelease() {
  if (currentReleaseIndex > 0) {
    currentReleaseIndex--;
    return releases[currentReleaseIndex];
  }
  return null;
}

export function getPreviousRelease() {
  if (currentReleaseIndex < releases.length - 1) {
    currentReleaseIndex++;
    return releases[currentReleaseIndex];
  }
  return null;
}

export function getReleaseById(id) {
  const index = releases.findIndex(release => release.id === id);
  if (index === -1) return null;

  currentReleaseIndex = index;
  return releases[index];
}

export function getReleaseMetadata(release) {
  if (!release) return null;

  return {
    id: release.id,
    name: release.name,
    releaseDate: release.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }),
    provider: release.provider,
    resolution: release.resolution,
    captureDate: release.captureDate
  };
}

export function hasNextRelease() {
  return currentReleaseIndex > 0;
}

export function hasPreviousRelease() {
  return currentReleaseIndex >= 0 && currentReleaseIndex < releases.length - 1;
}

export function getTotalReleases() {
  return releases.length;
}

export function clearReleases() {
  releases = [];
  currentReleaseIndex = -1;
}
