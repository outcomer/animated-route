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
		this.isRunning = false;
		this.distances = []; // Расстояния между точками
		this.avgDistance = 0; // Среднее расстояние
		this.smoothDistance = 0; // Сглаженное расстояние
		this.smoothingAlpha = 0.75; // Коэффициент сглаживания (0.75 = 75% предыдущее, 25% новое)
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

		// Предварительно рассчитываем расстояния
		this.precalculateDistances();

		// Запускаем первый шаг
		this.scheduleNextStep();
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

		// Конвертируем значение слайдера (-5 до +5) в реальную скорость
		// 0 на слайдере = 4x скорость (базовая)
		const actualSpeed = Math.max(0.5, 4 + this.state.speed);

		if (this.currentStep >= this.distances.length) {
			return baseDelay / actualSpeed;
		}

		// Текущее расстояние до следующей точки
		const currentDistance = this.distances[this.currentStep];

		// Экспоненциальное сглаживание
		this.smoothDistance = this.smoothingAlpha * this.smoothDistance +
		                      (1 - this.smoothingAlpha) * currentDistance;

		// Нормализуем относительно среднего расстояния
		// Если расстояние больше среднего -> была высокая скорость -> быстрее анимация
		// Если расстояние меньше среднего -> была низкая скорость -> медленнее анимация
		let normalizedDistance = this.smoothDistance / this.avgDistance;

		// Применяем интенсивность эффекта через степенную функцию
		// intensity = 1.0 -> линейный эффект
		// intensity > 1.0 -> усиленный эффект (более драматичная разница)
		// intensity < 1.0 -> ослабленный эффект (менее заметная разница)
		const intensity = this.state.animationIntensity || 1.0;
		normalizedDistance = Math.pow(normalizedDistance, intensity);

		// Задержка обратно пропорциональна расстоянию
		// Умножаем на speedMultiplier и ограничиваем минимум
		const delay = Math.max(10, baseDelay / normalizedDistance / actualSpeed);

		return delay;
	}

	animateStep() {
		this.currentStep++;

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
			smoothFactor: 2.0
		}).addTo(this.map);

		const percent = Math.round((this.currentStep / this.state.fullRoute.length) * 100);
		this.ui.updateProgress(percent);

		// Плавное панорамирование
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
				padding: [30, 30],
				duration: 2.5
			});

			this.map.once('moveend', () => {
				this.map.off('move', onMove);
				// Показываем контролы через 2 секунды после окончания анимации
				setTimeout(() => {
					this.ui.showControls();

					// Если есть коллбэк завершения - вызываем его
					if (this.onCompleteCallback) {
						this.onCompleteCallback();
						this.onCompleteCallback = null;
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
