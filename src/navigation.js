import { state, parseHash, updateHash } from './state.js';
import { navigateAlbumSelection, openSelectedAlbum } from './components/albumList.js';
import { backToIndex, nextPhoto, toggleFullscreen, updateOverlaySelectionVisual, getCurrentPhotoElement } from './components/photoViewer.js';
import { applyAmbientLighting } from './utils/colorUtils.js';

// Handle browser back/forward buttons
export function setupHashChangeListener(renderCallback) {
    window.addEventListener('hashchange', () => {
        parseHash();
        renderCallback();
    });
}

// Handle keyboard navigation
export function setupKeyboardNavigation(renderCallback) {
    window.addEventListener('keydown', (e) => {
        if (state.view === 'index') {
            // Album list navigation
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                navigateAlbumSelection(1, false);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateAlbumSelection(-1, false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateAlbumSelection(1, true);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateAlbumSelection(-1, true);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                openSelectedAlbum();
                renderCallback();
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            } else if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                backToIndex();
                renderCallback();
            }
        } else if (state.view === 'viewer') {
            // Photo viewer navigation
            const album = state.albums[state.currentAlbum];

            // Spacebar toggles overlay
            if (e.key === ' ') {
                e.preventDefault();
                const photoOverlay = document.getElementById('photo-overlay');
                const isOpen = !photoOverlay.classList.contains('translate-x-full');

                if (isOpen) {
                    // Close overlay
                    photoOverlay.classList.add('translate-x-full');
                    const backdrop = document.getElementById('photo-overlay-backdrop');
                    backdrop.classList.add('bg-opacity-0', 'pointer-events-none');
                    state.overlayOpen = false;
                    state.selectedOverlayIndex = -1;
                } else {
                    // Open overlay
                    photoOverlay.classList.remove('translate-x-full');
                    const backdrop = document.getElementById('photo-overlay-backdrop');
                    backdrop.classList.remove('bg-opacity-0', 'pointer-events-none');
                    state.overlayOpen = true;
                    state.selectedOverlayIndex = state.currentPhoto;
                    updateOverlaySelectionVisual();

                    // Scroll selected photo into view
                    setTimeout(() => {
                        const selectedPhotoEl = document.getElementById(`overlay-photo-${state.selectedOverlayIndex}`);
                        if (selectedPhotoEl) {
                            selectedPhotoEl.scrollIntoView({ behavior: 'auto', block: 'center' });
                        }
                    }, 50);
                }
            } else if (state.overlayOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                // Navigate overlay with arrow keys when open
                e.preventDefault();
                const direction = e.key === 'ArrowDown' ? 1 : -1;
                const newIndex = state.selectedOverlayIndex + direction;

                // Clamp to valid range
                if (newIndex >= 1 && newIndex <= album.photos.length) {
                    state.selectedOverlayIndex = newIndex;
                    updateOverlaySelectionVisual();

                    // Auto-scroll selected photo into view
                    const selectedPhotoEl = document.getElementById(`overlay-photo-${state.selectedOverlayIndex}`);
                    if (selectedPhotoEl) {
                        selectedPhotoEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            } else if (state.overlayOpen && e.key === 'Enter') {
                // Navigate to selected photo in overlay
                e.preventDefault();
                if (state.selectedOverlayIndex >= 1 && state.selectedOverlayIndex <= album.photos.length) {
                    state.currentPhoto = state.selectedOverlayIndex;
                    state.overlayOpen = false;
                    state.selectedOverlayIndex = -1;
                    updateHash();
                    renderCallback();
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (state.currentPhoto >= album.photos.length) {
                    backToIndex();
                    renderCallback();
                } else {
                    nextPhoto();
                    renderCallback();
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (state.currentPhoto === 1) {
                    backToIndex();
                    renderCallback();
                } else {
                    state.currentPhoto--;
                    updateHash();
                    renderCallback();
                }
            } else if (e.key === 'ArrowDown' && !state.overlayOpen) {
                e.preventDefault();
                backToIndex();
                renderCallback();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                // Close overlay if open, otherwise exit fullscreen or back to index
                if (state.overlayOpen) {
                    const photoOverlay = document.getElementById('photo-overlay');
                    photoOverlay.classList.add('translate-x-full');
                    const backdrop = document.getElementById('photo-overlay-backdrop');
                    backdrop.classList.add('bg-opacity-0', 'pointer-events-none');
                    state.overlayOpen = false;
                    state.selectedOverlayIndex = -1;
                } else if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    backToIndex();
                    renderCallback();
                }
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            } else if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                backToIndex();
                renderCallback();
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                // Return to first image in album
                state.currentPhoto = 1;
                updateHash();
                renderCallback();
            }
        }
    });
}

// Handle touch/swipe gestures
export function setupTouchNavigation(renderCallback) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    window.addEventListener('touchstart', (e) => {
        if (state.view !== 'viewer') return;
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    });

    window.addEventListener('touchend', (e) => {
        if (state.view !== 'viewer') return;

        // Disable swipe navigation when overlay is open
        if (state.overlayOpen) return;

        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;

        const album = state.albums[state.currentAlbum];
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Minimum swipe distance to trigger action (50px)
        const minSwipeDistance = 50;

        // Determine if horizontal or vertical swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe right (previous photo or back to index)
                    if (state.currentPhoto === 1) {
                        backToIndex();
                        renderCallback();
                    } else {
                        state.currentPhoto--;
                        updateHash();
                        renderCallback();
                    }
                } else {
                    // Swipe left (next photo or back to index)
                    if (state.currentPhoto >= album.photos.length) {
                        backToIndex();
                        renderCallback();
                    } else {
                        nextPhoto();
                        renderCallback();
                    }
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                // Check if in fullscreen mode
                if (document.fullscreenElement) {
                    // Exit fullscreen on any vertical swipe (up or down)
                    document.exitFullscreen();
                } else if (deltaY < 0) {
                    // Swipe up - back to index (only when not in fullscreen)
                    backToIndex();
                    renderCallback();
                }
            }
        }
    });
}

// Handle dark mode changes and reapply ambient lighting
export function setupDarkModeListener() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', () => {
        const currentPhotoElement = getCurrentPhotoElement();
        if (currentPhotoElement && state.view === 'viewer') {
            applyAmbientLighting(currentPhotoElement);
        }
    });
}
