// Класс для управления UI элементами
export class UIController {
	constructor() {
		this.controls = document.querySelector('.controls');
		this.infoBox = document.querySelector('.info-box');
		this.progress = document.getElementById('progress');
		this.startBtn = document.getElementById('startBtn');
		this.recordBtn = document.getElementById('recordBtn');
		this.durationSlider = document.getElementById('durationSlider');
		this.durationLabel = document.getElementById('durationLabel');
		this.zoomSlider = document.getElementById('zoomSlider');
		this.zoomLabel = document.getElementById('zoomLabel');
		this.weightInput = document.getElementById('weightInput');
		this.densifiedToggle = document.getElementById('densifiedToggle');
		this.cameraFollowToggle = document.getElementById('cameraFollowToggle');
		this.mapStyleSelect = document.getElementById('mapStyleSelect');
		this.gpxFileInput = document.getElementById('gpxFile');
		this.gpxFileName = document.getElementById('gpxFileName');
		this.deleteGpxBtn = document.getElementById('deleteGpxBtn');
		this.toggleControlsBtn = document.getElementById('toggleControlsBtn');

		// Состояние сайдбара
		this.isControlsOpen = false;
		this.isControlsVisible = true; // Видимость кнопки и сайдбара
	}

	async showCountdown() {
		this.hideControls();

		const countdown = document.createElement('div');
		countdown.className = 'countdown';
		document.body.appendChild(countdown);

		const numbers = [3, 2, 1];

		for (const number of numbers) {
			countdown.textContent = number;
			countdown.style.animation = 'none';
			await new Promise(resolve => setTimeout(resolve, 10));
			countdown.style.animation = 'pulse 0.25s ease-in-out';
			await new Promise(resolve => setTimeout(resolve, 500));
		}

		countdown.remove();
		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	showInfoBox() {
		this.infoBox.classList.remove('hidden');
	}

	hideInfoBox() {
		this.infoBox.classList.add('hidden');
	}

	showControls() {
		this.isControlsVisible = true;
		this.isControlsOpen = true; // Открываем сайдбар после анимации
		this.updateControlsVisibility();
	}

	hideControls() {
		this.isControlsVisible = false;
		this.isControlsOpen = false;
		this.updateControlsVisibility();
	}

	updateControlsVisibility() {
		if (this.isControlsVisible) {
			this.toggleControlsBtn.classList.remove('hidden');
			this.controls.classList.remove('hidden');
			if (this.isControlsOpen) {
				this.controls.classList.add('open');
			} else {
				this.controls.classList.remove('open');
			}
		} else {
			this.toggleControlsBtn.classList.add('hidden');
			this.controls.classList.add('hidden');
			this.controls.classList.remove('open');
		}
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

	updateDurationLabel(duration) {
		this.durationLabel.textContent = duration;
	}

	initDuration(duration) {
		this.durationSlider.value = duration;
		this.updateDurationLabel(duration);
	}

	updateZoomLabel(zoom) {
		this.zoomLabel.textContent = zoom;
	}

	initZoom(zoom) {
		this.zoomSlider.value = zoom;
		this.updateZoomLabel(zoom);
	}

	updateZoomSlider(zoom) {
		this.zoomSlider.value = zoom;
		this.updateZoomLabel(zoom);
	}

	initWeight(weight) {
		this.weightInput.value = weight;
	}

	initDensifiedToggle(useDensified) {
		this.densifiedToggle.checked = useDensified;
	}

	initCameraFollowToggle(cameraFollow) {
		this.cameraFollowToggle.checked = cameraFollow;
	}

	toggleControls() {
		if (!this.isControlsVisible) return; // Если скрыто - не переключать
		this.isControlsOpen = !this.isControlsOpen;
		this.updateControlsVisibility();
	}
}
