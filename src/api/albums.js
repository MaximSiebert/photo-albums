import { state, parseHash } from '../state.js';

// Load albums from folders
export async function loadAlbums(renderCallback) {
    try {
        // Fetch the albums list
        const response = await fetch('./albums/albums.json');
        const albumsList = await response.json();

        // Load each album's photos
        for (const albumId of albumsList.albums) {
            try {
                const photosResponse = await fetch(`./albums/${encodeURIComponent(albumId)}/photos.json`);
                const photosData = await photosResponse.json();
                state.albums[albumId] = {
                    name: photosData.name || albumId,
                    photos: photosData.photos,
                    created: photosData.created || null
                };
            } catch (e) {
                console.error(`Failed to load album ${albumId}:`, e);
            }
        }

        parseHash(); // Check URL hash after loading albums
        renderCallback();
    } catch (e) {
        console.error('Failed to load albums:', e);
        document.getElementById('app').innerHTML = '<p>Error loading albums. Make sure /albums/albums.json exists.</p>';
    }
}
