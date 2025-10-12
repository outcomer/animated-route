import { GPXMetrics } from './GPXMetrics.js';
import { UIController } from './UIController.js';
import { RouteAnimator } from './RouteAnimator.js';

// Главный класс приложения
export class TrackVisualization {
	constructor(state) {
		this.state = state;
		this.initMap();
		this.ui = new UIController();
		this.ui.initSpeed(this.state.speed); // Инициализируем ползунок скорости
		this.ui.initZoom(this.state.routeZoom); // Инициализируем ползунок зума
		this.animator = new RouteAnimator(this.map, this.state, this.ui, this);
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
			// Проверяем, есть ли сохраненный GPX в localStorage
			const savedGPX = localStorage.getItem('uploadedGPX');
			const savedFileName = localStorage.getItem('uploadedGPXFileName');

			if (savedGPX) {
				this.parseAndDisplayGPX(savedGPX);
				if (savedFileName) {
					this.ui.gpxFileName.textContent = `📄 ${savedFileName}`;
				}
				this.ui.deleteGpxBtn.classList.add('visible');
				console.log('Loaded GPX from localStorage');
			} else {
				// Нет сохраненного GPX - показываем пустую карту
				console.log('No GPX found. Please upload a GPX file.');
				this.ui.gpxFileName.textContent = 'No track loaded';
				this.ui.deleteGpxBtn.classList.remove('visible');
			}
		} catch (error) {
			console.error('Error loading GPX:', error);
		}
	}

	parseAndDisplayGPX(gpxText) {
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
		this.drawFullRoute(points); // fitBounds вызывается внутри
		this.ui.showInfoBox(); // Показываем информацию о треке
	}

	drawFullRoute(points) {
		// Удаляем предыдущую линию, если есть
		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
		}

		// Отрисовываем весь маршрут
		const coords = points.map(p => [p.lat, p.lng]);
		this.fullRouteLine = L.polyline(coords, {
			color: this.state.trackColor,
			weight: 4,
			opacity: 0.8,
			smoothFactor: 2.0
		}).addTo(this.map);

		// Масштабируем карту так, чтобы был виден весь маршрут
		this.map.fitBounds(this.fullRouteLine.getBounds(), {
			padding: [50, 50]
		});
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
				date: this.state.date,
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
		// Удаляем предыдущие маркеры, если они есть
		if (this.startMarker) this.map.removeLayer(this.startMarker);
		if (this.endMarker) this.map.removeLayer(this.endMarker);

		this.startMarker = L.marker([points[0].lat, points[0].lng], { icon: this.startIcon })
			.addTo(this.map)
			.bindPopup('<b>Start</b>');

		this.endMarker = L.marker([points[points.length - 1].lat, points[points.length - 1].lng], { icon: this.endIcon })
			.addTo(this.map)
			.bindPopup('<b>Finish</b>');
	}

	attachEventListeners() {
		this.ui.startBtn.addEventListener('click', () => {
			if (!this.state.fullRoute || this.state.fullRoute.length === 0) {
				alert('Please load a GPX file first');
				return;
			}
			this.startAnimation();
		});

		this.ui.speedSlider.addEventListener('input', (e) => {
			this.state.speed = parseInt(e.target.value);
			this.ui.updateSpeedLabel(this.state.speed);
		});

		this.ui.zoomSlider.addEventListener('input', (e) => {
			this.state.routeZoom = parseInt(e.target.value);
			this.ui.updateZoomLabel(this.state.routeZoom);
		});

		if (this.ui.recordBtn) {
			this.ui.recordBtn.addEventListener('click', () => {
				if (!this.state.fullRoute || this.state.fullRoute.length === 0) {
					alert('Please load a GPX file first');
					return;
				}
				console.log('Record button clicked');
				this.startRecording();
			});
		} else {
			console.error('Record button not found!');
		}

		// Обработчик загрузки GPX файла
		this.ui.gpxFileInput.addEventListener('change', (e) => {
			this.handleGPXUpload(e);
		});

		// Обработчик удаления трека
		this.ui.deleteGpxBtn.addEventListener('click', () => {
			this.deleteTrack();
		});
	}

	async startAnimation() {
		// Сначала убираем полную линию маршрута и инфобокс
		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
		}
		this.ui.hideInfoBox();

		// Центрируем карту на точке старта
		const startPoint = this.state.fullRoute[0];
		this.map.setView([startPoint.lat, startPoint.lng], this.state.routeZoom, {
			animate: true,
			duration: 1
		});

		// Ждём 1 секунду, чтобы завершилась анимация центрирования
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Показываем countdown и запускаем анимацию
		this.ui.showCountdown(() => this.animator.start());
	}

	handleGPXUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		if (!file.name.endsWith('.gpx')) {
			alert('Please select a valid GPX file');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const gpxText = e.target.result;

			// Сохраняем в localStorage
			try {
				localStorage.setItem('uploadedGPX', gpxText);
				localStorage.setItem('uploadedGPXFileName', file.name);
				console.log('GPX saved to localStorage');
			} catch (error) {
				console.error('Error saving to localStorage:', error);
				alert('File too large to save locally');
				return;
			}

			// Парсим и отображаем (включая полную линию маршрута и инфобокс)
			this.parseAndDisplayGPX(gpxText);
			this.ui.gpxFileName.textContent = `📄 ${file.name}`;
			this.ui.deleteGpxBtn.classList.add('visible');

			// Сбрасываем анимацию
			if (this.animator.animatedLine) {
				this.map.removeLayer(this.animator.animatedLine);
				this.animator.animatedLine = null;
			}
			this.animator.currentStep = 0;
		};

		reader.readAsText(file);
	}

	deleteTrack() {
		if (!confirm('Are you sure you want to delete the loaded track?')) {
			return;
		}

		// Удаляем из localStorage
		localStorage.removeItem('uploadedGPX');
		localStorage.removeItem('uploadedGPXFileName');

		// Очищаем карту
		if (this.startMarker) this.map.removeLayer(this.startMarker);
		if (this.endMarker) this.map.removeLayer(this.endMarker);
		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
			this.fullRouteLine = null;
		}
		if (this.animator.animatedLine) {
			this.map.removeLayer(this.animator.animatedLine);
			this.animator.animatedLine = null;
		}

		// Сбрасываем состояние
		this.state.fullRoute = [];
		this.state.gpxData = null;
		this.animator.currentStep = 0;

		// Обновляем UI
		this.ui.gpxFileName.textContent = 'No track loaded';
		this.ui.deleteGpxBtn.classList.remove('visible');
		this.ui.hideInfoBox();

		// Возвращаем карту к начальному виду
		this.map.setView([49.997, 14.24], this.state.initialZoom);

		console.log('Track deleted');
	}

	async startRecording() {
		try {
			// Запрашиваем захват с выбором вкладки или окна (без Entire Screen)
			const recordStream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { ideal: 3840 },
					height: { ideal: 2160 },
					frameRate: { max: 120, ideal: 120 }
				},
				audio: false,
				systemAudio: "exclude",
				monitorTypeSurfaces: "exclude"
			});

			// Переходим в полноэкранный режим после выбора источника
			await document.documentElement.requestFullscreen();

			// Ждём пока скроется попап "to exit full screen press Esc" (3 секунды)
			await new Promise(resolve => setTimeout(resolve, 3000));

			// Добавляем класс для скрытия курсора
			document.body.classList.add('recording');

			// Настройки MediaRecorder
			const options = {
				mimeType: 'video/webm;codecs=av1',
				videoBitsPerSecond: 250000000
			};

			const mediaRecorder = new MediaRecorder(recordStream, options);
			const recordedChunks = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					recordedChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const blob = new Blob(recordedChunks, { type: 'video/webm' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;

				// Формируем имя файла из имени трека
				const gpxFileName = localStorage.getItem('uploadedGPXFileName') || 'track';
				const baseName = gpxFileName.replace(/\.gpx$/i, '');
				a.download = `track-${baseName}.webm`;

				a.click();
				URL.revokeObjectURL(url);

				// Очищаем
				recordStream.getTracks().forEach(track => track.stop());

				// Убираем класс recording
				document.body.classList.remove('recording');

				// Выходим из полноэкранного режима
				if (document.fullscreenElement) {
					document.exitFullscreen();
				}
			};

			// Начинаем запись
			mediaRecorder.start();

			// Устанавливаем коллбэк на завершение анимации
			this.animator.onCompleteCallback = () => {
				if (mediaRecorder && mediaRecorder.state !== 'inactive') {
					mediaRecorder.stop();
				}
			};

			// Запускаем анимацию (переиспользуем существующую логику)
			this.startAnimation();

		} catch (error) {
			console.error('Ошибка при записи видео:', error);
			alert('Не удалось начать запись. Убедитесь, что выбрали правильную вкладку.');

			// Убираем класс recording в случае ошибки
			document.body.classList.remove('recording');

			// Выходим из fullscreen в случае ошибки
			if (document.fullscreenElement) {
				document.exitFullscreen();
			}
		}
	}
}
