// python -m http.server 8000
// Класс для расчёта метрик из GPX данных
class GPXMetrics {
	static calculateDistance(coords) {
		// Haversine formula для вычисления расстояния
		let totalDistance = 0;
		for (let i = 1; i < coords.length; i++) {
			const R = 6371; // Радиус Земли в км
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

	static calculateElevation(points) {
		let gain = 0, loss = 0;
		for (let i = 1; i < points.length; i++) {
			const diff = points[i].ele - points[i - 1].ele;
			if (diff > 0) gain += diff;
			else loss += Math.abs(diff);
		}
		return { gain, loss };
	}

	static calculateTimeAndSpeed(points) {
		const times = points.map(p => new Date(p.time).getTime()).filter(t => !isNaN(t));
		if (times.length < 2) return null;

		const totalTime = (times[times.length - 1] - times[0]) / 1000; // в секундах
		let movingTime = 0;

		// Порог скорости для определения движения: 1 км/ч
		const speedThreshold = 1 / 3600; // км/с
		for (let i = 1; i < points.length; i++) {
			const distance = this.calculateDistance([points[i - 1], points[i]]);
			const time = (new Date(points[i].time) - new Date(points[i - 1].time)) / 1000;
			if (time > 0 && distance / time > speedThreshold) {
				movingTime += time;
			}
		}

		return { totalTime, movingTime };
	}

	static calculateCalories(distance, movingTime, elevationGain, weight) {
		// Средняя скорость движения в км/ч
		const avgSpeed = distance / (movingTime / 3600);

		// Определяем MET на основе скорости
		let met;
		if (avgSpeed < 16) met = 4;
		else if (avgSpeed < 19) met = 6;
		else if (avgSpeed < 22) met = 8;
		else if (avgSpeed < 25) met = 10;
		else met = 12;

		// Базовые калории: MET × вес(кг) × время(часы)
		const baseCalories = met * weight * (movingTime / 3600);

		// Калории от набора высоты для велосипеда
		const bikeWeight = 10;
		const climbCalories = (weight + bikeWeight) * elevationGain * 0.1 * 0.6;

		return Math.round(baseCalories + climbCalories);
	}

	static formatTime(seconds) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}
}

// Класс для управления UI элементами
class UIController {
	constructor() {
		this.controls = document.querySelector('.controls');
		this.infoBox = document.querySelector('.info-box');
		this.progress = document.getElementById('progress');
		this.startBtn = document.getElementById('startBtn');
		this.pauseBtn = document.getElementById('pauseBtn');
		this.resetBtn = document.getElementById('resetBtn');
		this.speedSlider = document.getElementById('speedSlider');
		this.speedLabel = document.getElementById('speedLabel');
	}

	showCountdown(callback) {
		this.controls.style.display = 'none';

		const countdown = document.createElement('div');
		countdown.className = 'countdown';
		document.body.appendChild(countdown);

		const numbers = [3, 2, 1];
		let index = 0;

		const showNext = () => {
			if (index < numbers.length) {
				countdown.textContent = numbers[index];
				countdown.style.animation = 'none';
				setTimeout(() => {
					countdown.style.animation = 'pulse 0.5s ease-in-out';
				}, 10);
				index++;
				setTimeout(showNext, 1000);
			} else {
				countdown.remove();
				setTimeout(callback, 2000);
			}
		};

		showNext();
	}

	showInfoBox() {
		this.infoBox.classList.remove('hidden');
	}

	hideInfoBox() {
		this.infoBox.classList.add('hidden');
	}

	showControls() {
		this.controls.style.display = 'block';
	}

	hideControls() {
		this.controls.style.display = 'none';
	}

	updateProgress(percent) {
		this.progress.textContent = `${percent}% completed`;
	}

	setProgressComplete() {
		this.progress.textContent = '✓ Route completed!';
	}

	clearProgress() {
		this.progress.textContent = '';
	}

