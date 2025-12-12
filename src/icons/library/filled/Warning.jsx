// Filled style - Warning icon
import React from 'react';

export function Warning({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <path d="M12 3L2 21h20L12 3z" />
            <rect x="11" y="10" width="2" height="4" fill="#0a0a12" />
            <circle cx="12" cy="17" r="1" fill="#0a0a12" />
        </svg>
    );
}
