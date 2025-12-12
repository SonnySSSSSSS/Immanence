// Line style - Practice icon (meditation figure)
import React from 'react';

export function Practice({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Head */}
            <circle cx="12" cy="5" r="2.5" />
            {/* Body in lotus position */}
            <path d="M12 10v4" />
            {/* Arms in meditation mudra */}
            <path d="M8 12c-2 0-3 2-3 2" />
            <path d="M16 12c2 0 3 2 3 2" />
            {/* Crossed legs */}
            <path d="M7 18c0-3 2-4 5-4s5 1 5 4" />
            <path d="M6 20h12" />
        </svg>
    );
}
