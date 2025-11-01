import { GPXMetrics } from './GPXMetrics.js';
import { UIController } from './UIController.js';
import { RouteAnimator } from './RouteAnimator.js';
import { GPXDensifier } from './GPXDensifier.js';

// Дефолтные значения
const DEFAULT_WEIGHT = 80; // кг
const STORAGE_KEY = `${window.location.hostname}_appData`;

// Словарь стилей карт
const MAP_STYLES = {
	light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
	dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
	voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
	osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	osm_hot: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
	cyclosm: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
	satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
	street: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
	topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
};

// Главный класс приложения
export class TrackVisualization {
	constructor(state) {
		this.state = state;
		this.initMap();
		this.ui = new UIController();
		this.ui.initDuration(this.state.animationDuration); // Инициализируем ползунок длительности
		this.ui.initZoom(this.state.routeZoom); // Инициализируем ползунок зума
		this.animator = new RouteAnimator(this.map, this.state, this.ui, this);
		this.initAppData(); // Инициализируем структуру данных
		this.loadInitialData(); // Загружаем сохраненные данные приложения
		this.attachEventListeners();
	}

	initMap() {
		this.map = L.map('map', {
			zoomAnimation: true,
			fadeAnimation: true,
			markerZoomAnimation: true
		}).setView([49.997, 14.24], this.state.initialZoom);

		// Создаем tile layer с дефолтным стилем (будет заменен при загрузке из localStorage)
		this.tileLayer = L.tileLayer(MAP_STYLES['light'], {
			attribution: '© OpenStreetMap © CartoDB',
			maxZoom: 18,
			keepBuffer: 6,
			updateWhenIdle: false,
			updateWhenZooming: false
		}).addTo(this.map);

		this.startIcon = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34]
		});

		this.endIcon = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34]
		});

		// Синхронизируем слайдер зума при любом изменении зума карты (мышь, жесты и т.д.)
		this.map.on('zoomend', () => {
			const currentZoom = this.map.getZoom();
			this.state.routeZoom = currentZoom;
			this.ui.updateZoomSlider(currentZoom);
		});
	}

	// Инициализация структуры данных приложения
	initAppData() {
		try {
			const appDataStr = localStorage.getItem(STORAGE_KEY);
			if (!appDataStr) {
				const defaultData = {
					gpx: null, // Оригинальный GPX
					gpxDensified: null, // Нормализованный GPX (5м между точками)
					gpxFileName: null,
					weight: DEFAULT_WEIGHT,
					useDensified: true, // По умолчанию использовать нормализованный
					cameraFollow: true, // По умолчанию следовать за маршрутом
					mapStyle: 'light', // По умолчанию CartoDB Light
					animationDuration: 60, // По умолчанию 60 секунд
					routeZoom: this.state.initialZoom // Используем initialZoom из state
				};
				localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
			}
		} catch (error) {
			console.error('Error initializing app data:', error);
		}
	}

	// Загрузка данных: loadAppData() - все данные, loadAppData('weight') - только weight
	loadAppData(option = null) {
		try {
			const appDataStr = localStorage.getItem(STORAGE_KEY);
			if (!appDataStr) return null;

			const appData = JSON.parse(appDataStr);

			// Если указана конкретная опция, возвращаем только её
			if (option) {
				return appData[option];
			}

			// Иначе возвращаем все данные
			return appData;
		} catch (error) {
			console.error('Error loading app data:', error);
			return null;
		}
	}

	// Сохранение данных: saveAppData('weight', value) - сохраняет конкретное поле
	saveAppData(option, value) {
		try {
			const appDataStr = localStorage.getItem(STORAGE_KEY);
			const appData = appDataStr ? JSON.parse(appDataStr) : {
				gpx: null,
				gpxFileName: null,
				weight: DEFAULT_WEIGHT
			};

			appData[option] = value;

			localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
		} catch (error) {
			console.error('Error saving app data:', error);
		}
	}

	// Загрузка данных приложения при старте
	loadInitialData() {
		try {
			const appData = this.loadAppData();
			if (!appData) {
				this.ui.gpxFileName.textContent = 'No track loaded';
				this.ui.deleteGpxBtn.classList.remove('visible');
				return;
			}

			// Загружаем настройки
			this.ui.initWeight(appData.weight);
			this.ui.initDensifiedToggle(appData.useDensified);
			this.ui.initCameraFollowToggle(appData.cameraFollow);
			this.state.cameraFollow = appData.cameraFollow;

			// Инициализируем стиль карты
			this.ui.mapStyleSelect.value = appData.mapStyle;
			this.changeMapStyle(appData.mapStyle);

			// Загружаем animation duration
			this.state.animationDuration = appData.animationDuration;
			this.ui.initDuration(appData.animationDuration);

			// Загружаем routeZoom
			this.state.routeZoom = appData.routeZoom;
			this.ui.initZoom(appData.routeZoom);

			// Загружаем GPX если есть
			if (appData.gpx && appData.gpxFileName) {
				// Выбираем какую версию отображать
				const gpxToDisplay = appData.useDensified && appData.gpxDensified ? appData.gpxDensified : appData.gpx;
				this.parseAndDisplayGPX(gpxToDisplay, false); // false = не делать fitBounds при восстановлении
				this.ui.gpxFileName.textContent = `📄 ${appData.gpxFileName}`;
				this.ui.deleteGpxBtn.classList.add('visible');
				console.log('Loaded app data from localStorage');
				console.log('Using', appData.useDensified ? 'densified' : 'original', 'track');

				// Центруем карту на треке с сохраненным зумом
				const bounds = this.fullRouteLine.getBounds();
				const center = bounds.getCenter();
				this.map.setView(center, appData.routeZoom);
			} else {
				// Если трека нет, применяем зум к пустой карте
				this.map.setZoom(appData.routeZoom);
				this.ui.gpxFileName.textContent = 'No track loaded';
				this.ui.deleteGpxBtn.classList.remove('visible');
			}
		} catch (error) {
			console.error('Error loading initial data:', error);
		}
	}

	parseAndDisplayGPX(gpxText, shouldFitBounds = true) {
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
		this.drawFullRoute(points, shouldFitBounds);
		this.ui.showInfoBox(); // Показываем информацию о треке
	}

	drawFullRoute(points, shouldFitBounds = true) {
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

		// Масштабируем карту так, чтобы был виден весь маршрут (только при новой загрузке)
		if (shouldFitBounds) {
			this.map.fitBounds(this.fullRouteLine.getBounds(), {
				padding: [50, 50]
			});

			// Ждем завершения fitBounds и сохраняем зум
			this.map.once('moveend', () => {
				const currentZoom = this.map.getZoom();
				this.state.routeZoom = currentZoom;
				this.saveAppData('routeZoom', currentZoom);
			});
		}
	}

	calculateAndDisplayMetrics(points) {
		const distance = GPXMetrics.calculateDistance(points);
		const elevation = GPXMetrics.calculateElevation(points);
		const timeData = GPXMetrics.calculateTimeAndSpeed(points);

		if (timeData) {
			const movingSpeed = (distance / (timeData.movingTime / 3600)).toFixed(2);
			const totalSpeed = (distance / (timeData.totalTime / 3600)).toFixed(2);
			const weight = this.loadAppData('weight') || DEFAULT_WEIGHT;
			const calories = GPXMetrics.calculateCalories(distance, timeData.movingTime, elevation.gain, weight);

			this.ui.updateInfoBox({
				title: this.state.title,
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

	async addMarkers(points) {
		// Удаляем предыдущие маркеры, если они есть
		if (this.startMarker) this.map.removeLayer(this.startMarker);
		if (this.endMarker) this.map.removeLayer(this.endMarker);

		// Показываем маркер старта
		this.startMarker = L.marker([points[0].lat, points[0].lng], {
			icon: this.startIcon
		})
		.addTo(this.map)
		.bindPopup('<b>Start</b>');

		// Задержка между показом старта и финиша
		await new Promise(resolve => setTimeout(resolve, 300));

		// Показываем маркер финиша
		this.endMarker = L.marker([points[points.length - 1].lat, points[points.length - 1].lng], {
			icon: this.endIcon
		})
		.addTo(this.map)
		.bindPopup('<b>Finish</b>');

		// Задержка после показа маркера финиша
		await new Promise(resolve => setTimeout(resolve, 700));
	}

	changeMapStyle(styleKey) {
		const tileUrl = MAP_STYLES[styleKey];
		if (!tileUrl) {
			console.error('Unknown map style:', styleKey);
			return;
		}

		// Удаляем старый tile layer
		if (this.tileLayer) {
			this.map.removeLayer(this.tileLayer);
		}

		// Добавляем новый tile layer
		this.tileLayer = L.tileLayer(tileUrl, {
			attribution: '© OpenStreetMap © CartoDB',
			maxZoom: 18,
			keepBuffer: 6,
			updateWhenIdle: false,
			updateWhenZooming: false
		}).addTo(this.map);

		console.log('Map style changed to:', styleKey);
	}

	attachEventListeners() {
		this.ui.startBtn.addEventListener('click', () => {
			if (!this.state.fullRoute || this.state.fullRoute.length === 0) {
				alert('Please load a GPX file first');
				return;
			}
			this.startAnimation();
		});

		this.ui.durationSlider.addEventListener('input', (e) => {
			this.state.animationDuration = parseInt(e.target.value);
			this.ui.updateDurationLabel(this.state.animationDuration);
			this.saveAppData('animationDuration', this.state.animationDuration);
		});

		this.ui.zoomSlider.addEventListener('input', (e) => {
			this.state.routeZoom = parseInt(e.target.value);
			this.ui.updateZoomLabel(this.state.routeZoom);
			this.saveAppData('routeZoom', this.state.routeZoom);
			// Сразу применяем зум к карте
			this.map.setZoom(this.state.routeZoom);
		});

		this.ui.weightInput.addEventListener('input', (e) => {
			const weight = parseInt(e.target.value);
			// Сохраняем изменение веса
			this.saveAppData('weight', weight);
			// Пересчитываем метрики если трек загружен
			if (this.state.fullRoute && this.state.fullRoute.length > 0) {
				this.calculateAndDisplayMetrics(this.state.fullRoute);
			}
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

		// Обработчик сворачивания/разворачивания панели контролов
		this.ui.toggleControlsBtn.addEventListener('click', () => {
			this.ui.toggleControls();
		});

		// Обработчик переключения между оригинальным и нормализованным треком
		this.ui.densifiedToggle.addEventListener('change', (e) => {
			const useDensified = e.target.checked;
			this.saveAppData('useDensified', useDensified);

			// Перезагружаем трек если он загружен
			const appData = this.loadAppData();
			if (appData && appData.gpx) {
				const gpxToDisplay = useDensified && appData.gpxDensified ? appData.gpxDensified : appData.gpx;
				this.parseAndDisplayGPX(gpxToDisplay);
				console.log('Switched to', useDensified ? 'densified' : 'original', 'track');
			}
		});

		// Обработчик переключения режима следования камеры
		this.ui.cameraFollowToggle.addEventListener('change', (e) => {
			const cameraFollow = e.target.checked;
			this.state.cameraFollow = cameraFollow;
			this.saveAppData('cameraFollow', cameraFollow);
			console.log('Camera follow:', cameraFollow ? 'enabled' : 'disabled');
		});

		// Обработчик смены стиля карты
		this.ui.mapStyleSelect.addEventListener('change', (e) => {
			const styleKey = e.target.value;
			this.changeMapStyle(styleKey);
			this.saveAppData('mapStyle', styleKey);
		});
	}

	async startAnimation() {
		// Сбрасываем состояние аниматора
		if (this.animator.animatedLine) {
			this.map.removeLayer(this.animator.animatedLine);
			this.animator.animatedLine = null;
		}
		this.animator.clearSegments();
		this.animator.currentStep = 0;

		// Убираем полную линию маршрута, маркеры и инфобокс
		if (this.fullRouteLine) {
			this.map.removeLayer(this.fullRouteLine);
		}
		if (this.startMarker) {
			this.map.removeLayer(this.startMarker);
		}
		if (this.endMarker) {
			this.map.removeLayer(this.endMarker);
		}
		this.ui.hideInfoBox();
		this.ui.clearProgress();

		// Сохраняем текущий зум пользователя
		const userZoom = this.map.getZoom();

		// Определяем центр маршрута и bounds
		const coords = this.state.fullRoute.map(p => [p.lat, p.lng]);
		const bounds = L.latLngBounds(coords);
		const center = bounds.getCenter();
		const duration = 4;

		// Шаг 1: Мгновенно ставим зум 5 на центре маршрута
		this.map.setView(center, 5, { animate: true });

		// Шаг 2: Показываем countdown
		await this.ui.showCountdown();

		// Шаг 3: Плавный полёт к нужной позиции с исходным зумом
		if (this.state.cameraFollow) {
			// Если камера следует - летим к стартовой точке
			const startPoint = this.state.fullRoute[0];
			this.map.flyTo([startPoint.lat, startPoint.lng], userZoom, {
				duration: duration
			});
		} else {
			// Если камера статична - летим к центру маршрута
			// чтобы при исходном зуме весь маршрут был виден
			this.map.flyTo(center, userZoom, {
				duration: duration
			});
		}
		await new Promise(resolve => setTimeout(resolve, duration * 1000));

		// Принудительно обновляем карту чтобы убрать артефакты тайлов
		this.map.invalidateSize();

		// Шаг 4: Показываем маркеры старта и финиша с задержками и анимацией
		await this.addMarkers(this.state.fullRoute);

		// Шаг 5: Запускаем анимацию
		this.animator.start();
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

			// Создаем нормализованную версию трека (5м между точками)
			console.log('Creating densified version of the track...');
			let gpxDensified;
			try {
				gpxDensified = GPXDensifier.densify(gpxText, 5);
			} catch (error) {
				console.error('Error densifying GPX:', error);
				gpxDensified = null;
			}

			// Сохраняем обе версии в localStorage
			try {
				this.saveAppData('gpx', gpxText); // Оригинал
				this.saveAppData('gpxDensified', gpxDensified); // Нормализованный
				this.saveAppData('gpxFileName', file.name);
				console.log('App data saved to localStorage');
			} catch (error) {
				console.error('Error saving to localStorage:', error);
				alert('File too large to save locally');
				return;
			}

			// Определяем какую версию отображать
			const useDensified = this.loadAppData('useDensified') !== false; // По умолчанию true
			const gpxToDisplay = useDensified && gpxDensified ? gpxDensified : gpxText;

			// Парсим и отображаем (включая полную линию маршрута и инфобокс)
			this.parseAndDisplayGPX(gpxToDisplay);
			this.ui.gpxFileName.textContent = `📄 ${file.name}`;
			this.ui.deleteGpxBtn.classList.add('visible');

			// Сбрасываем анимацию
			if (this.animator.animatedLine) {
				this.map.removeLayer(this.animator.animatedLine);
				this.animator.animatedLine = null;
			}
			this.animator.clearSegments();
			this.animator.currentStep = 0;
		};

		reader.readAsText(file);
	}

	deleteTrack() {
		if (!confirm('Are you sure you want to delete the loaded track?')) {
			return;
		}

		// Удаляем обе версии GPX из appData, но оставляем настройки
		this.saveAppData('gpx', null);
		this.saveAppData('gpxDensified', null);
		this.saveAppData('gpxFileName', null);

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
		this.animator.clearSegments();

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
		let recordStream = null;

		try {
			// Запрашиваем захват с выбором вкладки или окна (без Entire Screen)
			recordStream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					aspectRatio: { ideal: 16/9 },
					frameRate: { ideal: 120 } // 60 FPS для плавной записи без VFR
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

			// Даем браузеру время применить CSS стили 16:9
			await new Promise(resolve => setTimeout(resolve, 100));

			// Пересчитываем размеры карты после изменения размеров контейнера
			this.map.invalidateSize();

			// Настройки MediaRecorder - оптимизированные для плавной записи
			const options = {
				mimeType: 'video/webm;codecs=av1', // VP9 легче чем AV1
				videoBitsPerSecond: 15000000 // 15 Mbps - оптимальный баланс
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

				// Формируем имя файла из имени трека из appData
				const gpxFileName = this.loadAppData('gpxFileName') || 'track';
				const baseName = gpxFileName.replace(/\.gpx$/i, '');
				a.download = `track-${baseName}.webm`;

				a.click();
				URL.revokeObjectURL(url);

				// Очищаем stream
				if (recordStream) {
					recordStream.getTracks().forEach(track => track.stop());
				}

				// Убираем класс recording
				document.body.classList.remove('recording');

				// Выходим из fullscreen
				if (document.fullscreenElement) {
					document.exitFullscreen();
				}
			};

			// Начинаем запись с timeslice для равномерной записи
			// 1000ms = записываем чанки каждую секунду для плавности
			mediaRecorder.start(1000);

			// Устанавливаем коллбэк на завершение анимации
			this.animator.onCompleteCallback = async (showControlsCallback) => {
				// Ждём 2 секунды после окончания анимации
				await new Promise(resolve => setTimeout(resolve, 2000));

				// Останавливаем запись
				if (mediaRecorder && mediaRecorder.state !== 'inactive') {
					mediaRecorder.stop();

					// Ждём завершения onstop перед показом контролов
					await new Promise(resolve => {
						mediaRecorder.addEventListener('stop', resolve, { once: true });
					});

					// Показываем контролы ПОСЛЕ завершения записи
					if (showControlsCallback) {
						showControlsCallback();
					}
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
