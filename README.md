# Animated GPX Route Viewer

Interactive GPX track visualization with smooth animation on a map using Leaflet.js. Features built-in video recording, automatic data persistence, and cinematic route playback.

## Features

- 🗺️ Beautiful route animation with cinematic intro (zoom out → countdown → zoom in)
- 📊 Automatic metrics calculation (distance, elevation, calories, time)
- 📁 Upload GPX files through UI (no configuration needed)
- 💾 Automatic data persistence in localStorage
- 🎬 Built-in video recording (no external tools required)
- 🎨 Multiple map tile styles (CartoDB Light/Dark/Voyager, OSM, Satellite, etc.)
- 📍 Start/finish markers with delays
- 🎯 Optional camera follow during animation
- ⏱️ Adjustable animation duration (5-300 seconds)
- 🔍 Configurable zoom level with live preview
- ⚖️ Customizable weight for calorie calculation
- 🧭 Collapsible sidebar with all controls
- 📱 Responsive design for mobile devices
- 🚴 Track densification for smoother animation (5m intervals)

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

1. Click the hamburger menu (☰) to open controls
2. Click **📁 Load GPX** button
3. Select your GPX file
4. Track will be displayed automatically
5. All data is saved to localStorage

That's it! No configuration files to edit.

## Controls

### Sidebar Menu

Click the hamburger icon (☰) in the top-right corner to open/close the controls panel.

**Track Management:**
- **📁 Load GPX** - Upload a GPX track file
- **✕** - Delete currently loaded track

**Animation Controls:**
- **▶ Animate** - Begin route playback with cinematic intro (zoom out, 3-2-1 countdown, zoom in to route)
- **⏺ Record** - Record animation to video file with automatic fullscreen

**Settings:**
- **Animation duration** - Set total animation time (5-300 seconds)
- **Zoom** - Set zoom level for animation (0-18)
- **My Weight** - Set your weight in kg for calorie calculation (40-150)
- **Use densified track** - Use interpolated track with 5m point spacing for smoother animation
- **Follow route during animation** - Camera follows the animated route (when disabled, camera stays centered on full route)
- **Map style** - Choose from 9 different map tile styles

Click outside the sidebar to close it.

## Video Recording

Record your animation directly in the browser with professional quality:

1. Load a GPX track
2. Click **⏺ Record**
3. Grant screen capture permission
4. Select the browser tab to record
5. Browser enters fullscreen automatically
6. Wait 3 seconds for fullscreen popup to disappear
7. Animation starts with cinematic intro
8. Video downloads automatically when complete

**Recording Features:**
- AV1 codec with 15 Mbps bitrate
- Up to 1920x1080 resolution (16:9 aspect ratio)
- 120 FPS capture capability
- Automatic filename based on GPX file name (`track-{filename}.webm`)
- Cursor hidden during recording
- Automatic fullscreen mode
- No controls visible during recording

**Note:** Recording requires a modern browser with MediaRecorder API support (Chrome/Edge recommended).

## Configuration

### Application State

Edit `js/track.js` to customize defaults:

```javascript
const state = {
    title: 'GPX Route Viewer',  // Page title
    animationDuration: 60,       // Default animation duration in seconds
    cameraFollow: true,          // Camera follows route by default
    trackColor: 'rgb(0 0 0)',    // Track line color (black)
    initialZoom: 12,             // Initial map zoom level
    fullRoute: [],               // Populated on GPX load
    gpxData: null                // Populated on GPX load
};
```

### Map Styles

The app includes 9 built-in map styles selectable via UI:
- CartoDB Light (default)
- CartoDB Dark
- CartoDB Voyager
- OSM Standard
- OSM HOT
- CyclOSM
- Satellite (ArcGIS World Imagery)
- World Street Map
- World Topo Map

Map style preference is saved to localStorage.

### Default Weight

Edit `js/TrackVisualization.js`:

```javascript
const DEFAULT_WEIGHT = 80; // kg
```

## Project Structure

