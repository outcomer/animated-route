import { UIController } from './UIController.js';
import { RouteAnimator } from './RouteAnimator.js';
import { FirebaseAnalytics } from './FirebaseAnalytics.js';
import { StorageManager } from './managers/StorageManager.js';
import { MapManager } from './managers/MapManager.js';
import { GPXManager } from './managers/GPXManager.js';
import { AnimationController } from './managers/AnimationController.js';
import { RecordingManager } from './managers/RecordingManager.js';
import { EventManager } from './managers/EventManager.js';
import { EndingScenarioManager } from './managers/EndingScenarioManager.js';

/**
 * Main application class for GPX track visualization
 * Coordinates all managers and components
 */
export class TrackVisualization {
	/**
	 * Create a new TrackVisualization instance
	 * @param {Object} state - Application state configuration
	 */
	constructor(state) {
		this.state = state;

		// Initialize managers
		this.storageManager = new StorageManager(window.location.hostname);
		this.storageManager.initAppData(this.state.initialZoom);

		this.mapManager = new MapManager(this.state.initialZoom);
		this.map = this.mapManager.initMap();

		this.ui = new UIController();
		this.endingScenarioManager = new EndingScenarioManager(this.ui, this.map, this.state);

		this.gpxManager = new GPXManager(
			this.map,
			this.state,
			this.mapManager,
			this.storageManager,
			this.endingScenarioManager
		);

		this.animator = new RouteAnimator(this.map, this.state, this.ui, this);

		this.animationController = new AnimationController(
			this.map,
			this.state,
			this.ui,
			this.gpxManager,
			this.endingScenarioManager
		);

		this.recordingManager = new RecordingManager(
			this.map,
			this.storageManager,
			this.ui
		);

		this.eventManager = new EventManager(
			this.ui,
			this.state,
			this.map,
			this.storageManager,
			this.gpxManager,
			this.endingScenarioManager,
			this.recordingManager,
			this.animationController,
			this.animator
		);

		this.analytics = new FirebaseAnalytics();

		// Initialize application
		this.initFirebase();
		this.initUI();
		this.loadInitialData();
		this.attachEventListeners();
	}

	/**
	 * Initialize Firebase connection and load animation count
	 */
	initFirebase() {
		const firebaseConfig = {
			databaseURL: "https://my-own-data-297a0-default-rtdb.europe-west1.firebasedatabase.app",
		};

		const initialized = this.analytics.init(firebaseConfig);

		if (initialized) {
			this.analytics.getAnimationCount().then(count => {
				this.ui.updateAnimationCount(count);
			});

			this.analytics.onAnimationCountChange((count) => {
				this.ui.updateAnimationCount(count);
			});
		} else {
			this.ui.updateAnimationCount(0);
		}
	}

	/**
	 * Initialize UI controls with saved values
	 */
	initUI() {
		const appData = this.storageManager.load();
		if (!appData) return;

		this.ui.initDuration(this.state.animationDuration);
		this.ui.initZoom(this.state.routeZoom);
		this.ui.initWeight(appData.weight);
		this.ui.initDensifiedToggle(appData.useDensified);
		this.ui.initCameraFollowToggle(appData.cameraFollow);
		this.ui.initEndingScenario(appData.endingScenario);

		this.state.cameraFollow = appData.cameraFollow;

		this.ui.mapStyleSelect.value = appData.mapStyle;

		// Setup map zoom change listener
		this.mapManager.onZoomChange((currentZoom) => {
			this.ui.zoomSlider.value = currentZoom;
			this.ui.zoomSlider.dispatchEvent(new Event('input'));
		});

		// Setup map style change listener with actual style change
		this.ui.mapStyleSelect.addEventListener('change', (e) => {
			this.mapManager.changeStyle(e.target.value);
		});

		// Apply initial map style
		this.mapManager.changeStyle(appData.mapStyle);
	}

	/**
	 * Load initial application data on startup
	 */
	loadInitialData() {
		try {
			const appData = this.storageManager.load();
			if (!appData) {
				this.ui.gpxFileName.textContent = 'No track loaded';
				this.ui.deleteGpxBtn.classList.remove('visible');
				return;
			}

			this.state.animationDuration = appData.animationDuration;
			this.ui.initDuration(appData.animationDuration);

			this.state.routeZoom = appData.routeZoom;
			this.ui.initZoom(appData.routeZoom);

			if (appData.gpx && appData.gpxFileName) {
				const gpxToDisplay = appData.useDensified && appData.gpxDensified ? appData.gpxDensified : appData.gpx;
				this.gpxManager.parseAndDisplayGPX(gpxToDisplay, false);
				this.ui.gpxFileName.textContent = `📄 ${appData.gpxFileName}`;
				this.ui.deleteGpxBtn.classList.add('visible');
				console.log('Loaded app data from localStorage');
				console.log('Using', appData.useDensified ? 'densified' : 'original', 'track');

				const bounds = this.gpxManager.getFullRouteLine().getBounds();
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
	 * Attach event listeners to UI controls
	 */
	attachEventListeners() {
		this.eventManager.attachAll();
	}
}
