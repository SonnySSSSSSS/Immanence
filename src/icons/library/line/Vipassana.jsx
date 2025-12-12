// Line style - Vipassana icon (flowing water / observation)
import React from 'react';

export function Vipassana({ size = 24, color = 'currentColor', className = '' }) {
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
            {/* Flowing wave lines representing mental stream */}
            <path d="M2 6c3-2 5 2 8 0s5-2 8 0 4 2 4 0" />
            <path d="M2 12c3-2 5 2 8 0s5-2 8 0 4 2 4 0" />
            <path d="M2 18c3-2 5 2 8 0s5-2 8 0 4 2 4 0" />
        </svg>
    );
}
