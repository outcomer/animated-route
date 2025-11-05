const DEFAULT_WEIGHT = 80;

/**
 * Manager for handling localStorage operations
 */
export class StorageManager {
	/**
	 * Create a new StorageManager instance
	 * @param {string} hostname - Current hostname for storage key
	 */
	constructor(hostname) {
		this.storageKey = `${hostname}_appData`;
	}

	/**
	 * Initialize application data structure in localStorage
	 * @param {number} initialZoom - Default initial zoom level
	 */
	initAppData(initialZoom) {
		try {
			const appDataStr = localStorage.getItem(this.storageKey);
			if (!appDataStr) {
				const defaultData = {
					gpx: null,
					gpxDensified: null,
					gpxFileName: null,
					weight: DEFAULT_WEIGHT,
					useDensified: true,
					cameraFollow: true,
					mapStyle: 'light',
					endingScenario: 'squint',
					animationDuration: 60,
					routeZoom: initialZoom,
					videoFormat: '16:9'
				};
				localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
			}
		} catch (error) {
			console.error('Error initializing app data:', error);
		}
	}

	/**
	 * Load application data from localStorage
	 * @param {string|null} option - Specific data key to load, or null for all data
	 * @returns {*} The requested data or null if not found
	 */
	load(option = null) {
		try {
			const appDataStr = localStorage.getItem(this.storageKey);
			if (!appDataStr) return null;

			const appData = JSON.parse(appDataStr);

			if (option) {
				return appData[option];
			}

			return appData;
		} catch (error) {
			console.error('Error loading app data:', error);
			return null;
		}
	}

	/**
	 * Save specific application data field to localStorage
	 * @param {string} option - Data key to save
	 * @param {*} value - Value to save
	 */
	save(option, value) {
		try {
			const appDataStr = localStorage.getItem(this.storageKey);
			const appData = appDataStr ? JSON.parse(appDataStr) : {
				gpx: null,
				gpxFileName: null,
				weight: DEFAULT_WEIGHT
			};

			appData[option] = value;

			localStorage.setItem(this.storageKey, JSON.stringify(appData));
		} catch (error) {
			console.error('Error saving app data:', error);
		}
	}

	/**
	 * Get default weight value
	 * @returns {number} Default weight
	 */
	static getDefaultWeight() {
		return DEFAULT_WEIGHT;
	}
}
