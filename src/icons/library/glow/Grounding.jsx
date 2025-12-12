// Glow style - Grounding icon
import React from 'react';

export function Grounding({ size = 24, color = 'currentColor', className = '' }) {
    const id = `ground-glow-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <radialGradient id={`${id}-aura`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <circle cx="12" cy="12" r="11" fill={`url(#${id}-aura)`} />
            <g filter={`url(#${id}-glow)`} fill="none" stroke={color} strokeWidth="1.5">
                <circle cx="12" cy="12" r="8" strokeOpacity="0.4" />
                <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
            </g>
            <circle cx="12" cy="12" r="2" fill={color} filter={`url(#${id}-glow)`} />
        </svg>
    );
}
