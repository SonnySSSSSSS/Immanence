// Glow style - StreakActive icon
import React, { useId } from 'react';

export function StreakActive({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <linearGradient id={`${id}-grad`} x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="1" />
                </linearGradient>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <path d="M12 22c-4 0-7-3-7-7 0-3 2-5 3-7 0 2 1 3 3 3 0-4 2-9 4-9 0 5 4 6 4 10 0 4-3 10-7 10z" fill={`url(#${id}-grad)`} filter={`url(#${id}-glow)`} />
        </svg>
    );
}
