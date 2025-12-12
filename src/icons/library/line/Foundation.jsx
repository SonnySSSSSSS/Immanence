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
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Stem */}
            <path d="M12 22V10" />
            {/* Left leaf */}
            <path d="M12 13c-4-4-8 0-8 0s0 4 4 4" />
            {/* Right leaf */}
            <path d="M12 8c4-4 8 0 8 0s0 4-4 4" />
            {/* Ground line */}
            <path d="M6 22h12" />
        </svg>
    );
}
