import { state, updateHash } from '../state.js';
import { getImageUrl, generateSrcset, preloadNextImage } from '../utils/imageUtils.js';
import { applyAmbientLighting } from '../utils/colorUtils.js';

let currentPhotoElement = null;

export function backToIndex() {
    state.view = 'index';
    state.currentAlbum = null;
    state.currentPhoto = 1;
    state.selectedAlbumIndex = -1; // Reset keyboard selection
    state.navVisible = true; // Reset nav visibility
    updateHash();
}

export function nextPhoto() {
    const album = state.albums[state.currentAlbum];
    if (state.currentPhoto < album.photos.length) {
        state.currentPhoto++;
        updateHash();
    }
}

export function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // Enter fullscreen
        document.documentElement.requestFullscreen().catch(err => {
            console.warn('Could not enter fullscreen:', err);
        });
    } else {
        // Exit fullscreen
        document.exitFullscreen();
    }
}

export function updateOverlaySelectionVisual() {
    const photoItems = document.querySelectorAll('#photo-overlay > div[id^="overlay-photo-"]');
    photoItems.forEach((item) => {
        const photoNum = parseInt(item.id.replace('overlay-photo-', ''));
        if (photoNum === state.selectedOverlayIndex) {
            item.classList.remove('outline-transparent');
            item.classList.add('outline', 'outline-stone-800', 'dark:outline-stone-100');
            // Remove hover outline classes to prevent conflict
            const img = item.querySelector('img');
            if (img) {
                img.classList.remove('hover:outline', 'hover:outline-stone-800', 'dark:hover:outline-stone-100');
            }
        } else {
            // Remove selection outline completely
            item.classList.remove('outline', 'outline-stone-800', 'dark:outline-stone-100');
            item.classList.add('outline-transparent');
            // Restore hover classes
            const img = item.querySelector('img');
            if (img) {
                img.classList.add('hover:outline', 'hover:outline-stone-800', 'dark:hover:outline-stone-100');
            }
        }
    });
}

