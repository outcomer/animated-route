/**
 * Controller for managing UI elements and interactions
 */
export class UIController {
	constructor() {
		this.controls = document.querySelector('.controls');
		this.infoBox = document.querySelector('.info-box');
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
		this.gpxFileInput = document.getElementById('gpxFile');
		this.gpxFileName = document.getElementById('gpxFileName');
		this.deleteGpxBtn = document.getElementById('deleteGpxBtn');
		this.toggleControlsBtn = document.getElementById('toggleControlsBtn');

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
	 * Show the info box with track metrics
	 */
	showInfoBox() {
		this.infoBox.classList.remove('hidden');
	}

	/**
	 * Hide the info box
	 */
	hideInfoBox() {
		this.infoBox.classList.add('hidden');
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
	 * Update info box with track data
	 * @param {Object} data - Track metrics data
	 * @param {string} data.title - Track title
	 * @param {number} data.distance - Distance in km
	 * @param {Object} data.elevation - Elevation data
	 * @param {number} data.elevation.gain - Elevation gain in meters
	 * @param {number} data.elevation.loss - Elevation loss in meters
	 * @param {string} data.movingSpeed - Average speed in km/h
	 * @param {string} data.maxSpeed - Maximum speed in km/h
	 * @param {string} data.movingTime - Moving time formatted
	 * @param {string} data.totalTime - Total time formatted
	 * @param {number} data.calories - Estimated calories burned
	 */
	updateInfoBox(data) {
		this.infoBox.innerHTML = `
			<h2>${data.title}</h2>
			<p><span class="material-symbols-outlined" title="Distance">straighten</span> ${data.distance.toFixed(2)} km</p>
			<p><span class="material-symbols-outlined" title="Elevation gain">trending_up</span> ${Math.round(data.elevation.gain)} m</p>
			<p><span class="material-symbols-outlined" title="Elevation loss">trending_down</span> ${Math.round(data.elevation.loss)} m</p>
			<p><span class="material-symbols-outlined" title="Average speed">speed</span> ${data.movingSpeed} km/h</p>
			<p><span class="material-symbols-outlined" title="Maximum speed">flash_on</span> ${data.maxSpeed} km/h</p>
			<p><span class="material-symbols-outlined" title="Time in motion">timer</span> ${data.movingTime}</p>
			<p><span class="material-symbols-outlined" title="Total time">schedule</span> ${data.totalTime}</p>
			<p><span class="material-symbols-outlined" title="Calories burned">whatshot</span> ~${data.calories} kcal</p>
			<div class="progress" id="progress"></div>
		`;
		this.progress = document.getElementById('progress');
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
}
