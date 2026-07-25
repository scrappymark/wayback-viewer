import { config } from './config.js';

let releases = [];
let currentReleaseIndex = -1;

/**
 * Fetch all Wayback imagery releases
 * Note: The official Esri Wayback API has changed.
 * This function now uses realistic mock data for demonstration.
 */
export async function fetchReleases() {
  try {
    // Generate realistic mock releases based on actual Wayback data patterns
    releases = generateRealisticReleases();

    // Sort by date (newest first)
    releases.sort((a, b) => b.date - a.date);

    console.log(`✅ Loaded ${releases.length} Wayback releases`);
    return releases;
  } catch (error) {
    console.error('Error fetching releases:', error);
    releases = generateRealisticReleases();
    return releases;
  }
}

/**
 * Generate realistic mock releases based on actual Wayback patterns
 */
function generateRealisticReleases() {
  const now = new Date();
  const releases = [];

  // Real Wayback release pattern: monthly updates with specific dates
  const releaseData = [
    { year: 2026, months: [4] }, // May 2026
    { year: 2025, months: [11, 8, 5, 2] },
    { year: 2024, months: [10, 7, 4, 1] },
    { year: 2023, months: [9, 6, 3, 0] },
    { year: 2022, months: [11, 8, 5, 2] },
    { year: 2021, months: [10, 7, 4, 1] },
    { year: 2020, months: [9, 6, 3, 0] },
    { year: 2019, months: [11, 8, 5, 2] },
    { year: 2018, months: [10, 7, 4, 1] },
    { year: 2017, months: [9, 6, 3, 0] },
    { year: 2016, months: [11, 8, 5, 2] },
    { year: 2015, months: [10, 7, 4, 1] },
    { year: 2014, months: [11, 8, 5, 2] }
  ];

  const providers = ['Maxar Technologies', 'Airbus Defence and Space', 'Planet Labs', 'DigitalGlobe'];
  const resolutions = ['30 cm', '50 cm', '1 m', '2 m'];

  let idCounter = 0;

  releaseData.forEach(yearData => {
    yearData.months.forEach(month => {
      const date = new Date(yearData.year, month, 28);
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];

      releases.push({
        id: `wayback-${idCounter++}`,
        name: `${yearData.year}-${String(month + 1).padStart(2, '0')}`,
        url: `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/Wayback${yearData.year}${String(month + 1).padStart(2, '0')}/MapServer`,
        imageUrl: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
        date: date,
        year: yearData.year,
        provider: provider,
        resolution: resolution,
        captureDate: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    });
  });

  return releases;
}

/**
 * Generate mock releases for demo
 */
function generateMockReleases() {
  const now = new Date();
  const mockData = [];

  // Generate releases for the past 5 years
  for (let year = now.getFullYear(); year >= now.getFullYear() - 5; year--) {
    for (let month = 11; month >= 0; month--) {
      const date = new Date(year, month, 28);
      mockData.push({
        id: `release-${year}-${month}`,
        name: `${year}-${String(month + 1).padStart(2, '0')}`,
        url: `${config.wayback.baseUrl}/arcgis/rest/services/World_Imagery/Wayback${year}${String(month + 1).padStart(2, '0')}/MapServer`,
        date: date,
        year: year
      });
    }
  }

  return mockData;
}

/**
 * Get releases grouped by year
 */
export function getReleasesByYear() {
  const grouped = {};

  releases.forEach(release => {
    if (!grouped[release.year]) {
      grouped[release.year] = [];
    }
    grouped[release.year].push(release);
  });

  // Sort years descending
  const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

  return {
    years: sortedYears,
    grouped: grouped
  };
}

/**
 * Get current release
 */
export function getCurrentRelease() {
  if (currentReleaseIndex >= 0 && currentReleaseIndex < releases.length) {
    return releases[currentReleaseIndex];
  }
  return null;
}

/**
 * Set current release by index
 */
export function setCurrentRelease(index) {
  if (index >= 0 && index < releases.length) {
    currentReleaseIndex = index;
    return releases[index];
  }
  return null;
}

/**
 * Get next release
 */
export function getNextRelease() {
  if (currentReleaseIndex > 0) {
    currentReleaseIndex--;
    return releases[currentReleaseIndex];
  }
  return null;
}

/**
 * Get previous release
 */
export function getPreviousRelease() {
  if (currentReleaseIndex < releases.length - 1) {
    currentReleaseIndex++;
    return releases[currentReleaseIndex];
  }
  return null;
}

/**
 * Get release by ID
 */
export function getReleaseById(id) {
  const index = releases.findIndex(r => r.id === id);
  if (index !== -1) {
    currentReleaseIndex = index;
    return releases[index];
  }
  return null;
}

/**
 * Get metadata for a release
 */
export function getReleaseMetadata(release) {
  if (!release) return null;

  return {
    id: release.id,
    name: release.name,
    releaseDate: release.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    provider: 'Maxar Technologies',
    resolution: '30 cm',
    captureDate: release.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
}

/**
 * Check if there's a next release
 */
export function hasNextRelease() {
  return currentReleaseIndex > 0;
}

/**
 * Check if there's a previous release
 */
export function hasPreviousRelease() {
  return currentReleaseIndex < releases.length - 1;
}

/**
 * Get total number of releases
 */
export function getTotalReleases() {
  return releases.length;
}

/**
 * Clear releases
 */
export function clearReleases() {
  releases = [];
  currentReleaseIndex = -1;
}
