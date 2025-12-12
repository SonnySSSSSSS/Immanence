// Filled style - Practice icon
import React from 'react';

export function Practice({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            className={className}
        >
            {/* Head */}
            <circle cx="12" cy="5" r="3" />
            {/* Body */}
            <ellipse cx="12" cy="12" rx="3" ry="4" opacity="0.7" />
            {/* Arms reaching out */}
            <path d="M7 11c-2 0-3 2-3 3 1 0 3 0 4-1l2-2h-3z" opacity="0.5" />
            <path d="M17 11c2 0 3 2 3 3-1 0-3 0-4-1l-2-2h3z" opacity="0.5" />
            {/* Crossed legs base */}
            <path d="M6 18c0-3 2-4 6-4s6 1 6 4H6z" opacity="0.6" />
            {/* Ground */}
            <rect x="5" y="19" width="14" height="2" />
        </svg>
    );
}
