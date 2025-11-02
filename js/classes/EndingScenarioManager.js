/**
 * Manager for handling ending scenarios after animation completion
 */
export class EndingScenarioManager {
	/**
	 * Create a new EndingScenarioManager instance
	 * @param {UIController} ui - UI controller instance
	 * @param {Object} map - Leaflet map instance
	 * @param {Object} state - Application state
	 */
	constructor(ui, map, state) {
		this.ui = ui;
		this.map = map;
		this.state = state;
		this.infoBox = document.querySelector('.info-box');
	}

	/**
	 * Show the info box
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
	 * Update info box with track metrics
	 * @param {Object} data - Track metrics data
	 */
	updateInfoBox(data) {
		const progress = this.infoBox.querySelector('#progress');
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
	}

	/**
	 * Execute the appropriate ending scenario based on user settings
	 * @param {Function} showControlsCallback - Callback to show controls after scenario
	 */
	execute(showControlsCallback) {
		const scenario = this.ui.getEndingScenario();

		switch (scenario) {
			case 'show_stats':
				this.showStatistics(showControlsCallback);
				break;
			case 'hide_all':
				this.hideAll(showControlsCallback);
				break;
			default:
				this.showStatistics(showControlsCallback);
		}
	}

	/**
	 * Apply the current scenario without animation (for initial load or scenario change)
	 */
	applyCurrentScenario() {
		const scenario = this.ui.getEndingScenario();

		switch (scenario) {
			case 'show_stats':
				this.showInfoBox();
				break;
			case 'hide_all':
				this.hideInfoBox();
				break;
			default:
				this.showInfoBox();
		}
	}

	/**
	 * Show statistics ending scenario
	 * @param {Function} showControlsCallback - Callback to show controls
	 */
	showStatistics(showControlsCallback) {
		// Show info box with statistics
		this.showInfoBox();

		// Fit map to route bounds
		if (this.state.cameraFollow) {
			const allCoords = this.state.fullRoute.map(p => [p.lat, p.lng]);
			const bounds = L.latLngBounds(allCoords);
			const currentZoom = this.map.getZoom();

			this.map.flyToBounds(bounds, {
				duration: 1.5,
				maxZoom: currentZoom,
				padding: [50, 50]
			});
		}

		// Show controls after delay
		setTimeout(() => {
			if (showControlsCallback) {
				showControlsCallback();
			}
		}, 2000);
	}

	/**
	 * Hide all ending scenario
	 * @param {Function} showControlsCallback - Callback to show controls
	 */
	hideAll(showControlsCallback) {
		// Hide info box
		this.hideInfoBox();

		// Fit map to route bounds
		if (this.state.cameraFollow) {
			const allCoords = this.state.fullRoute.map(p => [p.lat, p.lng]);
			const bounds = L.latLngBounds(allCoords);
			const currentZoom = this.map.getZoom();

			this.map.flyToBounds(bounds, {
				duration: 1.5,
				maxZoom: currentZoom,
				padding: [50, 50]
			});
		}

		// Show controls after delay
		setTimeout(() => {
			if (showControlsCallback) {
				showControlsCallback();
			}
		}, 2000);
	}

}
