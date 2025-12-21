// src/components/MoonGlowLayer.jsx
// Clean, simple 3-circle moon baseline
import React from 'react';

export function MoonGlowLayer({ progress = 0, centerX, centerY, orbitRadius }) {
    // Position on orbit
    const isDormant = progress === 0;
    const angle = (progress / 12) * Math.PI * 2 - Math.PI / 2;
    const moonX = centerX + Math.cos(angle) * orbitRadius;
    const moonY = centerY + Math.sin(angle) * orbitRadius;

    return (
        <g transform={`translate(${moonX} ${moonY})`}>
            {/* soft outer aura */}
            {!isDormant && (
                <circle
                    r={32}
                    fill="rgba(255, 220, 140, 0.16)"
                    style={{ filter: "blur(12px)" }}
                />
            )}

            {/* mid halo */}
            {!isDormant && (
                <circle
                    r={20}
                    fill="rgba(255, 220, 140, 0.35)"
                    style={{ filter: "blur(6px)" }}
                />
            )}

            {/* bright core */}
            <circle
                r={9}
                fill={isDormant ? "rgba(255, 236, 192, 0.15)" : "#FFECC0"}
                stroke={isDormant ? "rgba(247, 195, 95, 0.2)" : "#F7C35F"}
                strokeWidth={1.4}
            />
        </g>
    );
}
