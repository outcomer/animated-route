import { GPXMetrics } from './GPXMetrics.js';
import { UIController } from './UIController.js';
import { RouteAnimator } from './RouteAnimator.js';
import { GPXDensifier } from './GPXDensifier.js';
import { EndingScenarioManager } from './EndingScenarioManager.js';
import { FirebaseAnalytics } from './FirebaseAnalytics.js';

const DEFAULT_WEIGHT = 80;
const STORAGE_KEY = `${window.location.hostname}_appData`;

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
 * Main application class for GPX track visualization
 */
export class TrackVisualization {
	/**
	 * Create a new TrackVisualization instance
	 * @param {Object} state - Application state configuration
	 */
	constructor(state) {
		this.state = state;
		this.initMap();
		this.ui = new UIController();
		this.ui.initDuration(this.state.animationDuration);
		this.ui.initZoom(this.state.routeZoom);
		this.endingScenarioManager = new EndingScenarioManager(this.ui, this.map, this.state);
		this.animator = new RouteAnimator(this.map, this.state, this.ui, this);
		this.analytics = new FirebaseAnalytics();
		this.initFirebase();
		this.initAppData();
		this.loadInitialData();
		this.checkRecordingSupport();
		this.attachEventListeners();
	}

	/**
	 * Initialize Firebase connection and load animation count
	 */
	initFirebase() {
		const firebaseConfig = {
			databaseURL: "https://my-own-data-297a0-default-rtdb.europe-west1.firebasedatabase.app",
		};

		// Initialize Firebase
		const initialized = this.analytics.init(firebaseConfig);

		if (initialized) {
			// Load current count
			this.analytics.getAnimationCount().then(count => {
				this.ui.updateAnimationCount(count);
			});

			// Listen to real-time updates (if other users increment)
			this.analytics.onAnimationCountChange((count) => {
				this.ui.updateAnimationCount(count);
			});
		} else {
			// If Firebase fails, show 0
			this.ui.updateAnimationCount(0);
		}
	}

	/**
	 * Check if screen recording is supported
	 */
	checkRecordingSupport() {
		this.isRecordingSupported = navigator.mediaDevices &&
									typeof navigator.mediaDevices.getDisplayMedia === 'function';

		if (!this.isRecordingSupported) {
			console.log('Screen recording not supported on this device');
		}
	}

