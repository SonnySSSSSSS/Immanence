// src/components/AvatarHaloGate.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR HALO GATE — Navigation overlay for the Avatar instrument
// ═══════════════════════════════════════════════════════════════════════════════
//
// DESIGN CONSTRAINTS (Phase 0):
// • Ring asset is purely decorative — it can spin freely behind everything
// • Navigation text NEVER rotates — labels are always readable
// • Hit targets NEVER rotate — positioned at fixed angles
// • Gate positions are absolute, not driven by ring rotation
//
// LAYER STACK (integrated with Avatar.jsx):
// • Layer A (z-250): GateLabels — static text + icons, always on top
// • Layer B (z-240): GateHitWedges — invisible clickable wedges
// • Existing layers below...
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { useDisplayModeStore } from '../state/displayModeStore';

// ─── GATE CONFIGURATION ────────────────────────────────────────────────────────
// Positions use compass-style angles (0° = top, clockwise)
// Converted to math angles internally: mathAngle = (compassAngle - 90)
const GATE_CONFIG = {
    practice: {
        angle: 225,      // Bottom-left (7-8 o'clock)
        label: 'Practice',
        icon: '◈',       // Diamond with dot
        route: '/practice',
    },
    wisdom: {
        angle: 315,      // Bottom-right (4-5 o'clock)  
        label: 'Wisdom',
        icon: '☉',       // Sun symbol
        route: '/wisdom',
    },
    application: {
        angle: 135,      // Top-left (10-11 o'clock)
        label: 'Application',
        icon: '⚡',      // Lightning
        route: '/application',
    },
    navigation: {
        angle: 45,       // Top-right (1-2 o'clock)
        label: 'Navigation',
        icon: '✦',       // Star
        route: '/navigation',
    },
};

// ─── UTILITY: Convert compass angle to math radians ────────────────────────────
const compassToRadians = (compassAngle) => {
    // Compass: 0° = top, clockwise
    // Math: 0° = right, counter-clockwise
    return ((compassAngle - 90) * Math.PI) / 180;
};

// ─── GATE LABEL COMPONENT ──────────────────────────────────────────────────────
function GateLabel({
    gate,
    config,
    isArmed,
    isHovered,
    isActive,
    labelRadius = 56, // % from center
}) {
    const isLight = useDisplayModeStore((s) => s.colorScheme === 'light');
    const radian = compassToRadians(config.angle);
    const x = 50 + Math.cos(radian) * labelRadius;
    const y = 50 + Math.sin(radian) * labelRadius;

    // Determine rotation to keep text readable
    // Labels at bottom should not be upside-down
    const isBottomHalf = config.angle > 90 && config.angle < 270;
    const textRotation = isBottomHalf ? config.angle + 180 : config.angle;

    return (
        <div
            className="absolute transition-all duration-300 ease-out pointer-events-none select-none"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                opacity: isArmed ? (isHovered ? 1 : 0.85) : 0.12,
                filter: isHovered ? 'brightness(1.2)' : 'none',
            }}
        >
            {/* Icon */}
            <div
                className="text-center mb-0.5"
                style={{
                    fontSize: '0.9rem',
                    color: isLight
                        ? (isHovered ? '#B8860B' : 'rgba(139, 119, 42, 0.9)')
                        : (isHovered ? '#fcd34d' : 'rgba(253, 224, 71, 0.8)'),
                    textShadow: isHovered
                        ? (isLight ? '0 0 8px rgba(184, 134, 11, 0.6)' : '0 0 12px rgba(253, 211, 77, 0.6)')
                        : 'none',
                    transition: 'all 0.2s ease-out',
                }}
            >
                {config.icon}
            </div>

            {/* Label Text */}
            <div
                style={{
                    fontSize: '0.6rem',
                    fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
                    fontVariant: 'small-caps',
                    letterSpacing: '0.08em',
                    color: isLight
                        ? (isHovered ? '#5C4A1F' : 'rgba(92, 74, 31, 0.85)')
                        : (isHovered ? 'rgba(253, 251, 245, 0.95)' : 'rgba(253, 251, 245, 0.7)'),
                    textShadow: isLight
                        ? '0 1px 2px rgba(255, 255, 255, 0.3)'
                        : '0 1px 3px rgba(0, 0, 0, 0.5)',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                }}
            >
                {config.label}
            </div>

            {/* Active indicator arc */}
            {isHovered && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 mt-1"
                    style={{
                        width: '20px',
                        height: '2px',
                        background: isLight
                            ? 'linear-gradient(90deg, transparent, #B8860B, transparent)'
                            : 'linear-gradient(90deg, transparent, #fcd34d, transparent)',
                        borderRadius: '1px',
                    }}
                />
            )}
        </div>
    );
}

