// src/utils/stamps.js
// Image-based stamp system for Vipassana thoughts
// Loads PNG assets from public/vipassana/stamps/

// Image file mappings (based on actual files in public/vipassana/stamps/)
const STAMP_FILES = {
    birds: ['03', '05', '06', '08', '09', '10', '11', '15', '16'],
    clouds: ['03', '04', '05', '09', '10', '14', '15'],
    lanterns: ['03', '04', '05', '06', '08', '09', '10', '11', '12', '13', '14', '15'],
    leaves: ['03', '05', '08', '13', '16', '18', '21', '25', '28', '34', '36', '39', '41'],
};

export const STAMP_CONFIG = {
    clouds: { count: STAMP_FILES.clouds.length },
    birds: { count: STAMP_FILES.birds.length },
    leaves: { count: STAMP_FILES.leaves.length },
    lanterns: { count: STAMP_FILES.lanterns.length },
};

// Category tint colors (applied as overlay)
const CATEGORY_TINTS = {
    neutral: { r: 255, g: 255, b: 255, a: 0 },        // No tint
    future: { r: 96, g: 165, b: 250, a: 0.25 },       // Blue wash
    past: { r: 251, g: 191, b: 36, a: 0.25 },         // Amber wash
    evaluating: { r: 244, g: 114, b: 182, a: 0.25 },  // Pink wash
    body: { r: 74, g: 222, b: 128, a: 0.2 },          // Green wash
};

// Stamp cache: Map<string, HTMLImageElement>
let stampCache = null;
let loadingPromise = null;

/**
 * Initialize stamp system - loads all images
 * Returns a promise that resolves when all images are loaded
 */
export function initializeStamps() {
    if (stampCache) return Promise.resolve(stampCache);
    if (loadingPromise) return loadingPromise;

    stampCache = new Map();
    const loadPromises = [];

    // Load all stamp images
    for (const [type, fileNumbers] of Object.entries(STAMP_FILES)) {
        for (const num of fileNumbers) {
            const img = new Image();
            const path = `${import.meta.env.BASE_URL}vipassana/stamps/${type}/all ${type}_${num}.png`;

            const promise = new Promise((resolve, reject) => {
                img.onload = () => {
                    stampCache.set(`${type}-${num}`, img);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`[Stamps] Failed to load: ${path}`);
                    resolve(); // Don't reject, just skip this stamp
                };
            });

            img.src = path;
            loadPromises.push(promise);
        }
    }

    loadingPromise = Promise.all(loadPromises).then(() => {
        console.log(`[Stamps] Loaded ${stampCache.size} stamp images`);
        return stampCache;
    });

    return loadingPromise;
}

/**
 * Get a stamp image for drawing
 * @param {string} theme - 'clouds' | 'birds' | 'leaves' | 'lanterns'
 * @param {number} variant - Stamp variant index (0-based)
 * @param {string} category - 'neutral' | 'future' | 'past' | 'body' | 'evaluating' (currently unused, kept for compatibility)
 */
export function getStamp(theme, variant, category = 'neutral') {
    if (!stampCache) return null;

    const fileNumbers = STAMP_FILES[theme];
    if (!fileNumbers || variant >= fileNumbers.length) return null;

    const fileNum = fileNumbers[variant];
    return stampCache.get(`${theme}-${fileNum}`);
}

/**
 * Get category tint color
 */
export function getCategoryTint(category) {
    return CATEGORY_TINTS[category] || CATEGORY_TINTS.neutral;
}

/**
 * Get haze stamps for particle overlay (not implemented for image-based system)
 */
export function getHazeStamps() {
    return [];
}
