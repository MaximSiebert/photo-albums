import './style.css';
import { state } from './state.js';
import { loadAlbums } from './api/albums.js';
import { renderAlbumList } from './components/albumList.js';
import { renderPhotoViewer } from './components/photoViewer.js';
import {
    setupHashChangeListener,
    setupKeyboardNavigation,
    setupTouchNavigation,
    setupDarkModeListener
} from './navigation.js';

// Main render function
function render() {
    if (state.view === 'index') {
        renderAlbumList();
    } else if (state.view === 'viewer') {
        renderPhotoViewer();
    }
}

// Setup event listeners
setupHashChangeListener(render);
setupKeyboardNavigation(render);
setupTouchNavigation(render);
setupDarkModeListener();

// Initial load
loadAlbums(render);

// Register service worker for PWA installability
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}
