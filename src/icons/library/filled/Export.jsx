// Filled style - Export icon
import React from 'react';

export function Export({ size = 24, color = 'currentColor', className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
            <path d="M12 3l-5 5h3v6h4V8h3l-5-5z" />
            <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4h-2v4H6v-4H4z" opacity="0.6" />
        </svg>
    );
}
