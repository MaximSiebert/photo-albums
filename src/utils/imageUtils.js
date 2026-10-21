import { IMAGE_CDN_URL } from '../config.js';

// Helper function for ImageKit transformations
export function getImageUrl(path, options = {}) {
    const {
        width = null,
        height = null,
        quality = 85,
        format = 'auto',
    } = options;

    const transformations = [];
    if (width) transformations.push(`w-${width}`);
    if (height) transformations.push(`h-${height}`);
    transformations.push(`q-${quality}`);
    transformations.push(`f-${format}`);

    const tr = transformations.join(',');
    return `${IMAGE_CDN_URL}/tr:${tr}${path}`;
}

// Helper function to generate srcset for responsive images
export function generateSrcset(path, sizes, quality = 85) {
    return sizes.map(width =>
        `${getImageUrl(path, { width, quality, format: 'auto' })} ${width}w`
    ).join(', ');
}

// Viewer image settings - preloads must match these exactly to hit the cache
export const VIEWER_SRCSET_WIDTHS = [800, 1200, 1920];
export const VIEWER_QUALITY = 85;

const preloadedPaths = new Set();

// Preload viewer-sized images for photos [startIndex, startIndex + count) of an album
export function preloadAlbumPhotos(album, albumId, startIndex, count) {
    const end = Math.min(startIndex + count, album.photos.length);

    for (let photoIndex = startIndex; photoIndex < end; photoIndex++) {
        const photo = album.photos[photoIndex];
        if (!photo) continue;

        const photoFilename = typeof photo === 'string' ? photo : photo.filename;
        const photoPath = `/albums/${encodeURIComponent(albumId)}/${photoFilename}`;
        if (preloadedPaths.has(photoPath)) continue;
        preloadedPaths.add(photoPath);

        // Create link element for preloading (crossOrigin matches the viewer <img>)
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.crossOrigin = 'anonymous';
        link.imageSrcset = generateSrcset(photoPath, VIEWER_SRCSET_WIDTHS, VIEWER_QUALITY);
        link.imageSizes = '100vw';

        document.head.appendChild(link);
    }
}

// Preload next 5 images for faster navigation
export function preloadNextImage(state) {
    const album = state.albums[state.currentAlbum];
    if (!album) return;

    // state.currentPhoto is 1-indexed, so it's also the 0-indexed position of the next photo
    preloadAlbumPhotos(album, state.currentAlbum, state.currentPhoto, 5);
}
