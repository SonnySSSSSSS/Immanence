// Glow style - Milestone icon
import React, { useId } from 'react';

export function Milestone({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
            <defs>
                <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="1.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" fill={color} filter={`url(#${id}-glow)`} />
        </svg>
    );
}
