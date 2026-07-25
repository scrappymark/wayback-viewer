import { getReleasesByYear } from './wayback.js';

let timelineElement = null;
let yearDropdown = null;
let isInitialized = false;

/**
 * Initialize the timeline UI
 */
export function initTimeline() {
  timelineElement = document.getElementById('timeline');
  yearDropdown = document.getElementById('year-dropdown');
  
  if (!timelineElement || !yearDropdown) {
    console.error('Timeline elements not found');
    return;
  }

  if (!isInitialized) {
    yearDropdown.addEventListener('change', event => {
      if (event.target.value) {
        selectYear(event.target.value);
      }
    });
    isInitialized = true;
  }
}

/**
 * Render the timeline with releases
 */
export function renderTimeline(releases) {
  if (!timelineElement || !yearDropdown) return;
  
  const data = getReleasesByYear();
  const { years, grouped } = data;
  
  // Clear existing content
  timelineElement.innerHTML = '';
  
  // Create year dropdown options
  yearDropdown.innerHTML = '<option value="">Select Year</option>';
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearDropdown.appendChild(option);
  });

  if (years.length === 0) {
    yearDropdown.disabled = true;
    timelineElement.innerHTML = '<p class="loading">No timelines available for this area</p>';
    return;
  }

  yearDropdown.disabled = false;
  
  // Set first year as default if available
  if (years.length > 0) {
    yearDropdown.value = years[0];
  }
  
  // Create timeline visualization
  const timelineViz = document.createElement('div');
  timelineViz.className = 'timeline-visualization';
  
  // Create year points
  const yearPoints = document.createElement('div');
  yearPoints.className = 'year-points';
  
  years.forEach((year, index) => {
    const point = document.createElement('div');
    point.className = 'year-point';
    point.dataset.year = year;
    point.dataset.count = grouped[year].length;
    
    const label = document.createElement('span');
    label.className = 'year-label';
    label.textContent = year;
    
    point.appendChild(label);
    yearPoints.appendChild(point);
    
    // Add click handler
    point.addEventListener('click', () => {
      selectYear(year);
    });
  });
  
  // Create connecting line
  const line = document.createElement('div');
  line.className = 'timeline-line';
  
  timelineViz.appendChild(line);
  timelineViz.appendChild(yearPoints);
  timelineElement.appendChild(timelineViz);
  
  // Show release count for selected year
  if (years.length > 0) {
    showYearInfo(years[0], grouped[years[0]].length);
  }
}

/**
 * Select a specific year
 */
function selectYear(year) {
  const data = getReleasesByYear();
  const releases = data.grouped[year];
  
  if (!releases || releases.length === 0) return;
  
  // Update dropdown
  yearDropdown.value = year;
  
  // Highlight selected year
  document.querySelectorAll('.year-point').forEach(point => {
    point.classList.toggle('active', point.dataset.year === year);
  });

  showYearInfo(year, releases.length);
  
  // Show first release of that year
  if (releases.length > 0) {
    const event = new CustomEvent('wayback:yearSelected', {
      detail: { year, releases }
    });
    window.dispatchEvent(event);
  }
}

/**
 * Show year information
 */
function showYearInfo(year, count) {
  const infoDiv = document.createElement('div');
  infoDiv.className = 'year-info';
  infoDiv.innerHTML = `
    <span class="year-title">${year}</span>
    <span class="release-count">${count} release${count !== 1 ? 's' : ''}</span>
  `;
  
  const existing = timelineElement.querySelector('.year-info');
  if (existing) {
    existing.remove();
  }
  
  timelineElement.appendChild(infoDiv);
}

/**
 * Update timeline with current release
 */
export function updateTimelineCurrent(release) {
  if (!release || !yearDropdown) return;
  
  // Update dropdown
  yearDropdown.value = release.year;
  
  // Highlight current year
  document.querySelectorAll('.year-point').forEach(point => {
    point.classList.toggle('active', point.dataset.year === String(release.year));
  });
  
  // Show release info
  const shortMonth = release.date.toLocaleDateString('en-US', {
    month: 'short',
    timeZone: 'UTC'
  });
  
  showReleaseInfo(release.name, `${shortMonth} ${release.date.getUTCDate()}`);
}

/**
 * Show release information
 */
function showReleaseInfo(name, date) {
  const releaseInfo = document.createElement('div');
  releaseInfo.className = 'release-info';
  releaseInfo.innerHTML = `
    <span class="release-name">${name}</span>
    <span class="release-date">${date}</span>
  `;
  
  const existing = timelineElement.querySelector('.release-info');
  if (existing) {
    existing.remove();
  }
  
  timelineElement.appendChild(releaseInfo);
}

/**
 * Navigate to next year in timeline
 */
export function nextYear() {
  const currentYear = yearDropdown.value;
  const data = getReleasesByYear();
  const currentIndex = data.years.indexOf(currentYear);
  
  if (currentIndex > 0 && currentIndex < data.years.length) {
    const nextYearValue = data.years[currentIndex - 1];
    selectYear(nextYearValue);
  }
}

/**
 * Navigate to previous year in timeline
 */
export function previousYear() {
  const currentYear = yearDropdown.value;
  const data = getReleasesByYear();
  const currentIndex = data.years.indexOf(currentYear);
  
  if (currentIndex >= 0 && currentIndex < data.years.length - 1) {
    const prevYearValue = data.years[currentIndex + 1];
    selectYear(prevYearValue);
  }
}

/**
 * Get selected year from dropdown
 */
export function getSelectedYear() {
  return yearDropdown?.value || null;
}

/**
 * Set up year dropdown change handler
 */
export function onYearChange(callback) {
  if (yearDropdown) {
    yearDropdown.addEventListener('change', (e) => {
      if (e.target.value) {
        callback(e.target.value);
      }
    });
  }
}
