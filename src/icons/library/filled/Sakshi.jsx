// Filled style - Sakshi icon
import React from 'react';

export function Sakshi({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            className={className}
        >
            {/* Outer awareness circle */}
            <circle cx="12" cy="12" r="10" opacity="0.2" />
            {/* Middle circle */}
            <circle cx="12" cy="12" r="6" opacity="0.5" />
            {/* Inner witness point */}
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}