// ─── HIT WEDGE COMPONENT ───────────────────────────────────────────────────────
// Invisible clickable area for each gate
function GateHitWedge({
    gate,
    config,
    isArmed,
    onHover,
    onSelect,
    wedgeRadius = 48, // % from center
    wedgeSize = 44,   // px minimum touch target
}) {
    const radian = compassToRadians(config.angle);
    const x = 50 + Math.cos(radian) * wedgeRadius;
    const y = 50 + Math.sin(radian) * wedgeRadius;

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isArmed) {
            console.log(`[HaloGate] Selected: ${gate} → ${config.route}`);
            onSelect?.(gate, config.route);
        }
    }, [gate, config.route, isArmed, onSelect]);

    const handleMouseEnter = useCallback(() => {
        if (isArmed) {
            onHover?.(gate);
        }
    }, [gate, isArmed, onHover]);

    const handleMouseLeave = useCallback(() => {
        onHover?.(null);
    }, [onHover]);

    return (
        <div
            className="absolute cursor-pointer"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${wedgeSize}px`,
                height: `${wedgeSize}px`,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                // Debug: uncomment to visualize hit areas
                // background: 'rgba(255, 0, 0, 0.2)',
                // border: '1px solid red',
                pointerEvents: isArmed ? 'auto' : 'none',
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={isArmed ? 0 : -1}
            aria-label={`Navigate to ${config.label}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e);
                }
            }}
        />
    );
}

// ─── MAIN HALO GATE COMPONENT ──────────────────────────────────────────────────
export function AvatarHaloGate({
    isArmed = false,
    onGateSelect,
    onHoveredGateChange,
    className = '',
}) {
    const [hoveredGate, setHoveredGate] = useState(null);

    const handleHover = useCallback((gate) => {
        setHoveredGate(gate);
        onHoveredGateChange?.(gate);
    }, [onHoveredGateChange]);

    const handleSelect = useCallback((gate, route) => {
        onGateSelect?.(gate, route);
    }, [onGateSelect]);

    return (
        <div
            className={`absolute inset-0 pointer-events-none ${className}`}
            style={{
                // Container spans the full avatar area
                // Children position themselves via percentage
            }}
        >
            {/* LAYER A: Gate Labels (z-250) — Always on top, never rotates */}
            <div
                className="absolute inset-0"
                style={{ zIndex: 250 }}
            >
                {Object.entries(GATE_CONFIG).map(([gate, config]) => (
                    <GateLabel
                        key={gate}
                        gate={gate}
                        config={config}
                        isArmed={isArmed}
                        isHovered={hoveredGate === gate}
                        isActive={false}
                    />
                ))}
            </div>

            {/* LAYER B: Gate Hit Wedges (z-240) — Invisible click targets */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 240 }}
            >
                {Object.entries(GATE_CONFIG).map(([gate, config]) => (
                    <GateHitWedge
                        key={gate}
                        gate={gate}
                        config={config}
                        isArmed={isArmed}
                        onHover={handleHover}
                        onSelect={handleSelect}
                    />
                ))}
            </div>

            {/* Optional: Radial glow band when armed (Phase 5 placeholder) */}
            {isArmed && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        zIndex: 230,
                        background: 'radial-gradient(circle, transparent 40%, rgba(253, 211, 77, 0.05) 50%, transparent 60%)',
                        animation: 'haloReveal 0.3s ease-out forwards',
                    }}
                />
            )}
        </div>
    );
}

// ─── CSS KEYFRAMES (add to Avatar.css) ─────────────────────────────────────────
/*
@keyframes haloReveal {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
*/

export default AvatarHaloGate;
