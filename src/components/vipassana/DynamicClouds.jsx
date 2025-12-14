// src/components/vipassana/DynamicClouds.jsx
// Soft cloud layer that appears after first thought - earns complexity

import React, { useState, useEffect } from 'react';

export function DynamicClouds({ isVisible, opacity = 0.08 }) {
    const [cloudOpacity, setCloudOpacity] = useState(0);

    useEffect(() => {
        if (isVisible) {
            // Fade in over 3 seconds
            const timer = setTimeout(() => {
                setCloudOpacity(opacity);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setCloudOpacity(0);
        }
    }, [isVisible, opacity]);

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                opacity: cloudOpacity,
                transition: 'opacity 3s ease-out',
            }}
        >
            {/* Soft cloud wisps - ultra-slow vertical drift */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
            radial-gradient(ellipse 40% 20% at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 35% 18% at 70% 45%, rgba(255, 255, 255, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse 30% 15% at 45% 60%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)
          `,
                    animation: 'cloudDrift 120s ease-in-out infinite',
                }}
            />

            <style>{`
        @keyframes cloudDrift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
        </div>
    );
}

export default DynamicClouds;
