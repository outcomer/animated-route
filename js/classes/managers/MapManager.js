const MAP_STYLES = {
	light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
	dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
	voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
	osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	osm_hot: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
	cyclosm: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
	satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
	street: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
	topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
};

/**
 * Manager for Leaflet map initialization and styling
 */
export class MapManager {
	/**
	 * Create a new MapManager instance
	 * @param {number} initialZoom - Initial zoom level
	 */
	constructor(initialZoom) {
		this.initialZoom = initialZoom;
		this.map = null;
		this.tileLayer = null;
		this.startIcon = null;
		this.endIcon = null;
	}

	/**
	 * Initialize Leaflet map with default settings
	 * @returns {Object} Leaflet map instance
	 */
	initMap() {
		this.map = L.map('map', {
			zoomAnimation: true,
			fadeAnimation: true,
			markerZoomAnimation: true,
			zoomControl: false
		}).setView([49.997, 14.24], this.initialZoom);

		this.tileLayer = L.tileLayer(MAP_STYLES['light'], {
			attribution: '© OpenStreetMap © CartoDB',
			maxZoom: 18,
			keepBuffer: 6,
			updateWhenIdle: false,
			updateWhenZooming: false
		}).addTo(this.map);

		this.startIcon = L.divIcon({
			html: '<span class="material-symbols-outlined marker-filled" style="font-size: 40px; color: #00b607;">location_on</span>',
			className: 'custom-marker-icon',
			iconSize: [40, 40],
			iconAnchor: [20, 35],
			popupAnchor: [0, -35]
		});

		this.endIcon = L.divIcon({
			html: '<span class="material-symbols-outlined marker-filled" style="font-size: 40px; color: #ff0000;">location_on</span>',
			className: 'custom-marker-icon',
			iconSize: [40, 40],
			iconAnchor: [20, 35],
			popupAnchor: [0, -35]
		});

		return this.map;
	}

	/**
	 * Attach zoom change event listener
	 * @param {Function} callback - Callback function to execute on zoom change
	 */
	onZoomChange(callback) {
		this.map.on('zoomend', () => {
			const currentZoom = this.map.getZoom();
			callback(currentZoom);
		});
	}

	/**
	 * Change the map tile style
	 * @param {string} styleKey - Map style identifier from MAP_STYLES
	 */
	changeStyle(styleKey) {
		const tileUrl = MAP_STYLES[styleKey];
		if (!tileUrl) {
			console.error('Unknown map style:', styleKey);
			return;
		}

		if (this.tileLayer) {
			this.map.removeLayer(this.tileLayer);
		}

		this.tileLayer = L.tileLayer(tileUrl, {
			attribution: '© OpenStreetMap © CartoDB',
			maxZoom: 18,
			keepBuffer: 6,
			updateWhenIdle: false,
			updateWhenZooming: false
		}).addTo(this.map);

		console.log('Map style changed to:', styleKey);
	}

	/**
	 * Get the map instance
	 * @returns {Object} Leaflet map instance
	 */
	getMap() {
		return this.map;
	}

	/**
	 * Get start marker icon
	 * @returns {Object} Leaflet icon instance
	 */
	getStartIcon() {
		return this.startIcon;
	}

	/**
	 * Get end marker icon
	 * @returns {Object} Leaflet icon instance
	 */
	getEndIcon() {
		return this.endIcon;
	}
}
