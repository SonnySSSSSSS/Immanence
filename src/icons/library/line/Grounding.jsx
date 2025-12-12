// Line style - Grounding icon
import React from 'react';

export function Grounding({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4v4" />
            <path d="M12 16v4" />
            <path d="M4 12h4" />
            <path d="M16 12h4" />
            <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
        </svg>
    );
}
