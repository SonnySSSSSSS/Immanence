// Line style - Heart icon
import React from 'react';

export function Heart({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 21c-1-1-8-5-8-11 0-3 2-5 4.5-5 1.5 0 2.8.8 3.5 2 .7-1.2 2-2 3.5-2 2.5 0 4.5 2 4.5 5 0 6-7 10-8 11z" />
        </svg>
    );
}
