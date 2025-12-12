// Line style - Visualization icon (geometric eye / mandala)
import React from 'react';

export function Visualization({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Outer eye shape */}
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
            {/* Inner circle (iris) */}
            <circle cx="12" cy="12" r="3" />
            {/* Central dot (pupil) */}
            <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
        </svg>
    );
}
