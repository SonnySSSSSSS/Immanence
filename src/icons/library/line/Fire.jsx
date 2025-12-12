// Line style - Fire icon 
import React from 'react';

export function Fire({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22c-4 0-7-3-7-7 0-3 2-5 3-7 0 2 1 3 3 3 0-4 2-9 4-9 0 5 4 6 4 10 0 4-3 10-7 10z" />
            <path d="M12 22c-2 0-3-2-3-4 0-2 1-3 2-4 0 1 1 2 2 2 0-2 1-4 2-4 0 2 1 3 1 5 0 3-2 5-4 5z" />
        </svg>
    );
}
