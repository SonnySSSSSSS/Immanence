// Glow style - Spiral icon
import React, { useId } from 'react';

export function Spiral({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <path d="M12 12c0-1 1-2 2-2s2 1 2 2c0 2-2 4-4 4s-5-2-5-5c0-4 4-7 7-7s8 4 8 8c0 5-5 10-10 10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" filter={`url(#${id}-glow)`} />
        </svg>
    );
}
