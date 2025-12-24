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

    return {
        areaPath,
        segments,
        peakPoint: points[peakIndex],
        peakIndex,
        peakValue: data[peakIndex]
    };
}

export default function SevenDayTrendCurve({ last7Days = [0, 0, 0, 0, 0, 0, 0] }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const width = 100;
    const height = 36;

    // Firefox detection
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');

    // Use test data if all values are zero (for debugging)
    const hasData = last7Days.some(v => v > 0);
    const curveData = hasData ? last7Days : [3, 8, 5, 12, 7, 15, 10]; // Sample data for visibility testing

    const { segments, areaPath, peakPoint, peakIndex, peakValue } = generateCurve(curveData, width, height, 0.3, isLight);

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

                {/* White-hot peak glow */}
                <filter id="peakGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feFlood floodColor="rgba(255, 245, 220, 0.7)" result="color" />
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
            <path
                d={areaPath}
                fill={isFirefox
                    ? (isLight ? "rgba(120, 80, 45, 0.15)" : "rgba(253, 220, 145, 0.05)")
                    : "url(#areaFill)"
                }
            />

            {/* Curve segments with intensity-based heat-map colors */}
            {segments.map((seg, i) => (
                <path
                    key={i}
                    d={seg.path}
                    fill="none"
                    stroke={isFirefox ? seg.colors.hex : `url(#segment-${i})`}
                    strokeWidth={seg.strokeWidth * (isFirefox ? 2 : 1.5)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isFirefox ? seg.opacity : undefined}
                    style={!isFirefox ? { opacity: seg.opacity } : undefined}
                    filter={seg.isPeak && !isFirefox ? "url(#peakGlow)" : undefined}
                />
            ))}

            {/* Peak marker with bloom */}
            {peakPoint && peakValue > 0 && (
                <>
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={4}
                        fill="rgba(74, 222, 128, 0.15)"
                        filter={!isFirefox ? "url(#peakGlow)" : undefined}
                    />
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={1.5}
                        fill="rgba(74, 222, 128, 0.8)"
                    />
                    <circle
                        cx={peakPoint.x}
                        cy={peakPoint.y}
                        r={0.6}
                        fill="rgba(255, 255, 255, 0.95)"
                    />
                </>
            )}

            {/* "Now" marker at right edge - shows direction */}
            <circle
                cx={width}
                cy={latestY}
                r={1.8}
                fill="rgba(74, 222, 128, 0.5)"
                filter={!isFirefox ? "url(#softGlow)" : undefined}
            />
            <circle
                cx={width}
                cy={latestY}
                r={0.6}
                fill="rgba(255, 255, 255, 0.9)"
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
