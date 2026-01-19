// src/components/MoonOrbit.jsx
// Moon Atmosphere FX - realistic-mystical light behavior
// 3-Layer System: Atmospheric Halo + Ghost Echo Arc + Phase Rimlight

import React, { useMemo, useId } from 'react';
import { useLunarStore } from '../state/lunarStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import './moonAnimations.css';

const TWO_PI = Math.PI * 2;
const PHASE_MARKERS = 32;
const TICK_COUNT = 24;
const DEBUG_PHASE_STRIP = false;
const PHASE_BASE_RADIUS = 2.6;
const PHASE_ACTIVE_SCALE = 1.25;
const PHASE_TRACK_OFFSET = 6;

/**
 * MoonOrbit - Atmospheric moon with volumetric light behavior
 */
export function MoonOrbit({ avatarRadius = 138, centerX = 300, centerY = 300 }) {
    const progress = useLunarStore(s => s.progress);
    const isLight = useDisplayModeStore(s => s.colorScheme === 'light');
    const clipPrefix = useId();

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

    const baseFill = "rgba(10, 12, 14, 0.55)";
    const litFill = "rgba(255, 248, 235, 0.85)";
    const outlineStroke = "rgba(255, 255, 255, 0.12)";

    const renderPhaseGlyph = ({ cx, cy, r, phaseT, emphasis = 1, maskId, glow = false }) => {
        const illum = 0.5 * (1 - Math.cos(phaseT * TWO_PI));
        const waxing = phaseT < 0.5;
        const rawOffset = (waxing ? (1 - 2 * illum) : (2 * illum - 1)) * r;
        const xOffset = Math.max(-r, Math.min(r, rawOffset));

        if (illum < 0.001) {
            return (
                <g opacity={emphasis}>
                    <circle cx={cx} cy={cy} r={r} fill={baseFill} />
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={outlineStroke} strokeWidth={1.6} />
                </g>
            );
        }

        if (illum > 0.999) {
            return (
                <g opacity={emphasis}>
                    <circle cx={cx} cy={cy} r={r} fill={baseFill} />
                    <circle cx={cx} cy={cy} r={r} fill={litFill} filter={glow ? "url(#orbitGlow)" : undefined} />
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={outlineStroke} strokeWidth={0.6} />
                </g>
            );
        }

        const litLeft = waxing ? (cx + xOffset) : (cx - r);
        const litRight = waxing ? (cx + r) : (cx + xOffset);
        const darkLeft = cx - r;
        const darkRight = cx + r;
        const darkWidth = waxing ? Math.max(0, litLeft - darkLeft) : Math.max(0, darkRight - litRight);
        const darkX = waxing ? darkLeft : litRight;

        return (
            <g opacity={emphasis}>
                <defs>
                    <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
                        <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="black" />
                        <circle cx={cx} cy={cy} r={r} fill="white" />
                        {darkWidth > 0 && (
                            <rect x={darkX} y={cy - r} width={darkWidth} height={r * 2} fill="black" />
                        )}
                    </mask>
                </defs>
                <circle cx={cx} cy={cy} r={r} fill={baseFill} />
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={litFill}
                    mask={`url(#${maskId})`}
                    filter={glow ? "url(#orbitGlow)" : undefined}
                />
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={outlineStroke}
                    strokeWidth={0.6}
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
                                    emphasis: 1,
                                    maskId: `${clipPrefix}-debug-mask-${idx}`,
                                    glow: false
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
                const maskId = `${clipPrefix}-phase-mask-${i}`;

                return (
                    <g key={`orbit-phase-${i}`} opacity={glyphOpacity}>
                        {renderPhaseGlyph({
                            cx: glyphX,
                            cy: glyphY,
                            r: radius,
                            phaseT,
                            emphasis: 1,
                            maskId,
                            glow: isCurrent
                        })}
                    </g>
                );
            })}

            {/* Moon Marker */}
            {!isDormant && (
                <>
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
                        r={moonRadius * 0.82}
                        fill="rgba(248, 250, 252, 0.95)"
                    />
                    <circle
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 1.02}
                        fill="none"
                        stroke="rgba(248, 250, 252, 0.45)"
                        strokeWidth={0.6}
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
