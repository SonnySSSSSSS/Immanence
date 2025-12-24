// src/utils/dynamicLighting.js
// Calculate gradient angles for gold borders based on element position relative to avatar

/**
 * Calculates the gradient angle for a gold border based on element position
 * relative to the avatar (light source)
 * @param {DOMRect} elementRect - The element's bounding rectangle
 * @param {Object} avatarCenter - Avatar center coordinates {x, y}
 * @returns {number} Gradient angle in degrees (0-360)
 */
export function calculateGradientAngle(elementRect, avatarCenter) {
    // Calculate element center
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const elementCenterY = elementRect.top + elementRect.height / 2;

    // Calculate angle from avatar to element
    const deltaX = elementCenterX - avatarCenter.x;
    const deltaY = elementCenterY - avatarCenter.y;

    // Convert to degrees (0° = right, 90° = down, 180° = left, 270° = up)
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Add 180° to get the "light from avatar" direction
    // This makes the gradient point FROM the avatar TO the element
    angle = (angle + 180) % 360;

    return Math.round(angle);
}

/**
 * Gets the gold gradient string with dynamic angle
 * @param {number} angle - Gradient angle in degrees
 * @param {boolean} isLight - Light mode flag
 * @returns {string} CSS gradient string
 */
export function getDynamicGoldGradient(angle, isLight = false) {
    return `linear-gradient(${angle}deg, #AF8B2C 0%, #D4AF37 25%, #FBF5B7 50%, #D4AF37 75%, #AF8B2C 100%)`;
}

/**
 * Hook to get avatar center position (assumes avatar is centered in viewport)
 * @returns {Object} Avatar center coordinates {x, y}
 */
export function getAvatarCenter() {
    // Avatar is typically centered horizontally and in upper portion of viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
        x: viewportWidth / 2,
        y: viewportHeight * 0.25 // Roughly where the avatar sits
    };
}
