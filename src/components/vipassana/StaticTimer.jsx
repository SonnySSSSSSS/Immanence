// src/components/vipassana/StaticTimer.jsx
// Non-animated timer display for Vipassana - MM:SS only, no urgency

import React from 'react';

export function StaticTimer({ elapsedSeconds = 0, opacity = 0.75 }) {
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
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1.5"
                    />
                    {/* Pulsing inner glow */}
                    <circle
                        cx="60"
                        cy="60"
                        r="56"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1"
                        style={{
                            animation: 'timerPulse 4s ease-in-out infinite',
                            filter: 'blur(2px)',
                        }}
                    />
                </svg>

                {/* Time display */}
                <div
                    className="text-2xl tracking-[0.15em]"
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        color: 'rgba(255, 255, 255, 0.85)',
                        textShadow: '0 2px 12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.1)',
                    }}
                >
                    {timeString}
                </div>
            </div>
        </div>
    );
}

export default StaticTimer;

// CSS for timer pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes timerPulse {
        0%, 100% {
            opacity: 0.2;
            transform: scale(1);
        }
        50% {
            opacity: 0.4;
            transform: scale(1.02);
        }
    }
`;
if (typeof document !== 'undefined' && !document.getElementById('vipassana-timer-styles')) {
    style.id = 'vipassana-timer-styles';
    document.head.appendChild(style);
}
