import { GPXMetrics } from '../GPXMetrics.js';
import { GPXDensifier } from '../GPXDensifier.js';

/**
 * Manager for handling GPX file operations
 */
export class GPXManager {
	/**
	 * Create a new GPXManager instance
	 * @param {Object} map - Leaflet map instance
	 * @param {Object} state - Application state
	 * @param {Object} mapManager - MapManager instance
	 * @param {Object} storageManager - StorageManager instance
	 * @param {Object} endingScenarioManager - EndingScenarioManager instance
	 */
	constructor(map, state, mapManager, storageManager, endingScenarioManager) {
		this.map = map;
		this.state = state;
		this.mapManager = mapManager;
		this.storageManager = storageManager;
		this.endingScenarioManager = endingScenarioManager;
		this.fullRouteLine = null;
		this.startMarker = null;
		this.endMarker = null;
	}

	/**
	 * Parse GPX text and display the track on the map
	 * @param {string} gpxText - GPX file content as text
	 * @param {boolean} shouldFitBounds - Whether to fit map bounds to track
	 */
	parseAndDisplayGPX(gpxText, shouldFitBounds = false) {
		const parser = new DOMParser();
		const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
		const trkpts = gpxDoc.querySelectorAll('trkpt');

		const points = [];
		trkpts.forEach(pt => {
			const lat = parseFloat(pt.getAttribute('lat'));
			const lon = parseFloat(pt.getAttribute('lon'));
			const eleNode = pt.querySelector('ele');
			const timeNode = pt.querySelector('time');

			points.push({
				lat: lat,
				lng: lon,
				ele: eleNode ? parseFloat(eleNode.textContent) : 0,
				time: timeNode ? timeNode.textContent : null
			});
		});

		this.state.fullRoute = points;
		this.state.gpxData = points;

		this.calculateAndDisplayMetrics(points);
		this.addMarkers(points);
		this.drawFullRoute(points, shouldFitBounds);
		this.endingScenarioManager.applyCurrentScenario();
	}

	/**
	 * Draw the full route on the map
	 * @param {Array} points - Array of GPS points
	 * @param {boolean} shouldFitBounds - Whether to fit map bounds to route
	 */
	drawFullRoute(points, shouldFitBounds = true) {
		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
		}

		const coords = points.map(p => [p.lat, p.lng]);
		this.fullRouteLine = L.polyline(coords, {
			color: this.state.trackColor,
			weight: 4,
			opacity: 0.8,
			smoothFactor: 2.0
		}).addTo(this.map);

