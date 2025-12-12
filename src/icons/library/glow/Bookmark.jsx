// Glow style - Bookmark icon
import React from 'react';

export function Bookmark({ size = 24, color = 'currentColor', className = '' }) {
    const id = `book-glow-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V4z" fill={color} filter={`url(#${id}-glow)`} />
        </svg>
    );
}
