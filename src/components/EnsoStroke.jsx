// src/components/EnsoStroke.jsx
// Generates a proper brush-stroke enso with variable width and drawing animation

import React, { useMemo, useState, useEffect } from 'react';

function generateEnsoPath(centerX, centerY, radius, segments = 80) {
    const points = [];
    const startAngle = -Math.PI * 0.1;  // Start just before top
    const endAngle = Math.PI * 1.75;     // End with ~30° gap

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + (endAngle - startAngle) * t;

        // Add subtle wobble for organic feel
        const wobble = Math.sin(angle * 3) * 1.5 + Math.sin(angle * 7) * 0.8;
        const r = radius + wobble;

        points.push({
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r,
            angle: angle,
            t: t  // progress along stroke (0 to 1)
        });
    }

    return points;
}

function getStrokeWidth(t) {
    // t = 0 at start, t = 1 at end

    if (t < 0.1) {
        // Start: medium, quickly thickening
        return 5 + (t / 0.1) * 7;  // 5px → 12px
    } else if (t < 0.3) {
        // Early curve: thick with variation
        return 12 + Math.sin((t - 0.1) / 0.2 * Math.PI) * 3;  // 12px → 15px → 12px
    } else if (t < 0.7) {
        // Middle: consistently thick with slight variation
        return 11 + Math.sin(t * Math.PI * 3) * 2;  // 9-13px
    } else if (t < 0.9) {
        // Releasing: tapering
        const release = (t - 0.7) / 0.2;
        return 11 * (1 - release * 0.65);  // 11px → 3.85px
    } else {
        // End: thin trail
        const trail = (t - 0.9) / 0.1;
        return 3.85 * (1 - trail * 0.9);  // 3.85px → 0.385px
    }
}

function generateEnsoShape(centerPath) {
    const outerEdge = [];
    const innerEdge = [];

    for (let i = 0; i < centerPath.length; i++) {
        const point = centerPath[i];
        const width = getStrokeWidth(point.t);

        // Calculate normal (perpendicular to path direction)
        const prev = centerPath[Math.max(0, i - 1)];
        const next = centerPath[Math.min(centerPath.length - 1, i + 1)];

        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        // Normal vector (perpendicular)
        const nx = -dy / len;
        const ny = dx / len;

        // Add edge wobble for brush texture (deterministic based on position)
        const edgeWobble = Math.sin(point.angle * 11) * 0.8 + Math.sin(point.angle * 23) * 0.4;

        outerEdge.push({
            x: point.x + nx * (width / 2 + edgeWobble),
            y: point.y + ny * (width / 2 + edgeWobble)
        });

        innerEdge.push({
            x: point.x - nx * (width / 2 + edgeWobble * 0.7),
            y: point.y - ny * (width / 2 + edgeWobble * 0.7)
        });
    }

    return { outerEdge, innerEdge };
}

function buildEnsoSVGPath(outerEdge, innerEdge) {
    let d = `M ${outerEdge[0].x} ${outerEdge[0].y}`;

    // Outer edge (forward) - use smooth curves
    for (let i = 1; i < outerEdge.length; i++) {
        d += ` L ${outerEdge[i].x} ${outerEdge[i].y}`;
    }

    // Connect to inner edge at the end
    const lastInner = innerEdge[innerEdge.length - 1];
    d += ` L ${lastInner.x} ${lastInner.y}`;

    // Inner edge (backward)
    for (let i = innerEdge.length - 2; i >= 0; i--) {
        d += ` L ${innerEdge[i].x} ${innerEdge[i].y}`;
    }

    d += ' Z'; // Close path

    return d;
}

export function EnsoStroke({ centerX = 200, centerY = 200, radius = 140, accuracy = 'good', isActive = true }) {
    const [drawProgress, setDrawProgress] = useState(0);

    // Animate drawing from 0 to 1
    useEffect(() => {
        if (!isActive) {
            setDrawProgress(0);
            return;
        }

        const duration = accuracy === 'perfect' ? 400 : accuracy === 'good' ? 400 : 300;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDrawProgress(eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isActive, accuracy]);

    const ensoPath = useMemo(() => {
        const centerPath = generateEnsoPath(centerX, centerY, radius);
        const { outerEdge, innerEdge } = generateEnsoShape(centerPath);
        return buildEnsoSVGPath(outerEdge, innerEdge);
    }, [centerX, centerY, radius]);

    // Create clip path that reveals along the arc
    const clipPath = useMemo(() => {
        const startAngle = -Math.PI * 0.1;
        const totalAngle = Math.PI * 1.85; // Full enso arc
        const currentAngle = startAngle + (totalAngle * drawProgress);

        // Create a pie slice that reveals the enso
        const outerRadius = radius * 2;
        const x1 = centerX + Math.cos(startAngle) * outerRadius;
        const y1 = centerY + Math.sin(startAngle) * outerRadius;
        const x2 = centerX + Math.cos(currentAngle) * outerRadius;
        const y2 = centerY + Math.sin(currentAngle) * outerRadius;

        const largeArc = (currentAngle - startAngle) > Math.PI ? 1 : 0;

        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }, [centerX, centerY, radius, drawProgress]);

    // Gradient coordinates along the stroke
    const gradientStart = { x: centerX, y: centerY - radius };
    const gradientEnd = { x: centerX + radius * 0.7, y: centerY + radius * 0.7 };

    return (
        <svg width="128" height="128" viewBox="0 0 128 128" style={{ overflow: 'visible' }}>
            <defs>
                <clipPath id="ensoRevealClip">
                    <path d={clipPath} />
                </clipPath>

                <linearGradient
                    id="ensoGradient"
                    gradientUnits="userSpaceOnUse"
                    x1={gradientStart.x}
                    y1={gradientStart.y}
                    x2={gradientEnd.x}
                    y2={gradientEnd.y}
                >
                    <stop offset="0%" stopColor="#d4a847" stopOpacity="0.72" />
                    <stop offset="30%" stopColor="#fcd34d" stopOpacity="0.81" />
                    <stop offset="70%" stopColor="#fcd34d" stopOpacity="0.78" />
                    <stop offset="95%" stopColor="#b8942d" stopOpacity="0.42" />
                    <stop offset="100%" stopColor="#b8942d" stopOpacity="0.08" />
                </linearGradient>

                <filter id="enso3D">
                    {/* Inner highlight for 3D effect */}
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="innerBlur" />
                    <feOffset in="innerBlur" dx="-1" dy="-1" result="innerOffset" />
                    <feFlood floodColor="#fffef0" floodOpacity="0.3" result="innerColor" />
                    <feComposite in="innerColor" in2="innerOffset" operator="in" result="innerHighlight" />

                    {/* Outer glow for depth */}
                    <feGaussianBlur in="SourceAlpha" stdDeviation={accuracy === 'perfect' ? '6' : accuracy === 'good' ? '4' : '3'} result="outerBlur" />
                    <feOffset in="outerBlur" dx="1" dy="1" result="outerOffset" />
                    <feFlood floodColor="#d4a847" floodOpacity="0.4" result="outerColor" />
                    <feComposite in="outerColor" in2="outerOffset" operator="in" result="outerGlow" />

                    <feMerge>
                        <feMergeNode in="outerGlow" />
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode in="innerHighlight" />
                    </feMerge>
                </filter>
            </defs>

            <g clipPath="url(#ensoRevealClip)">
                <path
                    d={ensoPath}
                    fill="url(#ensoGradient)"
                    filter="url(#enso3D)"
                />
            </g>
        </svg>
    );
}
