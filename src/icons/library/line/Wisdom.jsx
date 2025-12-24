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
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Open book shape - Primary (2px) */}
            <path strokeWidth="2" d="M2 4v14c0 1 1 2 2 2h6c1 0 2-1 2-1s1 1 2 1h6c1 0 2-1 2-2V4" />

            {/* Center spine - Support (0.5px) */}
            <path strokeWidth="0.5" d="M12 5v14" />

            {/* Page curves - Support (0.5px) */}
            <g strokeWidth="0.5" opacity="0.6">
                <path d="M2 4c1 0 4 0 5 1s3 2 5 2" />
                <path d="M22 4c-1 0-4 0-5 1s-3 2-5 2" />
                {/* Decorative text lines */}
                <path d="M4 8h5M4 11h4M15 8h5M16 11h4" />
            </g>
        </svg>
    );
}
