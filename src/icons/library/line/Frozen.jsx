// Line style - Frozen icon (snowflake)
import React from 'react';

export function Frozen({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2v20" />
            <path d="M2 12h20" />
            <path d="M4.5 4.5l15 15" />
            <path d="M4.5 19.5l15-15" />
            <path d="M12 6l-2-2" />
            <path d="M12 6l2-2" />
            <path d="M12 18l-2 2" />
            <path d="M12 18l2 2" />
        </svg>
    );
}
