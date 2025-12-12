// Glow style - Practice icon
import React from 'react';

export function Practice({ size = 24, color = 'currentColor', className = '' }) {
    const id = `prac-glow-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <radialGradient id={`${id}-aura`} cx="50%" cy="30%" r="60%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Aura behind figure */}
            <circle cx="12" cy="10" r="10" fill={`url(#${id}-aura)`} />
            <g filter={`url(#${id}-glow)`}>
                {/* Head */}
                <circle cx="12" cy="5" r="2.5" fill={color} />
                {/* Body */}
                <path d="M12 10v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
                {/* Arms */}
                <path d="M8 12c-2 0-3 2-3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 12c2 0 3 2 3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                {/* Base */}
                <path d="M7 18c0-3 2-4 5-4s5 1 5 4" stroke={color} strokeWidth="1.5" fill="none" />
                <path d="M6 20h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </g>
        </svg>
    );
}
