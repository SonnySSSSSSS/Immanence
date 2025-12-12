// Glow style - Devotion icon
import React from 'react';

export function Devotion({ size = 24, color = 'currentColor', className = '' }) {
    const id = `devot-glow-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <radialGradient id={`${id}-aura`} cx="50%" cy="30%" r="60%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <ellipse cx="12" cy="12" rx="10" ry="12" fill={`url(#${id}-aura)`} />
            <path d="M7 10c0-3 2-5 5-5s5 2 5 5c0 4-5 9-5 9s-5-5-5-9z" fill={color} filter={`url(#${id}-glow)`} />
        </svg>
    );
}
