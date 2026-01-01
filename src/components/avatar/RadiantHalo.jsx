// src/components/avatar/RadiantHalo.jsx
// Image-based radiant star halo with high-quality pre-rendered asset
// Professional quality - renders behind the rune ring in light mode
// Stage-adaptive with hue rotation based on stage colors

import React from 'react';

// Stage-specific hue rotations (degrees)
const STAGE_HUE_SHIFTS = {
    seedling: 120,  // Shift towards green
    ember: -30,     // Shift towards orange/red
    flame: 0,       // Original golden/yellow
    beacon: 180,    // Shift towards cyan
    stellar: 240,   // Shift towards purple/violet
};

export function RadiantHalo({ size = 440, stage = 'flame' }) {
    // We use the pre-rendered PNG from public/assets/radiant_halo.png
    const assetPath = `${import.meta.env.BASE_URL}assets/radiant_halo.png`;

    // Get the hue shift for this stage
    const hueShift = STAGE_HUE_SHIFTS[stage.toLowerCase()] || 0;

    return (
        <div
            className="absolute pointer-events-none overflow-visible"
            style={{
                width: size,
                height: size,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
            }}
        >
            <img
                src={assetPath}
                alt="Radiant Star Halo"
                className="w-full h-full object-contain"
                style={{
                    animation: 'radiant-shimmer 12s ease-in-out infinite',
                    opacity: 0.85,
                    filter: `hue-rotate(${hueShift}deg) contrast(1.1) brightness(1.05)`,
                }}
            />

            <style>{`
                @keyframes radiant-shimmer {
                    0%, 100% { 
                        opacity: 0.75; 
                        transform: scale(1.0);
                    }
                    50% { 
                        opacity: 1.0; 
                        transform: scale(1.04);
                    }
                }
            `}</style>
        </div>
    );
}

export default RadiantHalo;
