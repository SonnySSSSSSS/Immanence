// Glow style - Visualization icon
import React from 'react';

export function Visualization({ size = 24, color = 'currentColor', className = '' }) {
    const id = `viz-glow-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <radialGradient id={`${id}-iris`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="1" />
                    <stop offset="70%" stopColor={color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                </radialGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <g filter={`url(#${id}-glow)`}>
                {/* Eye outline */}
                <path
                    d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                />
                {/* Iris glow */}
                <circle cx="12" cy="12" r="4" fill={`url(#${id}-iris)`} />
                {/* Bright pupil */}
                <circle cx="12" cy="12" r="1.5" fill={color} />
            </g>
        </svg>
    );
}
