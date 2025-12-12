// Filled style - Milestone icon
import React from 'react';

export function Milestone({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
        </svg>
    );
}
