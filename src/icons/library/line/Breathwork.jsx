// Line style - Breathwork icon (flowing wave pattern)
import React from 'react';

export function Breathwork({ size = 24, color = 'currentColor', className = '' }) {
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
            {/* Upper and lower waves - Support (0.5px) */}
            <g strokeWidth="0.5" opacity="0.4">
                <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
                <path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
            </g>

            {/* Central wave - Primary (2px) */}
            <path strokeWidth="2" d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        </svg>
    );
}
