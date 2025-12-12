// Glow style - Foundation icon
import React from 'react';

export function Foundation({ size = 24, color = 'currentColor', className = '' }) {
    const id = `found-glow-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <linearGradient id={`${id}-leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.3" />
                </linearGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <g filter={`url(#${id}-glow)`}>
                {/* Stem */}
                <path d="M12 22V10" stroke={color} strokeWidth="2" fill="none" />
                {/* Left leaf */}
                <path d="M12 13c-4-4-8 0-8 0s0 4 4 4" fill={`url(#${id}-leaf)`} />
                {/* Right leaf */}
                <path d="M12 8c4-4 8 0 8 0s0 4-4 4" fill={`url(#${id}-leaf)`} />
                {/* Ground glow */}
                <path d="M6 22h12" stroke={color} strokeWidth="2" strokeOpacity="0.6" />
            </g>
        </svg>
    );
}