	/**
	 * Initialize Leaflet map with default settings
	 */
	initMap() {
		this.map = L.map('map', {
			zoomAnimation: true,
			fadeAnimation: true,
			markerZoomAnimation: true,
			zoomControl: false
		}).setView([49.997, 14.24], this.state.initialZoom);

		this.tileLayer = L.tileLayer(MAP_STYLES['light'], {
			attribution: '© OpenStreetMap © CartoDB',
			maxZoom: 18,
			keepBuffer: 6,
			updateWhenIdle: false,
			updateWhenZooming: false
		}).addTo(this.map);

		this.startIcon = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34]
		});

		this.endIcon = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34]
		});

		this.map.on('zoomend', () => {
			const currentZoom = this.map.getZoom();
			// Update slider value - this will trigger input event which saves to storage
			this.ui.zoomSlider.value = currentZoom;
			this.ui.zoomSlider.dispatchEvent(new Event('input'));
		});
	}

	/**
	 * Initialize application data structure in localStorage
	 */
	initAppData() {
		try {
			const appDataStr = localStorage.getItem(STORAGE_KEY);
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
					routeZoom: this.state.initialZoom
				};
				localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
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
	loadAppData(option = null) {
		try {
			const appDataStr = localStorage.getItem(STORAGE_KEY);
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
	saveAppData(option, value) {
		try {
			const appDataStr = localStorage.getItem(STORAGE_KEY);
			const appData = appDataStr ? JSON.parse(appDataStr) : {
				gpx: null,
				gpxFileName: null,
				weight: DEFAULT_WEIGHT
			};

			appData[option] = value;

			localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
		} catch (error) {
			console.error('Error saving app data:', error);
		}
	}

	/**
	 * Load initial application data on startup
	 */
	loadInitialData() {
		try {
			const appData = this.loadAppData();
			if (!appData) {
				this.ui.gpxFileName.textContent = 'No track loaded';
				this.ui.deleteGpxBtn.classList.remove('visible');
				return;
			}

			this.ui.initWeight(appData.weight);
			this.ui.initDensifiedToggle(appData.useDensified);
			this.ui.initCameraFollowToggle(appData.cameraFollow);
			this.state.cameraFollow = appData.cameraFollow;

			this.ui.mapStyleSelect.value = appData.mapStyle;
			this.changeMapStyle(appData.mapStyle);

			const endingScenario = appData.endingScenario || 'squint';
			this.ui.initEndingScenario(endingScenario);

			this.state.animationDuration = appData.animationDuration;
			this.ui.initDuration(appData.animationDuration);

			this.state.routeZoom = appData.routeZoom;
			this.ui.initZoom(appData.routeZoom);

			if (appData.gpx && appData.gpxFileName) {
				const gpxToDisplay = appData.useDensified && appData.gpxDensified ? appData.gpxDensified : appData.gpx;
				this.parseAndDisplayGPX(gpxToDisplay, false);
				this.ui.gpxFileName.textContent = `📄 ${appData.gpxFileName}`;
				this.ui.deleteGpxBtn.classList.add('visible');
				console.log('Loaded app data from localStorage');
				console.log('Using', appData.useDensified ? 'densified' : 'original', 'track');

				const bounds = this.fullRouteLine.getBounds();
				const center = bounds.getCenter();
				this.map.setView(center, appData.routeZoom);
			} else {
				this.map.setZoom(appData.routeZoom);
				this.ui.gpxFileName.textContent = 'No track loaded';
				this.ui.deleteGpxBtn.classList.remove('visible');
			}
		} catch (error) {
			console.error('Error loading initial data:', error);
		}
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
				this.saveAppData('routeZoom', currentZoom);
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
			const weight = this.loadAppData('weight') || DEFAULT_WEIGHT;
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
			icon: this.startIcon
		})
		.addTo(this.map)
		.bindPopup('<b>Start</b>');

		await new Promise(resolve => setTimeout(resolve, 300));

		this.endMarker = L.marker([points[points.length - 1].lat, points[points.length - 1].lng], {
			icon: this.endIcon
		})
		.addTo(this.map)
		.bindPopup('<b>Finish</b>');

		await new Promise(resolve => setTimeout(resolve, 700));
	}

	/**
	 * Change the map tile style
	 * @param {string} styleKey - Map style identifier from MAP_STYLES
	 */
	changeMapStyle(styleKey) {
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
	 * Attach event listeners to UI controls
	 */
	attachEventListeners() {
		this.ui.startBtn.addEventListener('click', () => {
			if (!this.state.fullRoute || this.state.fullRoute.length === 0) {
				alert('Please load a GPX file first');
				return;
			}
			this.startAnimation();
		});

		this.ui.durationSlider.addEventListener('input', (e) => {
			const value = parseInt(e.target.value);
			this.state.animationDuration = value;
			this.ui.updateDurationLabel(value);
			this.saveAppData('animationDuration', value);
		});

		this.ui.durationSlider.addEventListener('change', (e) => {
			const value = parseInt(e.target.value);
			this.state.animationDuration = value;
			this.ui.updateDurationLabel(value);
			this.saveAppData('animationDuration', value);
		});

		this.ui.zoomSlider.addEventListener('input', (e) => {
			const newZoom = parseInt(e.target.value);
			this.state.routeZoom = newZoom;
			this.ui.updateZoomLabel(newZoom);
			this.saveAppData('routeZoom', newZoom);

			// Only set zoom if it's different to avoid infinite loop
			if (this.map.getZoom() !== newZoom) {
				this.map.setZoom(newZoom);
			}
		});

		this.ui.zoomSlider.addEventListener('change', (e) => {
			const newZoom = parseInt(e.target.value);
			this.state.routeZoom = newZoom;
			this.ui.updateZoomLabel(newZoom);
			this.saveAppData('routeZoom', newZoom);

			// Only set zoom if it's different to avoid infinite loop
			if (this.map.getZoom() !== newZoom) {
				this.map.setZoom(newZoom);
			}
		});

		this.ui.weightInput.addEventListener('input', (e) => {
			const weight = parseInt(e.target.value);
			this.saveAppData('weight', weight);
			if (this.state.fullRoute && this.state.fullRoute.length > 0) {
				this.calculateAndDisplayMetrics(this.state.fullRoute);
			}
		});

		if (this.ui.recordBtn) {
			this.ui.recordBtn.addEventListener('click', () => {
				if (!this.isRecordingSupported) {
					alert('Screen recording is not supported on this device/browser. Please use a desktop browser with screen capture support.');
					return;
				}
				if (!this.state.fullRoute || this.state.fullRoute.length === 0) {
					alert('Please load a GPX file first');
					return;
				}
				console.log('Record button clicked');
				this.startRecording();
			});
		} else {
			console.error('Record button not found!');
		}

		// Handle upload button click - trigger file input
		const uploadGpxBtn = document.getElementById('uploadGpxBtn');
		if (uploadGpxBtn) {
			uploadGpxBtn.addEventListener('click', () => {
				this.ui.gpxFileInput.click();
			});
		}

		this.ui.gpxFileInput.addEventListener('change', (e) => {
			this.handleGPXUpload(e);
		});

		this.ui.deleteGpxBtn.addEventListener('click', () => {
			this.deleteTrack();
		});

		this.ui.toggleControlsBtn.addEventListener('click', () => {
			this.ui.toggleControls();
		});

		this.ui.densifiedToggle.addEventListener('change', (e) => {
			const useDensified = e.target.checked;
			this.saveAppData('useDensified', useDensified);

			const appData = this.loadAppData();
			if (appData && appData.gpx) {
				const gpxToDisplay = useDensified && appData.gpxDensified ? appData.gpxDensified : appData.gpx;
				this.parseAndDisplayGPX(gpxToDisplay);
				console.log('Switched to', useDensified ? 'densified' : 'original', 'track');
			}
		});

		this.ui.cameraFollowToggle.addEventListener('change', (e) => {
			const cameraFollow = e.target.checked;
			this.state.cameraFollow = cameraFollow;
			this.saveAppData('cameraFollow', cameraFollow);
			console.log('Camera follow:', cameraFollow ? 'enabled' : 'disabled');
		});

		this.ui.mapStyleSelect.addEventListener('change', (e) => {
			const styleKey = e.target.value;
			this.changeMapStyle(styleKey);
			this.saveAppData('mapStyle', styleKey);
		});

		this.ui.endingScenarioSelect.addEventListener('change', (e) => {
			const scenario = e.target.value;
			this.saveAppData('endingScenario', scenario);
			// Apply scenario immediately if track is loaded
			if (this.state.fullRoute && this.state.fullRoute.length > 0) {
				this.endingScenarioManager.applyCurrentScenario();
			}
		});
	}

	/**
	 * Start route animation sequence
	 */
	async startAnimation() {
		if (this.animator.animatedLine) {
			this.map.removeLayer(this.animator.animatedLine);
			this.animator.animatedLine = null;
		}
		this.animator.clearSegments();
		this.animator.currentStep = 0;

		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
		}
		if (this.startMarker) {
			this.map.removeLayer(this.startMarker);
		}
		if (this.endMarker) {
			this.map.removeLayer(this.endMarker);
		}
		this.endingScenarioManager.hideAllScenarios();
		this.ui.clearProgress();

		const userZoom = this.map.getZoom();
		const coords = this.state.fullRoute.map(p => [p.lat, p.lng]);
		const bounds = L.latLngBounds(coords);
		const center = bounds.getCenter();
		const duration = 4;

		this.map.setView(center, 5, { animate: true });

		await this.ui.showCountdown();

		if (this.state.cameraFollow) {
			const startPoint = this.state.fullRoute[0];
			this.map.flyTo([startPoint.lat, startPoint.lng], userZoom, {
				duration: duration
			});
		} else {
			this.map.flyTo(center, userZoom, {
				duration: duration
			});
		}

		await new Promise(resolve => setTimeout(resolve, duration * 1000));
		this.map.invalidateSize();
		await this.addMarkers(this.state.fullRoute);
		this.animator.start();
	}

	/**
	 * Handle GPX file upload
	 * @param {Event} event - File input change event
	 */
	handleGPXUpload(event) {
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
				this.saveAppData('gpx', gpxText);
				this.saveAppData('gpxDensified', gpxDensified);
				this.saveAppData('gpxFileName', file.name);
				console.log('App data saved to localStorage');
			} catch (error) {
				console.error('Error saving to localStorage:', error);
				alert('File too large to save locally');
				return;
			}

			const useDensified = this.loadAppData('useDensified') !== false;
			const gpxToDisplay = useDensified && gpxDensified ? gpxDensified : gpxText;

			this.parseAndDisplayGPX(gpxToDisplay, true);
			this.ui.gpxFileName.textContent = `📄 ${file.name}`;
			this.ui.deleteGpxBtn.classList.add('visible');

			if (this.animator.animatedLine) {
				this.map.removeLayer(this.animator.animatedLine);
				this.animator.animatedLine = null;
			}
			this.animator.clearSegments();
			this.animator.currentStep = 0;
		};

		reader.readAsText(file);
	}

	/**
	 * Delete the currently loaded track
	 */
	deleteTrack() {
		if (!confirm('Are you sure you want to delete the loaded track?')) {
			return;
		}

		this.saveAppData('gpx', null);
		this.saveAppData('gpxDensified', null);
		this.saveAppData('gpxFileName', null);

		if (this.startMarker) this.map.removeLayer(this.startMarker);
		if (this.endMarker) this.map.removeLayer(this.endMarker);
		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
			this.fullRouteLine = null;
		}
		if (this.animator.animatedLine) {
			this.map.removeLayer(this.animator.animatedLine);
			this.animator.animatedLine = null;
		}
		this.animator.clearSegments();

		this.state.fullRoute = [];
		this.state.gpxData = null;
		this.animator.currentStep = 0;

		this.ui.gpxFileName.textContent = 'No track loaded';
		this.ui.deleteGpxBtn.classList.remove('visible');
		this.endingScenarioManager.hideAllScenarios();

		this.map.setView([49.997, 14.24], this.state.initialZoom);

		console.log('Track deleted');
	}

	/**
	 * Start video recording of the route animation
	 */
	async startRecording() {
		let recordStream = null;

		try {
			recordStream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					aspectRatio: { ideal: 16/9 },
					frameRate: { ideal: 120 }
				},
				audio: false,
				systemAudio: "exclude",
				monitorTypeSurfaces: "exclude"
			});

			await document.documentElement.requestFullscreen();
			await new Promise(resolve => setTimeout(resolve, 3000));
			document.body.classList.add('recording');
			await new Promise(resolve => setTimeout(resolve, 100));
			this.map.invalidateSize();

			const options = {
				mimeType: 'video/webm;codecs=av1',
				videoBitsPerSecond: 15000000
			};

			const mediaRecorder = new MediaRecorder(recordStream, options);
			const recordedChunks = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					recordedChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const blob = new Blob(recordedChunks, { type: 'video/webm' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;

				const gpxFileName = this.loadAppData('gpxFileName') || 'track';
				const baseName = gpxFileName.replace(/\.gpx$/i, '');
				a.download = `track-${baseName}.webm`;

				a.click();
				URL.revokeObjectURL(url);

				if (recordStream) {
					recordStream.getTracks().forEach(track => track.stop());
				}

				document.body.classList.remove('recording');

				if (document.fullscreenElement) {
					document.exitFullscreen();
				}
			};

			mediaRecorder.start(1000);

			// Listen for ending scenario completion to stop recording
			const stopRecording = () => {
				if (mediaRecorder && mediaRecorder.state !== 'inactive') {
					mediaRecorder.stop();
				}
			};

			document.addEventListener('endingScenarioComplete', stopRecording, { once: true });

			this.startAnimation();

		} catch (error) {
			console.error('Error recording video:', error);
			alert('Failed to start recording. Make sure you selected the correct tab.');

			document.body.classList.remove('recording');

			if (document.fullscreenElement) {
				document.exitFullscreen();
			}
		}
	}
}
