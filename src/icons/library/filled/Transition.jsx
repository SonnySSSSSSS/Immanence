// Filled style - Transition icon
import React from 'react';

export function Transition({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <circle cx="12" cy="12" r="10" opacity="0.2" />
            <rect x="11" y="2" width="2" height="20" opacity="0.5" />
            <rect x="2" y="11" width="20" height="2" opacity="0.5" />
            <circle cx="12" cy="12" r="4" />
        </svg>
    );
}
