// Line style - Cosmos icon
import React from 'react';

export function Cosmos({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
            <circle cx="12" cy="12" r="6" strokeOpacity="0.6" />
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
            <circle cx="6" cy="6" r="1" fill={color} stroke="none" opacity="0.5" />
            <circle cx="18" cy="8" r="0.5" fill={color} stroke="none" opacity="0.4" />
            <circle cx="16" cy="18" r="0.7" fill={color} stroke="none" opacity="0.5" />
        </svg>
    );
}
