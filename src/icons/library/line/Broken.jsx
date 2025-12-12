// Line style - Broken icon (broken heart)
import React from 'react';

export function Broken({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 21s-8-5-8-11c0-3 2-5 4.5-5 1.5 0 2.8.8 3.5 2" />
            <path d="M12 21s8-5 8-11c0-3-2-5-4.5-5-1.5 0-2.8.8-3.5 2" />
            <path d="M12 8l-2 4 4-2-2 5" />
        </svg>
    );
}
