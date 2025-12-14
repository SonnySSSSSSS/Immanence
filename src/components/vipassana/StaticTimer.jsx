// src/components/vipassana/StaticTimer.jsx
// Non-animated timer display for Vipassana - MM:SS only, no urgency

import React from 'react';

export function StaticTimer({ elapsedSeconds = 0, opacity = 0.35 }) {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ opacity }}
        >
            {/* Subtle luminance bowl - barely perceptible softening */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle, rgba(0, 0, 0, 0.15) 0%, transparent 70%)',
                }}
            />

            {/* Timer circle - static, no animation */}
            <div
                className="relative flex items-center justify-center"
                style={{
                    width: '120px',
                    height: '120px',
                }}
            >
                {/* Outer ring */}
                <svg
                    className="absolute inset-0"
                    viewBox="0 0 120 120"
                >
                    <circle
                        cx="60"
                        cy="60"
                        r="56"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                    />
                </svg>

                {/* Time display */}
                <div
                    className="text-2xl tracking-[0.15em]"
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        color: 'rgba(255, 255, 255, 0.6)',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    {timeString}
                </div>
            </div>
        </div>
    );
}

export default StaticTimer;
