// Line style - Transition icon
import React from 'react';

export function Transition({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 12h16" />
            <path d="M12 4v16" />
            <circle cx="12" cy="12" r="3" />
            <path d="M4 4l4 4" strokeOpacity="0.5" />
            <path d="M16 16l4 4" strokeOpacity="0.5" />
            <path d="M4 20l4-4" strokeOpacity="0.5" />
            <path d="M16 8l4-4" strokeOpacity="0.5" />
        </svg>
    );
}
