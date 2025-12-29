// src/components/vipassana/VipassanaVisual.jsx
// Visual component for Vipassana meditation practice

import React from 'react';

export function VipassanaVisual({
    isActive = false,
    phase = 'idle',
    intensity = 0,
}) {
    return (
        <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
            {/* Vipassana visualization - body scan indicator */}
            <div
                className="w-24 h-48 rounded-full"
                style={{
                    background: `radial-gradient(ellipse at center, 
            rgba(139, 92, 246, ${0.1 + intensity * 0.2}) 0%, 
            transparent 70%)`,
                    filter: 'blur(20px)',
                    animation: isActive ? 'breathingPulse 4s ease-in-out infinite' : 'none',
                }}
            />
        </div>
    );
}

export default VipassanaVisual;
