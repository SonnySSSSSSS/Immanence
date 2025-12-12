// src/components/CosmicCard.jsx
// Reusable card component with cosmic depth, warmth, and glow

import React from 'react';

/**
 * CosmicCard — A card that sits *in* the cosmos, not above it
 * 
 * Features:
 * - Warm violet background (#150b16)
 * - Gradient border (ember → purple)
 * - Inner glow effect
 * - Warm drop shadow
 * - Soft text shadows for lift
 */
export function CosmicCard({
    children,
    className = '',
    glowColor = 'var(--accent-glow)',
    padding = 'p-5',
    radius = 'rounded-3xl'
}) {
    return (
        <div
            className={`relative ${radius} ${padding} ${className}`}
            style={{
                background: 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                border: '1px solid transparent',
                backgroundImage: `
          linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
          linear-gradient(135deg, ${glowColor}40 0%, rgba(138, 43, 226, 0.2) 50%, ${glowColor}30 100%)
        `,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.6),
          0 2px 8px ${glowColor}15,
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          inset 0 -3px 12px rgba(0, 0, 0, 0.4)
        `,
            }}
        >
            {/* Inner glow layer */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 50% 0%, ${glowColor}12 0%, transparent 60%)`,
                    borderRadius: 'inherit',
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
