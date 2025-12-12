// Filled style - BodyScan icon
import React from 'react';

export function BodyScan({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            className={className}
        >
            {/* Body */}
            <circle cx="12" cy="4" r="2.5" />
            <ellipse cx="12" cy="12" rx="2.5" ry="4" opacity="0.7" />
            <path d="M9 18l3-4 3 4H9z" opacity="0.5" />
            {/* Sensing waves */}
            <path d="M4 10c1.5 0 2.5 1 2.5 2s-1 2-2.5 2c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1z" opacity="0.4" />
            <path d="M20 10c-1.5 0-2.5 1-2.5 2s1 2 2.5 2c.5 0 1-.5 1-1v-2c0-.5-.5-1-1-1z" opacity="0.4" />
        </svg>
    );
}
