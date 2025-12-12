// Glow style - Frozen icon
import React from 'react';

export function Frozen({ size = 24, color = 'currentColor', className = '' }) {
    const id = `frozen-glow-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}-glow)`} stroke={color} strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 2v20M2 12h20" />
                <path d="M4.5 4.5l15 15M4.5 19.5l15-15" strokeOpacity="0.6" />
                <path d="M12 6l-2-2M12 6l2-2M12 18l-2 2M12 18l2 2" />
            </g>
        </svg>
    );
}
