// Filled style - Vipassana icon
import React from 'react';

export function Vipassana({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            className={className}
        >
            {/* Flowing wave shapes */}
            <path d="M2 4c3-2 5 2 8 0s5-2 8 0 4 2 4 0v4c0 2-1 2-4 0s-5-2-8 0-5 2-8 0V4z" opacity="0.3" />
            <path d="M2 10c3-2 5 2 8 0s5-2 8 0 4 2 4 0v4c0 2-1 2-4 0s-5-2-8 0-5 2-8 0v-4z" opacity="0.5" />
            <path d="M2 16c3-2 5 2 8 0s5-2 8 0 4 2 4 0v4c0 2-1 2-4 0s-5-2-8 0-5 2-8 0v-4z" opacity="0.7" />
        </svg>
    );
}
