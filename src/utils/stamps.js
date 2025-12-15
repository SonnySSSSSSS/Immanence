// src/utils/stamps.js
// Pre-rendered stamp system for Vipassana thoughts
// Generates variant × category combinations at load time

// Stamp count capped at 20 total for memory safety (<50MB on 3GB devices)
export const STAMP_CONFIG = {
    clouds: { count: 6, sizes: [96, 128, 160] },
    birds: { count: 3, wingPoses: 3 },
    leaves: { count: 6 },
    lanterns: { count: 5 },
};

// Category tint colors (applied as overlay)
const CATEGORY_TINTS = {
    neutral: { r: 255, g: 255, b: 255, a: 0 },        // No tint
    future: { r: 96, g: 165, b: 250, a: 0.25 },       // Blue wash
    past: { r: 251, g: 191, b: 36, a: 0.25 },         // Amber wash
    evaluating: { r: 244, g: 114, b: 182, a: 0.25 },  // Pink wash
    body: { r: 74, g: 222, b: 128, a: 0.2 },          // Green wash
};

// Stamp cache: Map<string, Canvas>
let stampCache = null;
let hazeStamps = null;

// Helper: Create canvas (OffscreenCanvas with fallback)
function createCanvas(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(width, height);
    }
    // Fallback for older browsers
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/**
 * Initialize stamp system - call once at app load
 */
export function initializeStamps() {
    if (stampCache) return stampCache;

    stampCache = new Map();

    // Generate stamps for each theme
    generateCloudStamps();
    generateBirdStamps();
    generateLeafStamps();
    generateLanternStamps();
    generateHazeStamps();

    console.log(`[Stamps] Generated ${stampCache.size} stamps`);
    return stampCache;
}

/**
 * Get a stamp for drawing
 * @param {string} theme - 'clouds' | 'birds' | 'leaves' | 'lanterns'
 * @param {number} variant - Stamp variant index
 * @param {string} category - 'neutral' | 'future' | 'past' | 'body' | 'evaluating'
 * @param {number} frame - Animation frame (for birds)
 */
export function getStamp(theme, variant, category = 'neutral', frame = 0) {
    const key = theme === 'birds'
        ? `${theme}-${variant}-${frame}-${category}`
        : `${theme}-${variant}-${category}`;
    return stampCache?.get(key);
}

/**
 * Get haze stamps for particle overlay
 */
export function getHazeStamps() {
    return hazeStamps || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOUD STAMPS
// ─────────────────────────────────────────────────────────────────────────────

function generateCloudStamps() {
    const { count, sizes } = STAMP_CONFIG.clouds;

    for (let v = 0; v < count; v++) {
        const size = sizes[v % sizes.length];
        const baseCanvas = createCloudBase(size, v);

        // Pre-bake each category tint
        Object.keys(CATEGORY_TINTS).forEach(category => {
            const tinted = applyTint(baseCanvas, CATEGORY_TINTS[category]);
            stampCache.set(`clouds-${v}-${category}`, tinted);
        });
    }
}

function createCloudBase(size, variant) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.35;

    // Create gradient for cloud body
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;

    // Draw irregular cloud shape using overlapping circles
    const offsets = getCloudOffsets(variant);
    offsets.forEach(({ ox, oy, r }) => {
        ctx.beginPath();
        ctx.arc(cx + ox * baseRadius, cy + oy * baseRadius, r * baseRadius, 0, Math.PI * 2);
        ctx.fill();
    });

    return canvas;
}

