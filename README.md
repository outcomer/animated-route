# Animated Route Visualization

Interactive GPX track visualization with smooth animation on a map using Leaflet.js.

## Features

- 🗺️ Beautiful route animation with customizable speed
- 📊 Automatic metrics calculation (distance, elevation, calories, time)
- 🎨 Multiple map tile styles (OSM, CartoDB, Satellite, etc.)
- ⏯️ Playback controls (play, pause, reset)
- 🎬 Video recording capability with Puppeteer
- 📍 Start/finish markers
- 🎯 Auto-follow camera during animation
- 💨 Adaptive speed control (1x-30x)

## Quick Start

### 1. Setup

Clone the repository:
```bash
git clone https://github.com/outcomer/animated-route.git
cd animated-route
```

### 2. Add Your GPX Track

Place your GPX file in the `tracks/` folder (create it if it doesn't exist):
```bash
mkdir tracks
# Copy your GPX file
cp /path/to/your-track.gpx tracks/
```

### 3. Configure

Edit `track.html` and update the `state` object:

```javascript
const state = {
    title: 'Your Route Name',
    gpxPath: 'tracks/your-track.gpx',  // Path to your GPX file
    weight: 79,                          // Your weight in kg (for calorie calculation)
    speed: 4,                            // Animation speed (1-30x)
    trackColor: 'rgb(0 0 0)',           // Track line color
    mapTileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    initialZoom: 12,                     // Initial map zoom level
    routeZoom: 16,                       // Zoom level after GPX loads
    fullRoute: [],
    gpxData: null
};
```

### 4. Run

Start a local web server (required for loading GPX files):

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

Then open: http://localhost:8000/track.html

## Map Tile Options

Uncomment your preferred map style in `track.html`:

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

## Controls

- **▶ Start animation** - Begin route playback with 3-2-1 countdown
- **⏸ Pause / ▶ Continue** - Pause/resume animation
- **↻ Reset** - Return to start position
- **Speed slider** - Adjust animation speed (1x-30x)

## Video Recording

Record your animation to MP4 video:

### Install Dependencies

```bash
npm install puppeteer puppeteer-screen-recorder
```

### Configure Recording

Edit `record-video.js` if needed:
- Change FPS (default: 50)
- Adjust viewport size
- Modify wait times

### Record

```bash
node record-video.js
```

Output: `track-animation.mp4` in the same directory

**Note:** Make sure the local web server is running on `http://localhost:8000`

## Project Structure

```
animated-route/
├── track.html          # Main HTML file with configuration
├── track.js            # Animation logic and route rendering
├── track.css           # Styles
├── record-video.js     # Puppeteer video recording script
├── tracks/             # GPX files (gitignored)
│   └── your-track.gpx
├── .gitignore
├── .gitattributes
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

## Customization

### Change Track Color

```javascript
trackColor: 'rgb(255 0 0)',  // Red track
```

### Adjust Animation Speed

The speed parameter affects:
- How fast the track is drawn
- How quickly the camera follows

Values: 1 (slowest) to 30 (fastest)

### Modify Marker Labels

Edit in `track.js`:

```javascript
addMarkers(points) {
    L.marker([points[0].lat, points[0].lng], { icon: this.startIcon })
        .addTo(this.map)
        .bindPopup('<b>Start</b><br>Your Location');

    L.marker([points[points.length - 1].lat, points[points.length - 1].lng], { icon: this.endIcon })
        .addTo(this.map)
        .bindPopup('<b>Finish</b><br>Your Destination');
}
```

## Requirements

- Modern web browser with JavaScript enabled
- Local web server (for loading GPX files via AJAX)
- GPX file with track points (`<trkpt>` elements)

Optional for video recording:
- Node.js
- Puppeteer

## Browser Compatibility

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Credits

- [Leaflet.js](https://leafletjs.com/) - Interactive map library
- [OpenStreetMap](https://www.openstreetmap.org/) - Map data
- [CartoDB](https://carto.com/basemaps/) - Map tiles
- [Puppeteer](https://pptr.dev/) - Video recording

## Tips

### Getting GPX Files

1. Export from your GPS device or fitness app (Strava, Garmin, etc.)
2. Record a new track with GPS tracking apps
3. Create custom routes with [GPX Studio](https://gpx.studio/)

### Performance

- For long routes (1000+ points), animation may slow down
- Consider simplifying GPX track in GPX editors
- Lower FPS in `record-video.js` if recording stutters

### Troubleshooting

**Animation not starting:**
- Check browser console for errors
- Ensure web server is running
- Verify GPX file path in configuration

**GPX file not loading:**
- Must use local web server (not `file://` protocol)
- Check CORS if using external server
- Validate GPX file format

**Video recording issues:**
- Ensure localhost:8000 is accessible
- Check Puppeteer installation
- Increase timeout values if animation is long

## Support

For issues and questions, please open a GitHub issue.
