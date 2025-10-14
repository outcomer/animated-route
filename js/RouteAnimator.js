import { GPXMetrics } from './GPXMetrics.js';

// Класс для управления анимацией маршрута
export class RouteAnimator {
	constructor(map, state, ui, trackViz) {
		this.map = map;
		this.state = state;
		this.ui = ui;
		this.trackViz = trackViz; // Ссылка на TrackVisualization
		this.animationTimeout = null;
		this.currentStep = 0;
		this.animatedLine = null;
		this.segments = []; // Массив отрисованных сегментов
		this.isRunning = false;
		this.distances = []; // Расстояния между точками
		this.avgDistance = 0; // Среднее расстояние
		this.smoothDistance = 0; // Сглаженное расстояние
		this.smoothingAlpha = 0.75; // Коэффициент сглаживания (0.75 = 75% предыдущее, 25% новое)

		// Canvas renderer для эффективной отрисовки
		this.renderer = L.canvas();
	}

	// Предварительный расчет расстояний между точками
	precalculateDistances() {
		this.distances = [];
		for (let i = 1; i < this.state.fullRoute.length; i++) {
			const dist = GPXMetrics.calculateDistance([
				this.state.fullRoute[i - 1],
				this.state.fullRoute[i]
			]);
			this.distances.push(dist);
		}

		// Рассчитываем среднее расстояние для нормализации
		if (this.distances.length > 0) {
			this.avgDistance = this.distances.reduce((a, b) => a + b, 0) / this.distances.length;
			this.smoothDistance = this.distances[0]; // Инициализируем первым значением
		}
	}

	start() {
		if (this.isRunning) return;

		this.ui.startBtn.disabled = true;
		this.isRunning = true;

		// Очищаем предыдущие сегменты
		this.clearSegments();

		// Предварительно рассчитываем расстояния
		this.precalculateDistances();

		// Запускаем первый шаг
		this.scheduleNextStep();
	}

	clearSegments() {
		// Удаляем все сегменты с карты
		this.segments.forEach(segment => this.map.removeLayer(segment));
		this.segments = [];
	}

	scheduleNextStep() {
		if (!this.isRunning) return;

		if (this.currentStep >= this.state.fullRoute.length) {
			this.complete();
			return;
		}

		this.animateStep();

		// Рассчитываем задержку до следующего шага на основе расстояния
		const delay = this.calculateDelay();
		this.animationTimeout = setTimeout(() => this.scheduleNextStep(), delay);
	}

	calculateDelay() {
		const baseDelay = 50; // Базовая задержка в мс
		const minDelay = 10; // Минимальная задержка для стабильной работы на мобильных (Android требует минимум 4ms)

		// Конвертируем значение слайдера (-5 до +5) в реальную скорость
		// 0 на слайдере = 3x скорость (базовая)
		const actualSpeed = Math.max(0.5, 3 + this.state.speed);

		if (this.currentStep >= this.distances.length || !this.avgDistance || this.avgDistance === 0) {
			return baseDelay / actualSpeed;
		}

		// Текущее расстояние до следующей точки
		const currentDistance = this.distances[this.currentStep];

		// Проверка на валидность данных
		if (!currentDistance || isNaN(currentDistance)) {
			return baseDelay / actualSpeed;
		}

		// Экспоненциальное сглаживание
		this.smoothDistance = this.smoothingAlpha * this.smoothDistance +
		                      (1 - this.smoothingAlpha) * currentDistance;

		// Нормализуем относительно среднего расстояния
		// Если расстояние больше среднего -> была высокая скорость -> быстрее анимация
		// Если расстояние меньше среднего -> была низкая скорость -> медленнее анимация
		let normalizedDistance = this.smoothDistance / this.avgDistance;

		// Проверка на валидность нормализованного расстояния
		if (!normalizedDistance || isNaN(normalizedDistance) || normalizedDistance <= 0) {
			normalizedDistance = 1.0;
		}

		// Применяем интенсивность эффекта через степенную функцию
		// intensity = 1.0 -> линейный эффект
		// intensity > 1.0 -> усиленный эффект (более драматичная разница)
		// intensity < 1.0 -> ослабленный эффект (менее заметная разница)
		const intensity = this.state.animationIntensity;
		normalizedDistance = Math.pow(normalizedDistance, intensity);

		// Задержка обратно пропорциональна расстоянию
		// Минимум 10ms для стабильной работы на мобильных устройствах
		const delay = Math.max(minDelay, baseDelay / normalizedDistance / actualSpeed);

		return delay;
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
		if (this.animationTimeout) {
			clearTimeout(this.animationTimeout);
			this.animationTimeout = null;
		}
		this.ui.startBtn.disabled = false;
	}
}
