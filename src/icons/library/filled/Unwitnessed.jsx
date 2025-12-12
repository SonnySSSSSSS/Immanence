// Filled style - Unwitnessed icon
import React from 'react';

export function Unwitnessed({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" opacity="0.3" />
            <circle cx="12" cy="12" r="3" opacity="0.5" />
            <rect x="2" y="11" width="20" height="2" transform="rotate(45 12 12)" />
        </svg>
    );
}
