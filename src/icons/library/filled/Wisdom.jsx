// Filled style - Wisdom icon
import React from 'react';

export function Wisdom({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            className={className}
        >
            {/* Left page */}
            <path d="M2 4v14c0 1 1 2 2 2h6c1 0 2-1 2-1V5c-2 0-5 0-6 1s-3 2-4 2V4z" opacity="0.5" />
            {/* Right page */}
            <path d="M22 4v14c0 1-1 2-2 2h-6c-1 0-2-1-2-1V5c2 0 5 0 6 1s3 2 4 2V4z" opacity="0.7" />
            {/* Center spine */}
            <rect x="11" y="5" width="2" height="14" opacity="0.9" />
        </svg>
    );
}
