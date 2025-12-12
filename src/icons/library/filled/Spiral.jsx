// Filled style - Spiral icon
import React from 'react';

export function Spiral({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" className={className}>
            <path d="M12 12c0-1 1-2 2-2s2 1 2 2c0 2-2 4-4 4s-5-2-5-5c0-4 4-7 7-7s8 4 8 8c0 5-5 10-10 10" />
        </svg>
    );
}
