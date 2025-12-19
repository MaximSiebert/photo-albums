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

// Preload next 5 images for faster navigation
export function preloadNextImage(state) {
    const album = state.albums[state.currentAlbum];
    if (!album || state.currentPhoto >= album.photos.length) return;

    // Preload next 5 images (starting from next photo, not current)
    for (let i = 1; i <= 5; i++) {
        const photoIndex = state.currentPhoto + i - 1; // state.currentPhoto is 1-indexed, array is 0-indexed
        if (photoIndex >= album.photos.length) break;

        const nextPhoto = album.photos[photoIndex];
        if (!nextPhoto) continue;

        const nextPhotoFilename = typeof nextPhoto === 'string' ? nextPhoto : nextPhoto.filename;
        const nextPhotoPath = `/albums/${encodeURIComponent(state.currentAlbum)}/${nextPhotoFilename}`;

        // Create link element for preloading
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.imageSrcset = generateSrcset(nextPhotoPath, [800, 1200, 1920], 85);
        link.imageSizes = '100vw';

        document.head.appendChild(link);
    }
}