	updateInfoBox(data) {
		this.infoBox.innerHTML = `
			<h2>${data.title}</h2>
			<p><strong>Date:</strong> ${data.date}</p>
			<p><strong>Distance:</strong> ${data.distance.toFixed(2)} km</p>
			<p><strong>Elevation, m (gain/loss):</strong> ${Math.round(data.elevation.gain)} / ${Math.round(data.elevation.loss)}</p>
			<p><strong>Speed, km/h (moving/total):</strong> ${data.movingSpeed} / ${data.totalSpeed}</p>
			<p><strong>Time (moving/total):</strong> ${data.movingTime} / ${data.totalTime}</p>
			<p><strong>Calories burned:</strong> ~${data.calories} kcal</p>
			<div class="progress" id="progress"></div>
		`;
		this.progress = document.getElementById('progress');
	}

	setButtonStates(start, pause, reset) {
		this.startBtn.disabled = start;
		this.pauseBtn.disabled = pause;
		this.resetBtn.disabled = reset;
	}

	setPauseButtonText(text) {
		this.pauseBtn.textContent = text;
	}

	updateSpeedLabel(speed) {
		this.speedLabel.textContent = `${speed}x`;
	}

	initSpeed(speed) {
		this.speedSlider.value = speed;
		this.updateSpeedLabel(speed);
	}
}

// Класс для управления анимацией маршрута
class RouteAnimator {
	constructor(map, state, ui) {
		this.map = map;
		this.state = state;
		this.ui = ui;
		this.animationInterval = null;
		this.currentStep = 0;
		this.animatedLine = null;
		this.isRunning = false;
		this.isPaused = false;
	}

	start() {
		if (this.isRunning) return;

		this.ui.setButtonStates(true, false, true);
		this.isRunning = true;
		this.isPaused = false;

		this.animationInterval = setInterval(() => {
			if (this.isPaused) return;

			if (this.currentStep >= this.state.fullRoute.length) {
				this.complete();
				return;
			}

			this.animateStep();
		}, 50 / Math.min(this.state.speed, 10));
	}

	animateStep() {
		// Для скоростей > 10 добавляем несколько точек за раз
		let step = 1;
		if (this.state.speed > 10) {
			step = Math.floor((this.state.speed - 10) / 2) + 1;
		}

		this.currentStep += step;
		if (this.currentStep > this.state.fullRoute.length) {
			this.currentStep = this.state.fullRoute.length;
		}

		const coords = this.state.fullRoute.slice(0, this.currentStep).map(p => [p.lat, p.lng]);

		if (this.animatedLine) {
			this.map.removeLayer(this.animatedLine);
		}

		this.animatedLine = L.polyline(coords, {
			color: this.state.trackColor,
			weight: 4,
			opacity: 0.8,
			smoothFactor: 2.0 // Увеличиваем упрощение для лучшей производительности
		}).addTo(this.map);

		const percent = Math.round((this.currentStep / this.state.fullRoute.length) * 100);
		this.ui.updateProgress(percent);

		// Плавное панорамирование на всех скоростях
		if (this.currentStep > 0) {
			const point = this.state.fullRoute[this.currentStep - 1];
			this.map.panTo([point.lat, point.lng], { animate: true });
		}
	}

	complete() {
		this.stop();
		this.ui.setProgressComplete();
		this.ui.showInfoBox();

		setTimeout(() => {
			const onMove = () => this.map.fire('viewreset');
			this.map.on('move', onMove);

			this.map.flyToBounds(this.animatedLine.getBounds(), {
				padding: [0, 0],
				duration: 2.5
			});

			this.map.once('moveend', () => {
				this.map.off('move', onMove);
				// Показываем контролы через 2 секунды после окончания анимации
				setTimeout(() => {
					this.ui.showControls();
				}, 2000);
			});
		}, 100);
	}

	stop() {
		this.isRunning = false;
		this.isPaused = false;
		clearInterval(this.animationInterval);
		this.ui.setButtonStates(false, true, false);
		this.ui.setPauseButtonText('⏸ Pause');
	}

	pause() {
		this.isPaused = !this.isPaused;
		this.ui.setPauseButtonText(this.isPaused ? '▶ Continue' : '⏸ Pause');
	}

