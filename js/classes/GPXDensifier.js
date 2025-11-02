/**
 * Module for normalizing point density in GPX tracks
 */
export class GPXDensifier {
	/**
	 * Calculate distance between GPS coordinates using Haversine formula
	 * @param {number} lat1 - Latitude of first point
	 * @param {number} lon1 - Longitude of first point
	 * @param {number} lat2 - Latitude of second point
	 * @param {number} lon2 - Longitude of second point
	 * @returns {number} Distance in meters
	 */
	static calculateDistance(lat1, lon1, lat2, lon2) {
		const R = 6371e3;
		const φ1 = lat1 * Math.PI / 180;
		const φ2 = lat2 * Math.PI / 180;
		const Δφ = (lat2 - lat1) * Math.PI / 180;
		const Δλ = (lon2 - lon1) * Math.PI / 180;

		const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) *
			Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c;
	}

	/**
	 * Interpolate points between two GPS coordinates
	 * @param {Element} pt1 - First GPX track point element
	 * @param {Element} pt2 - Second GPX track point element
	 * @param {number} numPoints - Number of points to interpolate
	 * @returns {Array} Array of interpolated point objects
	 */
	static interpolatePoints(pt1, pt2, numPoints) {
		const result = [];
		const lat1 = parseFloat(pt1.getAttribute('lat'));
		const lon1 = parseFloat(pt1.getAttribute('lon'));
		const lat2 = parseFloat(pt2.getAttribute('lat'));
		const lon2 = parseFloat(pt2.getAttribute('lon'));

		const ele1 = parseFloat(pt1.getElementsByTagName('ele')[0]?.textContent || 0);
		const ele2 = parseFloat(pt2.getElementsByTagName('ele')[0]?.textContent || 0);

		const time1Elem = pt1.getElementsByTagName('time')[0];
		const time2Elem = pt2.getElementsByTagName('time')[0];

		let time1, time2, timeDiff;
		if (time1Elem && time2Elem) {
			time1 = new Date(time1Elem.textContent);
			time2 = new Date(time2Elem.textContent);
			timeDiff = time2 - time1;
		}

		for (let i = 1; i <= numPoints; i++) {
			const t = i / (numPoints + 1);
			const lat = lat1 + (lat2 - lat1) * t;
			const lon = lon1 + (lon2 - lon1) * t;
			const ele = ele1 + (ele2 - ele1) * t;

			const point = {
				lat: lat.toFixed(6),
				lon: lon.toFixed(6),
				ele: ele.toFixed(1)
			};

			if (time1 && time2) {
				const time = new Date(time1.getTime() + timeDiff * t);
				point.time = time.toISOString();
			}

			result.push(point);
		}

		return result;
	}

	/**
	 * Normalize point density in GPX track
	 * @param {string} gpxText - GPX file text content
	 * @param {number} targetDistance - Target distance between points in meters (default 5)
	 * @returns {string} Normalized GPX text
	 */
	static densify(gpxText, targetDistance = 5) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(gpxText, 'text/xml');

		const parserError = doc.querySelector('parsererror');
		if (parserError) {
			throw new Error('Invalid GPX file');
		}

		const trkpts = Array.from(doc.getElementsByTagName('trkpt'));

		if (trkpts.length === 0) {
			console.warn('No track points found in GPX');
			return gpxText;
		}

		console.log('Densifying GPX track...');
		console.log('Original points:', trkpts.length);
		console.log('Target distance:', targetDistance + 'm');

		const newPoints = [];

		for (let i = 0; i < trkpts.length; i++) {
			const pt1 = trkpts[i];

			newPoints.push({
				lat: pt1.getAttribute('lat'),
				lon: pt1.getAttribute('lon'),
				ele: pt1.getElementsByTagName('ele')[0]?.textContent || '0',
				time: pt1.getElementsByTagName('time')[0]?.textContent || ''
			});

			if (i < trkpts.length - 1) {
				const pt2 = trkpts[i + 1];

				const lat1 = parseFloat(pt1.getAttribute('lat'));
				const lon1 = parseFloat(pt1.getAttribute('lon'));
				const lat2 = parseFloat(pt2.getAttribute('lat'));
				const lon2 = parseFloat(pt2.getAttribute('lon'));

				const distance = this.calculateDistance(lat1, lon1, lat2, lon2);

				if (distance < 0.1) continue;

				const numSegments = Math.max(1, Math.round(distance / targetDistance));
				const numInterpPoints = numSegments - 1;

				if (numInterpPoints > 0) {
					const interpolated = this.interpolatePoints(pt1, pt2, numInterpPoints);
					newPoints.push(...interpolated);
				}
			}
		}

		console.log('Densified points:', newPoints.length);
		console.log('Added', (newPoints.length - trkpts.length), 'interpolated points');

		const trkseg = doc.getElementsByTagName('trkseg')[0];
		if (!trkseg) {
			console.warn('No track segment found in GPX');
			return gpxText;
		}

		while (trkseg.firstChild) {
			trkseg.removeChild(trkseg.firstChild);
		}

		for (const pt of newPoints) {
			const trkpt = doc.createElement('trkpt');
			trkpt.setAttribute('lat', pt.lat);
			trkpt.setAttribute('lon', pt.lon);

			const ele = doc.createElement('ele');
			ele.textContent = pt.ele;
			trkpt.appendChild(ele);

			if (pt.time) {
				const time = doc.createElement('time');
				time.textContent = pt.time;
				trkpt.appendChild(time);
			}

			trkseg.appendChild(trkpt);
		}

		const serializer = new XMLSerializer();
		const newGpxContent = serializer.serializeToString(doc);

		this.logQualityCheck(newPoints, targetDistance);

		return newGpxContent;
	}

	/**
	 * Log quality check of the densification process
	 * @param {Array} points - Array of densified points
	 * @param {number} targetDistance - Target distance between points
	 */
	static logQualityCheck(points, targetDistance) {
		const distances = [];
		for (let i = 1; i < points.length; i++) {
			const lat1 = parseFloat(points[i - 1].lat);
			const lon1 = parseFloat(points[i - 1].lon);
			const lat2 = parseFloat(points[i].lat);
			const lon2 = parseFloat(points[i].lon);
			const dist = this.calculateDistance(lat1, lon1, lat2, lon2);
			if (dist > 0.01) {
				distances.push(dist);
			}
		}

		if (distances.length === 0) return;

		const min = Math.min(...distances);
		const max = Math.max(...distances);
		const avg = distances.reduce((a, b) => a + b, 0) / distances.length;

		const ranges = [
			{ min: 0, max: 1, count: 0 },
			{ min: 1, max: 2, count: 0 },
			{ min: 2, max: 3, count: 0 },
			{ min: 3, max: 4, count: 0 },
			{ min: 4, max: 5, count: 0 },
			{ min: 5, max: 6, count: 0 },
			{ min: 6, max: 7, count: 0 },
			{ min: 7, max: Infinity, count: 0 }
		];

		distances.forEach(d => {
			const range = ranges.find(r => d >= r.min && d < r.max);
			if (range) range.count++;
		});

		console.log('\n=== Quality Check ===');
		console.log(`Distance range: ${min.toFixed(2)}m - ${max.toFixed(2)}m`);
		console.log(`Average: ${avg.toFixed(2)}m`);
		console.log(`Median: ${this.median(distances).toFixed(2)}m`);
		console.log('\nDistribution:');
		ranges.forEach(r => {
			if (r.count > 0) {
				const percent = (r.count / distances.length * 100).toFixed(1);
				const maxLabel = r.max === Infinity ? '+' : `-${r.max}m`;
				console.log(`  ${r.min}${maxLabel}: ${percent}% (${r.count} segments)`);
			}
		});
	}

	/**
	 * Calculate median value of an array
	 * @param {Array} arr - Array of numbers
	 * @returns {number} Median value
	 */
	static median(arr) {
		const sorted = [...arr].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
	}
}
