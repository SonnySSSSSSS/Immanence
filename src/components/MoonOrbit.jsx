// src/components/MoonOrbit.jsx
// Moon Atmosphere FX — realistic-mystical light behavior
// 3-Layer System: Atmospheric Halo + Ghost Echo Arc + Phase Rimlight

import React, { useState, useEffect, useRef } from 'react';
import { useLunarStore } from '../state/lunarStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { MoonGlowLayer } from './MoonGlowLayer';
import './moonAnimations.css';

const TWO_PI = Math.PI * 2;

// Normalize angle to 0-2π range
function normalizeAngle(angle) {
    const a = angle % TWO_PI;
    return a < 0 ? a + TWO_PI : a;
}

/**
 * MoonOrbit — Atmospheric moon with volumetric light behavior
 */
export function MoonOrbit({ avatarRadius = 138, centerX = 300, centerY = 300 }) {
    const progress = useLunarStore(s => s.progress);
    const recentActivity = useLunarStore(s => s.recentActivity);
    const sparkleMode = useLunarStore(s => s.sparkleMode);

    // Track previous progress for ghost echo
    const prevProgressRef = useRef(progress);
    const prevAngleRef = useRef(null);
    const [ghostEcho, setGhostEcho] = useState(null);
    const [isWobbling, setIsWobbling] = useState(false);
    const [sparkles, setSparkles] = useState([]);

    // Detect progress changes for animations
    useEffect(() => {
        const prevProgress = prevProgressRef.current;
        const prevAngle = (prevProgress / 12) * TWO_PI - Math.PI / 2;
        const newAngle = (progress / 12) * TWO_PI - Math.PI / 2;

        if (progress > prevProgress) {
            // Trigger ghost echo
            setGhostEcho({
                startAngle: prevAngle,
                endAngle: newAngle,
                key: Date.now(),
            });
            // Trigger wobble
            setIsWobbling(true);
            setTimeout(() => setIsWobbling(false), 600);
            // Clear ghost after animation
            setTimeout(() => setGhostEcho(null), 500);
        }

        prevProgressRef.current = progress;
        prevAngleRef.current = newAngle;
    }, [progress]);

    const isLight = useDisplayModeStore(s => s.colorScheme === 'light');

    const moonAngle = (progress / 12) * TWO_PI - Math.PI / 2; // Start at 12 o'clock
    const phase = getMoonPhase(progress);
    const orbitRadius = avatarRadius * 1.4;
    const moonRadius = 8;

    // Moon position
    const moonX = centerX + Math.cos(moonAngle) * orbitRadius;
    const moonY = centerY + Math.sin(moonAngle) * orbitRadius;

    // ═══════════════════════════════════════════════════════════════════════════
    // LIGHT MODE: Return nothing - no SVG elements
    // ═══════════════════════════════════════════════════════════════════════════
    if (isLight) {
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER PATH: DARK MODE (Volumetric Cosmic)
    // ═══════════════════════════════════════════════════════════════════════════
    const illumination = getIllumination(phase);
    const isDormant = progress === 0;
    const haloRadius = moonRadius * (1.5 + illumination * 0.5);
    const haloOpacity = isDormant ? 0 : (0.12 + illumination * 0.08);
    const rimlightWidth = 0.5 + illumination * 2;
    const rimlightOpacity = 0.3 + illumination * 0.5;

    return (
        <g className="moon-orbit-dark">
            <defs>
                <radialGradient id="moonHaloGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.4" />
                    <stop offset="40%" stopColor="var(--accent-color)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                </radialGradient>
                <filter id="rimlightBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
                </filter>
                <filter id="ghostBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
            </defs>

            {/* Orbit Path */}
            <circle
                cx={centerX}
                cy={centerY}
                r={orbitRadius}
                fill="none"
                stroke="var(--accent-color)"
                strokeWidth={1}
                strokeOpacity={0.08}
            />

            {/* Ghost Echo */}
            {ghostEcho && (
                <path
                    key={ghostEcho.key}
                    d={describeArc(centerX, centerY, orbitRadius, ghostEcho.startAngle, ghostEcho.endAngle)}
                    fill="none"
                    stroke="rgba(255, 250, 240, 0.3)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    filter="url(#ghostBlur)"
                    className="ghost-echo-arc"
                />
            )}

            {/* Atmospheric Halo */}
            <circle
                cx={moonX}
                cy={moonY}
                r={haloRadius}
                fill="url(#moonHaloGradient)"
                opacity={haloOpacity}
                className={`moon-star-breathe ${isWobbling ? 'moon-halo-wobble' : ''}`}
            />

            {/* Core Glow */}
            <circle
                cx={moonX}
                cy={moonY}
                r={haloRadius * 0.6}
                fill="var(--accent-color)"
                opacity={haloOpacity * 0.4}
                className={`moon-star-breathe ${isWobbling ? 'moon-halo-wobble' : ''}`}
            />

            {/* Phase Rimlight */}
            {!isDormant && (
                <circle
                    cx={moonX}
                    cy={moonY}
                    r={moonRadius + 1}
                    fill="none"
                    stroke="rgba(255, 250, 240, 0.7)"
                    strokeWidth={rimlightWidth}
                    strokeOpacity={rimlightOpacity}
                    filter="url(#rimlightBlur)"
                />
            )}

            {/* Standard MoonGlowLayer (fallback/combined) */}
            <MoonGlowLayer
                progress={progress}
                centerX={centerX}
                centerY={centerY}
                orbitRadius={orbitRadius}
            />

            {/* Phase shadows... */}
            {phase === 'firstQuarter' && (
                <ellipse cx={moonX - moonRadius * 0.3} cy={moonY} rx={moonRadius * 0.7} ry={moonRadius} fill="rgba(10, 10, 18, 0.75)" />
            )}
            {phase === 'lastQuarter' && (
                <ellipse cx={moonX + moonRadius * 0.3} cy={moonY} rx={moonRadius * 0.7} ry={moonRadius} fill="rgba(10, 10, 18, 0.75)" />
            )}
            {phase === 'new' && (
                <ellipse cx={moonX + moonRadius * 0.4} cy={moonY} rx={moonRadius * 0.8} ry={moonRadius} fill="rgba(10, 10, 18, 0.85)" />
            )}
        </g>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getMoonPhase(progress) {
    if (progress === 0) return 'new';
    if (progress < 4) return 'crescent';
    if (progress < 6) return 'firstQuarter';
    if (progress < 9) return 'full';
    return 'lastQuarter';
}

function getIllumination(phase) {
    return {
        new: 0.15,
        firstQuarter: 0.5,
        full: 1.0,
        lastQuarter: 0.5,
    }[phase];
}

function describeArc(cx, cy, r, startAngle, endAngle) {
    let start = normalizeAngle(startAngle);
    let end = normalizeAngle(endAngle);

    // Handle wrap-around
    if (end <= start) {
        end += TWO_PI;
    }

    // If no meaningful arc, return empty
    if (end - start < 0.01) return '';

    const startPoint = {
        x: cx + Math.cos(start) * r,
        y: cy + Math.sin(start) * r,
    };
    const endPoint = {
        x: cx + Math.cos(end) * r,
        y: cy + Math.sin(end) * r,
    };
    const largeArc = (end - start) > Math.PI ? 1 : 0;

    return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
}

export default MoonOrbit;
