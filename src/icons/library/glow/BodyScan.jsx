// Glow style - BodyScan icon
import React from 'react';

export function BodyScan({ size = 24, color = 'currentColor', className = '' }) {
    const id = `bodyscan-glow-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <radialGradient id={`${id}-aura`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <circle cx="12" cy="12" r="10" fill={`url(#${id}-aura)`} />
            <g filter={`url(#${id}-glow)`} fill="none" stroke={color} strokeWidth="1.5">
                <circle cx="12" cy="4" r="2" />
                <path d="M12 8v6" />
                <path d="M9 18l3-4 3 4" />
                <path d="M4 10c1 0 2 1 2 2s-1 2-2 2" strokeOpacity="0.6" />
                <path d="M20 10c-1 0-2 1-2 2s1 2 2 2" strokeOpacity="0.6" />
            </g>
        </svg>
    );
}
