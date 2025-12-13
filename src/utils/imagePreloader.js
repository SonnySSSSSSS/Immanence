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
            return new Promise((resolve, reject) => {
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
    // Avatar cores (most commonly displayed)
    'avatars/seedling-core.png',
    'avatars/ember-core.png',
    'avatars/flame-core.png',
    'avatars/beacon-core.png',
    'avatars/stellar-core.png',

    // Codex/Compass icons (small, quick to load)
    'codex/mirror.png',
    'codex/resonator.png',
    'codex/prism.png',
    'codex/sword.png',

    // Mode icons (navigation section)
    'modes/mode-navigation_00001_.png',
    'modes/mode-practice_00001_.png',
    'modes/mode-wisdom_00001_.png',
    'modes/mode-application_00001_.png',
];

/**
 * Secondary images to preload after critical ones
 * These can load in background after initial render
 */
export const SECONDARY_IMAGES = [
    // Stage backgrounds
    'bg/bg-seedling.png',
    'bg/bg-ember.png',
    'bg/bg-flame.png',
    'bg/bg-beacon.png',
    'bg/bg-stellar.png',

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
