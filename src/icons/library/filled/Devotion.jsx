// Filled style - Devotion icon
import React from 'react';

export function Devotion({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <path d="M7 10c0-3 2-5 5-5s5 2 5 5c0 4-5 9-5 9s-5-5-5-9z" />
            <rect x="11" y="2" width="2" height="4" opacity="0.5" />
        </svg>
    );
}
