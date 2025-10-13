// python -m http.server 8000
import { TrackVisualization } from './TrackVisualization.js';

// Конфигурация приложения
const state = {
	// Основные параметры
	title: 'GPX Route Viewer',
	date: '',

	// Настройки визуализации
	speed: 0, // Значение слайдера (-5 до +5, где 0 = базовая скорость)
	animationIntensity: 1.5, // Сила эффекта замедления (1.0 = линейно, 2.0 = сильно, 0.5 = слабо)
	trackColor: 'rgb(0 0 0)',
	// 1. OSM Standard (базовая):
	// mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	// 2. OSM HOT (гуманитарный стиль):
	// mapTileUrl: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
	// 3. Light (светлая):
	mapTileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
	// 4. Dark (темная):
	// mapTileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
	// 5. Voyager (насыщенная):
	// mapTileUrl:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
	// 6. World Imagery (спутник):
	// mapTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
	// 7. World Street Map:
	// mapTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
	// 8. World Topo Map (топографическая):
	// mapTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
	// 9. Terrain (рельеф):
	// mapTileUrl: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
	// 10. Watercolor (художественная):
	// mapTileUrl: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
	// CyclOSM (для велосипедистов):
	// mapTileUrl: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',

	initialZoom: 12, // Зум при инициализации карты
	routeZoom: 16, // Зум на точку старта после загрузки маршрута

	// Данные маршрута (заполняются при загрузке GPX)
	fullRoute: [],
	gpxData: null
};

// Устанавливаем title страницы
document.title = state.title;

// Инициализация приложения
const app = new TrackVisualization(state);
