import { readFileSync, writeFileSync } from 'fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

function calculateDistance(lat1, lon1, lat2, lon2) {
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

function interpolatePoints(pt1, pt2, numPoints) {
	const result = [];
	const lat1 = parseFloat(pt1.getAttribute('lat'));
	const lon1 = parseFloat(pt1.getAttribute('lon'));
	const lat2 = parseFloat(pt2.getAttribute('lat'));
	const lon2 = parseFloat(pt2.getAttribute('lon'));

	const ele1 = parseFloat(pt1.getElementsByTagName('ele')[0]?.textContent || 0);
	const ele2 = parseFloat(pt2.getElementsByTagName('ele')[0]?.textContent || 0);

	const time1 = new Date(pt1.getElementsByTagName('time')[0]?.textContent);
	const time2 = new Date(pt2.getElementsByTagName('time')[0]?.textContent);
	const timeDiff = time2 - time1;

	for (let i = 1; i <= numPoints; i++) {
		const t = i / (numPoints + 1);
		const lat = lat1 + (lat2 - lat1) * t;
		const lon = lon1 + (lon2 - lon1) * t;
		const ele = ele1 + (ele2 - ele1) * t;
		const time = new Date(time1.getTime() + timeDiff * t);

		result.push({
			lat: lat.toFixed(6),
			lon: lon.toFixed(6),
			ele: ele.toFixed(1),
			time: time.toISOString()
		});
	}

	return result;
}

const gpxPath = 'tracks/karlstein.gpx';
const outputPath = 'tracks/karlstein-densified.gpx';

console.log('Reading GPX file...');
const gpxContent = readFileSync(gpxPath, 'utf-8');
const parser = new DOMParser();
const doc = parser.parseFromString(gpxContent, 'text/xml');

const trkpts = Array.from(doc.getElementsByTagName('trkpt'));
console.log('Total points: ' + trkpts.length);

const targetLat = '49.960922';
const targetLon = '14.199798';
let splitIndex = -1;

for (let i = 0; i < trkpts.length; i++) {
	const lat = trkpts[i].getAttribute('lat');
	const lon = trkpts[i].getAttribute('lon');
	if (lat === targetLat && lon === targetLon) {
		splitIndex = i;
		break;
	}
}

if (splitIndex === -1) {
	console.error('Target point not found!');
	process.exit(1);
}

console.log('Found target point at index: ' + splitIndex + ' (' + ((splitIndex / trkpts.length) * 100).toFixed(1) + '% of track)');

let totalDistanceBefore = 0;
for (let i = 1; i <= splitIndex; i++) {
	const lat1 = parseFloat(trkpts[i - 1].getAttribute('lat'));
	const lon1 = parseFloat(trkpts[i - 1].getAttribute('lon'));
	const lat2 = parseFloat(trkpts[i].getAttribute('lat'));
	const lon2 = parseFloat(trkpts[i].getAttribute('lon'));
	totalDistanceBefore += calculateDistance(lat1, lon1, lat2, lon2);
}
const avgDistanceBefore = totalDistanceBefore / splitIndex;

let totalDistanceAfter = 0;
for (let i = splitIndex + 1; i < trkpts.length; i++) {
	const lat1 = parseFloat(trkpts[i - 1].getAttribute('lat'));
	const lon1 = parseFloat(trkpts[i - 1].getAttribute('lon'));
	const lat2 = parseFloat(trkpts[i].getAttribute('lat'));
	const lon2 = parseFloat(trkpts[i].getAttribute('lon'));
	totalDistanceAfter += calculateDistance(lat1, lon1, lat2, lon2);
}
const avgDistanceAfter = totalDistanceAfter / (trkpts.length - splitIndex - 1);

console.log('Average distance before split: ' + avgDistanceBefore.toFixed(2) + ' m');
console.log('Average distance after split: ' + avgDistanceAfter.toFixed(2) + ' m');

// Анализируем распределение расстояний
const distancesBefore = [];
for (let i = 1; i <= splitIndex; i++) {
	const lat1 = parseFloat(trkpts[i - 1].getAttribute('lat'));
	const lon1 = parseFloat(trkpts[i - 1].getAttribute('lon'));
	const lat2 = parseFloat(trkpts[i].getAttribute('lat'));
	const lon2 = parseFloat(trkpts[i].getAttribute('lon'));
	distancesBefore.push(calculateDistance(lat1, lon1, lat2, lon2));
}

const distancesAfter = [];
for (let i = splitIndex + 1; i < trkpts.length; i++) {
	const lat1 = parseFloat(trkpts[i - 1].getAttribute('lat'));
	const lon1 = parseFloat(trkpts[i - 1].getAttribute('lon'));
	const lat2 = parseFloat(trkpts[i].getAttribute('lat'));
	const lon2 = parseFloat(trkpts[i].getAttribute('lon'));
	distancesAfter.push(calculateDistance(lat1, lon1, lat2, lon2));
}

const maxBefore = Math.max(...distancesBefore);
const maxAfter = Math.max(...distancesAfter);
const segmentsOver30mBefore = distancesBefore.filter(d => d > 30).length;
const segmentsOver30mAfter = distancesAfter.filter(d => d > 30).length;

console.log('\nDistribution analysis:');
console.log('Max distance before: ' + maxBefore.toFixed(2) + ' m');
console.log('Max distance after: ' + maxAfter.toFixed(2) + ' m');
console.log('Segments >30m before: ' + segmentsOver30mBefore + ' (' + ((segmentsOver30mBefore / distancesBefore.length) * 100).toFixed(1) + '%)');
console.log('Segments >30m after: ' + segmentsOver30mAfter + ' (' + ((segmentsOver30mAfter / distancesAfter.length) * 100).toFixed(1) + '%)');

const densityRatio = avgDistanceAfter / avgDistanceBefore;
console.log('\nDensity ratio (after/before): ' + densityRatio.toFixed(2) + 'x');

// Определяем целевое расстояние для интерполяции
const overallAvg = (totalDistanceBefore + totalDistanceAfter) / (trkpts.length - 1);
const targetDistance = overallAvg * 1.5; // Интерполируем сегменты длиннее 1.5x от среднего

console.log('\nTarget distance for interpolation: ' + targetDistance.toFixed(2) + ' m');
console.log('Will interpolate segments longer than this threshold.\n');

console.log('Building densified track...');
const newPoints = [];

// Обрабатываем ВСЕ точки с интерполяцией длинных сегментов
for (let i = 0; i < trkpts.length; i++) {
	const pt1 = trkpts[i];

	newPoints.push({
		lat: pt1.getAttribute('lat'),
		lon: pt1.getAttribute('lon'),
		ele: pt1.getElementsByTagName('ele')[0]?.textContent || '0',
		time: pt1.getElementsByTagName('time')[0]?.textContent || ''
	});

	// Проверяем следующий сегмент
	if (i < trkpts.length - 1) {
		const pt2 = trkpts[i + 1];

		const lat1 = parseFloat(pt1.getAttribute('lat'));
		const lon1 = parseFloat(pt1.getAttribute('lon'));
		const lat2 = parseFloat(pt2.getAttribute('lat'));
		const lon2 = parseFloat(pt2.getAttribute('lon'));

		const distance = calculateDistance(lat1, lon1, lat2, lon2);

		// Интерполируем если сегмент длинный
		if (distance > targetDistance) {
			const numInterpPoints = Math.floor(distance / targetDistance);
			const interpolated = interpolatePoints(pt1, pt2, numInterpPoints);
			newPoints.push(...interpolated);
		}
	}
}

console.log('Original points: ' + trkpts.length);
console.log('Densified points: ' + newPoints.length);
console.log('Added ' + (newPoints.length - trkpts.length) + ' interpolated points');

const trkseg = doc.getElementsByTagName('trkseg')[0];
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
	trkseg.appendChild(doc.createTextNode('\n    '));
}

const serializer = new XMLSerializer();
const newGpxContent = serializer.serializeToString(doc);
writeFileSync(outputPath, newGpxContent);

console.log('Densified GPX saved to: ' + outputPath);
