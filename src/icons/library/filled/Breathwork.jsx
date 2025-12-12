// Filled style - Breathwork icon
import React from 'react';

export function Breathwork({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            className={className}
        >
            {/* Three solid wave shapes */}
            <path d="M2 6c2-2 4-2 6 0s4 2 6 0 4-2 6 0v4c-2 2-4 2-6 0s-4-2-6 0-4 2-6 0V6z" opacity="0.3" />
            <path d="M2 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0v4c-2 2-4 2-6 0s-4-2-6 0-4 2-6 0v-4z" opacity="0.5" />
            <path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0v4c-2 2-4 2-6 0s-4-2-6 0-4 2-6 0v-4z" opacity="0.8" />
        </svg>
    );
}
