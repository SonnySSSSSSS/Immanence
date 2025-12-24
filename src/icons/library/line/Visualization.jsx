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
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Outer eye shape - Support (0.5px) */}
            <path strokeWidth="0.5" opacity="0.4" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />

            {/* Inner iris circle - Primary (2px) */}
            <circle strokeWidth="2" cx="12" cy="12" r="3.5" />

            {/* Central pupil - Solid / No stroke */}
            <circle cx="12" cy="12" r="1" fill={color} stroke="none" />

            {/* Calibration dots around iris (0.5px) */}
            <g strokeWidth="0.5" opacity="0.5">
                <path d="M12 7.5v-1M12 17.5v-1M16.5 12h-1M7.5 12h-1" />
            </g>
        </svg>
    );
}
