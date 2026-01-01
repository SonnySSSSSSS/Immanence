// src/components/avatar/RadiantHalo.jsx
// Image-based radiant star halo with high-quality pre-rendered asset
// Professional quality - renders behind the rune ring in light mode

import React from 'react';

export function RadiantHalo({ size = 440 }) {
    // We use the pre-rendered PNG from public/assets/radiant_halo.png
    const assetPath = `${import.meta.env.BASE_URL}assets/radiant_halo.png`;

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
                    filter: 'contrast(1.1) brightness(1.05)',
                }}
            />

            <style>{`
                @keyframes radiant-shimmer {
                    0%, 100% { 
                        opacity: 0.75; 
                        transform: scale(1.0);
                        filter: contrast(1.1) brightness(1.05);
                    }
                    50% { 
                        opacity: 1.0; 
                        transform: scale(1.04);
                        filter: contrast(1.15) brightness(1.1);
                    }
                }
            `}</style>
        </div>
    );
}

export default RadiantHalo;
