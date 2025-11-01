// python -m http.server 8000
import { TrackVisualization } from './TrackVisualization.js';

// Конфигурация приложения
const state = {
	title: 'GPX Route Viewer',
	animationDuration: 60, // Длительность анимации в секундах
	cameraFollow: true, // Следить за маршрутом во время анимации
	trackColor: 'rgb(0 0 0)',
	initialZoom: 12, // Зум при инициализации карты
	fullRoute: [],// Данные маршрута (заполняются при загрузке GPX)
	gpxData: null
};

// Устанавливаем title страницы
document.title = state.title;

// Инициализация приложения
const app = new TrackVisualization(state);
