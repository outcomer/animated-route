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
	// Экспоненциальная зависимость от скорости (мягкая)
	calculateTimePerPoint() {
		const baseTime = 50; // Базовое время на точну в мс

		// Сдвиг на +5: теперь speed=0 соответствует старому speed=+5
		const actualSpeed = 4 * Math.pow(10, (this.state.speed + 5) / 25);

		return baseTime / actualSpeed;
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

		// Плавное панорамирование к текущей точке
		if (coords.length > 0) {
			const lastPoint = coords[coords.length - 1];
			this.map.panTo(lastPoint, { animate: true });
		}
	}

	complete() {
		this.stop();
		this.ui.setProgressComplete();
		this.ui.showInfoBox();

		// Создаём финальную polyline из всех точек для bounds
		const allCoords = this.state.fullRoute.map(p => [p.lat, p.lng]);
		const finalLine = L.polyline(allCoords);

		setTimeout(() => {
			const onMove = () => this.map.fire('viewreset');
			this.map.on('move', onMove);

			this.map.flyToBounds(finalLine.getBounds(), {
				padding: [50, 50],
				duration: 2.5
			});

			this.map.once('moveend', () => {
				this.map.off('move', onMove);
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
			});
		}, 100);
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
