// Glow style - Copy icon
import React from 'react';

export function Copy({ size = 24, color = 'currentColor', className = '' }) {
    const id = `copy-glow-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}-glow)`} fill="none" stroke={color} strokeWidth="1.5">
                <rect x="8" y="8" width="12" height="12" rx="2" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </g>
        </svg>
    );
}
