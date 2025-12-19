import { state, updateHash } from '../state.js';
import { getImageUrl, generateSrcset } from '../utils/imageUtils.js';
import { resetAmbientLighting } from '../utils/colorUtils.js';

export function openAlbum(albumId) {
    state.currentAlbum = albumId;
    state.currentPhoto = 1;
    state.view = 'viewer';
    state.navVisible = true; // Reset nav to visible when opening album
    updateHash();
}

export function filterAlbums() {
    const query = state.searchQuery.toLowerCase();
    const albumItems = document.querySelectorAll('#album-list li');

    albumItems.forEach(li => {
        const albumId = li.dataset.albumId.toLowerCase();
        const albumName = li.dataset.albumName;

        if (!query || albumName.includes(query) || albumId.includes(query)) {
            li.classList.remove('hidden');
        } else {
            li.classList.add('hidden');
        }
    });
}

export function updateAlbumSelectionVisual() {
    const albumItems = document.querySelectorAll('#album-list li');
    albumItems.forEach((li) => {
        const img = li.querySelector('img');
        const count = li.querySelector('.text-stone-500');
        const albumIndex = parseInt(li.dataset.albumIndex);

        if (albumIndex === state.selectedAlbumIndex) {
            // Add outline to image
            if (img) {
                img.classList.remove('outline-transparent');
                img.classList.add('outline', 'outline-stone-800', 'dark:outline-stone-100');
            }
            // Show count
            if (count) {
                count.classList.remove('sm:opacity-0');
                count.classList.add('opacity-100');
            }
        } else {
            // Remove outline from image
            if (img) {
                img.classList.add('outline-transparent');
                img.classList.remove('outline-stone-800', 'dark:outline-stone-100');
            }
            // Hide count
            if (count) {
                count.classList.add('sm:opacity-0');
                count.classList.remove('opacity-100');
            }
        }
    });
}

export function getVisibleAlbumItems() {
    const albumItems = document.querySelectorAll('#album-list li');
    return Array.from(albumItems).filter(li => !li.classList.contains('hidden'));
}

export function getGridColumns() {
    // Determine number of columns based on current viewport
    const width = window.innerWidth;
    if (width >= 1024) return 6; // lg:grid-cols-6
    if (width >= 768) return 4;  // md:grid-cols-4
    if (width >= 640) return 3;  // sm:grid-cols-3
    return 1;                     // grid-cols-1
}

