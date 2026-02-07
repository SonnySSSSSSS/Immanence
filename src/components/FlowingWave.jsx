// src/components/FlowingWave.jsx
// Animated SVG wave component for decorative flowing line effects

import React from 'react';

/**
 * FlowingWave - Animated SVG wave decoration
 * Creates smooth, flowing curves that animate horizontally
 * 
 * @param {string} color - Wave stroke color (default: uses CSS variable)
 * @param {number} opacity - Wave opacity (default: 0.3)
 * @param {boolean} animate - Whether to animate the wave (default: true)
 */
function FlowingWave({
    color = 'var(--accent-color)',
    opacity = 0.3,
    animate = true
}) {
    return (
        <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ opacity }}
        >
            <svg
                viewBox="0 0 1200 200"
                preserveAspectRatio="none"
                className="absolute w-[200%] h-full"
                style={{
                    animation: animate ? 'waveFlow 20s ease-in-out infinite' : 'none',
                    left: '-50%',
                }}
            >
                <defs>
                    {/* Gradient for luminous glow effect */}
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0" />
                        <stop offset="20%" stopColor={color} stopOpacity="0.8" />
                        <stop offset="50%" stopColor="rgba(255, 255, 255, 0.9)" />
                        <stop offset="80%" stopColor={color} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="waveGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Primary wave - smooth flowing curve */}
                <path
                    d="M0,100 C150,60 300,140 450,100 C600,60 750,140 900,100 C1050,60 1200,140 1200,100"
                    fill="none"
                    stroke="url(#waveGradient)"
                    strokeWidth="2"
                    filter="url(#waveGlow)"
                    style={{
                        opacity: 0.8,
                    }}
                />

                {/* Secondary wave - offset for depth */}
                <path
                    d="M0,120 C200,80 400,160 600,120 C800,80 1000,160 1200,120"
                    fill="none"
                    stroke="url(#waveGradient)"
                    strokeWidth="1.5"
                    filter="url(#waveGlow)"
                    style={{
                        opacity: 0.5,
                    }}
                />

                {/* Tertiary wave - subtle background layer */}
                <path
                    d="M0,80 C250,120 500,40 750,80 C1000,120 1200,40 1200,80"
                    fill="none"
                    stroke="url(#waveGradient)"
                    strokeWidth="1"
                    filter="url(#waveGlow)"
                    style={{
                        opacity: 0.3,
                    }}
                />
            </svg>

            {/* CSS animation keyframes injected via style tag */}
            <style>{`
        @keyframes waveFlow {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(25%);
          }
        }
      `}</style>
        </div>
    );
}

export { FlowingWave };
