// Filled style - Flow icon
import React from 'react';

export function Flow({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <path d="M3 4c4-3 6 3 10 0s6 3 8 0v6c-2 3-4-3-8 0s-6 3-10 0V4z" opacity="0.4" />
            <path d="M3 10c4-3 6 3 10 0s6 3 8 0v6c-2 3-4-3-8 0s-6 3-10 0v-6z" opacity="0.7" />
            <path d="M3 16c4-3 6 3 10 0s6 3 8 0v4c-2 3-4-3-8 0s-6 3-10 0v-4z" />
        </svg>
    );
}
