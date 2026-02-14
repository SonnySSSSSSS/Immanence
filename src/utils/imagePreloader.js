// src/utils/imagePreloader.js
// Preloads critical images on app start to improve first-load UX

/**
 * Preload an array of image paths
 * @param {string[]} imagePaths - Array of image paths relative to public folder
 * @param {string} baseUrl - The base URL (import.meta.env.BASE_URL)
 * @returns {Promise<void[]>} - Resolves when all images are loaded
 */
export function preloadImages(imagePaths, baseUrl = '') {
    return Promise.all(
        imagePaths.map(path => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(path);
                img.onerror = () => {
                    console.warn(`Failed to preload: ${path}`);
                    resolve(path); // Don't reject, just warn
                };
                img.src = baseUrl + path;
            });
        })
    );
}

/**
 * Critical images to preload immediately on app start
 * These are images that appear on first screen or are frequently used
 */
export const CRITICAL_IMAGES = [
    // Note: Avatar cores no longer used; legacy preload removed
];

/**
 * Secondary images to preload after critical ones
 * These can load in background after initial render
 */
export const SECONDARY_IMAGES = [
    // Stage backgrounds (bottom layers - note: top layers removed as they no longer exist)
    'bg/bg-seedling-bottom.png',
    'bg/bg-ember-bottom.png',
    'bg/bg-flame-bottom.png',
    'bg/bg-beacon-bottom.png',
    'bg/bg-stellar-bottom.png',

    // Practice backgrounds
    'bg/practice-breath-mandala.png',
];

/**
 * Start preloading critical images immediately
 * Call this in App.jsx useEffect on mount
 */
export function startImagePreloading(baseUrl) {
    // Load critical images immediately
    preloadImages(CRITICAL_IMAGES, baseUrl)
        .then(() => {
            console.log('Critical images preloaded');
            // Then load secondary images in background
            return preloadImages(SECONDARY_IMAGES, baseUrl);
        })
        .then(() => {
            console.log('Secondary images preloaded');
        })
        .catch(err => {
            console.warn('Image preloading error:', err);
        });
}
