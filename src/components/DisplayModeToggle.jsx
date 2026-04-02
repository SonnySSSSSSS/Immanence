// src/components/DisplayModeToggle.jsx
// Header toggle with minimal icon style to match legacy top-bar controls.

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function DisplayModeToggle() {
    const { colorScheme, toggleColorScheme } = useDisplayModeStore();
    const isLight = colorScheme === 'light';
    const nextModeIcon = isLight ? '☾' : '☼';
    const nextModeTitle = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';

    return (
        <button
            type="button"
            onClick={toggleColorScheme}
            className={`type-label font-medium px-2 py-1 rounded-lg transition-colors ${isLight ? 'text-[#5A4D3C]/70 hover:text-[#3D3425] hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
            title={nextModeTitle}
            aria-label={nextModeTitle}
        >
            {nextModeIcon}
        </button>
    );
}
