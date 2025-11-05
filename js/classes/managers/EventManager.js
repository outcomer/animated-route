/**
 * Manager for attaching and handling all UI event listeners
 */
export class EventManager {
	/**
	 * Create a new EventManager instance
	 * @param {Object} ui - UIController instance
	 * @param {Object} state - Application state
	 * @param {Object} map - Leaflet map instance
	 * @param {Object} storageManager - StorageManager instance
	 * @param {Object} gpxManager - GPXManager instance
	 * @param {Object} endingScenarioManager - EndingScenarioManager instance
	 * @param {Object} recordingManager - RecordingManager instance
	 * @param {Object} animationController - AnimationController instance
	 * @param {Object} animator - RouteAnimator instance
	 */
	constructor(ui, state, map, storageManager, gpxManager, endingScenarioManager, recordingManager, animationController, animator) {
		this.ui = ui;
		this.state = state;
		this.map = map;
		this.storageManager = storageManager;
		this.gpxManager = gpxManager;
		this.endingScenarioManager = endingScenarioManager;
		this.recordingManager = recordingManager;
		this.animationController = animationController;
		this.animator = animator;
	}

	/**
	 * Attach all event listeners to UI controls
	 */
	attachAll() {
		this.attachAnimationEvents();
		this.attachSliderEvents();
		this.attachWeightEvents();
		this.attachRecordingEvents();
		this.attachFileEvents();
		this.attachToggleEvents();
		this.attachSelectEvents();
	}

	/**
	 * Attach animation control events
	 */
	attachAnimationEvents() {
		this.ui.startBtn.addEventListener('click', () => {
			if (!this.state.fullRoute || this.state.fullRoute.length === 0) {
				alert('Please load a GPX file first');
				return;
			}
			this.animationController.startAnimation(this.animator);
		});
	}

	/**
	 * Attach slider events (duration and zoom)
	 */
	attachSliderEvents() {
		this.ui.durationSlider.addEventListener('input', (e) => {
			const value = parseInt(e.target.value);
			this.state.animationDuration = value;
			this.ui.updateDurationLabel(value);
			this.storageManager.save('animationDuration', value);
		});

		this.ui.durationSlider.addEventListener('change', (e) => {
			const value = parseInt(e.target.value);
			this.state.animationDuration = value;
			this.ui.updateDurationLabel(value);
			this.storageManager.save('animationDuration', value);
		});

		this.ui.zoomSlider.addEventListener('input', (e) => {
			const newZoom = parseInt(e.target.value);
			this.state.routeZoom = newZoom;
			this.ui.updateZoomLabel(newZoom);
			this.storageManager.save('routeZoom', newZoom);

			// Only set zoom if it's different to avoid infinite loop
			if (this.map.getZoom() !== newZoom) {
				this.map.setZoom(newZoom);
			}
		});

		this.ui.zoomSlider.addEventListener('change', (e) => {
			const newZoom = parseInt(e.target.value);
			this.state.routeZoom = newZoom;
			this.ui.updateZoomLabel(newZoom);
			this.storageManager.save('routeZoom', newZoom);

			// Only set zoom if it's different to avoid infinite loop
			if (this.map.getZoom() !== newZoom) {
				this.map.setZoom(newZoom);
			}
		});
	}

	/**
	 * Attach weight input events
	 */
	attachWeightEvents() {
		this.ui.weightInput.addEventListener('input', (e) => {
			const weight = parseInt(e.target.value);
			this.storageManager.save('weight', weight);
			if (this.state.fullRoute && this.state.fullRoute.length > 0) {
				this.gpxManager.calculateAndDisplayMetrics(this.state.fullRoute);
			}
		});
	}

	/**
	 * Attach recording button events
	 */
	attachRecordingEvents() {
		if (this.ui.recordBtn) {
			this.ui.recordBtn.addEventListener('click', () => {
				if (!this.recordingManager.isSupported()) {
					alert('Screen recording is not supported on this device/browser. Please use a desktop browser with screen capture support.');
					return;
				}
				if (!this.state.fullRoute || this.state.fullRoute.length === 0) {
					alert('Please load a GPX file first');
					return;
				}
				console.log('Record button clicked');
				this.recordingManager.startRecording(() => {
					this.animationController.startAnimation(this.animator);
				});
			});
		} else {
			console.error('Record button not found!');
		}
	}

	/**
	 * Attach file upload and delete events
	 */
	attachFileEvents() {
		// Handle upload button click - trigger file input
		const uploadGpxBtn = document.getElementById('uploadGpxBtn');
		if (uploadGpxBtn) {
			uploadGpxBtn.addEventListener('click', () => {
				this.ui.gpxFileInput.click();
			});
		}

		this.ui.gpxFileInput.addEventListener('change', (e) => {
			this.gpxManager.handleGPXUpload(e, (fileName) => {
				this.ui.gpxFileName.textContent = `📄 ${fileName}`;
				this.ui.deleteGpxBtn.classList.add('visible');

				// Clear animation state
				if (this.animator.animatedLine) {
					this.map.removeLayer(this.animator.animatedLine);
					this.animator.animatedLine = null;
				}
				this.animator.clearSegments();
				this.animator.currentStep = 0;
			});
		});

		this.ui.deleteGpxBtn.addEventListener('click', () => {
			this.gpxManager.deleteTrack(() => {
				// Clear animation state
				if (this.animator.animatedLine) {
					this.map.removeLayer(this.animator.animatedLine);
					this.animator.animatedLine = null;
				}
				this.animator.clearSegments();
				this.animator.currentStep = 0;

				this.ui.gpxFileName.textContent = 'No track loaded';
				this.ui.deleteGpxBtn.classList.remove('visible');
			});
		});

		this.ui.toggleControlsBtn.addEventListener('click', () => {
			this.ui.toggleControls();
		});
	}

	/**
	 * Attach toggle events (densified, camera follow)
	 */
	attachToggleEvents() {
		this.ui.densifiedToggle.addEventListener('change', (e) => {
			const useDensified = e.target.checked;
			this.storageManager.save('useDensified', useDensified);

			const appData = this.storageManager.load();
			if (appData && appData.gpx) {
				const gpxToDisplay = useDensified && appData.gpxDensified ? appData.gpxDensified : appData.gpx;
				this.gpxManager.parseAndDisplayGPX(gpxToDisplay);
				console.log('Switched to', useDensified ? 'densified' : 'original', 'track');
			}
		});

		this.ui.cameraFollowToggle.addEventListener('change', (e) => {
			const cameraFollow = e.target.checked;
			this.state.cameraFollow = cameraFollow;
			this.storageManager.save('cameraFollow', cameraFollow);
			console.log('Camera follow:', cameraFollow ? 'enabled' : 'disabled');
		});
	}

	/**
	 * Attach select dropdown events (map style, ending scenario, video format)
	 */
	attachSelectEvents() {
		this.ui.mapStyleSelect.addEventListener('change', (e) => {
			const styleKey = e.target.value;
			this.storageManager.save('mapStyle', styleKey);
		});

		this.ui.endingScenarioSelect.addEventListener('change', (e) => {
			const scenario = e.target.value;
			this.storageManager.save('endingScenario', scenario);
			// Apply scenario immediately if track is loaded
			if (this.state.fullRoute && this.state.fullRoute.length > 0) {
				this.endingScenarioManager.applyCurrentScenario();
			}
		});
	}
}
