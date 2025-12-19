// Helper to convert RGB to HSL
export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// Extract dominant color from image and apply ambient lighting
export function applyAmbientLighting(imgElement) {
    console.log('applyAmbientLighting called', imgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Use small canvas for performance
    canvas.width = 50;
    canvas.height = 50;

    // Draw scaled down image
    ctx.drawImage(imgElement, 0, 0, 50, 50);

    try {
        const imageData = ctx.getImageData(0, 0, 50, 50);
        const data = imageData.data;

        let r = 0, g = 0, b = 0;
        let count = 0;

        // Calculate average color
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        console.log('Average RGB:', r, g, b);

        // Check if dark mode is active
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('Dark mode:', isDarkMode);

        // Convert to HSL for easier manipulation
        const hsl = rgbToHsl(r, g, b);
        console.log('Original HSL:', hsl);

        if (isDarkMode) {
            // Dark mode: very dark, subtle colors (low lightness, low saturation)
            hsl.s = Math.min(hsl.s * 0.3, 12); // Max 12% saturation - very muted
            hsl.l = Math.min(hsl.l * 0.2, 10); // Max 10% lightness - very dark
        } else {
            // Light mode: very light colors (high lightness, moderate saturation)
            hsl.s = Math.min(hsl.s * 0.5, 25); // Max 25% saturation
            hsl.l = Math.max(98 - (hsl.l * 0.15), 88); // Range 88-98% lightness
        }

        console.log('Adjusted HSL:', hsl);
        const color = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        console.log('Applying color:', color);

        // Apply color to body with smooth transition (use !important to override Tailwind classes)
        document.body.style.transition = 'background-color 0.4s ease';
        document.body.style.setProperty('background-color', color, 'important');

        // Apply to overlay if it exists (no need to set transition, it has transition-all in class)
        const photoOverlay = document.getElementById('photo-overlay');
        if (photoOverlay) {
            photoOverlay.style.setProperty('background-color', color, 'important');
        }

        console.log('Body background-color after set:', document.body.style.backgroundColor);
    } catch (e) {
        // CORS or other errors - silently fail
        console.warn('Could not extract color for ambient lighting:', e);
    }
}

// Reset ambient lighting when returning to index
export function resetAmbientLighting() {
    document.body.style.transition = 'background-color 0.4s ease';
    document.body.style.backgroundColor = '';
}
