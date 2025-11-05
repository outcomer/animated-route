/**
 * Controller for managing animation sequence
 */
export class AnimationController {
	/**
	 * Create a new AnimationController instance
	 * @param {Object} map - Leaflet map instance
	 * @param {Object} state - Application state
	 * @param {Object} ui - UIController instance
	 * @param {Object} gpxManager - GPXManager instance
	 * @param {Object} endingScenarioManager - EndingScenarioManager instance
	 */
	constructor(map, state, ui, gpxManager, endingScenarioManager) {
		this.map = map;
		this.state = state;
		this.ui = ui;
		this.gpxManager = gpxManager;
		this.endingScenarioManager = endingScenarioManager;
	}

	/**
	 * Start route animation sequence
	 * @param {Object} animator - RouteAnimator instance
	 */
	async startAnimation(animator) {
		if (animator.animatedLine) {
			this.map.removeLayer(animator.animatedLine);
			animator.animatedLine = null;
		}
		animator.clearSegments();
		animator.currentStep = 0;

		this.gpxManager.removeFullRouteLine();
		this.gpxManager.removeMarkers();
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
		await this.gpxManager.addMarkers(this.state.fullRoute);
		animator.start();
	}
}
