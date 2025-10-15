// Класс для управления UI элементами
export class UIController {
	constructor() {
		this.controls = document.querySelector('.controls');
		this.infoBox = document.querySelector('.info-box');
		this.progress = document.getElementById('progress');
		this.startBtn = document.getElementById('startBtn');
		this.recordBtn = document.getElementById('recordBtn');
		this.speedSlider = document.getElementById('speedSlider');
		this.speedLabel = document.getElementById('speedLabel');
		this.zoomSlider = document.getElementById('zoomSlider');
		this.zoomLabel = document.getElementById('zoomLabel');
		this.weightInput = document.getElementById('weightInput');
		this.densifiedToggle = document.getElementById('densifiedToggle');
		this.gpxFileInput = document.getElementById('gpxFile');
		this.gpxFileName = document.getElementById('gpxFileName');
		this.deleteGpxBtn = document.getElementById('deleteGpxBtn');
		this.toggleControlsBtn = document.getElementById('toggleControlsBtn');

		// На мобильных устройствах панель свернута по умолчанию
		this.isControlsCollapsed = window.innerWidth <= 768;
		if (this.isControlsCollapsed) {
			this.controls.classList.add('collapsed');
		}
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
					countdown.style.animation = 'pulse 0.25s ease-in-out';
				}, 10);
				index++;
				setTimeout(showNext, 500);
			} else {
				countdown.remove();
				setTimeout(callback, 1000);
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
			<p><strong>Distance:</strong> ${data.distance.toFixed(2)} km</p>
			<p><strong>Elevation, m (gain/loss):</strong> ${Math.round(data.elevation.gain)} / ${Math.round(data.elevation.loss)}</p>
			<p><strong>Speed, km/h (moving/total):</strong> ${data.movingSpeed} / ${data.totalSpeed}</p>
			<p><strong>Time (moving/total):</strong> ${data.movingTime} / ${data.totalTime}</p>
			<p><strong>Calories burned:</strong> ~${data.calories} kcal</p>
			<div class="progress" id="progress"></div>
		`;
		this.progress = document.getElementById('progress');
	}

	updateSpeedLabel(speed) {
		// Показываем значение слайдера со знаком
		const displayValue = speed > 0 ? `+${speed}` : speed;
		this.speedLabel.textContent = displayValue;
	}

	initSpeed(speed) {
		this.speedSlider.value = speed;
		this.updateSpeedLabel(speed);
	}

	updateZoomLabel(zoom) {
		this.zoomLabel.textContent = zoom;
	}

	initZoom(zoom) {
		this.zoomSlider.value = zoom;
		this.updateZoomLabel(zoom);
	}

	initWeight(weight) {
		this.weightInput.value = weight;
	}

	initDensifiedToggle(useDensified) {
		this.densifiedToggle.checked = useDensified;
	}

	toggleControls() {
		this.isControlsCollapsed = !this.isControlsCollapsed;
		if (this.isControlsCollapsed) {
			this.controls.classList.add('collapsed');
		} else {
			this.controls.classList.remove('collapsed');
		}
	}
}
