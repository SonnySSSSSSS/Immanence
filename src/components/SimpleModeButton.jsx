// src/components/SimpleModeButton.jsx
// Simplified mode button with gradient circle and minimal SVG icon (reference design style)

import React from 'react';

export function SimpleModeButton({ title, onClick, gradient, icon }) {
    const getIcon = () => {
        switch (icon) {
            case 'practice':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
                    </svg>
                );
            case 'wisdom':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
                    </svg>
                );
            case 'application':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" fill="none" opacity="0.9" />
                        <path d="M12 3v18M19.07 7.5l-14.14 9M19.07 16.5l-14.14-9" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    </svg>
                );
            case 'navigation':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" fill="none" opacity="0.9" />
                        <path d="M12 3L14 9H20L15 13L17 19L12 15L7 19L9 13L4 9H10L12 3Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative flex flex-col items-center gap-1.5"
            style={{ cursor: 'pointer' }}
            aria-label={title}
        >
            <div
                className="relative flex items-center justify-center transition-all duration-300"
                style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: gradient,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
            >
                {getIcon()}
            </div>
            <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{
                    color: 'rgba(100, 80, 60, 0.75)',
                    letterSpacing: '0.08em',
                }}
            >
                {title}
            </span>
        </button>
    );
}
