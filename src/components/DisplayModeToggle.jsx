// src/components/DisplayModeToggle.jsx
// Toggle between Light (☀️) and Dark (🌙) color schemes

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function DisplayModeToggle() {
    const { colorScheme, toggleColorScheme } = useDisplayModeStore();
    const isLight = colorScheme === 'light';

    return (
        <button
            type="button"
            onClick={toggleColorScheme}
            className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300"
            style={{
                background: isLight
                    ? 'rgba(212, 168, 75, 0.2)'
                    : 'rgba(180, 200, 255, 0.1)',
                boxShadow: isLight
                    ? '0 0 12px rgba(212, 168, 75, 0.3)'
                    : '0 0 12px rgba(180, 200, 255, 0.2)',
            }}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
            <span
                className="text-base transition-transform duration-300"
                style={{
                    transform: 'scale(1)',
                    filter: isLight
                        ? 'drop-shadow(0 0 4px rgba(212, 168, 75, 0.6))'
                        : 'drop-shadow(0 0 4px rgba(200, 220, 255, 0.6))',
                }}
            >
                {isLight ? '☀️' : '🌙'}
            </span>
        </button>
    );
}
