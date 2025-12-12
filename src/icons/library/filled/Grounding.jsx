// Filled style - Grounding icon
import React from 'react';

export function Grounding({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <circle cx="12" cy="12" r="10" opacity="0.3" />
            <circle cx="12" cy="12" r="6" opacity="0.6" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