export function renderPhotoViewer() {
    const album = state.albums[state.currentAlbum];
    const currentPhoto = album.photos[state.currentPhoto - 1];
    const currentPhotoFilename = typeof currentPhoto === 'string' ? currentPhoto : currentPhoto.filename;
    const isLastPhoto = state.currentPhoto >= album.photos.length;

    // Get dimensions if available
    const photoWidth = (currentPhoto && typeof currentPhoto === 'object' && currentPhoto.width) ? currentPhoto.width : null;
    const photoHeight = (currentPhoto && typeof currentPhoto === 'object' && currentPhoto.height) ? currentPhoto.height : null;

    // Set page title and meta tags
    document.title = `${album.name} | Albums by Maxim`;
    document.getElementById('og-title').setAttribute('content', `${album.name} | Albums by Maxim`);

    // Set og:image to the current photo
    const currentPhotoUrl = getImageUrl(`/albums/${encodeURIComponent(state.currentAlbum)}/${currentPhotoFilename}`, {
        width: 1200,
        quality: 85,
        format: 'auto'
    });
    document.getElementById('og-image').setAttribute('content', currentPhotoUrl);

    // Set og:image dimensions (use actual photo dimensions or defaults)
    if (photoWidth && photoHeight) {
        // Scale to max width of 1200 while maintaining aspect ratio
        const scale = Math.min(1200 / photoWidth, 1);
        const ogWidth = Math.round(photoWidth * scale);
        const ogHeight = Math.round(photoHeight * scale);
        document.getElementById('og-image-width').setAttribute('content', ogWidth.toString());
        document.getElementById('og-image-height').setAttribute('content', ogHeight.toString());
    } else {
        // Default to 1200x630 (recommended OG image size)
        document.getElementById('og-image-width').setAttribute('content', '1200');
        document.getElementById('og-image-height').setAttribute('content', '630');
    }

    document.getElementById('og-url').setAttribute('content', window.location.href);
    const aspectRatio = (photoWidth && photoHeight) ? `${photoWidth} / ${photoHeight}` : 'auto';
    const isPortrait = (photoWidth && photoHeight) ? photoHeight > photoWidth : false;
    const orientationClass = isPortrait ? 'sm:h-[100cqmin] sm:w-auto w-[100cqmin] max-h-full max-w-full' : 'w-[110cqmin] max-h-full max-w-full';

    const photoPath = `/albums/${encodeURIComponent(state.currentAlbum)}/${currentPhotoFilename}`;

    const app = document.getElementById('app');
    app.innerHTML = `
        <div>
            <!-- Loading progress bar -->
            <div class="fixed top-0 left-0 w-full h-px z-50">
                <div id="loading-bar" class="h-full bg-black/5 dark:bg-white/10 transition-all duration-150" style="width: 0%"></div>
            </div>

            <div id="top-nav" class="absolute top-0 w-full flex place-content-between px-6 py-6 z-20 transition-opacity duration-[800ms]">
                <div class="flex space-x-1">
                  <button id="back-btn" aria-label="Return to album list" class="hover:underline block">
                    Albums
                  </button>
                  <span class="text-stone-500">/</span>
                  <button id="album-name-btn" aria-label="Toggle fullscreen mode" class="hover:underline"> ${album.name}</button>
                </div>
                <button id="photo-count-btn" aria-label="View all photos in overlay, currently viewing photo ${state.currentPhoto} of ${album.photos.length}" class="text-stone-500 hover:underline flex items-center">
                    (${state.currentPhoto}
                    <span class="text-stone-500">/</span>
                    ${album.photos.length})
                    <span class="ml-1" aria-hidden="true">
                        <svg viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg" id="More-2-Line--Streamline-Remix" height="12" width="12">
                          <desc>
                            More 2 Line Streamline Icon: https://streamlinehq.com
                          </desc>
                          <path d="M6 1.5c-0.4125 0 -0.75 0.3375 -0.75 0.75S5.5875 3 6 3s0.75 -0.3375 0.75 -0.75S6.4125 1.5 6 1.5Zm0 7.5c-0.4125 0 -0.75 0.3375 -0.75 0.75S5.5875 10.5 6 10.5s0.75 -0.3375 0.75 -0.75S6.4125 9 6 9Zm0 -3.75c-0.4125 0 -0.75 0.3375 -0.75 0.75s0.3375 0.75 0.75 0.75 0.75 -0.3375 0.75 -0.75 -0.3375 -0.75 -0.75 -0.75Z" stroke-width="0.5"></path>
                        </svg>
                    </span>
                </button>
            </div>
            <div class="w-full h-dvh md:p-24 sm:p-12 p-6">
              <div class="w-full h-full relative flex items-center justify-center">
                <div class="relative ${orientationClass}" style="aspect-ratio: ${aspectRatio}; container-type: size;">
                  <div class="w-full h-full bg-black/5 dark:bg-white/10"></div>
                  <img
                      class="absolute inset-0 w-full h-full object-contain opacity-0"
                      id="photo-img"
                      srcset="${generateSrcset(photoPath, [800, 1200, 1920], 85)}"
                      sizes="100vw"
                      src="${getImageUrl(photoPath, { width: 1920, quality: 85, format: 'auto' })}"
                      alt="${album.name}, photo ${state.currentPhoto} of ${album.photos.length}"
                      style="cursor: pointer"
                      loading="eager"
                      decoding="async"
                      crossorigin="anonymous"
                  />
                </div>
              </div>
            </div>

            <!-- Photo navigation overlay -->
            <div id="photo-overlay-backdrop" class="fixed inset-0 bg-transparent bg-opacity-0 transition-opacity duration-400 pointer-events-none z-40"></div>
            <div id="photo-overlay" class="fixed top-0 right-0 h-full w-128 sm:w-160 transform translate-x-full transition-all duration-400 z-50 overflow-y-auto p-6 space-y-6">
            </div>
        </div>
    `;

    document.getElementById('back-btn').onclick = backToIndex;
    document.getElementById('album-name-btn').onclick = toggleFullscreen;

    // Top navigation auto-hide functionality
    const topNav = document.getElementById('top-nav');
    let navHideTimer = null;

    function showNav() {
        state.navVisible = true;
        topNav.style.opacity = '1';

        // Clear existing timer
        if (navHideTimer) {
            clearTimeout(navHideTimer);
        }

        // Set timer to hide after 2 seconds
        navHideTimer = setTimeout(() => {
            state.navVisible = false;
            topNav.style.opacity = '0';
        }, 2000);
    }

    function hideNavImmediate() {
        if (navHideTimer) {
            clearTimeout(navHideTimer);
        }
        state.navVisible = false;
        topNav.style.opacity = '0';
    }

    // Show nav on hover
    topNav.addEventListener('mouseenter', () => {
        showNav();
    });

    // Click handler for showing nav (attached to container, not document)
    const clickHandler = (e) => {
        const photoImg = document.getElementById('photo-img');
        const overlay = document.getElementById('photo-overlay');

        // Don't show nav if clicking on image or inside overlay
        if (e.target !== photoImg && !overlay.contains(e.target) && !photoImg.contains(e.target)) {
            showNav();
        }
    };

    // Attach to the app container instead of document
    document.getElementById('app').addEventListener('click', clickHandler);

    // Initialize: show nav and start timer, unless it was already hidden
    if (state.navVisible) {
        showNav();
    } else {
        topNav.style.opacity = '0';
    }

    // Photo overlay functionality
    const photoOverlay = document.getElementById('photo-overlay');
    const photoOverlayBackdrop = document.getElementById('photo-overlay-backdrop');
    let overlayOpen = false;

    // Populate overlay with all photos
    album.photos.forEach((photo, index) => {
        const photoFilename = typeof photo === 'string' ? photo : photo.filename;
        const photoIndex = index + 1;
        const isCurrentPhoto = photoIndex === state.currentPhoto;

        const photoItem = document.createElement('div');
        photoItem.className = `cursor-pointer ${isCurrentPhoto ? 'outline outline-stone-800 dark:outline-stone-100' : ''}`;
        photoItem.id = `overlay-photo-${photoIndex}`;

        const img = document.createElement('img');
        img.className = 'w-full h-auto hover:outline hover:outline-stone-800 dark:hover:outline-stone-100 outline outline-transparent';
        img.src = getImageUrl(`/albums/${encodeURIComponent(state.currentAlbum)}/${photoFilename}`, {
            width: 200,
            quality: 80,
            format: 'auto'
        });
        img.alt = `Thumbnail ${photoIndex} of ${album.photos.length} in ${album.name}`;

        photoItem.appendChild(img);
        photoItem.onclick = (e) => {
            e.stopPropagation();
            state.currentPhoto = photoIndex;
            state.overlayOpen = false; // Reset overlay state when navigating
            // Don't change navVisible - preserve current state
            updateHash();
        };

        photoOverlay.appendChild(photoItem);
    });

    // Toggle overlay
    const toggleOverlay = (show) => {
        overlayOpen = show;
        state.overlayOpen = show;
        if (show) {
            photoOverlay.classList.remove('translate-x-full');
            photoOverlayBackdrop.classList.remove('bg-opacity-0', 'pointer-events-none');
            photoOverlayBackdrop.classList.add('bg-opacity-0');

            // Initialize keyboard selection to current photo
            state.selectedOverlayIndex = state.currentPhoto;
            updateOverlaySelectionVisual();

            // Scroll current photo into view (centered)
            setTimeout(() => {
                const currentPhotoEl = document.getElementById(`overlay-photo-${state.currentPhoto}`);
                if (currentPhotoEl) {
                    currentPhotoEl.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
            }, 50);
        } else {
            photoOverlay.classList.add('translate-x-full');
            photoOverlayBackdrop.classList.add('bg-opacity-0', 'pointer-events-none');
            photoOverlayBackdrop.classList.remove('bg-opacity-50');
            // Reset selection when closing
            state.selectedOverlayIndex = -1;
        }
    };

    document.getElementById('photo-count-btn').onclick = () => toggleOverlay(true);
    photoOverlayBackdrop.onclick = () => toggleOverlay(false);

    const photoImg = document.getElementById('photo-img');
    const loadingBar = document.getElementById('loading-bar');

    // Optimized: let browser load natively, simulate smooth progress
    let progress = 0;
    let progressSpeed = 15; // Start fast

    const progressInterval = setInterval(() => {
        // Slow down as we get closer to 90%
        if (progress > 70) progressSpeed = 3;
        else if (progress > 50) progressSpeed = 8;

        progress += progressSpeed;
        if (progress > 90) progress = 90;
        loadingBar.style.width = `${progress}%`;
    }, 50);

    // Complete on actual image load
    photoImg.onload = () => {
        clearInterval(progressInterval);
        loadingBar.style.width = '100%';

        setTimeout(() => {
            loadingBar.style.opacity = '0';
        }, 150);

        photoImg.classList.remove('opacity-0');
        photoImg.classList.add('animate-fade-in');

        // Store current photo element and apply ambient lighting
        currentPhotoElement = photoImg;
        applyAmbientLighting(photoImg);
    };

    photoImg.onerror = () => {
        clearInterval(progressInterval);
        loadingBar.style.width = '100%';
        loadingBar.classList.remove('bg-black');
        loadingBar.classList.add('bg-red-500');
    };

    photoImg.onclick = (e) => {
        e.stopPropagation();

        // Get click position relative to image
        const rect = photoImg.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const imageWidth = rect.width;
        const clickPercentage = clickX / imageWidth;

        // Left 30% - go to previous photo
        if (clickPercentage < 0.30) {
            if (state.currentPhoto === 1) {
                backToIndex();
            } else {
                state.currentPhoto--;
                updateHash();
            }
        }
        // Right 70% - go to next photo
        else {
            if (state.currentPhoto >= album.photos.length) {
                backToIndex();
            } else {
                nextPhoto();
            }
        }
    };

    // Preload the next image for instant navigation
    preloadNextImage(state);
}

export function getCurrentPhotoElement() {
    return currentPhotoElement;
}
