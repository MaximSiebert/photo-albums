# Photo Albums

A lightweight, responsive photo album viewer with ambient lighting effects.

## Project Structure

```
photo-albums/
├── src/
│   ├── api/
│   │   └── albums.js          # Album data loading
│   ├── components/
│   │   ├── albumList.js       # Album grid view
│   │   └── photoViewer.js     # Photo viewer with overlay
│   ├── utils/
│   │   ├── imageUtils.js      # Image CDN and preloading
│   │   └── colorUtils.js      # Ambient lighting effects
│   ├── config.js              # Configuration constants
│   ├── state.js               # Global state management
│   ├── navigation.js          # Keyboard, touch, and URL navigation
│   ├── main.js                # Application entry point
│   └── style.css              # Global styles
├── public/
│   └── albums/                # Album photos and JSON metadata
├── dist/                      # Production build (auto-generated)
└── index.html                 # HTML entry point
```

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Run server locally (alternative)
- `python3 -m http.server 8000 --bind 0.0.0.0`
- To visit on mobile device use http://YOUR_LOCAL_IP:8000
- Run `ipconfig getifaddr en0` to find local IP

## Adding Albums

### Steps for adding images
1. Create new folder under `/albums` and add photos
2. Run `python3 generate_album_lists.py` to generate metadata
3. Push to GitHub
4. Upload album to R2 Cloudflare using:
   ```
   bash
   rclone sync ./albums r2:my-photo-albums/albums --progress --exclude "*.DS_Store" --exclude ".git/*"
   ```

## Deployment

### GitHub Actions (Automatic)

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

1. Push your changes to GitHub
2. GitHub Actions will automatically build and deploy
3. Enable GitHub Pages in your repository settings:
   - Settings → Pages → Source: GitHub Actions

### Manual Deployment

```bash
# Build the project
npm run build

# The dist/ folder contains the production build
# Deploy the contents of dist/ to your hosting provider
```

## Features

- **Responsive grid layout** with Tailwind CSS
- **Lazy loading** for images with Intersection Observer
- **Ambient lighting** that adapts to photo colors
- **Keyboard navigation** (arrow keys, spacebar, escape)
- **Touch gestures** for mobile devices
- **Photo overlay** for quick album navigation
- **Search and sort** albums by name or date
- **URL-based routing** with hash navigation
- **Optimized images** via ImageKit CDN

## Technology Stack

- **Vite** - Build tool and dev server
- **Vanilla JavaScript** - No framework dependencies
- **Tailwind CSS** - Utility-first CSS (loaded via CDN)
- **ImageKit** - Image CDN and transformations
- **GitHub Actions** - Automated deployment

## License

All Rights Reserved, 2026 ©
