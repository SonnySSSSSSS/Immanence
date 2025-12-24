// src/components/WidthToggle.jsx
// Toggle between Hearth (430px phone) and Sanctuary (820px tablet) viewport widths

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function WidthToggle() {
    const mode = useDisplayModeStore((s) => s.mode);
    const toggleMode = useDisplayModeStore((s) => s.toggleMode);

    const isSanctuary = mode === 'sanctuary';

    return (
        <button
            type="button"
            onClick={toggleMode}
            className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
                background: isSanctuary
                    ? 'linear-gradient(135deg, rgba(100, 150, 200, 0.15), rgba(80, 120, 180, 0.1))'
                    : 'linear-gradient(135deg, rgba(255, 120, 40, 0.15), rgba(255, 80, 20, 0.1))',
                border: `1px solid ${isSanctuary ? 'rgba(100, 150, 200, 0.3)' : 'rgba(255, 120, 40, 0.3)'}`,
            }}
            title={isSanctuary ? 'Sanctuary (820px tablet) - Click for Hearth (430px phone)' : 'Hearth (430px phone) - Click for Sanctuary (820px tablet)'}
        >
            {isSanctuary ? (
                // Sanctuary icon - expand/wide icon
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
                    <path d="M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                // Hearth icon - compress/narrow icon
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
                    <path d="M5 8h6M5 8l3-3M5 8l3 3M11 8l-3-3M11 8l-3 3M2 3v10M14 3v10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
}
