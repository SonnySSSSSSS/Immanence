// src/utils/geometryRenderers.js
// Procedural geometry rendering functions for the Visualization module
// All functions accept: (ctx, progress, config) where progress is 0.0-1.0

/**
 * Draw an Enso (zen circle) with a single brushstroke
 * Progress controls how much of the circle is drawn
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} progress - 0.0 to 1.0
 * @param {Object} config - { accentColor, accentSecondary, accent40, rotation, scale, strokeWidth }
 */
export function drawEnso(ctx, progress, config) {
    const {
        accentColor = '#fcd34d',
        rotation = 0,
        scale = 1.0,
        strokeWidth = 2.0,
    } = config;

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = 120 * scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    // Enso starts at top and draws clockwise, leaving a small gap
    const startAngle = -Math.PI / 2; // Top
    // Draw up to ~95% of the circle to keep a small gap at full progress
    const endAngle = startAngle + (Math.PI * 2 * 0.95 * progress);

    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle, false);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = strokeWidth * 2; // Enso has thicker brush
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
}

/**
 * Draw a perfect circle
 * Progress controls how much of the circle is drawn
 */
export function drawCircle(ctx, progress, config) {
    const {
        accentColor = '#fcd34d',
        rotation = 0,
        scale = 1.0,
        strokeWidth = 2.0,
    } = config;

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = 100 * scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * progress);

    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle, false);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
}

/**
 * Draw an equilateral triangle
 * Progress controls how much of the perimeter is drawn
 */
export function drawTriangle(ctx, progress, config) {
    const {
        accentColor = '#fcd34d',
        rotation = 0,
        scale = 1.0,
        strokeWidth = 2.0,
    } = config;

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const size = 100 * scale;

    // Equilateral triangle vertices
    const height = size * Math.sqrt(3) / 2;
    const points = [
        { x: 0, y: -height * 2/3 },           // Top
        { x: size / 2, y: height / 3 },       // Bottom right
        { x: -size / 2, y: height / 3 },      // Bottom left
    ];

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    // Total perimeter = 3 segments
    const totalSegments = 3;
    const progressPerSegment = 1 / totalSegments;
    const currentSegment = Math.floor(progress * totalSegments);
    const withinSegment = (progress * totalSegments) - currentSegment;

    ctx.beginPath();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw completed segments and partial current segment
    for (let i = 0; i < 3; i++) {
        const start = points[i];
        const end = points[(i + 1) % 3];

        if (i < currentSegment) {
            if (i === 0) ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
        } else if (i === currentSegment) {
            if (i === 0) ctx.moveTo(start.x, start.y);
            const partialX = start.x + (end.x - start.x) * withinSegment;
            const partialY = start.y + (end.y - start.y) * withinSegment;
            ctx.lineTo(partialX, partialY);
        }
    }

    ctx.stroke();
    ctx.restore();
}

/**
 * Draw a square
 * Progress controls how much of the perimeter is drawn
 */
export function drawSquare(ctx, progress, config) {
    const {
        accentColor = '#fcd34d',
        rotation = 0,
        scale = 1.0,
        strokeWidth = 2.0,
    } = config;

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const halfSize = 80 * scale;

    // Square vertices (starting from top-left, clockwise)
    const points = [
        { x: -halfSize, y: -halfSize },  // Top left
        { x: halfSize, y: -halfSize },   // Top right
        { x: halfSize, y: halfSize },    // Bottom right
        { x: -halfSize, y: halfSize },   // Bottom left
    ];

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    // Total perimeter = 4 segments
    const totalSegments = 4;
    const currentSegment = Math.floor(progress * totalSegments);
    const withinSegment = (progress * totalSegments) - currentSegment;

    ctx.beginPath();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw completed segments and partial current segment
    for (let i = 0; i < 4; i++) {
        const start = points[i];
        const end = points[(i + 1) % 4];

        if (i < currentSegment) {
            if (i === 0) ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
        } else if (i === currentSegment) {
            if (i === 0) ctx.moveTo(start.x, start.y);
            const partialX = start.x + (end.x - start.x) * withinSegment;
            const partialY = start.y + (end.y - start.y) * withinSegment;
            ctx.lineTo(partialX, partialY);
        }
    }

    ctx.stroke();
    ctx.restore();
}

/**
 * Get geometry renderer by name
 */
export function getGeometryRenderer(geometryName) {
    const renderers = {
        enso: drawEnso,
        enzo: drawEnso, // common misspelling
        circle: drawCircle,
        triangle: drawTriangle,
        square: drawSquare,
    };

    return renderers[geometryName] || drawEnso;
}
