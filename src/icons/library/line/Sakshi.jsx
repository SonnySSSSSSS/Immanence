// Line style - Sakshi icon (witness eye / circle)
import React from 'react';

export function Sakshi({ size = 24, color = 'currentColor', className = '' }) {
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
            {/* Outer awareness circle */}
            <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
            {/* Middle circle */}
            <circle cx="12" cy="12" r="5" strokeOpacity="0.7" />
            {/* Inner witness point */}
            <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
        </svg>
    );
}
