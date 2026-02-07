// src/utils/thoughtRenderers.js
// Theme-specific rendering functions for Vipassana thoughts
// Fixed: Gradients now created at correct position after translation

import { THOUGHT_CATEGORIES } from '../data/vipassanaThemes';

/**
 * Create a radial gradient at current position (after translate)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} type - gradient type ('soft', 'glow', etc.)
 * @param {string} color - base color
 * @param {number} radius - gradient radius
 * @returns {CanvasGradient}
 */
function createGradient(ctx, type, color, radius) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);

    switch (type) {
        case 'soft':
            // Soft cloud-like gradient
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, color);
            gradient.addColorStop(1, 'transparent');
            break;
        case 'glow':
            // Glow effect without blur
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, color.replace('0.6)', '0.3)'));
            gradient.addColorStop(1, 'transparent');
            break;
        default:
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
    }

    return gradient;
}

/**
 * Draw a bird silhouette
 */
export function drawBird(ctx, thought) {
    const categoryData = THOUGHT_CATEGORIES[thought.category] || THOUGHT_CATEGORIES.neutral;

    ctx.save();
    ctx.translate(thought.x, thought.y);

    // Create gradient AFTER translate so it's centered at thought position
    const gradient = createGradient(ctx, 'soft', categoryData.color, 36);
    ctx.fillStyle = gradient;

    // Bird silhouette using bezier curves
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.quadraticCurveTo(-18, -12, 0, 0);
    ctx.quadraticCurveTo(18, -12, 30, 0);
    ctx.quadraticCurveTo(18, 6, 0, -3);
    ctx.quadraticCurveTo(-18, 6, -30, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a leaf shape
 */
export function drawLeaf(ctx, thought) {
    const categoryData = THOUGHT_CATEGORIES[thought.category] || THOUGHT_CATEGORIES.neutral;

    ctx.save();
    ctx.translate(thought.x, thought.y);

    const gradient = createGradient(ctx, 'soft', categoryData.color, 36);
    ctx.fillStyle = gradient;

    // Leaf shape
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.quadraticCurveTo(24, -6, 0, 30);
    ctx.quadraticCurveTo(-24, -6, 0, -30);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a cloud (multiple overlapping circles)
 */
export function drawCloud(ctx, thought) {
    const categoryData = THOUGHT_CATEGORIES[thought.category] || THOUGHT_CATEGORIES.neutral;

    ctx.save();
    ctx.translate(thought.x, thought.y);

    const gradient = createGradient(ctx, 'soft', categoryData.color, 30);
    ctx.fillStyle = gradient;

    // Multiple overlapping circles for cloud puffiness
    ctx.beginPath();
    ctx.arc(-12, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -6, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(12, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a lantern (ellipse with glow)
 */
export function drawLantern(ctx, thought) {
    const categoryData = THOUGHT_CATEGORIES[thought.category] || THOUGHT_CATEGORIES.neutral;

    ctx.save();
    ctx.translate(thought.x, thought.y);

    // Outer glow using compositing
    const glowGradient = createGradient(ctx, 'glow', categoryData.color, 45);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main lantern shape
    ctx.globalCompositeOperation = 'source-over';
    const mainGradient = createGradient(ctx, 'soft', categoryData.color, 30);
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 21, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Main render function - delegates to theme-specific renderer
 */
export function renderThought(ctx, thought, theme) {
    const elementType = theme?.thoughtElement || 'cloud';

    switch (elementType) {
        case 'bird':
            drawBird(ctx, thought, theme);
            break;
        case 'leaf':
            drawLeaf(ctx, thought, theme);
            break;
        case 'lantern':
            drawLantern(ctx, thought, theme);
            break;
        case 'cloud':
        default:
            drawCloud(ctx, thought, theme);
            break;
    }
}

