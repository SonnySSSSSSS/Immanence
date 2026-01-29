// src/utils/photicLayout.js
// Shared layout math for photic circles (preview and overlay)
// Computes proportional scale for fit, returns both scale and scaled dimensions

/**
 * Compute layout dimensions and positions for photic circles
 * Uses proportional scaling to fit both radius and spacing into the container.
 * Preview can apply additional perceptual mapping; overlay uses raw values.
 *
 * @param {Object} params
 * @param {number} params.containerWidth - Measured container width in px
 * @param {number} params.containerHeight - Measured container height in px
 * @param {number} params.radiusPx - Requested radius of each circle
 * @param {number} params.spacingPx - Requested distance between circle centers
 * @param {number} [params.horizontalMargins=40] - Horizontal padding (left/right)
 * @param {number} [params.verticalMargins=12] - Vertical padding (top/bottom)
 *
 * @returns {Object} Layout values:
 *   - scale: proportional scale factor (0.05-1.0) for fit
 *   - scaledRadius: radius after scale (proportional)
 *   - scaledSpacing: spacing after scale (proportional)
 *   - centerX: horizontal center of container
 *   - centerY: vertical center of container
 *   - leftCircleX: left circle center X position
 *   - rightCircleX: right circle center X position
 *   - leftCircleY, rightCircleY: Y positions (same as centerY)
 *   - availW, availH: available space after margins
 *   - radiusMaxByHeight, radiusMaxByWidth: individual radius limits
 *   - spacingMax: maximum spacing at current scale
 */
export function computePhoticLayout({
    containerWidth,
    containerHeight,
    radiusPx,
    spacingPx,
    horizontalMargins = 40,
    verticalMargins = 12,
}) {
    // Safe defaults if container not ready
    if (!containerWidth || !containerHeight) {
        return {
            scale: 1.0,
            scaledRadius: radiusPx,
            scaledSpacing: spacingPx,
            centerX: 0,
            centerY: 0,
            leftCircleX: 0,
            rightCircleX: 0,
            leftCircleY: 0,
            rightCircleY: 0,
            availW: 0,
            availH: 0,
            radiusMaxByHeight: 0,
            radiusMaxByWidth: 0,
            spacingMax: 0,
        };
    }

    // Calculate available space
    const availW = Math.max(0, containerWidth - horizontalMargins);
    const availH = Math.max(0, containerHeight - verticalMargins);

    // Compute individual constraints
    const radiusMaxByHeight = availH / 2;
    const radiusMaxByWidth = availW / 2;

    // Total width needed for both circles + spacing
    const totalWidthNeeded = 2 * radiusPx + spacingPx;
    const circleDiameter = 2 * radiusPx;

    // Proportional scale constraints
    const widthScale = availW > 0 ? availW / totalWidthNeeded : 0;
    const heightScale = availH > 0 ? availH / circleDiameter : 0;

    // Use the most restrictive scale, clamped to safe range
    const scale = Math.max(
        Math.min(Math.max(widthScale, heightScale), 1.0), // Most restrictive, don't scale up
        0.05 // Minimum viable scale
    );

    // Apply proportional scale
    const scaledRadius = radiusPx * scale;
    const scaledSpacing = spacingPx * scale;

    // Maximum spacing at current scale
    const circlesDiameterWidth = 2 * scaledRadius;
    const spacingMax = Math.max(0, availW - circlesDiameterWidth);

    // Calculate positions (horizontal layout, circles side-by-side)
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    const leftCircleX = centerX - scaledSpacing / 2;
    const rightCircleX = centerX + scaledSpacing / 2;

    return {
        scale,
        scaledRadius,
        scaledSpacing,
        centerX,
        centerY,
        leftCircleX,
        rightCircleX,
        leftCircleY: centerY,
        rightCircleY: centerY,
        // Extra info for perceptual mapping and debug
        availW,
        availH,
        radiusMaxByHeight,
        radiusMaxByWidth,
        spacingMax,
    };
}
