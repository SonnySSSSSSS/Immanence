// Line style - Wisdom icon (open book / scroll)
import React from 'react';

export function Wisdom({ size = 24, color = 'currentColor', className = '' }) {
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
            {/* Open book shape */}
            <path d="M2 4v14c0 1 1 2 2 2h6c1 0 2-1 2-1s1 1 2 1h6c1 0 2-1 2-2V4" />
            {/* Center spine */}
            <path d="M12 5v14" />
            {/* Left page curve */}
            <path d="M2 4c1 0 4 0 5 1s3 2 5 2" />
            {/* Right page curve */}
            <path d="M22 4c-1 0-4 0-5 1s-3 2-5 2" />
        </svg>
    );
}
