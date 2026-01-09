// src/components/SevenDayTrendCurve.jsx
// 7-day practice trend curve - the SHAPE of your rhythm
// Now with: directional flow (L→R), peak emphasis, timeline clarity

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';

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
 * Get intensity-based color for heat-map effect
 * Cool amber (low) → warm orange (medium) → white-hot (peak)
 */
function getIntensityColor(normalizedValue, isPeak, isLight = false) {
    if (isLight) {
        // Light mode: MUCH darker colors for visibility on parchment
        if (isPeak) {
            return {
                start: 'rgba(100, 60, 20, 1)',
                end: 'rgba(120, 70, 25, 1)',
                hex: '#784619' // Hex fallback for Firefox
            };
        }
        if (normalizedValue < 0.3) {
            return { start: 'rgba(90, 60, 40, 0.85)', end: 'rgba(100, 65, 45, 0.9)', hex: '#5A3C28' };
        } else if (normalizedValue < 0.6) {
            return { start: 'rgba(110, 70, 35, 0.9)', end: 'rgba(120, 75, 40, 0.95)', hex: '#6E4623' };
        } else if (normalizedValue < 0.9) {
            return { start: 'rgba(130, 80, 35, 0.95)', end: 'rgba(140, 85, 40, 1)', hex: '#825023' };
        } else {
            return { start: 'rgba(140, 90, 40, 1)', end: 'rgba(150, 95, 45, 1)', hex: '#8C5A28' };
        }
    }

    // Dark mode: original warm amber/gold colors
    if (isPeak) {
        return {
            start: 'rgba(255, 245, 220, 1)',
            end: 'rgba(255, 255, 255, 0.95)',
            hex: '#FFF5DC' // Hex fallback for Firefox
        };
    }
    if (normalizedValue < 0.3) {
        return { start: 'rgba(180, 140, 90, 0.6)', end: 'rgba(200, 160, 110, 0.7)', hex: '#B48C5A' };
    } else if (normalizedValue < 0.6) {
        return { start: 'rgba(220, 170, 100, 0.7)', end: 'rgba(240, 190, 120, 0.8)', hex: '#DCAA64' };
    } else if (normalizedValue < 0.9) {
        return { start: 'rgba(255, 200, 120, 0.85)', end: 'rgba(255, 220, 150, 0.9)', hex: '#FFC878' };
    } else {
        return { start: 'rgba(255, 235, 180, 0.95)', end: 'rgba(255, 245, 220, 1)', hex: '#FFEBB4' };
    }
}

/**
 * Generate curve with directional flow and peak emphasis
 */
