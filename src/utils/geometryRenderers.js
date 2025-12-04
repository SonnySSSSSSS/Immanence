// src/utils/geometryRenderers.js
// Canvas drawing functions for visualization geometry
// All functions draw progressively based on progress (0.0 to 1.0)

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
    const endAngle = startAngle + (1.95 * Math.PI * 2 * progress); // 97.5% of circle max
    const gapSize = 0.05 * Math.PI * 2; // 2.5% gap

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

    const startAngle = -Math.PI / 2; // Top
    const endAngle = startAngle + (2 * Math.PI * progress);

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
 * Progress controls line-by-line drawing
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
    const size = 140 * scale;

    // Calculate equilateral triangle vertices
    const height = (size * Math.sqrt(3)) / 2;
    const points = [
        { x: 0, y: -height * 0.66 }, // Top
        { x: size / 2, y: height * 0.33 }, // Bottom right
        { x: -size / 2, y: height * 0.33 }, // Bottom left
    ];

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw triangle in 3 segments based on progress
    const totalSegments = 3;
    const segmentProgress = progress * totalSegments;
    const currentSegment = Math.floor(segmentProgress);
    const withinSegment = segmentProgress - currentSegment;

    ctx.beginPath();

    for (let i = 0; i < 3; i++) {
        const start = points[i];
        const end = points[(i + 1) % 3];

        if (i < currentSegment) {
            // Full segment
            if (i === 0) ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
        } else if (i === currentSegment) {
            // Partial segment
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
 * Progress controls line-by-line drawing
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
    const size = 160 * scale;
    const half = size / 2;

    const points = [
        { x: -half, y: -half }, // Top left
        { x: half, y: -half },  // Top right
        { x: half, y: half },   // Bottom right
        { x: -half, y: half },  // Bottom left
    ];

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw square in 4 segments
    const totalSegments = 4;
    const segmentProgress = progress * totalSegments;
    const currentSegment = Math.floor(segmentProgress);
    const withinSegment = segmentProgress - currentSegment;

    ctx.beginPath();

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
        circle: drawCircle,
        triangle: drawTriangle,
        square: drawSquare,
    };

    return renderers[geometryName] || drawEnso;
}
