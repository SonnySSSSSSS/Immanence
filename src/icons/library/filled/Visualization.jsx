// Filled style - Visualization icon
import React from 'react';

export function Visualization({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            className={className}
        >
            {/* Eye shape with cutout */}
            <path
                d="M12 4c-6 0-10 7-10 8s4 8 10 8 10-7 10-8-4-8-10-8z"
                opacity="0.3"
            />
            {/* Iris */}
            <circle cx="12" cy="12" r="4" opacity="0.6" />
            {/* Pupil */}
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}
