// Glow style - Flow icon
import React, { useId } from 'react';

export function Flow({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="50%" stopColor={color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.3" />
                </linearGradient>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}-glow)`} fill="none" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6c4-3 6 3 10 0s6 3 8 0" stroke={`url(#${id}-grad)`} />
                <path d="M3 12c4-3 6 3 10 0s6 3 8 0" stroke={color} />
                <path d="M3 18c4-3 6 3 10 0s6 3 8 0" stroke={`url(#${id}-grad)`} />
            </g>
        </svg>
    );
}
