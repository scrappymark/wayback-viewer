/**
 * Render metadata panel with release information
 */
export function renderMetadata(metadata) {
  const metadataDiv = document.getElementById('metadata');
  
  if (!metadataDiv) return;
  
  if (!metadata) {
    metadataDiv.innerHTML = '<p class="loading">Select a release to view metadata</p>';
    return;
  }
  
  metadataDiv.innerHTML = `
    <div class="metadata-item">
      <span class="metadata-label">Release</span>
      <span class="metadata-value">${metadata.name}</span>
    </div>
    
    <div class="metadata-item">
      <span class="metadata-label">Release Date</span>
      <span class="metadata-value">${metadata.releaseDate}</span>
    </div>
    
    <div class="metadata-item">
      <span class="metadata-label">Provider</span>
      <span class="metadata-value">${metadata.provider}</span>
    </div>
    
    <div class="metadata-item">
      <span class="metadata-label">Resolution</span>
      <span class="metadata-value">${metadata.resolution}</span>
    </div>
    
    <div class="metadata-item">
      <span class="metadata-label">Capture Date</span>
      <span class="metadata-value">${metadata.captureDate}</span>
    </div>
  `;
}

/**
 * Clear metadata display
 */
export function clearMetadata() {
  const metadataDiv = document.getElementById('metadata');
  if (metadataDiv) {
    metadataDiv.innerHTML = '<p class="loading">Select a release to view metadata</p>';
  }
}

/**
 * Show loading state in metadata panel
 */
export function showMetadataLoading() {
  const metadataDiv = document.getElementById('metadata');
  if (metadataDiv) {
    metadataDiv.innerHTML = '<p class="loading">Loading metadata...</p>';
  }
}

/**
 * Update specific metadata field
 */
export function updateMetadataField(field, value) {
  const metadataDiv = document.getElementById('metadata');
  if (!metadataDiv) return;
  
  const fieldElement = metadataDiv.querySelector(`[data-field="${field}"]`);
  if (fieldElement) {
    fieldElement.textContent = value;
  }
}
