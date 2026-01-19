// src/components/MoonOrbit.jsx
// Moon Atmosphere FX - realistic-mystical light behavior
// Stroke-based lunar orbit + directional wake

import React, { useMemo } from 'react';
import { useLunarStore } from '../state/lunarStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import './moonAnimations.css';

const TWO_PI = Math.PI * 2;
const PHASE_MARKERS = 40;
const TICK_COUNT = 24;
const DEBUG_PHASE_STRIP = false; // Enable to validate phase rendering
const PHASE_ACTIVE_SCALE = 1.25;
const PHASE_TRACK_OFFSET = 0; // Glyphs sit ON the orbit ring, not offset
const TRAIL_STEPS = 5;
const TRAIL_LENGTH = 60; // Increased 50%
const WAKE_RADIUS_SCALE = 1.5; // 50% larger wake
const BLUR_STDDEV = 2.25; // 1.5x larger blur

/**
 * MoonOrbit - Atmospheric moon with volumetric light behavior
 */
export function MoonOrbit({ avatarRadius = 138, centerX = 300, centerY = 300 }) {
    const progress = useLunarStore(s => s.progress);
    const isLight = useDisplayModeStore(s => s.colorScheme === 'light');

    const progress01 = ((progress % 12) + 12) % 12 / 12;
    const moonAngle = (progress01 * TWO_PI) - Math.PI / 2; // Start at 12 o'clock
    const orbitRadius = avatarRadius * 1.4;
    const phaseTrackRadius = orbitRadius + PHASE_TRACK_OFFSET; // Now sits ON the ring
    
    const moonRadius = 9.2;
    const MILESTONE_R = moonRadius * 0.85; // Milestone glyphs sized to match moon feel
    
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

    // Heat tracking: based on progress to enable gold heating
    const heat = Math.max(0, Math.min(1, progress / 12)); // 0..1 as moon progresses
    const glowIntensity = 0.6 + 0.4 * heat; // Glow increases with heat

    const baseStroke = "rgba(255, 255, 255, 0.16)";
    const litStroke = "rgba(140, 255, 225, 0.72)";
    const haloStroke = `rgba(${Math.round(140 + 60 * heat)}, 255, ${Math.round(225 - 50 * heat)}, ${0.22 * glowIntensity})`;
    const moonCoreFill = heat > 0.1 ? `rgba(255, 230, 150, ${0.5 + 0.5 * heat})` : "rgba(248, 250, 252, 0.96)";
    const moonRimStroke = `rgba(248, 250, 252, ${0.42 * glowIntensity})`;


    const tangentX = -Math.sin(moonAngle);
    const tangentY = Math.cos(moonAngle);

    const trailSegments = !isDormant ? Array.from({ length: TRAIL_STEPS }, (_, i) => {
        const t = (i + 1) / TRAIL_STEPS; // 0..1
        const distance = t * TRAIL_LENGTH;
        const falloff = (1 - t);
        const alpha = falloff * falloff; // smoothstep-like
        const size = moonRadius * WAKE_RADIUS_SCALE * (0.4 + 0.08 * (1 - t)) * 6; // 500% larger moons
        return {
            x: moonX - tangentX * distance,
            y: moonY - tangentY * distance,
            alpha,
            size,
        };
    }) : [];
    const renderPhaseGlyph = ({ cx, cy, r, phaseT, emphasis = 1, index }) => {
        // Calculate lunar phase illumination
        const a = phaseT * TWO_PI;
        const k = (1 - Math.cos(a)) / 2; // 0 = new moon, 0.5 = quarter, 1 = full
        const waxing = phaseT < 0.5;
        
        // Terminator X offset (straight edge)
        let terminatorX = (1 - 2 * k) * r; // k=0 -> +r (new), k=0.5 -> 0 (quarter), k=1 -> -r (full)
        if (!waxing) terminatorX = -terminatorX; // Flip for waning phase
        
        // Organic scale variation (subtle)
        const scaleJitter = 0.98 + 0.04 * Math.sin(index * 2.3);
        const effectiveR = r * scaleJitter;
        
        const clipId = `phase-clip-${index}`;
        const clipIdFeather = `phase-clip-feather-${index}`;
        
        return (
            <g opacity={emphasis}>
                {/* Define clipPaths for lit portion */}
                <defs>
                    <clipPath id={clipId}>
                        <rect
                            x={cx + terminatorX}
                            y={cy - effectiveR}
                            width={effectiveR * 2}
                            height={effectiveR * 2}
                        />
                    </clipPath>
                    <clipPath id={clipIdFeather}>
                        <rect
                            x={cx + terminatorX}
                            y={cy - effectiveR - 0.3}
                            width={effectiveR * 2}
                            height={effectiveR * 2 + 0.6}
                        />
                    </clipPath>
                </defs>
                
                {/* Base (unlit) disc - darker for better contrast */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={effectiveR}
                    fill="rgba(0, 0, 0, 0.45)"
                    stroke="rgba(255, 220, 140, 0.25)"
                    strokeWidth={0.6}
                />
                
                {/* Lit portion (clipped) - warm ivory */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={effectiveR}
                    fill="rgba(244, 232, 210, 0.88)"
                    clipPath={`url(#${clipId})`}
                />
                
                {/* Feathered edge for smooth terminator */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={effectiveR + 0.3}
                    fill="rgba(244, 232, 210, 0.25)"
                    clipPath={`url(#${clipIdFeather})`}
                    style={{ filter: 'blur(0.6px)' }}
                />
            </g>
        );
    };

    return (
        <g className="moon-orbit-dark">
            {/* DEBUG: Red square proof - remove after verification */}
            <rect x="8" y="8" width="10" height="10" fill="red" />

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
                                    index: `debug-${idx}`
                                })}
                            </g>
                        );
                    })}
                </g>
            )}

            {/* Orbit Rings - REMOVED (eliminated green path) */}

            {/* Tick Marks - DISABLED to find green line source */}
            {/* tickAngles.map((baseAngle, i) => {
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
            }) */}


            {/* Orbit Phase Track - Progress Meter */}
            {markerAngles.map((baseAngle, i) => {
                const angle = baseAngle - Math.PI / 2;
                const isCompleted = i < activeIndex;
                const isCurrent = i === activeIndex;
                const distFromActive = Math.min(
                    Math.abs(i - activeIndex),
                    PHASE_MARKERS - Math.abs(i - activeIndex)
                );
                const isNearCurrent = distFromActive <= 1;
                
                const spriteSrc = `/bg/moon-phases/moon_phase_${String(i).padStart(2, '0')}.png`;
                
                // Progress meter styling
                let phaseOpacity = 0.2; // future/unearned
                let phaseScale = 1;
                if (isCompleted) {
                    phaseOpacity = 0.65; // earned phases
                    phaseScale = 1;
                }
                if (isNearCurrent) {
                    phaseOpacity = 0.80; // neighbors get boost
                }
                if (isCurrent) {
                    phaseOpacity = 1.0; // current is brightest
                    phaseScale = 1.35;
                }
                
                const markerSize = (isCurrent ? 40 : 32) * phaseScale;
                const glyphX = centerX + Math.cos(angle) * phaseTrackRadius;
                const glyphY = centerY + Math.sin(angle) * phaseTrackRadius;
                
                return (
                    <g key={`orbit-phase-${i}`} opacity={phaseOpacity}>
                        <image
                            href={spriteSrc}
                            x={glyphX - markerSize / 2}
                            y={glyphY - markerSize / 2}
                            width={markerSize}
                            height={markerSize}
                        />
                    </g>
                );
            })}

            {/* Moon Marker */}
            {!isDormant && (
                <>
                    {/* Wake Trail - 50% larger with blur */}
                    {trailSegments.map((segment, idx) => (
                        <circle
                            key={`moon-trail-${idx}`}
                            cx={segment.x}
                            cy={segment.y}
                            r={segment.size}
                            fill="none"
                            stroke={`rgba(140, 255, 225, ${0.34 * segment.alpha})`}
                            strokeWidth={1.425}
                            style={{ filter: `blur(${BLUR_STDDEV}px)` }}
                        />
                    ))}

                    {/* Pulse Circle - FILLED with gold, SAME SIZE as moon */}
                    <circle
                        className="moon-halo-pulse"
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius}
                        fill={`rgba(255, 200, 100, ${0.25 * glowIntensity})`}
                        style={{ filter: `blur(${BLUR_STDDEV * 0.8}px)` }}
                    />

                    {/* Halo Stroke - single thin stroke */}
                    <circle
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 1.5}
                        fill="none"
                        stroke={haloStroke}
                        strokeWidth={1.2}
                    />

                    {/* Moon Core */}
                    <circle
                        className="moon-twinkle"
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 0.9}
                        fill={moonCoreFill}
                    />

                    {/* Moon Rim Highlight */}
                    <circle
                        cx={moonX}
                        cy={moonY}
                        r={moonRadius * 1.04}
                        fill="none"
                        stroke={moonRimStroke}
                        strokeWidth={0.8}
                    />
                </>
            )}
        </g>
    );
}

export default MoonOrbit;
