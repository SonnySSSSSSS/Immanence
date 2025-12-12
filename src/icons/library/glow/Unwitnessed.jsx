// Glow style - Unwitnessed icon
import React from 'react';

export function Unwitnessed({ size = 24, color = 'currentColor', className = '' }) {
    const id = `unwit-glow-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}-glow)`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
                <path d="M1 1l22 22" strokeWidth="2" />
            </g>
        </svg>
    );
}
