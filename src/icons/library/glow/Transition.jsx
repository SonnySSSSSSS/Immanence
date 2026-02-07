// Glow style - Transition icon
import React, { useId } from 'react';

export function Transition({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <radialGradient id={`${id}-aura`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <circle cx="12" cy="12" r="11" fill={`url(#${id}-aura)`} />
            <g filter={`url(#${id}-glow)`} fill="none" stroke={color} strokeWidth="1.5">
                <path d="M4 12h16M12 4v16" />
                <circle cx="12" cy="12" r="3" />
            </g>
        </svg>
    );
}
