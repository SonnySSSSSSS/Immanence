// Glow style - Vipassana icon
import React from 'react';

export function Vipassana({ size = 24, color = 'currentColor', className = '' }) {
    const id = `vipassana-glow-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="50%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.3" />
                </linearGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <g filter={`url(#${id}-glow)`} fill="none" strokeWidth="2" strokeLinecap="round">
                <path d="M2 6c3-2 5 2 8 0s5-2 8 0 4 2 4 0" stroke={`url(#${id}-grad)`} />
                <path d="M2 12c3-2 5 2 8 0s5-2 8 0 4 2 4 0" stroke={color} />
                <path d="M2 18c3-2 5 2 8 0s5-2 8 0 4 2 4 0" stroke={`url(#${id}-grad)`} />
            </g>
        </svg>
    );
}
