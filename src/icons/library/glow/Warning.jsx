// Glow style - Warning icon
import React from 'react';

export function Warning({ size = 24, color = 'currentColor', className = '' }) {
    const id = `warn-glow-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}-glow)`}>
                <path d="M12 3L2 21h20L12 3z" fill="none" stroke={color} strokeWidth="1.5" />
                <path d="M12 10v4" stroke={color} strokeWidth="2" />
                <circle cx="12" cy="17" r="1" fill={color} />
            </g>
        </svg>
    );
}
