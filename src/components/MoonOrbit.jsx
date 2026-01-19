// src/components/MoonOrbit.jsx
// Moon Atmosphere FX - realistic-mystical light behavior
// Stroke-based lunar orbit + directional wake

import React, { useMemo } from 'react';
import { useLunarStore } from '../state/lunarStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useTrackingStore } from '../state/trackingStore';
import './moonAnimations.css';

const TWO_PI = Math.PI * 2;
const PHASE_MARKERS = 32;
const TICK_COUNT = 24;
const DEBUG_PHASE_STRIP = false;
const PHASE_BASE_RADIUS = 2.6;
const PHASE_ACTIVE_SCALE = 1.25;
const PHASE_TRACK_OFFSET = 6;
const TRAIL_STEPS = 5;
const TRAIL_LENGTH = 80;

/**
 * MoonOrbit - Atmospheric moon with volumetric light behavior
 */
export function MoonOrbit({ avatarRadius = 138, centerX = 300, centerY = 300 }) {
    const progress = useLunarStore(s => s.progress);
    const isLight = useDisplayModeStore(s => s.colorScheme === 'light');
    const streakCurrent = useTrackingStore(s => s.streak?.current ?? 0);

    const progress01 = ((progress % 12) + 12) % 12 / 12;
    const moonAngle = (progress01 * TWO_PI) - Math.PI / 2; // Start at 12 o'clock
    const orbitRadius = avatarRadius * 1.4;
    const phaseTrackRadius = orbitRadius + PHASE_TRACK_OFFSET;
    const moonRadius = 9.2;
    const activeIndex = Math.floor(progress01 * PHASE_MARKERS);
    const markerAngles = useMemo(
        () => Array.from({ length: PHASE_MARKERS }, (_, i) => (i / PHASE_MARKERS) * TWO_PI),
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

    const streakStrength = Math.min(1, Math.max(0, streakCurrent / 30));
    const gold = { r: 255, g: 210, b: 120 };
    const k = 0.25 + 0.75 * streakStrength;
    const wakeR = Math.round(gold.r * k);
    const wakeG = Math.round(gold.g * k);
    const wakeB = Math.round(gold.b * k);

    const baseStroke = "rgba(255, 255, 255, 0.16)";
    const litStroke = `rgba(${wakeR}, ${wakeG}, ${wakeB}, 0.8)`;
    const haloStroke = `rgba(${wakeR}, ${wakeG}, ${wakeB}, ${Math.min(0.25, 0.20 + 0.55 * streakStrength)})`;
    const moonCoreFill = `rgba(${wakeR}, ${wakeG}, ${wakeB}, ${0.10 + 0.25 * streakStrength})`;
    const moonRimStroke = `rgba(${wakeR}, ${wakeG}, ${wakeB}, ${Math.min(0.6, 0.35 + 0.25 * streakStrength)})`;

    const tangentX = -Math.sin(moonAngle);
    const tangentY = Math.cos(moonAngle);

    const trailSegments = !isDormant ? Array.from({ length: TRAIL_STEPS }, (_, i) => {
        const t = (i + 1) / TRAIL_STEPS; // 0..1
        const distance = t * TRAIL_LENGTH;
        const falloff = (1 - t);
        const alpha = falloff * falloff; // smoothstep-like
        const size = moonRadius * (0.4 + 0.08 * (1 - t));
        return {
            x: moonX - tangentX * distance,
            y: moonY - tangentY * distance,
            alpha,
            size,
        };
    }) : [];
    const renderPhaseGlyph = ({ cx, cy, r, phaseT, emphasis = 1 }) => {
        const illum = 0.5 * (1 - Math.cos(phaseT * TWO_PI));
        const waxing = phaseT < 0.5;
        const circumference = TWO_PI * r;
        const litLength = Math.max(illum * circumference, 0.08 * circumference);
        const dashArray = `${litLength} ${circumference}`;
        const dashOffset = -(waxing ? 0.25 : 0.75) * circumference;

        return (
            <g opacity={emphasis}>
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={baseStroke}
                    strokeWidth={0.7}
                />
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={litStroke}
                    strokeWidth={1.2}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    opacity={0.9}
                />
            </g>
        );
    };

    return (
        <g className="moon-orbit-dark">
            <defs>
                <filter id="orbitGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {DEBUG_PHASE_STRIP && (
                <g>
                    {([0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]).map((phaseT, idx) => {
                        const x = centerX - orbitRadius - 40 + idx * 20;
                        const y = centerY - orbitRadius - 30;
                        return (
                            <g key={`phase-debug-${idx}`}>
                                {renderPhaseGlyph({
                                    cx: x,
                                    cy: y,
                                    r: 8,
                                    phaseT,
                                    emphasis: 1
                                })}
                            </g>
                        );
                    })}
                </g>
            )}

            {/* Orbit Rings */}
            <circle
                cx={centerX}
                cy={centerY}
                r={orbitRadius}
                fill="none"
                stroke="rgba(248, 250, 252, 0.18)"
                strokeWidth={2}
                strokeOpacity={0.35}
            />
            <circle
                cx={centerX}
                cy={centerY}
                r={orbitRadius * 0.94}
                fill="none"
                stroke="rgba(248, 250, 252, 0.18)"
                strokeWidth={1.1}
                strokeOpacity={0.4}
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

            {/* Orbit Phase Track */}
            {markerAngles.map((baseAngle, i) => {
                const angle = baseAngle - Math.PI / 2;
                const isCompleted = i < activeIndex;
                const isCurrent = i === activeIndex;
                const phaseT = i / PHASE_MARKERS;
                const radius = PHASE_BASE_RADIUS * (isCurrent ? PHASE_ACTIVE_SCALE : 1);
                const glyphX = centerX + Math.cos(angle) * phaseTrackRadius;
                const glyphY = centerY + Math.sin(angle) * phaseTrackRadius;
                const glyphOpacity = isCurrent ? 0.9 : (isCompleted ? 0.58 : 0.26);

                return (
                    <g key={`orbit-phase-${i}`} opacity={glyphOpacity}>
                        {renderPhaseGlyph({
                            cx: glyphX,
                            cy: glyphY,
                            r: radius,
                            phaseT,
                            emphasis: isCurrent ? 1.15 : 1
                        })}
                    </g>
                );
            })}

            {/* Moon Marker */}
            {!isDormant && (
                <>
                    {trailSegments.map((segment, idx) => (
                        <circle
                            key={`moon-trail-${idx}`}
                            cx={segment.x}
                            cy={segment.y}
                            r={segment.size}
                            fill="none"
                            stroke={`rgba(${wakeR}, ${wakeG}, ${wakeB}, ${0.48 * segment.alpha})`}
                            strokeWidth={2}
                        />
                    ))}
                    <circle
                        className="moon-halo-pulse"
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 2.1}
                        fill="rgba(52, 211, 153, 0.12)"
                        filter="url(#orbitGlow)"
                    />
                    <circle
                        cx={moonX - Math.sin(moonAngle) * (moonRadius * 1.8)}
                        cy={moonY + Math.cos(moonAngle) * (moonRadius * 1.8)}
                        r={moonRadius * 2.6}
                        fill="rgba(52, 211, 153, 0.24)"
                        filter="url(#orbitGlow)"
                    />
                    {[
                        { offset: 8, radius: moonRadius * 1.2, opacity: 0.22 },
                        { offset: 16, radius: moonRadius * 0.9, opacity: 0.14 },
                        { offset: 26, radius: moonRadius * 0.7, opacity: 0.08 }
                    ].map((puff, idx) => (
                        <circle
                            key={`moon-puff-${idx}`}
                            cx={moonX - Math.sin(moonAngle) * puff.offset}
                            cy={moonY + Math.cos(moonAngle) * puff.offset}
                            r={puff.radius}
                            fill={`rgba(52, 211, 153, ${puff.opacity})`}
                            filter="url(#orbitGlow)"
                        />
                    ))}
                    <circle
                        cx={moonX + Math.sin(moonAngle) * (moonRadius * 1.1)}
                        cy={moonY - Math.cos(moonAngle) * (moonRadius * 1.1)}
                        r={moonRadius * 0.55}
                        fill="rgba(52, 211, 153, 0.25)"
                        filter="url(#orbitGlow)"
                    />
                    <circle
                        className="moon-twinkle"
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 0.9}
                        fill={moonCoreFill}
                    />
                    <circle
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 1.04}
                        fill="none"
                        stroke={moonRimStroke}
                        strokeWidth={0.8}
                    />
                    <circle
                        className="moon-halo-wobble"
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

export default MoonOrbit;
