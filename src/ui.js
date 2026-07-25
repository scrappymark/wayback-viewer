/**
 * Initialize UI event listeners and handlers
 */
export function initUI(handlers) {
  // Search functionality
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      handlers.onSearch?.(searchInput.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handlers.onSearch?.(searchInput.value);
      }
    });
  }
  
  // Geolocation button
  const geolocationBtn = document.getElementById('geolocation-btn');
  if (geolocationBtn) {
    geolocationBtn.addEventListener('click', () => {
      handlers.onGeolocation?.();
    });
  }
  
  // Dark mode toggle
  const darkModeBtn = document.getElementById('dark-mode-btn');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      handlers.onDarkMode?.();
    });
  }
  
  // Tomas Oppus button
  const tomasOppsBtn = document.getElementById('tomas-opps-btn');
  if (tomasOppsBtn) {
    tomasOppsBtn.addEventListener('click', () => {
      handlers.onTomasOppus?.();
    });
  }
  
  // Previous/Next buttons
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      handlers.onPrevious?.();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      handlers.onNext?.();
    });
  }
  
  // Opacity slider
  const opacitySlider = document.getElementById('opacity-slider');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      handlers.onOpacityChange?.(e.target.value / 100);
    });
  }
  
  // Labels toggle
  const labelsToggle = document.getElementById('labels-toggle');
  if (labelsToggle) {
    labelsToggle.addEventListener('change', (e) => {
      handlers.onLabelsToggle?.(e.target.checked);
    });
  }
  
  // Measure button
  const measureBtn = document.getElementById('measure-btn');
  if (measureBtn) {
    measureBtn.addEventListener('click', () => {
      handlers.onMeasure?.();
    });
  }
  
  // Draw button
  const drawBtn = document.getElementById('draw-btn');
  if (drawBtn) {
    drawBtn.addEventListener('click', () => {
      handlers.onDraw?.();
    });
  }
  
  // Export coordinates button
  const exportCoordsBtn = document.getElementById('export-coords-btn');
  if (exportCoordsBtn) {
    exportCoordsBtn.addEventListener('click', () => {
      handlers.onExportCoords?.();
    });
  }
  
  // Copy coordinates button
  const copyCoordsBtn = document.getElementById('copy-coords-btn');
  if (copyCoordsBtn) {
    copyCoordsBtn.addEventListener('click', () => {
      handlers.onCopyCoords?.();
    });
  }
  
  // Keyboard shortcuts
  setupKeyboardShortcuts(handlers);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts(handlers) {
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    switch(e.key.toLowerCase()) {
      case 'arrowleft':
        e.preventDefault();
        handlers.onPrevious?.();
        break;
        
      case 'arrowright':
        e.preventDefault();
        handlers.onNext?.();
        break;
        
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
        
      case 'd':
        e.preventDefault();
        handlers.onDarkMode?.();
        break;
        
      case 'm':
        e.preventDefault();
        handlers.onMeasure?.();
        break;
        
      case 'g':
        e.preventDefault();
        handlers.onGeolocation?.();
        break;
        
      case 'escape':
        e.preventDefault();
        handlers.onEscape?.();
        break;
    }
  });
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
  const app = document.getElementById('app');
  
  if (!document.fullscreenElement) {
    app.requestFullscreen().catch(err => {
      console.error('Error attempting to enable fullscreen:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

/**
 * Update navigation button states
 */
export function updateNavigationButtons(hasPrev, hasNext) {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) {
    prevBtn.disabled = !hasPrev;
    prevBtn.classList.toggle('disabled', !hasPrev);
  }
  
  if (nextBtn) {
    nextBtn.disabled = !hasNext;
    nextBtn.classList.toggle('disabled', !hasNext);
  }
}

/**
 * Set active year in dropdown
 */
export function setActiveYear(year) {
  const yearDropdown = document.getElementById('year-dropdown');
  if (yearDropdown) {
    yearDropdown.value = year;
  }
}

/**
 * Show/hide sidebar on mobile
 */
export function toggleSidebar(show) {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed', !show);
  }
}

/**
 * Add loading class to body
 */
export function setBodyLoading(loading) {
  document.body.classList.toggle('loading', loading);
}

/**
 * Initialize responsive behavior
 */
export function initResponsive() {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  
  function handleMobileView(e) {
    const sidebar = document.querySelector('.sidebar');
    if (e.matches) {
      // Mobile view - sidebar starts collapsed
      sidebar?.classList.add('mobile');
    } else {
      // Desktop view
      sidebar?.classList.remove('mobile');
      sidebar?.classList.remove('collapsed');
    }
  }
  
  handleMobileView(mediaQuery);
  mediaQuery.addEventListener('change', handleMobileView);
}
