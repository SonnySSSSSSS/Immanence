// Line style - Flow icon
import React from 'react';

export function Flow({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 6c4-3 6 3 10 0s6 3 8 0" />
            <path d="M3 12c4-3 6 3 10 0s6 3 8 0" />
            <path d="M3 18c4-3 6 3 10 0s6 3 8 0" />
        </svg>
    );
}