export function navigateAlbumSelection(direction, isVertical = false) {
    const visibleAlbums = getVisibleAlbumItems();
    if (visibleAlbums.length === 0) return;

    if (state.selectedAlbumIndex === -1) {
        // No album selected yet, select first
        state.selectedAlbumIndex = parseInt(visibleAlbums[0].dataset.albumIndex);
    } else {
        // Find current position in visible albums
        const currentVisibleIndex = visibleAlbums.findIndex(
            li => parseInt(li.dataset.albumIndex) === state.selectedAlbumIndex
        );

        if (currentVisibleIndex === -1) {
            // Current selection is filtered out, select first visible
            state.selectedAlbumIndex = parseInt(visibleAlbums[0].dataset.albumIndex);
        } else {
            let newVisibleIndex;

            if (isVertical) {
                // Vertical navigation (up/down) - jump by number of columns
                const columns = getGridColumns();
                newVisibleIndex = currentVisibleIndex + (direction * columns);

                // Wrap around if out of bounds
                if (newVisibleIndex < 0) {
                    // Going up from top - wrap to bottom, same column if possible
                    const column = currentVisibleIndex % columns;
                    const lastRowStart = Math.floor((visibleAlbums.length - 1) / columns) * columns;
                    newVisibleIndex = lastRowStart + column;
                    if (newVisibleIndex >= visibleAlbums.length) {
                        newVisibleIndex = visibleAlbums.length - 1;
                    }
                } else if (newVisibleIndex >= visibleAlbums.length) {
                    // Going down from bottom - wrap to top, same column if possible
                    const column = currentVisibleIndex % columns;
                    newVisibleIndex = column;
                }
            } else {
                // Horizontal navigation (left/right) - move by 1
                newVisibleIndex = currentVisibleIndex + direction;
                if (newVisibleIndex < 0) {
                    newVisibleIndex = visibleAlbums.length - 1; // Wrap to last
                } else if (newVisibleIndex >= visibleAlbums.length) {
                    newVisibleIndex = 0; // Wrap to first
                }
            }

            state.selectedAlbumIndex = parseInt(visibleAlbums[newVisibleIndex].dataset.albumIndex);
        }
    }

    updateAlbumSelectionVisual();

    // Scroll selected album into view
    const selectedLi = visibleAlbums.find(
        li => parseInt(li.dataset.albumIndex) === state.selectedAlbumIndex
    );
    if (selectedLi) {
        selectedLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

export function openSelectedAlbum() {
    if (state.selectedAlbumIndex === -1) return;

    const albumItems = document.querySelectorAll('#album-list li');
    const selectedLi = Array.from(albumItems).find(
        li => parseInt(li.dataset.albumIndex) === state.selectedAlbumIndex
    );

    if (selectedLi) {
        const albumId = selectedLi.dataset.albumId;
        openAlbum(albumId);
    }
}

export function renderAlbumList() {
    // Reset ambient lighting when returning to index
    resetAmbientLighting();

    // Set page title and meta tags
    document.title = 'Albums by Maxim';
    document.getElementById('og-title').setAttribute('content', 'Albums by Maxim');
    document.getElementById('og-image').setAttribute('content', '');
    document.getElementById('og-image-width').setAttribute('content', '1200');
    document.getElementById('og-image-height').setAttribute('content', '630');
    document.getElementById('og-url').setAttribute('content', window.location.href);

    const app = document.getElementById('app');
    app.innerHTML = `
        <div role="main" aria-label="Photo albums">
            <div class="p-6 grid md:gap-x-10 gap-x-6 sm:gap-y-0 gap-y-6 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 border-b border-stone-800 dark:border-stone-400">
              <div class="flex space-x-1 group h-fit">
                <h1><a href="/photo-albums" class="hover:underline">Albums</a></h1>
                <span class="text-stone-500 sm:opacity-0 group-hover:opacity-100">(${Object.keys(state.albums).length})</span>
              </div>
              <div class="lg:col-span-4 md:col-span-2 col-span-1" role="search">
                <input id="search-input" type="text" placeholder="Search" value="${state.searchQuery}" aria-label="Search albums" class="w-full bg-transparent focus:outline-none focus:underline placeholder-stone-800 dark:placeholder-stone-200"/>
              </div>
              <div class="space-y-1 sm:col-span-1 sm:col-start-auto col-start-2" role="navigation" aria-label="Sort options">
                <span class="text-stone-500">Sort by:</span>
                <div>
                    <button id="sort-date-desc" aria-label="Sort albums by newest first" aria-pressed="${state.sortBy === 'date-desc'}" class="block ${state.sortBy === 'date-desc' ? 'underline' : 'hover:underline'}">Newest</button>
                    <button id="sort-date-asc" aria-label="Sort albums by oldest first" aria-pressed="${state.sortBy === 'date-asc'}" class="block ${state.sortBy === 'date-asc' ? 'underline' : 'hover:underline'}">Oldest</button>
                    <button id="sort-name-asc" aria-label="Sort albums alphabetically A to Z" aria-pressed="${state.sortBy === 'name-asc'}" class="block ${state.sortBy === 'name-asc' ? 'underline' : 'hover:underline'}">Name (A-Z)</button>
                    <button id="sort-name-desc" aria-label="Sort albums alphabetically Z to A" aria-pressed="${state.sortBy === 'name-desc'}" class="block ${state.sortBy === 'name-desc' ? 'underline' : 'hover:underline'}">Name (Z-A)</button>
                    <button id="sort-random" aria-label="Sort albums randomly" aria-pressed="${state.sortBy === 'random'}" class="block ${state.sortBy === 'random' ? 'underline' : 'hover:underline'}">Random</button>
                </div>
              </div>
            </div>
            <ul id="album-list" class="px-6 py-12 md:gap-x-10 gap-x-6 gap-y-12 grid lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-1 items-end"></ul>
            <div class="p-6 border-t border-stone-800 dark:border-stone-400 grid md:gap-x-10 gap-x-6 sm:gap-y-0 gap-y-6 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2">
              <span class="lg:col-span-5 md:col-span-3 col-span-1 text-stone-500">(${Object.values(state.albums).reduce((total, album) => total + album.photos.length, 0)})</span>
              <span class="text-stone-500">All Rights Reserved, 2026 ©</span>
            </div>
        </div>
    `;

    const list = document.getElementById('album-list');

    if (Object.keys(state.albums).length === 0) {
        list.innerHTML = '<li>No albums found</li>';
        return;
    }

    // Add search input handler
    const searchInput = document.getElementById('search-input');
    searchInput.oninput = (e) => {
        state.searchQuery = e.target.value;
        filterAlbums();
    };

    // Add sorting button handlers
    document.getElementById('sort-name-asc').onclick = () => {
        state.sortBy = 'name-asc';
        renderAlbumList();
    };
    document.getElementById('sort-name-desc').onclick = () => {
        state.sortBy = 'name-desc';
        renderAlbumList();
    };
    document.getElementById('sort-date-desc').onclick = () => {
        state.sortBy = 'date-desc';
        renderAlbumList();
    };
    document.getElementById('sort-date-asc').onclick = () => {
        state.sortBy = 'date-asc';
        renderAlbumList();
    };
    document.getElementById('sort-random').onclick = () => {
        state.sortBy = 'random';
        renderAlbumList();
    };

    // Sort albums based on current sort option
    let albumEntries = Object.entries(state.albums);

    if (state.sortBy === 'random') {
        // Fisher-Yates shuffle algorithm
        for (let i = albumEntries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [albumEntries[i], albumEntries[j]] = [albumEntries[j], albumEntries[i]];
        }
    } else {
        albumEntries.sort((a, b) => {
            const [idA, albumA] = a;
            const [idB, albumB] = b;

            if (state.sortBy === 'name-asc') {
                return albumA.name.localeCompare(albumB.name); // A-Z
            } else if (state.sortBy === 'name-desc') {
                return albumB.name.localeCompare(albumA.name); // Z-A
            } else if (state.sortBy === 'date-desc') {
                const dateA = albumA.created ? new Date(albumA.created) : new Date(0);
                const dateB = albumB.created ? new Date(albumB.created) : new Date(0);
                return dateB - dateA; // Newest first
            } else if (state.sortBy === 'date-asc') {
                const dateA = albumA.created ? new Date(albumA.created) : new Date(0);
                const dateB = albumB.created ? new Date(albumB.created) : new Date(0);
                return dateA - dateB; // Oldest first
            }
            return 0;
        });
    }

    albumEntries.forEach(([id, album], index) => {
        const li = document.createElement('li');
        li.className = 'group';
        li.dataset.albumId = id;
        li.dataset.albumName = album.name.toLowerCase();
        li.dataset.albumIndex = index;
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'focus:outline-none';

        // Add cover image if available
        if (album.photos && album.photos.length > 0) {
            // Get first photo (support both string and object format)
            const firstPhoto = album.photos[0];
            const firstPhotoFilename = typeof firstPhoto === 'string' ? firstPhoto : firstPhoto.filename;

            // Get dimensions if available
            const coverWidth = (typeof firstPhoto === 'object' && firstPhoto.width) ? firstPhoto.width : null;
            const coverHeight = (typeof firstPhoto === 'object' && firstPhoto.height) ? firstPhoto.height : null;
            const coverAspectRatio = (coverWidth && coverHeight) ? `${coverWidth} / ${coverHeight}` : 'auto';

            // Create container with aspect ratio
            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative mb-4';
            imgContainer.style.aspectRatio = coverAspectRatio;

            // Add background placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'absolute inset-0 bg-stone-300 dark:bg-stone-800 opacity-0';
            imgContainer.appendChild(placeholder);

            // Add staggered fade-in animation to placeholder
            setTimeout(() => {
                placeholder.classList.remove('opacity-0');
                placeholder.classList.add('animate-fade-in');
            }, index * 100);

            const img = document.createElement('img');
            img.className = 'relative z-10 w-full h-full object-contain group-hover:outline group-hover:outline-stone-800 dark:group-hover:outline-stone-100 outline outline-transparent opacity-0';
            img.dataset.albumIndex = index;

            // Store data for lazy loading
            img.dataset.srcset = generateSrcset(`/albums/${encodeURIComponent(id)}/${firstPhotoFilename}`, [200, 400, 600, 800], 80);
            img.dataset.sizes = '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw';
            img.dataset.src = getImageUrl(`/albums/${encodeURIComponent(id)}/${firstPhotoFilename}`, {
                width: 400,
                quality: 80,
                format: 'auto'
            });
            img.alt = album.name;
            img.decoding = 'async';

            // Add staggered fade-in animation after image loads (with 600ms base delay)
            img.onload = () => {
                setTimeout(() => {
                    img.classList.remove('opacity-0');
                    img.classList.add('animate-fade-in');
                }, 600 + (index * 100)); // 600ms base delay + 100ms stagger per item
            };

            imgContainer.appendChild(img);
            a.appendChild(imgContainer);
        }

        const infoWrapper = document.createElement('div');
        infoWrapper.className = 'flex space-x-1'

        const title = document.createElement('div');
        title.textContent = album.name;
        title.className = 'group-hover:underline';
        infoWrapper.appendChild(title);

        const count = document.createElement('div');
        count.className = 'text-stone-500 sm:opacity-0 group-hover:opacity-100'
        count.textContent = `(${album.photos.length})`;
        infoWrapper.appendChild(count);

        a.appendChild(infoWrapper);

        a.onclick = (e) => {
            e.preventDefault();
            openAlbum(id);
        };

        // Preload first 3 images on hover
        a.onmouseenter = () => {
            if (album.photos && album.photos.length > 0) {
                const photosToPreload = album.photos.slice(0, 3);
                photosToPreload.forEach(photo => {
                    const photoFilename = typeof photo === 'string' ? photo : photo.filename;
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.as = 'image';
                    link.imageSrcset = generateSrcset(`/albums/${encodeURIComponent(id)}/${photoFilename}`, [800, 1200, 1920, 2560, 3840], 100);
                    link.imageSizes = '100vw';
                    document.head.appendChild(link);
                });
            }
        };

        li.appendChild(a);
        list.appendChild(li);
    });

    // Lazy load images with Intersection Observer
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.srcset = img.dataset.srcset;
                img.sizes = img.dataset.sizes;
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });

    document.querySelectorAll('#album-list img').forEach(img => {
        imageObserver.observe(img);
    });

    // Always apply search filter to ensure correct visibility
    filterAlbums();

    // Update keyboard selection visual state if needed
    updateAlbumSelectionVisual();
}
