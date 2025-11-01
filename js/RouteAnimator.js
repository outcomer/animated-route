import { GPXMetrics } from './GPXMetrics.js';

// Класс для управления анимацией маршрута
export class RouteAnimator {
	constructor(map, state, ui, trackViz) {
		this.map = map;
		this.state = state;
		this.ui = ui;
		this.trackViz = trackViz; // Ссылка на TrackVisualization
		this.animationFrameId = null; // requestAnimationFrame ID
		this.lastFrameTime = null; // Время последнего кадра
		this.accumulatedTime = 0; // Накопленное время для продвижения к следующей точке
		this.currentStep = 0;
		this.animatedLine = null;
		this.segments = []; // Массив отрисованных сегментов
		this.isRunning = false;

		// Canvas renderer для эффективной отрисовки
		this.renderer = L.canvas();
	}

	start() {
		if (this.isRunning) return;

		this.ui.startBtn.disabled = true;
		this.isRunning = true;

		// Очищаем предыдущие сегменты
		this.clearSegments();

		// Сбрасываем время
		this.lastFrameTime = null;
		this.accumulatedTime = 0;

		// Запускаем анимацию через requestAnimationFrame
		this.animationFrameId = requestAnimationFrame((timestamp) => this.animate(timestamp));
	}

	clearSegments() {
		// Удаляем все сегменты с карты
		this.segments.forEach(segment => this.map.removeLayer(segment));
		this.segments = [];
	}

	// Главный цикл анимации на базе requestAnimationFrame
	animate(timestamp) {
		if (!this.isRunning) return;

		// Инициализация времени на первом кадре
		if (this.lastFrameTime === null) {
			this.lastFrameTime = timestamp;
		}

		// Рассчитываем время с последнего кадра (в миллисекундах)
		const deltaTime = timestamp - this.lastFrameTime;
		this.lastFrameTime = timestamp;

		// Накапливаем время
		this.accumulatedTime += deltaTime;

		// Рассчитываем время на одну точку (в мс)
		const timePerPoint = this.calculateTimePerPoint();

		// Проверяем сколько точек нужно продвинуть
		while (this.accumulatedTime >= timePerPoint && this.isRunning) {
			this.accumulatedTime -= timePerPoint;

			if (this.currentStep >= this.state.fullRoute.length) {
				this.complete();
				return;
			}

			this.animateStep();
		}

		// Запрашиваем следующий кадр
		if (this.isRunning) {
			this.animationFrameId = requestAnimationFrame((ts) => this.animate(ts));
		}
	}

	// Рассчитывает время на отрисовку одной точки (в мс)
	// На основе общей длительности анимации
	calculateTimePerPoint() {
		const totalPoints = this.state.fullRoute.length;
		const durationMs = this.state.animationDuration * 1000; // Секунды в миллисекунды

		return durationMs / totalPoints;
	}

	animateStep() {
		this.currentStep++;

		if (this.currentStep > this.state.fullRoute.length) {
			this.currentStep = this.state.fullRoute.length;
		}

		// Создаём coords из всех точек до текущей
		const coords = this.state.fullRoute.slice(0, this.currentStep).map(p => [p.lat, p.lng]);

		// Если линия уже существует - обновляем координаты
		// Если нет - создаём новую
		if (this.animatedLine) {
			this.animatedLine.setLatLngs(coords);
		} else {
			this.animatedLine = L.polyline(coords, {
				color: this.state.trackColor,
				weight: 4,
				opacity: 0.8,
				smoothFactor: 2.0,
				renderer: this.renderer
			}).addTo(this.map);
		}

		const percent = Math.round((this.currentStep / this.state.fullRoute.length) * 100);
		this.ui.updateProgress(percent);

		// Плавное панорамирование к текущей точке (только если включен режим следования)
		if (this.state.cameraFollow && coords.length > 0) {
			const lastPoint = coords[coords.length - 1];
			this.map.panTo(lastPoint, { animate: true });
		}
	}

	complete() {
		this.stop();
		this.ui.setProgressComplete();
		this.ui.showInfoBox();

		// Если режим follow route - центруем весь трек без изменения зума
		if (this.state.cameraFollow) {
			const allCoords = this.state.fullRoute.map(p => [p.lat, p.lng]);
			const bounds = L.latLngBounds(allCoords);
			const currentZoom = this.map.getZoom();

			this.map.flyToBounds(bounds, {
				duration: 1.5,
				maxZoom: currentZoom,
				padding: [50, 50]
			});
		}

		// Ждём 2 секунды после окончания анимации
		setTimeout(() => {
			// Если есть коллбэк завершения (запись) - передаем ему управление
			if (this.onCompleteCallback) {
				// Передаем функцию показа контролов в callback
				this.onCompleteCallback(() => this.ui.showControls());
				this.onCompleteCallback = null;
			} else {
				// Обычная анимация - показываем контролы сразу
				this.ui.showControls();
			}
		}, 2000);
	}

	stop() {
		this.isRunning = false;
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
		this.ui.startBtn.disabled = false;
	}
}
