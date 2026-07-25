import { config } from './config.js';

let map = null;
let imageryLayer = null;
let labelsLayer = null;
let miniMap = null;
let drawnItems = [];
let measureLine = null;
let isDrawing = false;
let isMeasuring = false;

/**
 * Initialize the main map
 */
export function initMap() {
  map = L.map('map', {
    center: config.map.defaultCenter,
    zoom: config.map.defaultZoom,
    minZoom: config.map.minZoom,
    maxZoom: config.map.maxZoom,
    worldCopyJump: true
  });

  // Add base tile layer (OpenStreetMap as fallback)
  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  });

  // Initialize latest imagery layer
  imageryLayer = L.tileLayer(config.tiles.latest, {
    attribution: '© Esri World Imagery',
    opacity: 1
  });

  // Initialize labels layer
  labelsLayer = L.tileLayer(config.tiles.labels, {
    attribution: '© Esri Reference',
    opacity: 0.8
  });

  // Add imagery layer by default
  imageryLayer.addTo(map);

  // Add scale control
  L.control.scale({
    position: 'bottomleft',
    metric: true,
    imperial: true
  }).addTo(map);

  // Add coordinates display
  const coordinatesControl = L.control({ position: 'bottomleft' });
  coordinatesControl.onAdd = function() {
    this._div = L.DomUtil.create('div', 'coordinates-display');
    this.update('Lat: 0.0000, Lng: 0.0000');
    return this._div;
  };
  coordinatesControl.update = function(coords) {
    this._div.innerHTML = coords;
  };
  coordinatesControl.addTo(map);

  // Update coordinates on mouse move
  map.on('mousemove', function(e) {
    coordinatesControl.update(
      `Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`
    );
  });

  return map;
}

/**
 * Load Wayback imagery for a specific release
 */
export function loadWaybackImagery(release) {
  if (!release) return;

  showLoading(true);

  // Remove existing imagery layer
  if (imageryLayer) {
    map.removeLayer(imageryLayer);
  }

  // Use the imageUrl from the release object, or fall back to latest
  const tileUrl = release.imageUrl || config.tiles.latest;
  
  // Create new tile layer with Wayback URL
  imageryLayer = L.tileLayer(tileUrl, {
    attribution: '© Esri Wayback Imagery',
    opacity: parseFloat(document.getElementById('opacity-slider')?.value || 100) / 100
  });

  imageryLayer.addTo(map);
  imageryLayer.bringToFront();

  // Keep labels on top if enabled
  if (document.getElementById('labels-toggle')?.checked) {
    labelsLayer.bringToFront();
  }

  setTimeout(() => {
    showLoading(false);
  }, 1000);
}

/**
 * Load latest World Imagery
 */
export function loadLatestImagery() {
  if (imageryLayer) {
    map.removeLayer(imageryLayer);
  }

  imageryLayer = L.tileLayer(config.tiles.latest, {
    attribution: '© Esri World Imagery',
    opacity: parseFloat(document.getElementById('opacity-slider')?.value || 100) / 100
  });

  imageryLayer.addTo(map);
}

/**
 * Toggle labels layer
 */
export function toggleLabels(show) {
  if (show) {
    if (!map.hasLayer(labelsLayer)) {
      labelsLayer.addTo(map);
    }
    labelsLayer.bringToFront();
  } else {
    if (map.hasLayer(labelsLayer)) {
      map.removeLayer(labelsLayer);
    }
  }
}

/**
 * Set layer opacity
 */
export function setOpacity(value) {
  if (imageryLayer) {
    imageryLayer.setOpacity(value);
  }
}

/**
 * Navigate to Tomas Oppus
 */
export function goToTomasOppus() {
  map.flyTo([config.tomasOppus.lat, config.tomasOppus.lng], config.tomasOppus.zoom, {
    duration: 2
  });
}

/**
 * Search and navigate to location
 */
export async function searchLocation(query) {
  if (!query.trim()) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const results = await response.json();

    if (results && results.length > 0) {
      const result = results[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      map.flyTo([lat, lng], 16, { duration: 2 });

      // Add temporary marker
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(result.display_name).openPopup();

      setTimeout(() => {
        map.removeLayer(marker);
      }, 10000);

      return { lat, lng, name: result.display_name };
    }

    return null;
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

/**
 * Get current coordinates
 */
export function getCurrentCoordinates() {
  const center = map.getCenter();
  return {
    lat: center.lat,
    lng: center.lng,
    zoom: map.getZoom()
  };
}

/**
 * Copy coordinates to clipboard
 */
export function copyCoordinates() {
  const coords = getCurrentCoordinates();
  const text = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Coordinates copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy coordinates', 'error');
  });
}

/**
 * Export coordinates to file
 */
