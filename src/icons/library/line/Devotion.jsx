// Line style - Devotion icon
import React from 'react';

export function Devotion({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 4v2" />
            <path d="M12 18v2" />
            <path d="M8 6l1 1" strokeOpacity="0.6" />
            <path d="M15 17l1 1" strokeOpacity="0.6" />
            <path d="M16 6l-1 1" strokeOpacity="0.6" />
            <path d="M9 17l-1 1" strokeOpacity="0.6" />
            <path d="M7 10c0-3 2-5 5-5s5 2 5 5c0 4-5 9-5 9s-5-5-5-9z" />
        </svg>
    );
}
