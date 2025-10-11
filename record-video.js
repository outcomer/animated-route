// npm install puppeteer puppeteer-screen-recorder
const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');

(async () => {
	try {
		console.log('Запуск браузера...');
		const browser = await puppeteer.launch({
			headless: false,
			args: [
				'--window-size=1920,1080',
				'--disable-infobars',
				'--disable-dev-shm-usage',
				'--no-sandbox'
			]
		});

		const page = await browser.newPage();
		await page.setViewport({ width: 1920, height: 1080 });

		const recorder = new PuppeteerScreenRecorder(page, {
			fps: 50,
			videoFrame: {
				width: 1920,
				height: 1080,
			},
		});

		// Открыть HTML файл
		console.log('Загрузка страницы...');
		await page.goto(`http://localhost:8000/track.html`, { waitUntil: 'networkidle0' });

		// Начать запись
		console.log('Начало записи...');
		await recorder.start(path.resolve(__dirname, 'track-animation.mp4'));

		// Подождать загрузки карты и GPX данных
		await page.waitForTimeout(3000);

		// Нажать кнопку старта
		console.log('Запуск анимации...');
		await page.click('#startBtn');

		// Ждать появления текста о завершении маршрута
		console.log('Ожидание завершения анимации...');
		await page.waitForFunction(
			() => {
				const progress = document.getElementById('progress');
				return progress && progress.textContent.includes('Route completed');
			},
			{ timeout: 180000 } // Максимум 3 минуты
		);

		console.log('Анимация завершена, ждем окончания flyToBounds и паузы...');
		// Дождаться завершения flyToBounds (2.5 сек) + паузы перед показом контролов (2 сек) + запас
		await page.waitForTimeout(6000);

		// Остановить запись
		console.log('Остановка записи...');
		await recorder.stop();

		// ВАЖНО: Даем время на завершение записи файла перед закрытием браузера
		console.log('Ожидание завершения записи файла...');
		await page.waitForTimeout(3000);

		await browser.close();

		console.log('✓ Видео успешно сохранено: track-animation.mp4');
	} catch (error) {
		console.error('Ошибка при записи видео:', error);
		process.exit(1);
	}
})();