function generateCurve(data, width, height, tension = 0.3, isLight = false) {
    if (data.length === 0) return { path: '', segments: [], peakPoint: null, peakIndex: 0 };

    const clamp01 = (value) => {
        if (!Number.isFinite(value)) return 0;
        return Math.min(1, Math.max(0, value));
    };

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
        // Plus peak emphasis and CALLIGRAPHIC VELOCITY-BASED WIDTH (light mode)
        const baseWidth = 0.8 + (i / (points.length - 1)) * 0.8; // 0.8 → 1.6 L→R
        const peakBoost = isPeakSegment ? 1.2 : 0;

        // Calligraphic velocity modulation: thicker on descents, thinner on ascents
        const velocityDelta = normalized[i + 1] - normalized[i];
        const velocityWidth = isLight
            ? Math.abs(velocityDelta) * 1.5 // More pronounced in light mode for ink effect
            : Math.abs(velocityDelta) * 0.8;

        // Ascending = thinner (pen lifting), Descending = thicker (pen pressing)
        const calligraphyMod = isLight
            ? (velocityDelta < 0 ? 0.6 : -0.3) // Descending = thicker, ascending = thinner
            : 0;

        const strokeWidthRaw = baseWidth + avgNorm * 0.6 + peakBoost + velocityWidth + calligraphyMod;
        const strokeWidth = Number.isFinite(strokeWidthRaw) ? Math.max(strokeWidthRaw, 0.1) : 0.1;

        // Directional opacity: slightly dimmer at start, brighter toward "now"
        const baseOpacity = 0.25 + (i / (points.length - 1)) * 0.25; // 0.25 → 0.5 L→R
        const opacityRaw = isPeakSegment ? 0.9 : (baseOpacity + avgNorm * 0.3);
        const opacity = clamp01(opacityRaw);

        // Get intensity color for this segment
        const colors = getIntensityColor(avgNorm, isPeakSegment, isLight);

        segments.push({
            path: segPath,
            strokeWidth,
            opacity,
            isPeak: isPeakSegment,
            colorIndex: i,
            colors // Add color data for rendering
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

    // Generate harmonic echoes (smoothed paths above/below the main curve)
    const echoOffset = height * 0.08; // Subtle vertical offset
    const echoPoints1 = normalized.map((y, i) => ({
        x: i * stepX,
        y: height - (y * height * 0.75) - echoOffset
    }));
    const echoPoints2 = normalized.map((y, i) => ({
        x: i * stepX,
        y: height - (y * height * 0.75) + echoOffset
    }));

    // Generate smooth echo paths
    const generateEchoPath = (echoPoints) => {
        let path = `M ${echoPoints[0].x},${echoPoints[0].y}`;
        for (let i = 0; i < echoPoints.length - 1; i++) {
            const p0 = echoPoints[Math.max(0, i - 1)];
            const p1 = echoPoints[i];
            const p2 = echoPoints[i + 1];
            const p3 = echoPoints[Math.min(echoPoints.length - 1, i + 2)];

            for (let s = 1; s <= resolution; s++) {
                const t = s / resolution;
                const x = catmullRom(t, p0.x, p1.x, p2.x, p3.x, tension * 1.2);
                const y = catmullRom(t, p0.y, p1.y, p2.y, p3.y, tension * 1.2);
                path += ` L ${x},${y}`;
            }
        }
        return path;
    };

    return {
        areaPath,
        segments,
        peakPoint: points[peakIndex],
        peakIndex,
        peakValue: data[peakIndex],
        echoPath1: generateEchoPath(echoPoints1),
        echoPath2: generateEchoPath(echoPoints2),
        mainPath: fullPath // The main curve path without area fill
    };
}

export default function SevenDayTrendCurve({ last7Days = [0, 0, 0, 0, 0, 0, 0] }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const width = 100;
    const height = 36;

    // Firefox detection
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');

    const safeLast7DaysRaw = Array.isArray(last7Days) ? last7Days : [];
    const sanitizedDays = safeLast7DaysRaw.map((value) =>
        Number.isFinite(value) ? Math.max(value, 0) : 0
    );
    const safeLast7Days = sanitizedDays.length >= 7
        ? sanitizedDays.slice(0, 7)
        : [...sanitizedDays, ...Array(7 - sanitizedDays.length).fill(0)];

    // Use test data if all values are zero (for debugging)
    const hasData = safeLast7Days.some(v => v > 0);
    const curveData = hasData ? safeLast7Days : [3, 8, 5, 12, 7, 15, 10]; // Sample data for visibility testing

    const { segments, areaPath, peakPoint, peakIndex, peakValue, echoPath1, echoPath2, mainPath } = generateCurve(curveData, width, height, 0.3, isLight);

    // Latest point
    const weekMax = Math.max(...safeLast7Days, 30);
    const latestY = height - ((safeLast7Days[6] / weekMax) * height * 0.75);

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
                willChange: 'transform' // Performance hint for mobile
            }}
        >
            <defs>
                {/* Per-segment gradients for heat-map effect */}
                {segments.map((seg, i) => (
                    <linearGradient key={`grad-${i}`} id={`segment-${i}`} x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={seg.colors.start} />
                        <stop offset="100%" stopColor={seg.colors.end} />
                    </linearGradient>
                ))}

                {/* Area fill with directional fade */}
                <linearGradient id="areaFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={isLight ? "rgba(100, 70, 40, 0.12)" : "rgba(200, 180, 130, 0.02)"} />
                    <stop offset="50%" stopColor={isLight ? "rgba(120, 80, 45, 0.18)" : "rgba(253, 220, 145, 0.06)"} />
                    <stop offset="100%" stopColor={isLight ? "rgba(140, 90, 50, 0.25)" : "rgba(255, 235, 180, 0.08)"} />
                </linearGradient>

                {/* LUMINOUS FILAMENT FILTERS */}

                {/* Dual-stage glow for Body layer */}
                <filter id="filamentGlow" x="-50%" y="-50%" width="200%" height="200%">
                    {/* Stage 1: Tight glow (3px, 40% opacity) */}
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="glow1" />
                    <feComponentTransfer in="glow1" result="glow1bright">
                        <feFuncA type="linear" slope="0.4" />
                    </feComponentTransfer>

                    {/* Stage 2: Wide falloff (8px, 15% opacity) */}
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="glow2" />
                    <feComponentTransfer in="glow2" result="glow2soft">
                        <feFuncA type="linear" slope="0.15" />
                    </feComponentTransfer>

                    {/* Merge: glow2 → glow1 → source */}
                    <feMerge>
                        <feMergeNode in="glow2soft" />
                        <feMergeNode in="glow1bright" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Organic turbulence for Atmosphere envelope */}
                <filter id="organicTurbulence" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="1" result="noise" seed="1">
                        {/* Animate seed for organic "shiver" - very cheap on GPU */}
                        <animate attributeName="seed" from="1" to="100" dur="30s" repeatCount="indefinite" />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
                </filter>

                {/* Peak glow - white-hot with bloom */}
                <filter id="peakGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feFlood floodColor={isLight ? "rgba(140, 90, 40, 0.6)" : "rgba(255, 245, 220, 0.7)"} result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Cymatic ripple filter for peak marker */}
                <filter id="cymaticRipple" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Area fill */}
            <path
                d={areaPath}
                fill={isFirefox
                    ? (isLight ? "rgba(120, 80, 45, 0.15)" : "rgba(253, 220, 145, 0.05)")
                    : "url(#areaFill)"
                }
            />

            {/* LAYER 1: Atmosphere Envelope (wide, turbulent, barely visible) */}
            <path
                d={mainPath}
                fill="none"
                stroke={isLight ? "rgba(90, 60, 40, 0.15)" : "rgba(253, 220, 145, 0.1)"}
                strokeWidth={isFirefox ? 12 : 10}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={!isFirefox ? "url(#organicTurbulence)" : undefined}
                style={{
                    mixBlendMode: isLight ? 'multiply' : 'screen'
                }}
            />

            {/* LAYER 2: Harmonic Echoes (thin, trailing energy) */}
            <path
                d={echoPath1}
                fill="none"
                stroke={isLight ? "rgba(100, 70, 40, 0.2)" : "rgba(253, 220, 145, 0.2)"}
                strokeWidth={0.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
            />
            <path
                d={echoPath2}
                fill="none"
                stroke={isLight ? "rgba(100, 70, 40, 0.2)" : "rgba(253, 220, 145, 0.2)"}
                strokeWidth={0.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
            />

            {/* LAYER 3: Body (dual-stage bioluminescent glow) */}
            <path
                d={mainPath}
                fill="none"
                stroke={isLight ? "rgba(120, 80, 40, 0.8)" : "rgba(253, 220, 145, 0.8)"}
                strokeWidth={isFirefox ? 3 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={!isFirefox ? "url(#filamentGlow)" : undefined}
                opacity={0.9}
            />

            {/* LAYER 4: Core (high-intensity truth signal) */}
            {segments.map((seg, i) => (
                <path
                    key={i}
                    d={seg.path}
                    fill="none"
                    stroke={isFirefox ? seg.colors.hex : `url(#segment-${i})`}
                    strokeWidth={seg.strokeWidth * (isFirefox ? 1.2 : 1)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={seg.opacity}
                />
            ))}

            {/* CYMATIC SINGULARITY: Peak marker with ripple effect */}
            {peakPoint && peakValue > 0 && (
                <>
                    {/* Ripple 3: Outermost (faint) */}
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={7}
                        fill="none"
                        stroke={isLight ? "rgba(120, 80, 40, 0.15)" : "rgba(74, 222, 128, 0.15)"}
                        strokeWidth={0.5}
                        filter={!isFirefox ? "url(#cymaticRipple)" : undefined}
                    >
                        <animate attributeName="r" values="7;9;7" dur="4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.15;0.3;0.15" dur="4s" repeatCount="indefinite" />
                    </circle>

                    {/* Ripple 2: Middle */}
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={5}
                        fill="none"
                        stroke={isLight ? "rgba(130, 85, 45, 0.25)" : "rgba(74, 222, 128, 0.25)"}
                        strokeWidth={0.8}
                    >
                        <animate attributeName="r" values="5;6.5;5" dur="4s" begin="0.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.25;0.45;0.25" dur="4s" begin="0.5s" repeatCount="indefinite" />
                    </circle>

                    {/* Ripple 1: Inner glow */}
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={3.5}
                        fill={isLight ? "rgba(140, 90, 40, 0.2)" : "rgba(74, 222, 128, 0.2)"}
                        filter={!isFirefox ? "url(#peakGlow)" : undefined}
                    >
                        <animate attributeName="r" values="3.5;4.5;3.5" dur="4s" begin="1s" repeatCount="indefinite" />
                    </circle>

                    {/* Core of singularity */}
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={1.5}
                        fill={isLight ? "rgba(140, 90, 40, 0.95)" : "rgba(74, 222, 128, 0.9)"}
                    />
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={0.6}
                        fill={isLight ? "#FFF" : "rgba(255, 255, 255, 0.95)"}
                    />
                </>
            )}

            {/* "Now" marker at right edge - pulse indicator */}
            <circle
                cx={width}
                cy={latestY}
                r={2.5}
                fill={isLight ? "rgba(120, 80, 40, 0.5)" : "rgba(74, 222, 128, 0.5)"}
                filter={!isFirefox ? "url(#filamentGlow)" : undefined}
            >
                <animate attributeName="r" values="2.5;3.2;2.5" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle
                cx={width}
                cy={latestY}
                r={0.8}
                fill={isLight ? "#FFF" : "rgba(255, 255, 255, 0.95)"}
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
