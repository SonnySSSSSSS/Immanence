// Glow style - Wisdom icon
import React, { useId } from 'react';

export function Wisdom({ size = 24, color = 'currentColor', className = '' }) {
    const id = useId();

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <linearGradient id={`${id}-page`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.2" />
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
                {/* Left page */}
                <path
                    d="M2 4v14c0 1 1 2 2 2h6c1 0 2-1 2-1V5c-2 0-5 0-6 1s-3 2-4 2V4z"
                    fill={`url(#${id}-page)`}
                />
                {/* Right page */}
                <path
                    d="M22 4v14c0 1-1 2-2 2h-6c-1 0-2-1-2-1V5c2 0 5 0 6 1s3 2 4 2V4z"
                    fill={`url(#${id}-page)`}
                />
                {/* Glowing spine */}
                <rect x="11" y="5" width="2" height="14" fill={color} />
            </g>
        </svg>
    );
}
