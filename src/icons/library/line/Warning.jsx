// Line style - Warning icon
import React from 'react';

export function Warning({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 3L2 21h20L12 3z" />
            <path d="M12 10v4" />
            <circle cx="12" cy="17" r="1" fill={color} stroke="none" />
        </svg>
    );
}
