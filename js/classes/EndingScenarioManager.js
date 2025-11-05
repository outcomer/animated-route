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
		this.passportFrame = document.querySelector('.passport-frame');
		this.passportStats = document.querySelector('.passport-stats');
		this.squintFrame = document.querySelector('.squint-frame');
		this.squintStats = document.querySelector('.squint-stats');
	}

	/**
	 * Hide all scenario elements (use before animation starts)
	 */
	hideAllScenarios() {
		this._hideInfoBoxUI();
		this._hidePassportUI();
		this._hideSquintUI();
	}

	/**
	 * Show the info box UI
	 */
	_showInfoBoxUI() {
		this.infoBox.classList.add('visible');
	}

	/**
	 * Hide the info box UI
	 */
	_hideInfoBoxUI() {
		this.infoBox.classList.remove('visible');
	}

	/**
	 * Update info box with track metrics data
	 * @param {Object} data - Track metrics data
	 */
	_updateInfoBoxData(data) {
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
			case 'none':
				this.showNone(showControlsCallback);
				break;
			case 'info_box':
				this.showInfoBoxScenario(showControlsCallback);
				break;
			case 'passport':
				this.showPassportScenario(showControlsCallback);
				break;
			case 'squint':
				this.showSquintScenario(showControlsCallback);
				break;
			default:
				this.showNone(showControlsCallback);
		}
	}

	/**
	 * Apply the current scenario without animation (for initial load or scenario change)
	 */
	applyCurrentScenario() {
		const scenario = this.ui.getEndingScenario();

		// Reset all scenarios first
		this._hideInfoBoxUI();
		this._hidePassportUI();
		this._hideSquintUI();

		switch (scenario) {
			case 'none':
				// Everything is hidden
				break;
			case 'info_box':
				this._showInfoBoxUI();
				break;
			case 'passport':
				this._showPassportUI();
				break;
			case 'squint':
				this._showSquintUI();
				break;
			default:
				// Everything is hidden by default
				break;
		}
	}

	/**
	 * Info box ending scenario
	 * @param {Function} showControlsCallback - Callback to show controls
	 */
	showInfoBoxScenario(showControlsCallback) {
		// Show info box with statistics
		this._showInfoBoxUI();

		// Fit map to route bounds
		if (this.state.cameraFollow) {
			const allCoords = this.state.fullRoute.map(p => [p.lat, p.lng]);
			const bounds = L.latLngBounds(allCoords);
			const currentZoom = this.map.getZoom();

			// Force viewreset during fly animation to ensure polylines are redrawn
			const onMove = () => this.map.fire('viewreset');
			this.map.on('move', onMove);

			this.map.flyToBounds(bounds, {
				duration: 1.5,
				maxZoom: currentZoom,
				padding: [50, 50]
			});

			this.map.once('moveend', () => {
				this.map.off('move', onMove);
			});
		}

		// Show controls after delay and dispatch event
		setTimeout(() => {
			document.dispatchEvent(new CustomEvent('endingScenarioComplete'));

			if (showControlsCallback) {
				showControlsCallback();
			}
		}, 2000);
	}

	/**
	 * None ending scenario - hide everything
	 * @param {Function} showControlsCallback - Callback to show controls
	 */
	showNone(showControlsCallback) {
		// Hide info box
		this._hideInfoBoxUI();

		// Fit map to route bounds
		if (this.state.cameraFollow) {
			const allCoords = this.state.fullRoute.map(p => [p.lat, p.lng]);
			const bounds = L.latLngBounds(allCoords);
			const currentZoom = this.map.getZoom();

			// Force viewreset during fly animation to ensure polylines are redrawn
			const onMove = () => this.map.fire('viewreset');
			this.map.on('move', onMove);

			this.map.flyToBounds(bounds, {
				duration: 1.5,
				maxZoom: currentZoom,
				padding: [50, 50]
			});

			this.map.once('moveend', () => {
				this.map.off('move', onMove);
			});
		}

		// Show controls after delay and dispatch event
		setTimeout(() => {
			document.dispatchEvent(new CustomEvent('endingScenarioComplete'));

			if (showControlsCallback) {
				showControlsCallback();
			}
		}, 2000);
	}

	/**
	 * Update passport and squint stats bars with track metrics data
	 * @param {Object} data - Track metrics data
	 */
	_updatePassportData(data) {
		const statsHTML = `
			<div class="passport-stat">
				<span class="material-symbols-outlined" title="Distance">straighten</span>
				<span>${data.distance.toFixed(2)} km</span>
			</div>
			<div class="passport-stat">
				<span class="material-symbols-outlined" title="Elevation gain">trending_up</span>
				<span>${Math.round(data.elevation.gain)} m</span>
			</div>
			<div class="passport-stat">
				<span class="material-symbols-outlined" title="Elevation loss">trending_down</span>
				<span>${Math.round(data.elevation.loss)} m</span>
			</div>
			<div class="passport-stat">
				<span class="material-symbols-outlined" title="Average speed">speed</span>
				<span>${data.movingSpeed} km/h</span>
			</div>
			<div class="passport-stat">
				<span class="material-symbols-outlined" title="Maximum speed">flash_on</span>
				<span>${data.maxSpeed} km/h</span>
			</div>
			<div class="passport-stat">
				<span class="material-symbols-outlined" title="Time in motion">timer</span>
				<span>${data.movingTime}</span>
			</div>
			<div class="passport-stat">
				<span class="material-symbols-outlined" title="Total time">schedule</span>
				<span>${data.totalTime}</span>
			</div>
			<div class="passport-stat">
				<span class="material-symbols-outlined" title="Calories burned">whatshot</span>
				<span>~${data.calories} kcal</span>
			</div>
		`;
		this.passportStats.innerHTML = statsHTML;
		this.squintStats.innerHTML = statsHTML.replace(/passport-stat/g, 'squint-stat');
	}

	/**
	 * Show passport frame UI
	 */
	_showPassportUI() {
		this.passportFrame.classList.add('visible');
		this.passportStats.classList.add('visible');
	}

	/**
	 * Passport ending scenario
	 * @param {Function} showControlsCallback - Callback to show controls
	 */
	showPassportScenario(showControlsCallback) {
		const showFrame = () => {
			// Show passport frame and stats
			this._showPassportUI();

			// Show controls after delay and dispatch event
			setTimeout(() => {
				document.dispatchEvent(new CustomEvent('endingScenarioComplete'));

				if (showControlsCallback) {
					showControlsCallback();
				}
			}, 2000);
		};

		// Fit map to route bounds
		if (this.state.cameraFollow) {
			const allCoords = this.state.fullRoute.map(p => [p.lat, p.lng]);
			const bounds = L.latLngBounds(allCoords);
			const currentZoom = this.map.getZoom();

			// Force viewreset during fly animation to ensure polylines are redrawn
			const onMove = () => this.map.fire('viewreset');
			this.map.on('move', onMove);

			this.map.flyToBounds(bounds, {
				duration: 1.5,
				maxZoom: currentZoom,
				padding: [80, 80]
			});

			this.map.once('moveend', () => {
				this.map.off('move', onMove);
				showFrame();
			});
		} else {
			showFrame();
		}
	}

	/**
	 * Hide passport frame and stats UI
	 */
	_hidePassportUI() {
		this.passportFrame.classList.remove('visible');
		this.passportStats.classList.remove('visible');
	}

	/**
	 * Show squint frame UI
	 */
	_showSquintUI() {
		this.squintFrame.classList.add('visible');
		this.squintStats.classList.add('visible');
	}

	/**
	 * Squint ending scenario
	 * @param {Function} showControlsCallback - Callback to show controls
	 */
	showSquintScenario(showControlsCallback) {
		const showFrame = () => {
			// Show squint frame and stats
			this._showSquintUI();

			// Show controls after delay and dispatch event
			setTimeout(() => {
				document.dispatchEvent(new CustomEvent('endingScenarioComplete'));

				if (showControlsCallback) {
					showControlsCallback();
				}
			}, 2000);
		};

		// Fit map to route bounds
		if (this.state.cameraFollow) {
			const allCoords = this.state.fullRoute.map(p => [p.lat, p.lng]);
			const bounds = L.latLngBounds(allCoords);
			const currentZoom = this.map.getZoom();

			// Force viewreset during fly animation to ensure polylines are redrawn
			const onMove = () => this.map.fire('viewreset');
			this.map.on('move', onMove);

			this.map.flyToBounds(bounds, {
				duration: 1.5,
				maxZoom: currentZoom,
				padding: [80, 80]
			});

			this.map.once('moveend', () => {
				this.map.off('move', onMove);
				showFrame();
			});
		} else {
			showFrame();
		}
	}

	/**
	 * Hide squint frame and stats UI
	 */
	_hideSquintUI() {
		this.squintFrame.classList.remove('visible');
		this.squintStats.classList.remove('visible');
	}
}
