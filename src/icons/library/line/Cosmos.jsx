// Line style - Cosmos icon
import React from 'react';

export function Cosmos({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Central Star - Solid */}
            <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />

            {/* Inner Orbital - Primary (2px) */}
            <circle strokeWidth="2" cx="12" cy="12" r="6" strokeOpacity="0.8" />

            {/* Outer Orbital - Support (0.5px) */}
            <circle strokeWidth="0.5" cx="12" cy="12" r="10" strokeOpacity="0.3" />

            {/* Distant Stars - Support (0.5px or dots) */}
            <g opacity="0.5">
                <circle cx="6" cy="6" r="1" fill={color} stroke="none" />
                <circle cx="18" cy="8" r="0.5" fill={color} stroke="none" />
                <circle cx="16" cy="18" r="0.7" fill={color} stroke="none" />
            </g>
        </svg>
    );
}
