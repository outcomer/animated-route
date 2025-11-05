/**
 * Manager for handling video recording functionality
 */
export class RecordingManager {
	/**
	 * Create a new RecordingManager instance
	 * @param {Object} map - Leaflet map instance
	 * @param {Object} storageManager - StorageManager instance
	 * @param {Object} ui - UIController instance
	 */
	constructor(map, storageManager, ui) {
		this.map = map;
		this.storageManager = storageManager;
		this.ui = ui;
		this.isRecordingSupported = false;
		this.checkRecordingSupport();
	}

	/**
	 * Check if screen recording is supported
	 */
	checkRecordingSupport() {
		this.isRecordingSupported = navigator.mediaDevices &&
									typeof navigator.mediaDevices.getDisplayMedia === 'function';

		if (!this.isRecordingSupported) {
			console.log('Screen recording not supported on this device');
		}
	}

	/**
	 * Check if recording is supported on this device
	 * @returns {boolean} True if recording is supported
	 */
	isSupported() {
		return this.isRecordingSupported;
	}

	/**
	 * Start video recording of the route animation
	 * @param {Function} startAnimationCallback - Callback to start animation
	 */
	async startRecording(startAnimationCallback) {
		let recordStream = null;

		try {
			recordStream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					aspectRatio: { ideal: 16/9 },
					frameRate: { ideal: 120 }
				},
				audio: false,
				systemAudio: "exclude",
				monitorTypeSurfaces: "exclude"
			});

			await document.documentElement.requestFullscreen();
			await new Promise(resolve => setTimeout(resolve, 3000));
			document.body.classList.add('recording');
			await new Promise(resolve => setTimeout(resolve, 100));
			this.map.invalidateSize();

			const options = {
				mimeType: 'video/webm;codecs=av1',
				videoBitsPerSecond: 15000000
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

				const gpxFileName = this.storageManager.load('gpxFileName') || 'track';
				const baseName = gpxFileName.replace(/\.gpx$/i, '');
				a.download = `track-${baseName}.webm`;

				a.click();
				URL.revokeObjectURL(url);

				if (recordStream) {
					recordStream.getTracks().forEach(track => track.stop());
				}

				document.body.classList.remove('recording');

				if (document.fullscreenElement) {
					document.exitFullscreen();
				}
			};

			mediaRecorder.start(1000);

			// Listen for ending scenario completion to stop recording
			const stopRecording = () => {
				if (mediaRecorder && mediaRecorder.state !== 'inactive') {
					mediaRecorder.stop();
				}
			};

			document.addEventListener('endingScenarioComplete', stopRecording, { once: true });

			startAnimationCallback();

		} catch (error) {
			console.error('Error recording video:', error);
			alert('Failed to start recording. Make sure you selected the correct tab.');

			document.body.classList.remove('recording');
			document.body.classList.remove('format-16-9');
			document.body.classList.remove('format-9-16');

			if (document.fullscreenElement) {
				document.exitFullscreen();
			}
		}
	}
}
