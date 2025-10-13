# GPX Route Viewer

Interactive GPX track visualization with smooth animation on a map using Leaflet.js. Features built-in video recording and automatic data persistence.

## Features

- 🗺️ Beautiful route animation with customizable speed
- 📊 Automatic metrics calculation (distance, elevation, calories, time)
- 📁 Upload GPX files through UI (no configuration needed)
- 💾 Automatic data persistence in localStorage
- 🎬 Built-in video recording (no external tools required)
- 🎨 Multiple map tile styles (OSM, CartoDB, Satellite, etc.)
- 📍 Start/finish markers
- 🎯 Auto-follow camera during animation
- 💨 Adjustable speed (-5 to +5 multiplier)
- 🔍 Configurable animation zoom level
- ⚖️ Customizable weight for calorie calculation

## Quick Start

### 1. Setup

Clone the repository:
```bash
git clone https://github.com/outcomer/animated-route.git
cd animated-route
```

### 2. Run

Start a local web server:

**Python 3:**
```bash
python -m http.server 8000
```

**Node.js (http-server):**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

Then open: http://localhost:8000

### 3. Load GPX File

1. Click **📁 Load GPX** button
2. Select your GPX file
3. Track will be displayed automatically
4. All data is saved to localStorage

That's it! No configuration files to edit.

## Controls

- **📁 Load GPX** - Upload a GPX track file
- **🗑️** - Delete currently loaded track
- **▶ Start animation** - Begin route playback with 3-2-1 countdown
- **⏺ Record animation** - Record animation to video file
- **Speed slider** - Adjust animation speed (-5 to +5)
- **Start zoom slider** - Set zoom level for animation (12-18)
- **Weight input** - Set your weight in kg for calorie calculation (40-150)

## Video Recording

Record your animation directly in the browser:

1. Load a GPX track
2. Click **⏺ Record animation**
3. Select the browser tab to record
4. Animation starts automatically in fullscreen
5. Video downloads when complete

**Features:**
- AV1 codec with high bitrate (250 Mbps)
- Up to 4K resolution (3840x2160)
- 120 FPS capture
- Automatic filename based on GPX file name
- Cursor hidden during recording

**Note:** Recording requires modern browser with MediaRecorder API support (Chrome/Edge recommended).

## Configuration

Edit `js/track.js` to customize defaults:

```javascript
const state = {
    title: 'GPX Route Viewer',// Page title
    speed: 0,                 // Default speed slider value (-5 to +5)
    animationIntensity: 1.5,  // Animation easing intensity
    trackColor: 'rgb(0 0 0)', // Track line color
    mapTileUrl: '...',        // Map tile provider URL
    initialZoom: 12,          // Initial map zoom
    routeZoom: 16,            // Animation zoom level
    fullRoute: [],            // Populated on GPX load
    gpxData: null             // Populated on GPX load
};
```

### Map Tile Options

Uncomment your preferred map style in `js/track.js`:

```javascript
// Light theme (default)
mapTileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',

// Dark theme
// mapTileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',

// OSM Standard
// mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

// Satellite
// mapTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',

// Cycling map
// mapTileUrl: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
```

### Default Weight

Edit `js/TrackVisualization.js`:

```javascript
const DEFAULT_WEIGHT = 80; // kg
```

## Project Structure

```
me-animated-route/
├── index.html              # Main HTML file
├── js/
│   ├── track.js            # Main entry point & configuration
│   ├── TrackVisualization.js  # Core application logic
│   ├── UIController.js     # UI controls handler
│   ├── RouteAnimator.js    # Animation engine
│   └── GPXMetrics.js       # Metrics calculation
├── css/
│   └── track.css           # Styles
├── favicon.svg             # App icon
├── .gitignore
└── README.md
```

## Metrics Calculated

The app automatically calculates and displays:

- **Distance** - Total route length (km)
- **Elevation** - Gain and loss (meters)
- **Speed** - Moving average and total average (km/h)
- **Time** - Moving time and total time (HH:MM:SS)
- **Calories** - Estimated calories burned (kcal) based on:
  - MET values for cycling at different speeds
  - Body weight
  - Elevation gain

## Data Persistence

All data is automatically saved to localStorage:

- **GPX file content** - Track data
- **GPX file name** - For display and video naming
- **Weight** - User's weight setting

Storage key format: `{hostname}_appData`

Examples:
- `localhost_appData`
- `example.com_appData`

## Technical Details

### Architecture

- **ES6 Modules** - Modular code organization
- **Leaflet.js** - Map rendering and interaction
- **MediaRecorder API** - In-browser video capture
- **FileReader API** - GPX file loading
- **localStorage** - Data persistence

### Browser Requirements

- Modern browser with:
  - ES6 module support
  - MediaRecorder API (for video recording)
  - FileReader API (for GPX upload)
  - Fullscreen API (for recording)

### Tested On

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Customization

### Change Track Color

Edit `js/track.js`:

```javascript
trackColor: 'rgb(255 0 0)',  // Red track
```

### Adjust Animation Behavior

Edit `js/track.js`:

```javascript
animationIntensity: 1.5,  // 1.0 = linear, 2.0 = strong easing, 0.5 = weak easing
```

### Modify Marker Icons

Edit `js/TrackVisualization.js` in the `initMap()` method to change marker URLs or styles.

## Tips

### Getting GPX Files

1. Export from fitness apps (Strava, Garmin Connect, Komoot, etc.)
2. Record with GPS tracking apps
3. Create custom routes with [GPX Studio](https://gpx.studio/)

### Performance

- Animation optimized for routes up to 1000 points
- Large files (>5MB) may exceed localStorage limits
- Simplify tracks in GPX editors if needed

### Troubleshooting

**GPX file not loading:**
- Must use local web server (not `file://` protocol)
- Check browser console for errors
- Ensure GPX file is valid XML with `<trkpt>` elements

**localStorage quota exceeded:**
- Large GPX files may exceed 5-10MB browser limit
- Simplify track or use smaller GPX files

**Video recording not working:**
- Ensure browser supports MediaRecorder with AV1
- Select the correct browser tab when prompted
- Check browser permissions for screen capture

**Animation stuttering:**
- Reduce route point count
- Lower recording FPS expectations
- Close other browser tabs

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Credits

- [Leaflet.js](https://leafletjs.com/) - Interactive map library
- [OpenStreetMap](https://www.openstreetmap.org/) - Map data
- [CartoDB](https://carto.com/basemaps/) - Map tiles

## Support

For issues and questions, please open a GitHub issue.
