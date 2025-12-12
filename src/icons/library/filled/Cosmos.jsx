// Filled style - Cosmos icon
import React from 'react';

export function Cosmos({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <circle cx="12" cy="12" r="10" opacity="0.15" />
            <circle cx="12" cy="12" r="6" opacity="0.3" />
            <circle cx="12" cy="12" r="3" />
            <circle cx="6" cy="6" r="1.5" opacity="0.6" />
            <circle cx="18" cy="8" r="1" opacity="0.5" />
            <circle cx="16" cy="18" r="1.2" opacity="0.6" />
            <circle cx="5" cy="16" r="0.8" opacity="0.4" />
        </svg>
    );
}
