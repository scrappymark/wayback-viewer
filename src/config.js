// Application Configuration
export const config = {
  // Map settings
  map: {
    defaultCenter: [10.375, 124.9167], // Tomas Oppus, Philippines
    defaultZoom: 15,
    minZoom: 3,
    maxZoom: 19
  },

  // Esri Wayback endpoints
  wayback: {
    baseUrl: 'https://wayback.maptiles.arcgis.com',
    imageryService: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    releasesEndpoint: '/arcgis/rest/services/Wayback/WorldImagery/MapServer?f=json'
  },

  // Tile sources
  tiles: {
    latest: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
  },

  // Default view for Tomas Oppus
  tomasOppus: {
    lat: 10.375,
    lng: 124.9167,
    zoom: 16
  },

  // UI settings
  ui: {
    toastDuration: 3000,
    loadingTimeout: 30000
  }
};

export default config;
