/**
 * Utility class for calculating metrics from GPX data
 */
export class GPXMetrics {
	/**
	 * Calculate total distance using Haversine formula
	 * @param {Array} coords - Array of GPS coordinates
	 * @returns {number} Total distance in kilometers
	 */
	static calculateDistance(coords) {
		let totalDistance = 0;
		for (let i = 1; i < coords.length; i++) {
			const R = 6371;
			const lat1 = coords[i - 1].lat * Math.PI / 180;
			const lat2 = coords[i].lat * Math.PI / 180;
			const deltaLat = (coords[i].lat - coords[i - 1].lat) * Math.PI / 180;
			const deltaLon = (coords[i].lng - coords[i - 1].lng) * Math.PI / 180;

			const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
				Math.cos(lat1) * Math.cos(lat2) *
				Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			totalDistance += R * c;
		}
		return totalDistance;
	}

	/**
	 * Calculate elevation gain and loss
	 * @param {Array} points - Array of GPS points with elevation data
	 * @returns {Object} Object with gain and loss properties in meters
	 */
	static calculateElevation(points) {
		let gain = 0, loss = 0;
		for (let i = 1; i < points.length; i++) {
			const diff = points[i].ele - points[i - 1].ele;
			if (diff > 0) gain += diff;
			else loss += Math.abs(diff);
		}
		return { gain, loss };
	}

	/**
	 * Calculate time and speed metrics
	 * @param {Array} points - Array of GPS points with time data
	 * @returns {Object|null} Object with totalTime, movingTime in seconds, and maxSpeed in km/h, or null if insufficient data
	 */
	static calculateTimeAndSpeed(points) {
		const times = points.map(p => new Date(p.time).getTime()).filter(t => !isNaN(t));
		if (times.length < 2) return null;

		const totalTime = (times[times.length - 1] - times[0]) / 1000;
		let movingTime = 0;
		let maxSpeed = 0;

		const speedThreshold = 1 / 3600;
		for (let i = 1; i < points.length; i++) {
			const distance = this.calculateDistance([points[i - 1], points[i]]);
			const time = (new Date(points[i].time) - new Date(points[i - 1].time)) / 1000;
			if (time > 0) {
				const speedKmh = (distance / time) * 3600;
				if (speedKmh > maxSpeed) {
					maxSpeed = speedKmh;
				}
				if (distance / time > speedThreshold) {
					movingTime += time;
				}
			}
		}

		return { totalTime, movingTime, maxSpeed };
	}

	/**
	 * Calculate estimated calories burned based on cycling activity
	 * @param {number} distance - Distance in kilometers
	 * @param {number} movingTime - Moving time in seconds
	 * @param {number} elevationGain - Elevation gain in meters
	 * @param {number} weight - User weight in kilograms
	 * @returns {number} Estimated calories burned
	 */
	static calculateCalories(distance, movingTime, elevationGain, weight) {
		const avgSpeed = distance / (movingTime / 3600);

		let met;
		if (avgSpeed < 16) met = 4;
		else if (avgSpeed < 19) met = 6;
		else if (avgSpeed < 22) met = 8;
		else if (avgSpeed < 25) met = 10;
		else met = 12;

		const baseCalories = met * weight * (movingTime / 3600);

		const bikeWeight = 10;
		const climbCalories = (weight + bikeWeight) * elevationGain * 0.1 * 0.6;

		return Math.round(baseCalories + climbCalories);
	}

	/**
	 * Format time in seconds to HH:MM:SS string
	 * @param {number} seconds - Time in seconds
	 * @returns {string} Formatted time string
	 */
	static formatTime(seconds) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}
}
