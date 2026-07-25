// Main application entry point
import { initMap, loadWaybackImagery, loadLatestImagery, toggleLabels, setOpacity, goToTomasOppus, searchLocation, copyCoordinates, exportCoordinates, toggleMeasure, toggleDraw, locateUser, showToast } from './map.js';
import { fetchReleases, getCurrentRelease, getNextRelease, getPreviousRelease, getReleaseMetadata, hasNextRelease, hasPreviousRelease, setCurrentRelease } from './wayback.js';
import { initTimeline, renderTimeline, updateTimelineCurrent } from './timeline.js';
import { renderMetadata } from './metadata.js';
import { initUI, updateNavigationButtons, initResponsive } from './ui.js';

// Application state
let currentRelease = null;
let isDarkMode = false;

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
  console.log('✅ Event handlers setup');
  
  // Fetch and display releases
  await loadReleases();
  
  // Load latest imagery by default
  loadLatestImagery();
  console.log('✅ Latest imagery loaded');
  
  // Show welcome message
  showToast('Welcome to Wayback Viewer! 🛰', 'success');
  
  console.log('🎉 Wayback Viewer ready!');
}

/**
 * Load and display releases
 */
async function loadReleases() {
  try {
    showToast('Loading releases...', 'info');
    
    const releases = await fetchReleases();
    console.log(`📅 Loaded ${releases.length} releases`);
    
    renderTimeline(releases);
    
    // Set first release as current
    if (releases.length > 0) {
      setCurrentRelease(0);
      currentRelease = getCurrentRelease();
      updateTimelineCurrent(currentRelease);
      updateNavigationState();
    }
    
    showToast(`Loaded ${releases.length} releases`, 'success');
  } catch (error) {
    console.error('Failed to load releases:', error);
    showToast('Failed to load releases', 'error');
  }
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
  currentRelease = release;
  
  // Update UI
  updateTimelineCurrent(release);
  updateNavigationState();
  
  // Render metadata
  const metadata = getReleaseMetadata(release);
  renderMetadata(metadata);
  
  // Load imagery - pass the entire release object, not just URL
  loadWaybackImagery(release);
  
  console.log(`🗺️ Loaded release: ${release.name}`);
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
  getMap: () => import('./map.js').then(m => m.getMap())
};