		if (shouldFitBounds) {
			this.map.fitBounds(this.fullRouteLine.getBounds(), {
				padding: [50, 50]
			});

			this.map.once('moveend', () => {
				const currentZoom = this.map.getZoom();
				this.state.routeZoom = currentZoom;
				this.storageManager.save('routeZoom', currentZoom);
			});
		}
	}

	/**
	 * Calculate and display track metrics
	 * @param {Array} points - Array of GPS points
	 */
	calculateAndDisplayMetrics(points) {
		const distance = GPXMetrics.calculateDistance(points);
		const elevation = GPXMetrics.calculateElevation(points);
		const timeData = GPXMetrics.calculateTimeAndSpeed(points);

		if (timeData) {
			const movingSpeed = (distance / (timeData.movingTime / 3600)).toFixed(1);
			const weight = this.storageManager.load('weight') || GPXManager.getDefaultWeight();
			const calories = GPXMetrics.calculateCalories(distance, timeData.movingTime, elevation.gain, weight);

			const statsData = {
				title: this.state.title,
				distance: distance,
				elevation: elevation,
				movingSpeed: movingSpeed,
				maxSpeed: timeData.maxSpeed.toFixed(1),
				movingTime: GPXMetrics.formatTime(timeData.movingTime),
				totalTime: GPXMetrics.formatTime(timeData.totalTime),
				calories: calories
			};

			this.endingScenarioManager._updateInfoBoxData(statsData);
			this.endingScenarioManager._updatePassportData(statsData);
		}
	}

	/**
	 * Add start and finish markers to the map with animation delays
	 * @param {Array} points - Array of GPS points
	 */
	async addMarkers(points) {
		if (this.startMarker) this.map.removeLayer(this.startMarker);
		if (this.endMarker) this.map.removeLayer(this.endMarker);

		this.startMarker = L.marker([points[0].lat, points[0].lng], {
			icon: this.mapManager.getStartIcon()
		})
		.addTo(this.map)
		.bindPopup('<b>Start</b>');

		await new Promise(resolve => setTimeout(resolve, 300));

		this.endMarker = L.marker([points[points.length - 1].lat, points[points.length - 1].lng], {
			icon: this.mapManager.getEndIcon()
		})
		.addTo(this.map)
		.bindPopup('<b>Finish</b>');

		await new Promise(resolve => setTimeout(resolve, 700));
	}

	/**
	 * Handle GPX file upload
	 * @param {Event} event - File input change event
	 * @param {Function} onSuccess - Callback on successful upload
	 */
	handleGPXUpload(event, onSuccess) {
		const file = event.target.files[0];
		if (!file) return;

		if (!file.name.endsWith('.gpx')) {
			alert('Please select a valid GPX file');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const gpxText = e.target.result;

			console.log('Creating densified version of the track...');
			let gpxDensified;
			try {
				gpxDensified = GPXDensifier.densify(gpxText, 5);
			} catch (error) {
				console.error('Error densifying GPX:', error);
				gpxDensified = null;
			}

			try {
				this.storageManager.save('gpx', gpxText);
				this.storageManager.save('gpxDensified', gpxDensified);
				this.storageManager.save('gpxFileName', file.name);
				console.log('App data saved to localStorage');
			} catch (error) {
				console.error('Error saving to localStorage:', error);
				alert('File too large to save locally');
				return;
			}

			const useDensified = this.storageManager.load('useDensified') !== false;
			const gpxToDisplay = useDensified && gpxDensified ? gpxDensified : gpxText;

			this.parseAndDisplayGPX(gpxToDisplay, true);

			if (onSuccess) {
				onSuccess(file.name);
			}
		};

		reader.readAsText(file);
	}

	/**
	 * Delete the currently loaded track
	 * @param {Function} onDelete - Callback after deletion
	 */
	deleteTrack(onDelete) {
		if (!confirm('Are you sure you want to delete the loaded track?')) {
			return;
		}

		this.storageManager.save('gpx', null);
		this.storageManager.save('gpxDensified', null);
		this.storageManager.save('gpxFileName', null);

		if (this.startMarker) this.map.removeLayer(this.startMarker);
		if (this.endMarker) this.map.removeLayer(this.endMarker);
		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
			this.fullRouteLine = null;
		}

		this.state.fullRoute = [];
		this.state.gpxData = null;

		this.endingScenarioManager.hideAllScenarios();

		this.map.setView([49.997, 14.24], this.state.initialZoom);

		console.log('Track deleted');

		if (onDelete) {
			onDelete();
		}
	}

	/**
	 * Remove markers from the map
	 */
	removeMarkers() {
		if (this.startMarker) {
			this.map.removeLayer(this.startMarker);
		}
		if (this.endMarker) {
			this.map.removeLayer(this.endMarker);
		}
	}

	/**
	 * Remove full route line from the map
	 */
	removeFullRouteLine() {
		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
		}
	}

	/**
	 * Get full route line instance
	 * @returns {Object|null} Leaflet polyline instance
	 */
	getFullRouteLine() {
		return this.fullRouteLine;
	}

	/**
	 * Get default weight value
	 * @returns {number} Default weight
	 */
	static getDefaultWeight() {
		return 80;
	}
}
