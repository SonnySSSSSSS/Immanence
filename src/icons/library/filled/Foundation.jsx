// Filled style - Foundation icon
import React from 'react';

export function Foundation({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            className={className}
        >
            {/* Stem */}
            <rect x="11" y="10" width="2" height="12" opacity="0.6" />
            {/* Left leaf */}
            <path d="M12 14c-5-5-9 0-9 0s0 5 5 5c2 0 4-1 4-1v-4z" opacity="0.5" />
            {/* Right leaf */}
            <path d="M12 9c5-5 9 0 9 0s0 5-5 5c-2 0-4-1-4-1V9z" opacity="0.7" />
            {/* Ground */}
            <rect x="5" y="21" width="14" height="2" />
        </svg>
    );
}
