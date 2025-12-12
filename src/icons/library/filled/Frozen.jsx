// Filled style - Frozen icon
import React from 'react';

export function Frozen({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <rect x="11" y="2" width="2" height="20" />
            <rect x="2" y="11" width="20" height="2" />
            <rect x="11" y="2" width="2" height="20" transform="rotate(45 12 12)" opacity="0.6" />
            <rect x="11" y="2" width="2" height="20" transform="rotate(-45 12 12)" opacity="0.6" />
        </svg>
    );
}
