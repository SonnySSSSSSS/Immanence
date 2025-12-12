// Line style - BodyScan icon (hand sensing body)
import React from 'react';

export function BodyScan({ size = 24, color = 'currentColor', className = '' }) {
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
            {/* Body outline */}
            <circle cx="12" cy="4" r="2" />
            <path d="M12 8v6" />
            <path d="M9 18l3-4 3 4" />
            {/* Sensing waves */}
            <path d="M4 10c1 0 2 1 2 2s-1 2-2 2" strokeOpacity="0.6" />
            <path d="M2 9c2 0 3 1.5 3 3s-1 3-3 3" strokeOpacity="0.4" />
            <path d="M20 10c-1 0-2 1-2 2s1 2 2 2" strokeOpacity="0.6" />
            <path d="M22 9c-2 0-3 1.5-3 3s1 3 3 3" strokeOpacity="0.4" />
        </svg>
    );
}
