// Line style - Foundation icon (seedling / sprout)
import React from 'react';

export function Foundation({ size = 24, color = 'currentColor', className = '' }) {
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
            {/* Stem - Primary (2px) */}
            <path strokeWidth="2" d="M12 22V10" />

            {/* Leaves - Support (0.5px) */}
            <g strokeWidth="0.5" opacity="0.6">
                <path d="M12 13c-4-4-8 0-8 0s0 4 4 4" />
                <path d="M12 8c4-4 8 0 8 0s0 4-4 4" />
            </g>

            {/* Ground line - Support (0.5px) */}
            <path strokeWidth="0.5" opacity="0.3" d="M6 22h12" />
        </svg>
    );
}
