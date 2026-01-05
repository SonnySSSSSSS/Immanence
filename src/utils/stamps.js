// src/utils/stamps.js
// Image and video-based stamp system for Vipassana thoughts
// Loads PNG assets and WebM videos from public/vipassana/stamps/

// Image file mappings (based on actual files in public/vipassana/stamps/)
export const STAMP_FILES = {
    birds: ['birds1', 'birds2', 'birds3', 'birds4', 'birds5', 'birds6', 'birds8', 'bird7', 'birds no watermark'],
    clouds: ['cloud2', 'cloud3', 'cloud4', 'cloud5', 'cloud6', 'cloud7', 'cloud8', 'cloud9', 'Untitled', 'clouds no watermark'],
    lanterns: ['lanterns1', 'lantern2', 'lantern3', 'lantern4', 'lantern5', 'lantern6', 'lantern8', 'lantern9', 'lanterns s no watermark'],
    leaves: ['leaves1', 'leaves2', 'leaves3', 'leaves4', 'leaves2 no watermark'],
};

// Video stamp mappings (WebM files with alpha transparency)
const VIDEO_STAMP_FILES = {
    birds: ['singlebird'], // singlebird.webm
};

export const STAMP_CONFIG = {
    clouds: { count: STAMP_FILES.clouds.length },
    birds: { count: STAMP_FILES.birds.length + (VIDEO_STAMP_FILES.birds?.length || 0) },
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

// Stamp cache: Map<string, {element: HTMLImageElement|HTMLVideoElement, type: 'image'|'video'}>
let stampCache = null;
let loadingPromise = null;

/**
 * Initialize stamp system - loads all images and videos
 * Returns a promise that resolves when all assets are loaded
 */
export function initializeStamps() {
    if (stampCache) return Promise.resolve(stampCache);
    if (loadingPromise) return loadingPromise;

    stampCache = new Map();
    const loadPromises = [];

    // Load all GIF stamp images
    for (const [type, fileNumbers] of Object.entries(STAMP_FILES)) {
        for (const fileName of fileNumbers) {
            const img = new Image();
            const path = `${import.meta.env.BASE_URL}vipassana/stamps/${type}/${fileName}.gif`;

            const promise = new Promise((resolve) => {
                img.onload = () => {
                    stampCache.set(`${type}-${fileName}`, { element: img, type: 'image' });
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`[Stamps] Failed to load GIF: ${path}`);
                    resolve(); // Don't reject, just skip this stamp
                };
            });

            img.src = path;
            loadPromises.push(promise);
        }
    }

    // Load all WebM video stamps
    for (const [type, fileNames] of Object.entries(VIDEO_STAMP_FILES)) {
        for (const name of fileNames) {
            const video = document.createElement('video');
            const path = `${import.meta.env.BASE_URL}vipassana/stamps/${type}/${name}.webm`;

            // Configure video for canvas rendering
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.autoplay = true;
            video.preload = 'auto';

            const promise = new Promise((resolve) => {
                video.onloadeddata = () => {
                    // Start playing the video
                    video.play().then(() => {
                        stampCache.set(`${type}-video-${name}`, { element: video, type: 'video' });
                        resolve();
                    }).catch(err => {
                        console.warn(`[Stamps] Failed to play video: ${path}`, err);
                        resolve();
                    });
                };
                video.onerror = () => {
                    console.warn(`[Stamps] Failed to load video: ${path}`);
                    resolve(); // Don't reject, just skip this stamp
                };
            });

            video.src = path;
            loadPromises.push(promise);
        }
    }

    loadingPromise = Promise.all(loadPromises).then(() => {
        const imageCount = Array.from(stampCache.values()).filter(s => s.type === 'image').length;
        const videoCount = Array.from(stampCache.values()).filter(s => s.type === 'video').length;
        console.log(`[Stamps] Loaded ${imageCount} stamp images and ${videoCount} video stamps`);
        return stampCache;
    });

    return loadingPromise;
}

/**
 * Get a stamp for drawing
 * @param {string} theme - 'clouds' | 'birds' | 'leaves' | 'lanterns'
 * @param {number} variant - Stamp variant index (0-based)
 * @param {string} category - 'neutral' | 'future' | 'past' | 'body' | 'evaluating'
 * @returns {{element: HTMLImageElement|HTMLVideoElement, type: 'image'|'video'}|null}
 */
export function getStamp(theme, variant, _category = 'neutral') {
    if (!stampCache) return null;

    const fileNumbers = STAMP_FILES[theme];
    const videoFiles = VIDEO_STAMP_FILES[theme] || [];
    const totalCount = (fileNumbers?.length || 0) + videoFiles.length;

    if (variant >= totalCount) return null;

    // Check if this variant is a video (videos come after images)
    const imageCount = fileNumbers?.length || 0;
    if (variant >= imageCount && videoFiles.length > 0) {
        // This is a video stamp
        const videoIndex = variant - imageCount;
        const videoName = videoFiles[videoIndex];
        return stampCache.get(`${theme}-video-${videoName}`);
    }

    // This is an image stamp
    if (!fileNumbers || variant >= fileNumbers.length) return null;
    const fileName = fileNumbers[variant];
    return stampCache.get(`${theme}-${fileName}`);
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
