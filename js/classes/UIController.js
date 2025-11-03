/**
 * Controller for managing UI elements and interactions
 */
export class UIController {
	constructor() {
		this.controls = document.querySelector('.controls');
		this.progress = document.getElementById('progress');
		this.startBtn = document.getElementById('startBtn');
		this.recordBtn = document.getElementById('recordBtn');
		this.durationSlider = document.getElementById('durationSlider');
		this.durationLabel = document.getElementById('durationLabel');
		this.zoomSlider = document.getElementById('zoomSlider');
		this.zoomLabel = document.getElementById('zoomLabel');
		this.weightInput = document.getElementById('weightInput');
		this.densifiedToggle = document.getElementById('densifiedToggle');
		this.cameraFollowToggle = document.getElementById('cameraFollowToggle');
		this.mapStyleSelect = document.getElementById('mapStyleSelect');
		this.endingScenarioSelect = document.getElementById('endingScenarioSelect');
		this.gpxFileInput = document.getElementById('gpxFile');
		this.gpxFileName = document.getElementById('gpxFileName');
		this.deleteGpxBtn = document.getElementById('deleteGpxBtn');
		this.toggleControlsBtn = document.getElementById('toggleControlsBtn');
		this.animationCountDisplay = document.getElementById('animationCount');

		this.isControlsOpen = true;
		this.isControlsVisible = true;

		this.initOutsideClickHandler();
		this.updateControlsVisibility();
	}

	/**
	 * Initialize click handler to close sidebar when clicking outside
	 */
	initOutsideClickHandler() {
		document.addEventListener('click', (e) => {
			if (this.isControlsOpen &&
				!this.controls.contains(e.target) &&
				!this.toggleControlsBtn.contains(e.target)) {
				this.isControlsOpen = false;
				this.updateControlsVisibility();
			}
		});
	}

	/**
	 * Show animated countdown (3, 2, 1) before animation starts
	 */
	async showCountdown() {
		this.hideControls();

		const countdown = document.createElement('div');
		countdown.className = 'countdown';
		document.body.appendChild(countdown);

		const numbers = [3, 2, 1];

		for (const number of numbers) {
			countdown.textContent = number;
			countdown.style.animation = 'none';
			await new Promise(resolve => setTimeout(resolve, 10));
			countdown.style.animation = 'pulse 0.25s ease-in-out';
			await new Promise(resolve => setTimeout(resolve, 500));
		}

		countdown.remove();
		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	/**
	 * Show controls panel and open sidebar
	 */
	showControls() {
		this.isControlsVisible = true;
		this.isControlsOpen = true;
		this.updateControlsVisibility();
	}

	/**
	 * Hide controls panel and close sidebar
	 */
	hideControls() {
		this.isControlsVisible = false;
		this.isControlsOpen = false;
		this.updateControlsVisibility();
	}

	/**
	 * Update controls visibility based on current state
	 */
	updateControlsVisibility() {
		if (this.isControlsVisible) {
			this.toggleControlsBtn.classList.remove('hidden');
			this.controls.classList.remove('hidden');
			if (this.isControlsOpen) {
				this.controls.classList.add('open');
			} else {
				this.controls.classList.remove('open');
			}
		} else {
			this.toggleControlsBtn.classList.add('hidden');
			this.controls.classList.add('hidden');
			this.controls.classList.remove('open');
		}
	}

	/**
	 * Update progress display during animation
	 * @param {number} percent - Completion percentage (0-100)
	 */
	updateProgress(percent) {
		this.progress.textContent = `${percent}% completed`;
	}

	/**
	 * Set progress display to completion state
	 */
	setProgressComplete() {
		this.progress.textContent = '';
	}

	/**
	 * Clear progress display
	 */
	clearProgress() {
		this.progress.textContent = '';
	}

	/**
	 * Update duration label display
	 * @param {number} duration - Animation duration in seconds
	 */
	updateDurationLabel(duration) {
		this.durationLabel.textContent = duration;
	}

	/**
	 * Initialize duration slider with value
	 * @param {number} duration - Initial duration in seconds
	 */
	initDuration(duration) {
		this.durationSlider.value = duration;
		this.updateDurationLabel(duration);
	}

	/**
	 * Update zoom label display
	 * @param {number} zoom - Zoom level
	 */
	updateZoomLabel(zoom) {
		this.zoomLabel.textContent = zoom;
	}

	/**
	 * Initialize zoom slider with value
	 * @param {number} zoom - Initial zoom level
	 */
	initZoom(zoom) {
		this.zoomSlider.value = zoom;
		this.updateZoomLabel(zoom);
	}

	/**
	 * Update zoom slider and label
	 * @param {number} zoom - New zoom level
	 */
	updateZoomSlider(zoom) {
		this.zoomSlider.value = zoom;
		this.updateZoomLabel(zoom);
	}

	/**
	 * Initialize weight input with value
	 * @param {number} weight - User weight in kg
	 */
	initWeight(weight) {
		this.weightInput.value = weight;
	}

	/**
	 * Initialize ending scenario selector with value
	 * @param {string} scenario - Ending scenario value
	 */
	initEndingScenario(scenario) {
		this.endingScenarioSelect.value = scenario;
	}

	/**
	 * Get current ending scenario value
	 * @returns {string} Current ending scenario
	 */
	getEndingScenario() {
		return this.endingScenarioSelect.value;
	}

	/**
	 * Initialize densified track toggle
	 * @param {boolean} useDensified - Whether to use densified track
	 */
	initDensifiedToggle(useDensified) {
		this.densifiedToggle.checked = useDensified;
	}

	/**
	 * Initialize camera follow toggle
	 * @param {boolean} cameraFollow - Whether camera should follow route
	 */
	initCameraFollowToggle(cameraFollow) {
		this.cameraFollowToggle.checked = cameraFollow;
	}

	/**
	 * Toggle controls panel open/closed state
	 */
	toggleControls() {
		if (!this.isControlsVisible) return;
		this.isControlsOpen = !this.isControlsOpen;
		this.updateControlsVisibility();
	}

	/**
	 * Update animation counter display
	 * @param {number} count - Current animation count
	 */
	updateAnimationCount(count) {
		if (this.animationCountDisplay) {
			this.animationCountDisplay.textContent = count.toLocaleString();
		}
	}
}