	reset() {
		this.stop();
		this.currentStep = 0;

		if (this.animatedLine) {
			this.map.removeLayer(this.animatedLine);
			this.animatedLine = null;
		}

		if (this.state.fullRoute.length > 0) {
			const point = this.state.fullRoute[0];
			this.map.setView([point.lat, point.lng], this.state.routeZoom);
		}

		this.ui.clearProgress();
		this.ui.setButtonStates(false, true, true);
		this.ui.showControls();
		this.ui.hideInfoBox();
	}
}

// Главный класс приложения
class TrackVisualization {
	constructor(state) {
		this.state = state;
		this.initMap();
		this.ui = new UIController();
		this.ui.initSpeed(this.state.speed); // Инициализируем ползунок скорости
		this.animator = new RouteAnimator(this.map, this.state, this.ui);
		this.loadGPX();
		this.attachEventListeners();
	}

	initMap() {
		this.map = L.map('map', {
			zoomAnimation: true,
			fadeAnimation: true,
			markerZoomAnimation: true
		}).setView([49.997, 14.24], this.state.initialZoom);
		L.tileLayer(this.state.mapTileUrl, {
			attribution: '© OpenStreetMap © CartoDB',
			maxZoom: 18,
			keepBuffer: 6,
			updateWhenIdle: false,
			updateWhenZooming: false
		}).addTo(this.map);

		this.startIcon = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});

		this.endIcon = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});
	}

	async loadGPX() {
		try {
			const response = await fetch(this.state.gpxPath);
			const gpxText = await response.text();
			const parser = new DOMParser();
			const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
			const trkpts = gpxDoc.querySelectorAll('trkpt');

			const points = [];
			trkpts.forEach(pt => {
				const lat = parseFloat(pt.getAttribute('lat'));
				const lon = parseFloat(pt.getAttribute('lon'));
				const eleNode = pt.querySelector('ele');
				const timeNode = pt.querySelector('time');

				points.push({
					lat: lat,
					lng: lon,
					ele: eleNode ? parseFloat(eleNode.textContent) : 0,
					time: timeNode ? timeNode.textContent : null
				});
			});

			this.state.fullRoute = points;
			this.state.gpxData = points;

			this.calculateAndDisplayMetrics(points);
			this.addMarkers(points);
			this.map.setView([points[0].lat, points[0].lng], this.state.routeZoom);
		} catch (error) {
			console.error('Error loading GPX:', error);
		}
	}

	calculateAndDisplayMetrics(points) {
		const distance = GPXMetrics.calculateDistance(points);
		const elevation = GPXMetrics.calculateElevation(points);
		const timeData = GPXMetrics.calculateTimeAndSpeed(points);

		if (timeData) {
			const movingSpeed = (distance / (timeData.movingTime / 3600)).toFixed(2);
			const totalSpeed = (distance / (timeData.totalTime / 3600)).toFixed(2);
			const calories = GPXMetrics.calculateCalories(distance, timeData.movingTime, elevation.gain, this.state.weight);

			this.ui.updateInfoBox({
				title: this.state.title,
				date: 'October 7, 2025',
				distance: distance,
				elevation: elevation,
				movingSpeed: movingSpeed,
				totalSpeed: totalSpeed,
				movingTime: GPXMetrics.formatTime(timeData.movingTime),
				totalTime: GPXMetrics.formatTime(timeData.totalTime),
				calories: calories
			});
		}
	}

	addMarkers(points) {
		L.marker([points[0].lat, points[0].lng], { icon: this.startIcon })
			.addTo(this.map)
			.bindPopup('<b>Start</b><br>Zličín');

		L.marker([points[points.length - 1].lat, points[points.length - 1].lng], { icon: this.endIcon })
			.addTo(this.map)
			.bindPopup('<b>Finish</b><br>Mořina');
	}

	attachEventListeners() {
		this.ui.startBtn.addEventListener('click', () => {
			this.ui.showCountdown(() => this.animator.start());
		});

		this.ui.pauseBtn.addEventListener('click', () => {
			this.animator.pause();
		});

		this.ui.resetBtn.addEventListener('click', () => {
			this.animator.reset();
		});

		this.ui.speedSlider.addEventListener('input', (e) => {
			this.state.speed = parseInt(e.target.value);
			this.ui.updateSpeedLabel(this.state.speed);
		});
	}
}
