/**
 * Controller for route animation on the map
 */
export class RouteAnimator {
	/**
	 * Create a new RouteAnimator instance
	 * @param {Object} map - Leaflet map instance
	 * @param {Object} state - Application state
	 * @param {UIController} ui - UI controller instance
	 * @param {TrackVisualization} trackViz - TrackVisualization instance
	 */
	constructor(map, state, ui, trackViz) {
		this.map = map;
		this.state = state;
		this.ui = ui;
		this.trackViz = trackViz;
		this.animationFrameId = null;
		this.lastFrameTime = null;
		this.accumulatedTime = 0;
		this.currentStep = 0;
		this.animatedLine = null;
		this.segments = [];
		this.isRunning = false;
	}

	/**
	 * Start the route animation
	 */
	start() {
		if (this.isRunning) return;

		this.ui.startBtn.disabled = true;
		this.isRunning = true;

		this.clearSegments();

		this.lastFrameTime = null;
		this.accumulatedTime = 0;

		this.animationFrameId = requestAnimationFrame((timestamp) => this.animate(timestamp));
	}

	/**
	 * Clear all animated segments from the map
	 */
	clearSegments() {
		this.segments.forEach(segment => this.map.removeLayer(segment));
		this.segments = [];
	}

	/**
	 * Main animation loop using requestAnimationFrame
	 * @param {number} timestamp - Current timestamp from requestAnimationFrame
	 */
	animate(timestamp) {
		if (!this.isRunning) return;

		if (this.lastFrameTime === null) {
			this.lastFrameTime = timestamp;
		}

		const deltaTime = timestamp - this.lastFrameTime;
		this.lastFrameTime = timestamp;

		this.accumulatedTime += deltaTime;

		const timePerPoint = this.calculateTimePerPoint();

		while (this.accumulatedTime >= timePerPoint && this.isRunning) {
			this.accumulatedTime -= timePerPoint;

			if (this.currentStep >= this.state.fullRoute.length) {
				this.complete();
				return;
			}

			this.animateStep();
		}

		if (this.isRunning) {
			this.animationFrameId = requestAnimationFrame((ts) => this.animate(ts));
		}
	}

	/**
	 * Calculate time per point for animation based on total duration
	 * @returns {number} Time per point in milliseconds
	 */
	calculateTimePerPoint() {
		const totalPoints = this.state.fullRoute.length;
		const durationMs = this.state.animationDuration * 1000;

		return durationMs / totalPoints;
	}

	/**
	 * Animate a single step of the route
	 */
	animateStep() {
		this.currentStep++;

		if (this.currentStep > this.state.fullRoute.length) {
			this.currentStep = this.state.fullRoute.length;
		}

		const coords = this.state.fullRoute.slice(0, this.currentStep).map(p => [p.lat, p.lng]);

		if (this.animatedLine) {
			this.animatedLine.setLatLngs(coords);
		} else {
			this.animatedLine = L.polyline(coords, {
				color: this.state.trackColor,
				weight: 4,
				opacity: 0.8,
				smoothFactor: 2.0
			}).addTo(this.map);
		}

		const percent = Math.round((this.currentStep / this.state.fullRoute.length) * 100);
		this.ui.updateProgress(percent);

		if (this.state.cameraFollow && coords.length > 0) {
			const lastPoint = coords[coords.length - 1];
			this.map.panTo(lastPoint, { animate: true });
		}
	}

	/**
	 * Complete the animation and show final state
	 */
	complete() {
		this.stop();
		this.ui.setProgressComplete();

		// Increment Firebase counter when animation completes
		this.trackViz.analytics.incrementAnimationCount();

		// Execute ending scenario
		const showControlsCallback = () => this.ui.showControls();
		this.trackViz.endingScenarioManager.execute(showControlsCallback);
	}

	/**
	 * Stop the animation
	 */
	stop() {
		this.isRunning = false;
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
		this.ui.startBtn.disabled = false;
	}
}
