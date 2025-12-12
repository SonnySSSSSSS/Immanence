// src/components/SevenDayTrendCurve.jsx
// 7-day practice trend curve - the SHAPE of your rhythm
// Now with: directional flow (L→R), peak emphasis, timeline clarity

import React from 'react';

/**
 * Catmull-Rom spline interpolation
 */
function catmullRom(t, p0, p1, p2, p3, tension = 0.5) {
    const t2 = t * t;
    const t3 = t2 * t;
    const v0 = (p2 - p0) * tension;
    const v1 = (p3 - p1) * tension;
    return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
        (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
        v0 * t + p1;
}

/**
 * Generate curve with directional flow and peak emphasis
 */
function generateCurve(data, width, height, tension = 0.3) {
    if (data.length === 0) return { path: '', segments: [], peakPoint: null, peakIndex: 0 };

    const weekMax = Math.max(...data, 30);
    const normalized = data.map(v => v / weekMax);
    const peakValue = Math.max(...normalized);
    const peakIndex = normalized.indexOf(peakValue);

    const stepX = width / (data.length - 1);
    const points = normalized.map((y, i) => ({
        x: i * stepX,
        y: height - (y * height * 0.75),
        normalized: y
    }));

    // Generate segments with directional properties
    const segments = [];
    const resolution = 12;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        let segPath = `M ${p1.x},${p1.y}`;

        for (let s = 1; s <= resolution; s++) {
            const t = s / resolution;
            const x = catmullRom(t, p0.x, p1.x, p2.x, p3.x, tension);
            const y = catmullRom(t, p0.y, p1.y, p2.y, p3.y, tension);
            segPath += ` L ${x},${y}`;
        }

        const avgNorm = (normalized[i] + normalized[i + 1]) / 2;
        const isPeakSegment = (i === peakIndex || i === peakIndex - 1);

        // Directional flow: thinner at start, thicker toward end
        // Plus peak emphasis
        const baseWidth = 0.8 + (i / (points.length - 1)) * 0.8; // 0.8 → 1.6 L→R
        const peakBoost = isPeakSegment ? 1.2 : 0;
        const strokeWidth = baseWidth + avgNorm * 0.6 + peakBoost;

        // Directional opacity: slightly dimmer at start, brighter toward "now"
        const baseOpacity = 0.25 + (i / (points.length - 1)) * 0.25; // 0.25 → 0.5 L→R
        const opacity = isPeakSegment ? 0.9 : (baseOpacity + avgNorm * 0.3);

        segments.push({
            path: segPath,
            strokeWidth,
            opacity,
            isPeak: isPeakSegment,
            // Color temperature: cooler left (past) → warmer right (present)
            colorIndex: i
        });
    }

    // Full path for area fill
    let fullPath = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        for (let s = 1; s <= resolution; s++) {
            const t = s / resolution;
            const x = catmullRom(t, p0.x, p1.x, p2.x, p3.x, tension);
            const y = catmullRom(t, p0.y, p1.y, p2.y, p3.y, tension);
            fullPath += ` L ${x},${y}`;
        }
    }
    const areaPath = fullPath + ` L ${width},${height} L 0,${height} Z`;

    return {
        areaPath,
        segments,
        peakPoint: points[peakIndex],
        peakIndex,
        peakValue: data[peakIndex]
    };
}

export default function SevenDayTrendCurve({ last7Days = [0, 0, 0, 0, 0, 0, 0] }) {
    const width = 100;
    const height = 36;

    const { segments, areaPath, peakPoint, peakIndex, peakValue } = generateCurve(last7Days, width, height);

    // Latest point
    const weekMax = Math.max(...last7Days, 30);
    const latestY = height - ((last7Days[6] / weekMax) * height * 0.75);

    // Total segment count for gradient distribution
    const totalSegments = segments.length;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
            }}
        >
            <defs>
                {/* Directional gradient: cool past (left) → warm present (right) */}
                <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(180, 160, 120, 0.3)" />
                    <stop offset="40%" stopColor="rgba(220, 190, 130, 0.5)" />
                    <stop offset="70%" stopColor="rgba(255, 210, 140, 0.7)" />
                    <stop offset="100%" stopColor="rgba(255, 230, 170, 0.85)" />
                </linearGradient>

                {/* Hot peak gradient */}
                <linearGradient id="peakHot" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255, 180, 80, 0.6)" />
                    <stop offset="100%" stopColor="rgba(255, 220, 130, 0.95)" />
                </linearGradient>

                {/* Area fill with directional fade */}
                <linearGradient id="areaFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(200, 180, 130, 0.02)" />
                    <stop offset="50%" stopColor="rgba(253, 220, 145, 0.06)" />
                    <stop offset="100%" stopColor="rgba(255, 235, 180, 0.08)" />
                </linearGradient>

                {/* Peak bloom */}
                <filter id="peakGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                    <feFlood floodColor="rgba(255, 200, 100, 0.5)" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill="url(#areaFill)" />

            {/* Curve segments with directional flow */}
            {segments.map((seg, i) => (
                <path
                    key={i}
                    d={seg.path}
                    fill="none"
                    stroke={seg.isPeak ? "url(#peakHot)" : "url(#timelineGradient)"}
                    strokeWidth={seg.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: seg.opacity }}
                    filter={seg.isPeak ? "url(#peakGlow)" : undefined}
                />
            ))}

            {/* Peak marker with bloom */}
            {peakPoint && peakValue > 0 && (
                <>
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={5}
                        fill="rgba(255, 210, 120, 0.1)"
                        filter="url(#peakGlow)"
                    />
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={2}
                        fill="rgba(255, 220, 150, 0.75)"
                    />
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={0.8}
                        fill="rgba(255, 250, 220, 0.95)"
                    />
                </>
            )}

            {/* "Now" marker at right edge - shows direction */}
            <circle
                cx={width}
                cy={latestY}
                r={2}
                fill="rgba(255, 240, 200, 0.6)"
                filter="url(#softGlow)"
            />
            <circle
                cx={width}
                cy={latestY}
                r={0.7}
                fill="rgba(255, 250, 230, 0.9)"
            />
        </svg>
    );
}

// Export peak index for use by parent (dots synchronization)
SevenDayTrendCurve.getPeakIndex = (data) => {
    if (!data || data.length === 0) return -1;
    const max = Math.max(...data);
    return data.indexOf(max);
};