```
animated-route/
├── index.html              # Main HTML file
├── js/
│   ├── track.js            # Main entry point & configuration
│   ├── TrackVisualization.js  # Core application logic
│   ├── UIController.js     # UI controls handler
│   ├── RouteAnimator.js    # Animation engine (requestAnimationFrame)
│   ├── GPXMetrics.js       # Metrics calculation utilities
│   └── GPXDensifier.js     # Track densification for smooth animation
├── css/
│   └── track.css           # Styles (Exo 2 font, Material Icons)
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

Metrics are displayed in the info box at the bottom-left corner after loading a track.

## Data Persistence

All data is automatically saved to localStorage:

- **GPX file content** - Original track data
- **GPX densified content** - Processed track with 5m point spacing
- **GPX file name** - For display and video naming
- **Weight** - User's weight setting
- **Animation duration** - Preferred animation duration
- **Zoom level** - Preferred zoom level
- **Camera follow** - Camera follow preference
- **Use densified** - Track densification preference
- **Map style** - Selected map tile style

Storage key format: `{hostname}_appData`

Examples:
- `localhost_appData`
- `example.com_appData`

## Technical Details

### Architecture

- **ES6 Modules** - Modular code organization with JSDoc
- **Leaflet.js** - Map rendering and interaction
- **Canvas Renderer** - Efficient polyline rendering
- **requestAnimationFrame** - Smooth 60 FPS animation loop
- **MediaRecorder API** - In-browser video capture
- **FileReader API** - GPX file loading
- **localStorage** - Data persistence
- **Material Icons** - UI icons
- **Exo 2 Font** - Google Fonts typography

### Animation System

The animation uses `requestAnimationFrame` for smooth 60 FPS playback:
- Time-based animation (not frame-based)
- Configurable duration (5-300 seconds)
- Cinematic intro sequence with zoom and countdown
- Optional camera follow mode
- Progress indicator during playback

### Track Densification

Tracks are automatically processed to ensure smooth animation:
- Interpolates points to 5m spacing
- Preserves elevation data
- Generates timestamp estimates
- Quality verification with warnings

### Browser Requirements

- Modern browser with:
  - ES6 module support
  - MediaRecorder API (for video recording)
  - FileReader API (for GPX upload)
  - Fullscreen API (for recording)
  - Dynamic Viewport Height support (`dvh` units)

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

### Modify Animation Duration Range

Edit `index.html`:

```html
<input type="range" id="durationSlider" min="5" max="300" step="5" value="60">
```

### Adjust Recording Settings

Edit `js/TrackVisualization.js` in the `startRecording()` method:

```javascript
const options = {
    mimeType: 'video/webm;codecs=av1',
    videoBitsPerSecond: 15000000  // 15 Mbps
};
```

### Modify Marker Icons

Edit `js/TrackVisualization.js` in the `initMap()` method to change marker URLs:

```javascript
this.startIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    // ...
});
```

## Tips

### Getting GPX Files

1. Export from fitness apps (Strava, Garmin Connect, Komoot, etc.)
2. Record with GPS tracking apps
3. Create custom routes with [GPX Studio](https://gpx.studio/)

### Performance

- Animation optimized with Canvas renderer
- Densified tracks provide smoother animation
- Original tracks work fine but may appear jerky
- Large files (>5MB) may exceed localStorage limits

### Mobile Usage

- Sidebar is collapsible and touch-friendly
- Click/tap outside sidebar to close it
- Uses dynamic viewport height (`100dvh`) for proper mobile display
- Info box adjusts to screen size

### Troubleshooting

**GPX file not loading:**
- Must use local web server (not `file://` protocol)
- Check browser console for errors
- Ensure GPX file is valid XML with `<trkpt>` elements

**localStorage quota exceeded:**
- Large GPX files may exceed 5-10MB browser limit
- Simplify track or use smaller GPX files
- Clear old data from localStorage

**Video recording not working:**
- Ensure browser supports MediaRecorder with AV1 codec
- Select the correct browser tab when prompted
- Check browser permissions for screen capture
- Try Chrome/Edge if Firefox has issues

**Sidebar footer not visible on mobile:**
- Uses `100dvh` for proper mobile viewport handling
- Update browser to latest version
- Try landscape orientation for more vertical space

**Animation stuttering:**
- Enable "Use densified track" for smoother animation
- Close other browser tabs
- Increase animation duration for slower playback
- Reduce recording resolution expectations

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Credits

- [Leaflet.js](https://leafletjs.com/) - Interactive map library
- [OpenStreetMap](https://www.openstreetmap.org/) - Map data
- [CartoDB](https://carto.com/basemaps/) - Map tiles
- [Google Fonts](https://fonts.google.com/) - Exo 2 typeface
- [Material Icons](https://fonts.google.com/icons) - UI icons

## Author

David Evdoshchenko
- GitHub: [@outcomer](https://github.com/outcomer/animated-route)
- LinkedIn: [david-evdoshchenko](https://www.linkedin.com/in/david-evdoshchenko/)

## Support

For issues and questions, please [open a GitHub issue](https://github.com/outcomer/animated-route/issues).
