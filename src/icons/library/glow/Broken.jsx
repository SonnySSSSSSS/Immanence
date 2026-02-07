// Glow style - Broken icon
import React, { useId } from 'react';

export function Broken({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}-glow)`} fill="none" stroke={color} strokeWidth="1.5">
                <path d="M12 21s-8-5-8-11c0-3 2-5 4.5-5 1.5 0 2.8.8 3.5 2" />
                <path d="M12 21s8-5 8-11c0-3-2-5-4.5-5-1.5 0-2.8.8-3.5 2" />
                <path d="M12 8l-2 4 4-2-2 5" strokeLinecap="round" />
            </g>
        </svg>
    );
}
