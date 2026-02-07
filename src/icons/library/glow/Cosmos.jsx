// Glow style - Cosmos icon
import React, { useId } from 'react';

export function Cosmos({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <radialGradient id={`${id}-aura`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                    <stop offset="60%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <circle cx="12" cy="12" r="11" fill={`url(#${id}-aura)`} />
            <g filter={`url(#${id}-glow)`}>
                <circle cx="12" cy="12" r="3" fill={color} />
                <circle cx="6" cy="6" r="1.5" fill={color} opacity="0.7" />
                <circle cx="18" cy="8" r="1" fill={color} opacity="0.6" />
                <circle cx="16" cy="18" r="1.2" fill={color} opacity="0.7" />
                <circle cx="5" cy="16" r="0.8" fill={color} opacity="0.5" />
            </g>
        </svg>
    );
}
