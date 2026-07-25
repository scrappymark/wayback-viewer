// Main application entry point
import { initMap, getMap, loadWaybackImagery, loadLatestImagery, toggleLabels, setOpacity, goToTomasOppus, searchLocation, copyCoordinates, exportCoordinates, toggleMeasure, toggleDraw, locateUser, showToast } from './map.js';
import { fetchReleases, getCurrentRelease, getNextRelease, getPreviousRelease, getReleaseById, getReleaseMetadata, hasNextRelease, hasPreviousRelease } from './wayback.js';
import { initTimeline, renderTimeline, updateTimelineCurrent } from './timeline.js';
import { renderMetadata } from './metadata.js';
import { initUI, updateNavigationButtons, initResponsive } from './ui.js';

// Application state
let currentRelease = null;
let isDarkMode = false;
let areaRequestController = null;
let areaRefreshTimer = null;

/**
 * Initialize the application
 */
async function initApp() {
  console.log('🛰 Initializing Wayback Viewer...');
  
  // Initialize map
  const map = initMap();
  console.log('✅ Map initialized');
  
  // Initialize UI components
  initTimeline();
  initResponsive();
  console.log('✅ UI initialized');
  
  // Setup event handlers
  setupEventHandlers();
  setupAreaChangeHandler(map);
  console.log('✅ Event handlers setup');
  
  // Fetch releases available at the initial map location.
  await loadReleasesForArea(map, true);
  
  // Show welcome message
  showToast('Welcome to Wayback Viewer! 🛰', 'success');
  
  console.log('🎉 Wayback Viewer ready!');
}

/**
 * Load and display releases
 */
async function loadReleasesForArea(map, announce = false) {
  areaRequestController?.abort();
  areaRequestController = new AbortController();
  const requestController = areaRequestController;
  const center = map.getCenter();

  try {
    if (announce) {
      showToast('Loading available timelines...', 'info');
    }
    
    const releases = await fetchReleases(
      { latitude: center.lat, longitude: center.lng },
      map.getZoom(),
      { signal: requestController.signal }
    );

    if (requestController !== areaRequestController) return;
    
    renderTimeline(releases);
    
    if (releases.length > 0) {
      loadRelease(getCurrentRelease());
      if (announce) {
        showToast(`Loaded ${releases.length} available timeline${releases.length === 1 ? '' : 's'}`, 'success');
      }
    } else {
      currentRelease = null;
      renderMetadata(null);
      updateNavigationState();
      loadLatestImagery();
      showToast('No archived imagery changes are available for this area', 'info');
    }
  } catch (error) {
    if (error.name === 'AbortError' || requestController.signal.aborted) return;

    console.error('Failed to load releases:', error);
    showToast('Failed to load timelines for this area', 'error');
  }
}

/**
 * Refresh available releases whenever the visible map area changes.
 */
function setupAreaChangeHandler(map) {
  const refresh = () => {
    clearTimeout(areaRefreshTimer);
    areaRefreshTimer = setTimeout(() => {
      loadReleasesForArea(map);
    }, 250);
  };

  map.on('moveend zoomend', refresh);
}

/**
 * Setup all event handlers
 */
function setupEventHandlers() {
  initUI({
    onSearch: handleSearch,
    onGeolocation: handleGeolocation,
    onDarkMode: handleDarkMode,
    onTomasOppus: handleTomasOppus,
    onPrevious: handlePreviousRelease,
    onNext: handleNextRelease,
    onOpacityChange: handleOpacityChange,
    onLabelsToggle: handleLabelsToggle,
    onMeasure: handleMeasure,
    onDraw: handleDraw,
    onExportCoords: handleExportCoords,
    onCopyCoords: handleCopyCoords,
    onEscape: handleEscape
  });
  
  // Listen for year selection events
  window.addEventListener('wayback:yearSelected', handleYearSelected);
}

/**
 * Handle search
 */
async function handleSearch(query) {
  if (!query.trim()) {
    showToast('Please enter a search term', 'warning');
    return;
  }
  
  showToast('Searching...', 'info');
  const result = await searchLocation(query);
  
  if (result) {
    showToast(`Found: ${result.name}`, 'success');
  } else {
    showToast('Location not found', 'error');
  }
}

/**
 * Handle geolocation
 */
function handleGeolocation() {
  locateUser();
}

/**
 * Handle Tomas Oppus navigation
 */
function handleTomasOppus() {
  goToTomasOppus();
  showToast('Jumping to Tomas Oppus, Philippines 📍', 'info');
}

/**
 * Handle dark mode toggle
 */
function handleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  
  const btn = document.getElementById('dark-mode-btn');
  if (btn) {
    btn.textContent = isDarkMode ? '☀️' : '🌙';
  }
  
  showToast(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
}

/**
 * Handle previous release navigation
 */
function handlePreviousRelease() {
  const release = getPreviousRelease();
  if (release) {
    loadRelease(release);
  } else {
    showToast('No earlier releases available', 'info');
  }
}

/**
 * Handle next release navigation
 */
function handleNextRelease() {
  const release = getNextRelease();
  if (release) {
    loadRelease(release);
  } else {
    showToast('No later releases available', 'info');
  }
}

/**
 * Handle year selection
 */
function handleYearSelected(event) {
  const { year, releases } = event.detail;
  
  if (releases && releases.length > 0) {
    // Load the most recent release for that year
    loadRelease(releases[0]);
    showToast(`Showing ${year} imagery`, 'info');
  }
}

/**
 * Handle opacity change
 */
function handleOpacityChange(value) {
  setOpacity(value);
}

/**
 * Handle labels toggle
 */
function handleLabelsToggle(show) {
  toggleLabels(show);
  showToast(show ? 'Labels enabled' : 'Labels disabled', 'info');
}

/**
 * Handle measure tool
 */
function handleMeasure() {
  toggleMeasure();
}

/**
 * Handle draw tool
 */
function handleDraw() {
  toggleDraw();
}

/**
 * Handle export coordinates
 */
function handleExportCoords() {
  exportCoordinates();
}

/**
 * Handle copy coordinates
 */
function handleCopyCoords() {
  copyCoordinates();
}

/**
 * Handle escape key
 */
function handleEscape() {
  // Clear any active drawing/measuring tools
  const measureBtn = document.getElementById('measure-btn');
  const drawBtn = document.getElementById('draw-btn');
  
  if (measureBtn?.classList.contains('active')) {
    measureBtn.click();
  }
  
  if (drawBtn?.classList.contains('active')) {
    drawBtn.click();
  }
}

/**
 * Load a specific release
 */
function loadRelease(release) {
  const selectedRelease = getReleaseById(release?.id);
  if (!selectedRelease) return;

  currentRelease = selectedRelease;
  
  // Update UI
  updateTimelineCurrent(selectedRelease);
  updateNavigationState();
  
  // Render metadata
  const metadata = getReleaseMetadata(selectedRelease);
  renderMetadata(metadata);
  
  loadWaybackImagery(selectedRelease);
  
  console.log(`🗺️ Loaded release: ${selectedRelease.name}`);
}

/**
 * Update navigation button states
 */
function updateNavigationState() {
  updateNavigationButtons(hasPreviousRelease(), hasNextRelease());
}

/**
 * Jump to Tomas Oppus (convenience function)
 */
export function jumpToTomasOppus() {
  goToTomasOppus();
  showToast('Jumping to Tomas Oppus, Philippines 📍', 'info');
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for external access
window.waybackViewer = {
  jumpToTomasOppus,
  loadLatestImagery,
  toggleDarkMode: handleDarkMode,
  getMap
};
