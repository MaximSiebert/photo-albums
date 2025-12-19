export const state = {
    view: 'index',
    currentAlbum: null,
    currentPhoto: 1,
    albums: {},
    sortBy: 'date-desc', // 'name-asc', 'name-desc', 'date-desc', 'date-asc', 'random'
    overlayOpen: false,
    searchQuery: '',
    selectedAlbumIndex: -1, // -1 means no album selected, 0+ means album at that index is selected
    navVisible: true, // Track navigation visibility
    selectedOverlayIndex: -1, // -1 means no photo selected in overlay, 1+ means photo number selected
    scrollPosition: 0 // Track album list scroll position
};

// Parse URL hash to restore state
export function parseHash() {
    const hash = window.location.hash.slice(1); // Remove the #
    if (!hash) {
        // No hash means we're at the index
        state.view = 'index';
        state.currentAlbum = null;
        state.currentPhoto = 1;
        return;
    }

    const parts = hash.split('/');
    if (parts.length === 2) {
        const [encodedAlbumId, photoNum] = parts;
        const albumId = decodeURIComponent(encodedAlbumId);
        const photoNumber = parseInt(photoNum, 10);

        if (state.albums[albumId] && photoNumber > 0) {
            state.currentAlbum = albumId;
            state.currentPhoto = Math.min(photoNumber, state.albums[albumId].photos.length);
            state.view = 'viewer';
        }
    }
}

// Update URL hash when state changes
export function updateHash() {
    if (state.view === 'viewer' && state.currentAlbum) {
        window.location.hash = `${encodeURIComponent(state.currentAlbum)}/${state.currentPhoto}`;
    } else {
        window.location.hash = '';
    }
}
