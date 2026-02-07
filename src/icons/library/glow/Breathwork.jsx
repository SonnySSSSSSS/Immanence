// Glow style - Breathwork icon
import React, { useId } from 'react';

export function Breathwork({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="50%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                </linearGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <g filter={`url(#${id}-glow)`}>
                <path
                    d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
                    fill="none"
                    stroke={`url(#${id}-grad)`}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
                    fill="none"
                    stroke={`url(#${id}-grad)`}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </g>
        </svg>
    );
}
