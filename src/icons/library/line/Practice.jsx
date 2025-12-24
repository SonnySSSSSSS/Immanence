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
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Calibration Marks - External support layer (0.5px) */}
            <g strokeWidth="0.5" opacity="0.4">
                <circle cx="12" cy="12" r="10.5" strokeDasharray="1 3" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                <path d="M18.36 5.64l-1.41 1.41M7.05 16.95l-1.41 1.41" />
                <path d="M18.36 18.36l-1.41-1.41M7.05 7.05l-1.41-1.41" />
            </g>

            {/* Primary Geometry - The meditative frame (2px) */}
            <g strokeWidth="2" opacity="0.9">
                {/* Head */}
                <circle cx="12" cy="6" r="2.5" />
                {/* Crossed legs / Base foundation */}
                <path d="M7 17.5c0-2.5 2-3.5 5-3.5s5 1 5 3.5" />
            </g>

            {/* Support/Decorative Lines - Internal flow (0.5px) */}
            <g strokeWidth="0.5" opacity="0.7">
                {/* Torso */}
                <path d="M12 10v4" />
                {/* Arms in mudra */}
                <path d="M8.5 12c-2 0-2.5 1.5-2.5 1.5" />
                <path d="M15.5 12c2 0 2.5 1.5 2.5 1.5" />
                {/* Grounding line */}
                <path d="M6 19h12" />
            </g>
        </svg>
    );
}
