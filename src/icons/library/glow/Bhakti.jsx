// Glow style - Bhakti icon
import React from 'react';

export function Bhakti({ size = 24, color = 'currentColor', className = '' }) {
    const id = `bhakti-glow-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <radialGradient id={`${id}-aura`} cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <ellipse cx="12" cy="12" rx="10" ry="10" fill={`url(#${id}-aura)`} />
            <path
                d="M12 21c-1-1-8-5-8-11 0-3 2-5 4.5-5 1.5 0 2.8.8 3.5 2 .7-1.2 2-2 3.5-2 2.5 0 4.5 2 4.5 5 0 6-7 10-8 11z"
                fill={color}
                filter={`url(#${id}-glow)`}
            />
        </svg>
    );
}
