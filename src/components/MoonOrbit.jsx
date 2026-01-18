// src/components/MoonOrbit.jsx
// Moon Atmosphere FX - realistic-mystical light behavior
// 3-Layer System: Atmospheric Halo + Ghost Echo Arc + Phase Rimlight

import React, { useMemo } from 'react';
import { useLunarStore } from '../state/lunarStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import './moonAnimations.css';

const TWO_PI = Math.PI * 2;
const TRAIL_DOTS = 60;
const TICK_COUNT = 24;
const TRAIL_BASE_RADIUS = 1.6;
const TRAIL_MAX_RADIUS = 3.0;

/**
 * MoonOrbit - Atmospheric moon with volumetric light behavior
 */
export function MoonOrbit({ avatarRadius = 138, centerX = 300, centerY = 300 }) {
    const progress = useLunarStore(s => s.progress);
    const isLight = useDisplayModeStore(s => s.colorScheme === 'light');

    const progress01 = ((progress % 12) + 12) % 12 / 12;
    const moonAngle = (progress01 * TWO_PI) - Math.PI / 2; // Start at 12 o'clock
    const orbitRadius = avatarRadius * 1.4;
    const moonRadius = 8;
    const activeIndex = Math.floor(progress01 * TRAIL_DOTS);
    const dotAngles = useMemo(
        () => Array.from({ length: TRAIL_DOTS }, (_, i) => (i / TRAIL_DOTS) * TWO_PI),
        []
    );
    const tickAngles = useMemo(
        () => Array.from({ length: TICK_COUNT }, (_, i) => (i / TICK_COUNT) * TWO_PI),
        []
    );

    // Moon position
    const moonX = centerX + Math.cos(moonAngle) * orbitRadius;
    const moonY = centerY + Math.sin(moonAngle) * orbitRadius;
    const isDormant = progress === 0;

    // -----------------------------------------------------------------------------
    // LIGHT MODE: Return nothing - no SVG elements
    // -----------------------------------------------------------------------------
    if (isLight) {
        return null;
    }

    return (
        <g className="moon-orbit-dark">
            <defs>
                <linearGradient
                    id="orbitStrokeGradient"
                    x1={centerX - orbitRadius}
                    y1={centerY}
                    x2={centerX + orbitRadius}
                    y2={centerY}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="rgba(52, 211, 153, 0.58)" />
                    <stop offset="50%" stopColor="rgba(52, 211, 153, 0.4)" />
                    <stop offset="100%" stopColor="rgba(52, 211, 153, 0.24)" />
                </linearGradient>
                <filter id="orbitGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Orbit Rings */}
            <circle
                cx={centerX}
                cy={centerY}
                r={orbitRadius}
                fill="none"
                stroke="url(#orbitStrokeGradient)"
                strokeWidth={2}
                strokeOpacity={0.38}
                filter="url(#orbitGlow)"
            />
            <circle
                cx={centerX}
                cy={centerY}
                r={orbitRadius * 0.94}
                fill="none"
                stroke="url(#orbitStrokeGradient)"
                strokeWidth={1.2}
                strokeOpacity={0.6}
            />

            {/* Tick Marks */}
            {tickAngles.map((baseAngle, i) => {
                const angle = baseAngle - Math.PI / 2;
                const innerR = orbitRadius * 0.97;
                const outerR = orbitRadius * 1.01;
                const x1 = centerX + Math.cos(angle) * innerR;
                const y1 = centerY + Math.sin(angle) * innerR;
                const x2 = centerX + Math.cos(angle) * outerR;
                const y2 = centerY + Math.sin(angle) * outerR;
                return (
                    <line
                        key={`orbit-tick-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="rgba(248, 250, 252, 0.18)"
                        strokeWidth={1}
                    />
                );
            })}

            {/* Orbit Dot Trail */}
            {dotAngles.map((baseAngle, i) => {
                const angle = baseAngle - Math.PI / 2;
                const dotX = centerX + Math.cos(angle) * orbitRadius;
                const dotY = centerY + Math.sin(angle) * orbitRadius;
                const delta = wrapAngle(angle - moonAngle);
                const isCompleted = i < activeIndex;
                const isCurrent = i === activeIndex;
                const distance = Math.abs(delta);
                const nearFactor = Math.max(0, 1 - distance / (Math.PI / 3));
                const directional = delta >= 0 ? 1 : 0.55;
                const falloff = 0.3 + 0.7 * (1 - Math.min(1, distance / Math.PI));
                const baseAlpha = isCurrent ? 0.95 : (isCompleted ? 0.55 : 0.22);
                const opacity = baseAlpha * falloff * directional;
                const radius = Math.min(
                    TRAIL_MAX_RADIUS,
                    TRAIL_BASE_RADIUS + nearFactor * (TRAIL_MAX_RADIUS - TRAIL_BASE_RADIUS) + (isCurrent ? 0.4 : 0)
                );
                const fill = isCompleted || isCurrent ? "var(--accent-color)" : "none";
                const stroke = isCompleted || isCurrent
                    ? "var(--accent-color)"
                    : "rgba(248, 250, 252, 0.22)";

                return (
                    <circle
                        key={`orbit-dot-${i}`}
                        cx={dotX}
                        cy={dotY}
                        r={radius}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={1}
                        opacity={opacity}
                        filter={isCurrent ? "url(#orbitGlow)" : undefined}
                    />
                );
            })}

            {/* Moon Marker */}
            {!isDormant && (
                <>
                    <circle
                        cx={moonX + Math.sin(moonAngle) * (moonRadius * 1.1)}
                        cy={moonY - Math.cos(moonAngle) * (moonRadius * 1.1)}
                        r={moonRadius * 0.55}
                        fill="rgba(52, 211, 153, 0.25)"
                        filter="url(#orbitGlow)"
                    />
                    <circle
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 0.82}
                        fill="rgba(248, 250, 252, 0.95)"
                    />
                    <circle
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 1.18}
                        fill="none"
                        stroke="rgba(52, 211, 153, 0.6)"
                        strokeWidth={1.1}
                        filter="url(#orbitGlow)"
                    />
                </>
            )}
        </g>
    );
}

function wrapAngle(angle) {
    let a = (angle + Math.PI) % TWO_PI;
    if (a < 0) a += TWO_PI;
    return a - Math.PI;
}

export default MoonOrbit;
