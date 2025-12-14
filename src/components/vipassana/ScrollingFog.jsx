// src/components/vipassana/ScrollingFog.jsx
// Horizontal fog band in lower third - mirrors thought density without moralizing

import React from 'react';

export function ScrollingFog({ thoughtDensity = 0 }) {
    // Density: 0-1 scale based on active thought count
    // Affects opacity modulation, not speed
    const baseOpacity = 0.15;
    const densityOpacity = Math.min(baseOpacity + (thoughtDensity * 0.1), 0.3);

    return (
        <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
                height: '33%', // lower third
                opacity: densityOpacity,
                transition: 'opacity 2s ease-out',
            }}
        >
            {/* Scrolling fog band - left to right */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
            linear-gradient(90deg,
              transparent 0%,
              rgba(200, 200, 220, 0.4) 15%,
              rgba(180, 180, 200, 0.5) 30%,
              rgba(200, 200, 220, 0.4) 45%,
              transparent 60%,
              rgba(200, 200, 220, 0.3) 75%,
              transparent 100%
            )
          `,
                    backgroundSize: '200% 100%',
                    animation: 'fogScroll 180s linear infinite',
                }}
            />

            {/* Gradient fade to transparent at top */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 100%)',
                }}
            />

            <style>{`
        @keyframes fogScroll {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 0%; }
        }
      `}</style>
        </div>
    );
}

export default ScrollingFog;