function getCloudOffsets(variant) {
    // Different cloud shapes based on variant
    const patterns = [
        [{ ox: 0, oy: 0, r: 1 }, { ox: -0.5, oy: 0.1, r: 0.7 }, { ox: 0.4, oy: -0.1, r: 0.8 }],
        [{ ox: 0, oy: 0, r: 0.9 }, { ox: -0.3, oy: -0.2, r: 0.6 }, { ox: 0.3, oy: 0.2, r: 0.7 }],
        [{ ox: 0, oy: 0, r: 1.1 }, { ox: -0.4, oy: 0, r: 0.5 }, { ox: 0.5, oy: 0, r: 0.6 }],
        [{ ox: 0, oy: 0, r: 0.85 }, { ox: 0, oy: -0.3, r: 0.5 }, { ox: 0.35, oy: 0.15, r: 0.6 }],
        [{ ox: 0, oy: 0, r: 1 }, { ox: -0.45, oy: -0.1, r: 0.55 }, { ox: 0.4, oy: 0.1, r: 0.65 }],
        [{ ox: 0, oy: 0, r: 0.95 }, { ox: -0.25, oy: 0.25, r: 0.5 }, { ox: 0.3, oy: -0.2, r: 0.6 }],
    ];
    return patterns[variant % patterns.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// BIRD STAMPS
// ─────────────────────────────────────────────────────────────────────────────

function generateBirdStamps() {
    const { count, wingPoses } = STAMP_CONFIG.birds;
    const size = 64;

    for (let v = 0; v < count; v++) {
        for (let frame = 0; frame < wingPoses; frame++) {
            const baseCanvas = createBirdBase(size, v, frame);

            Object.keys(CATEGORY_TINTS).forEach(category => {
                const tinted = applyTint(baseCanvas, CATEGORY_TINTS[category]);
                stampCache.set(`birds-${v}-${frame}-${category}`, tinted);
            });
        }
    }
}

function createBirdBase(size, variant, frame) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const cx = size / 2;
    const cy = size / 2;

    // Wing angles for 3 poses: down, mid, up
    const wingAngle = [15, 0, -15][frame] * (Math.PI / 180);
    const scale = 0.6 + variant * 0.1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Bird silhouette color (not pure black, biased toward sky)
    ctx.fillStyle = 'rgba(40, 50, 70, 0.7)';

    // Draw simplified bird shape
    ctx.beginPath();
    // Body
    ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left wing
    ctx.save();
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(-20, -8, -25, 0);
    ctx.quadraticCurveTo(-20, 2, -5, 0);
    ctx.fill();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.rotate(-wingAngle);
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.quadraticCurveTo(20, -8, 25, 0);
    ctx.quadraticCurveTo(20, 2, 5, 0);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAF STAMPS
// ─────────────────────────────────────────────────────────────────────────────

function generateLeafStamps() {
    const { count } = STAMP_CONFIG.leaves;
    const size = 48;

    for (let v = 0; v < count; v++) {
        const baseCanvas = createLeafBase(size, v);

        Object.keys(CATEGORY_TINTS).forEach(category => {
            const tinted = applyTint(baseCanvas, CATEGORY_TINTS[category]);
            stampCache.set(`leaves-${v}-${category}`, tinted);
        });
    }
}

function createLeafBase(size, variant) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const cx = size / 2;
    const cy = size / 2;

    // Leaf colors based on variant (autumn palette)
    const colors = [
        'rgba(180, 100, 50, 0.8)',   // Brown
        'rgba(200, 120, 40, 0.8)',   // Orange-brown
        'rgba(220, 150, 50, 0.8)',   // Golden
        'rgba(170, 80, 30, 0.75)',   // Dark brown
        'rgba(200, 90, 40, 0.8)',    // Rust
        'rgba(190, 140, 60, 0.75)',  // Tan
    ];

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((variant * 60) * (Math.PI / 180)); // Pre-rotate variants

    ctx.fillStyle = colors[variant % colors.length];

    // Draw leaf shape
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(12, -8, 10, 6);
    ctx.quadraticCurveTo(5, 14, 0, 18);
    ctx.quadraticCurveTo(-5, 14, -10, 6);
    ctx.quadraticCurveTo(-12, -8, 0, -16);
    ctx.fill();

    // Stem
    ctx.strokeStyle = 'rgba(100, 60, 30, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 18);
    ctx.stroke();

    ctx.restore();

    return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// LANTERN STAMPS
// ─────────────────────────────────────────────────────────────────────────────

function generateLanternStamps() {
    const { count } = STAMP_CONFIG.lanterns;
    const size = 56;

    for (let v = 0; v < count; v++) {
        const baseCanvas = createLanternBase(size, v);

        Object.keys(CATEGORY_TINTS).forEach(category => {
            const tinted = applyTint(baseCanvas, CATEGORY_TINTS[category]);
            stampCache.set(`lanterns-${v}-${category}`, tinted);
        });
    }
}

function createLanternBase(size, variant) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const cx = size / 2;
    const cy = size / 2;

    // Lantern colors (warm palette)
    const colors = [
        { body: 'rgba(255, 200, 100, 0.7)', glow: 'rgba(255, 180, 80, 0.4)' },
        { body: 'rgba(255, 180, 80, 0.65)', glow: 'rgba(255, 160, 60, 0.35)' },
        { body: 'rgba(255, 220, 120, 0.7)', glow: 'rgba(255, 200, 100, 0.4)' },
        { body: 'rgba(255, 160, 60, 0.65)', glow: 'rgba(255, 140, 40, 0.35)' },
        { body: 'rgba(255, 190, 90, 0.7)', glow: 'rgba(255, 170, 70, 0.4)' },
    ];

    const color = colors[variant % colors.length];

    // Baked glow effect
    const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
    glowGradient.addColorStop(0, color.glow);
    glowGradient.addColorStop(0.6, color.glow.replace('0.4', '0.15'));
    glowGradient.addColorStop(1, 'rgba(255, 180, 80, 0)');

    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, size, size);

    // Lantern body
    ctx.fillStyle = color.body;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 8 + variant, 12 + variant * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner light
    ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// HAZE STAMPS
// ─────────────────────────────────────────────────────────────────────────────

function generateHazeStamps() {
    hazeStamps = [];

    // Reuse cloud stamps at lower opacity for haze
    for (let i = 0; i < 12; i++) {
        const size = 128 + Math.random() * 64;
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        const cx = size / 2;
        const cy = size / 2;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.4);
        gradient.addColorStop(0, 'rgba(200, 210, 230, 0.15)');
        gradient.addColorStop(0.7, 'rgba(200, 210, 230, 0.06)');
        gradient.addColorStop(1, 'rgba(200, 210, 230, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        hazeStamps.push({
            canvas,
            x: Math.random(),  // Relative position (0-1)
            y: Math.random(),
            variance: 0.5 + Math.random() * 0.5,
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TINTING UTILITY
// ─────────────────────────────────────────────────────────────────────────────

function applyTint(sourceCanvas, tint) {
    if (tint.a === 0) {
        return sourceCanvas; // No tint, return original
    }

    const { width, height } = sourceCanvas;
    const result = createCanvas(width, height);
    const ctx = result.getContext('2d');

    // Draw original
    ctx.drawImage(sourceCanvas, 0, 0);

    // Apply tint using multiply-like blend
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${tint.a})`;
    ctx.fillRect(0, 0, width, height);

    return result;
}

export default { initializeStamps, getStamp, getHazeStamps };