export function exportCoordinates() {
  const coords = getCurrentCoordinates();
  const data = {
    latitude: coords.lat,
    longitude: coords.lng,
    zoom: coords.zoom,
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coordinates-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Coordinates exported!', 'success');
}

/**
 * Enable measure mode
 */
export function toggleMeasure() {
  isMeasuring = !isMeasuring;
  isDrawing = false;

  if (isMeasuring) {
    map.getContainer().style.cursor = 'crosshair';
    showToast('Click on map to measure distance. Click again to add points. Right-click to finish.', 'info');
    
    map.on('click', handleMeasureClick);
    map.on('contextmenu', finishMeasure);
  } else {
    cleanupDrawing();
  }
}

/**
 * Handle measure click
 */
function handleMeasureClick(e) {
  if (!measureLine) {
    measureLine = L.polyline([[e.latlng.lat, e.latlng.lng]], {
      color: '#ff0000',
      weight: 3,
      dashArray: '10, 10'
    }).addTo(map);
  } else {
    measureLine.addLatLng(e.latlng);
  }

  updateMeasureDisplay();
}

/**
 * Update measure display
 */
function updateMeasureDisplay() {
  if (!measureLine) return;

  const latlngs = measureLine.getLatLngs();
  if (latlngs.length < 2) return;

  let distance = 0;
  for (let i = 1; i < latlngs.length; i++) {
    distance += latlngs[i - 1].distanceTo(latlngs[i]);
  }

  const text = distance >= 1000 
    ? `${(distance / 1000).toFixed(2)} km`
    : `${distance.toFixed(2)} m`;

  if (measureLine._tooltip) {
    measureLine._tooltip.setContent(text);
  } else {
    measureLine.bindTooltip(text, { sticky: true }).openTooltip();
  }
}

/**
 * Finish measuring
 */
function finishMeasure(e) {
  e.preventDefault();
  isMeasuring = false;
  map.off('click', handleMeasureClick);
  map.off('contextmenu', finishMeasure);
  map.getContainer().style.cursor = '';
  showToast(`Total distance: ${measureLine ? getMeasureDistance() : '0 m'}`, 'info');
}

/**
 * Get measure distance string
 */
function getMeasureDistance() {
  if (!measureLine) return '0 m';
  
  const latlngs = measureLine.getLatLngs();
  if (latlngs.length < 2) return '0 m';

  let distance = 0;
  for (let i = 1; i < latlngs.length; i++) {
    distance += latlngs[i - 1].distanceTo(latlngs[i]);
  }

  return distance >= 1000 
    ? `${(distance / 1000).toFixed(2)} km`
    : `${distance.toFixed(2)} m`;
}

/**
 * Toggle draw polygon mode
 */
export function toggleDraw() {
  isDrawing = !isDrawing;
  isMeasuring = false;

  if (isDrawing) {
    map.getContainer().style.cursor = 'crosshair';
    showToast('Click to add polygon points. Right-click or double-click to finish.', 'info');
    
    const polygonPoints = [];
    let polygon = null;

    function handleDrawClick(e) {
      polygonPoints.push(e.latlng);
      
      if (polygon) {
        map.removeLayer(polygon);
      }
      
      polygon = L.polygon(polygonPoints, {
        color: '#00ff00',
        fillColor: '#00ff00',
        fillOpacity: 0.3
      }).addTo(map);
      
      drawnItems.push(polygon);
    }

    function finishDraw(e) {
      if (e) e.preventDefault();
      isDrawing = false;
      map.off('click', handleDrawClick);
      map.off('contextmenu', finishDraw);
      map.off('dblclick', finishDraw);
      map.getContainer().style.cursor = '';
      
      if (polygonPoints.length >= 3) {
        const area = getPolygonArea(polygonPoints);
        showToast(`Polygon area: ${formatArea(area)}`, 'info');
      }
    }

    map.on('click', handleDrawClick);
    map.on('contextmenu', finishDraw);
    map.on('dblclick', finishDraw);
  } else {
    cleanupDrawing();
  }
}

/**
 * Calculate polygon area (simplified)
 */
function getPolygonArea(latlngs) {
  // Simple approximation using Haversine formula
  let area = 0;
  const R = 6378137; // Earth radius in meters
  
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    const p1 = latlngs[i];
    const p2 = latlngs[j];
    
    area += (p2.lng - p1.lng) * (2 * Math.sin(Math.PI / 180) + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
  }
  
  return Math.abs(area * R * R / 2);
}

/**
 * Format area string
 */
function formatArea(area) {
  if (area >= 1000000) {
    return `${(area / 1000000).toFixed(2)} km²`;
  } else if (area >= 10000) {
    return `${(area / 10000).toFixed(2)} ha`;
  } else {
    return `${area.toFixed(2)} m²`;
  }
}

/**
 * Cleanup drawing tools
 */
function cleanupDrawing() {
  isMeasuring = false;
  isDrawing = false;
  map.getContainer().style.cursor = '';
  
  if (measureLine) {
    map.removeLayer(measureLine);
    measureLine = null;
  }
  
  map.off('click', handleMeasureClick);
  map.off('contextmenu', finishMeasure);
}

/**
 * Clear all drawn items
 */
export function clearDrawnItems() {
  drawnItems.forEach(item => map.removeLayer(item));
  drawnItems = [];
  cleanupDrawing();
}

/**
 * Toggle geolocation
 */
export function locateUser() {
  if ('geolocation' in navigator) {
    showToast('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 16, { duration: 2 });
        
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup('📍 You are here!')
          .openPopup();
        
        showToast('Location found!', 'success');
      },
      (error) => {
        showToast('Unable to get your location', 'error');
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    showToast('Geolocation not supported', 'error');
  }
}

/**
 * Show/hide loading spinner
 */
export function showLoading(show) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.classList.toggle('hidden', !show);
  }
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, config.ui.toastDuration);
}

/**
 * Get map instance
 */
export function getMap() {
  return map;
}

/**
 * Get imagery layer
 */
export function getImageryLayer() {
  return imageryLayer;
}
