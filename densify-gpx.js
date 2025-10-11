// Скрипт для насыщения точками дорисованной части GPX трека
const fs = require('fs');

// Haversine формула для расчета расстояния
function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371; // Радиус Земли в км
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // расстояние в км
}

// Интерполяция между двумя точками
function interpolatePoints(point1, point2, numPoints) {
	const points = [];
	for (let i = 1; i <= numPoints; i++) {
		const ratio = i / (numPoints + 1);
		points.push({
			lat: point1.lat + (point2.lat - point1.lat) * ratio,
			lon: point1.lon + (point2.lon - point1.lon) * ratio,
			ele: point1.ele + (point2.ele - point1.ele) * ratio,
			time: point1.time // упрощенно, можно интерполировать время
		});
	}
	return points;
}

// Читаем и парсим GPX
const gpxContent = fs.readFileSync('tracks/karlstein.gpx', 'utf-8');
const trkptRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">\s*<ele>([^<]+)<\/ele>\s*(?:<time>([^<]+)<\/time>)?/g;

const points = [];
let match;
while ((match = trkptRegex.exec(gpxContent)) !== null) {
	points.push({
		lat: parseFloat(match[1]),
		lon: parseFloat(match[2]),
		ele: parseFloat(match[3]),
		time: match[4] || null
	});
}

console.log(`Всего точек: ${points.length}`);

// Находим индекс точки разделения (примерно 49.960586, 14.197579)
const splitLat = 49.960586;
const splitLon = 14.197579;
let splitIndex = 0;
let minDistance = Infinity;

for (let i = 0; i < points.length; i++) {
	const dist = calculateDistance(splitLat, splitLon, points[i].lat, points[i].lon);
	if (dist < minDistance) {
		minDistance = dist;
		splitIndex = i;
	}
}

console.log(`Найдена точка разделения на индексе ${splitIndex}`);
console.log(`Координаты: ${points[splitIndex].lat}, ${points[splitIndex].lon}`);
console.log(`Расстояние от указанной точки: ${(minDistance * 1000).toFixed(2)}м`);

// Рассчитываем среднее расстояние в первой части (реальный трек)
const realPart = points.slice(0, splitIndex);
let totalDistance = 0;
for (let i = 1; i < realPart.length; i++) {
	totalDistance += calculateDistance(
		realPart[i - 1].lat, realPart[i - 1].lon,
		realPart[i].lat, realPart[i].lon
	);
}
const avgDistance = totalDistance / (realPart.length - 1);
console.log(`Среднее расстояние в реальной части: ${(avgDistance * 1000).toFixed(2)}м`);

// Обрабатываем вторую часть (дорисованная)
const drawnPart = points.slice(splitIndex);
const densifiedPart = [drawnPart[0]]; // Начинаем с точки разделения

for (let i = 1; i < drawnPart.length; i++) {
	const dist = calculateDistance(
		drawnPart[i - 1].lat, drawnPart[i - 1].lon,
		drawnPart[i].lat, drawnPart[i].lon
	);

	// Сколько точек нужно добавить между текущими точками
	const numPointsToAdd = Math.floor(dist / avgDistance) - 1;

	if (numPointsToAdd > 0) {
		// Добавляем интерполированные точки
		const interpolated = interpolatePoints(drawnPart[i - 1], drawnPart[i], numPointsToAdd);
		densifiedPart.push(...interpolated);
	}

	densifiedPart.push(drawnPart[i]);
}

console.log(`Точек в дорисованной части ДО: ${drawnPart.length}`);
console.log(`Точек в дорисованной части ПОСЛЕ: ${densifiedPart.length}`);

// Объединяем обе части
const resultPoints = [...realPart, ...densifiedPart];
console.log(`Всего точек в результате: ${resultPoints.length}`);

// Генерируем новый GPX
const gpxHeader = gpxContent.substring(0, gpxContent.indexOf('<trkpt'));
const gpxFooter = gpxContent.substring(gpxContent.lastIndexOf('</trkseg>'));

let trkptsXml = '';
for (const point of resultPoints) {
	trkptsXml += `    <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}">\n`;
	trkptsXml += `      <ele>${point.ele.toFixed(1)}</ele>\n`;
	if (point.time) {
		trkptsXml += `      <time>${point.time}</time>\n`;
	}
	trkptsXml += `    </trkpt>\n`;
}

const newGpx = gpxHeader + trkptsXml + gpxFooter;

// Сохраняем результат
fs.writeFileSync('tracks/karlstein-densified.gpx', newGpx, 'utf-8');
console.log('\n✓ Создан файл tracks/karlstein-densified.gpx');
console.log('Обновите gpxPath в track.html для использования нового файла');
