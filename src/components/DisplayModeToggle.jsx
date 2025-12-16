// src/components/DisplayModeToggle.jsx
// Toggle between Sanctuary (🌙 cosmic) and Hearth (🔥 focused) display modes

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function DisplayModeToggle() {
    const { mode, toggleMode } = useDisplayModeStore();
    const isSanctuary = mode === 'sanctuary';

    return (
        <button
            type="button"
            onClick={toggleMode}
            className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300"
            style={{
                background: isSanctuary
                    ? 'rgba(180, 200, 255, 0.1)'
                    : 'rgba(255, 140, 50, 0.15)',
                boxShadow: isSanctuary
                    ? '0 0 12px rgba(180, 200, 255, 0.2)'
                    : '0 0 12px rgba(255, 120, 40, 0.3)',
            }}
            title={isSanctuary ? 'Switch to Hearth (focused)' : 'Switch to Sanctuary (immersive)'}
        >
            <span
                className="text-base transition-transform duration-300"
                style={{
                    transform: isSanctuary ? 'scale(1)' : 'scale(0.9)',
                    filter: isSanctuary
                        ? 'drop-shadow(0 0 4px rgba(200, 220, 255, 0.6))'
                        : 'drop-shadow(0 0 4px rgba(255, 150, 50, 0.6))',
                }}
            >
                {isSanctuary ? '🌙' : '🔥'}
            </span>
        </button>
    );
}
