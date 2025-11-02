import { TrackVisualization } from './classes/TrackVisualization.js';

/**
 * Application state configuration
 * @type {Object}
 */
const state = {
	title: 'GPX Route Viewer',
	animationDuration: 60,
	cameraFollow: true,
	trackColor: 'rgb(0 0 0)',
	initialZoom: 12,
	fullRoute: [],
	gpxData: null
};

document.title = state.title;

const app = new TrackVisualization(state);
