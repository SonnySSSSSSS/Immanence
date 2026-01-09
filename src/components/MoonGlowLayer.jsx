// src/components/MoonGlowLayer.jsx
// Clean, simple 3-circle moon baseline
import React from 'react';

export function MoonGlowLayer({ progress = 0, centerX = 300, centerY = 300, orbitRadius = 200 }) {
    // Ensure all values are finite numbers
    const safeProgress = Number.isFinite(progress) ? progress : 0;
    const safeCenterX = Number.isFinite(centerX) ? centerX : 300;
    const safeCenterY = Number.isFinite(centerY) ? centerY : 300;
    const safeOrbitRadius = Number.isFinite(orbitRadius) ? orbitRadius : 200;

    // Position on orbit
    const isDormant = safeProgress === 0;
    const angle = (safeProgress / 12) * Math.PI * 2 - Math.PI / 2;
    const moonX = safeCenterX + Math.cos(angle) * safeOrbitRadius;
    const moonY = safeCenterY + Math.sin(angle) * safeOrbitRadius;

    // Final safety check - if somehow still NaN, use center position
    const finalMoonX = Number.isFinite(moonX) ? moonX : safeCenterX;
    const finalMoonY = Number.isFinite(moonY) ? moonY : safeCenterY;

    return (
        <g transform={`translate(${finalMoonX} ${finalMoonY})`}>
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
