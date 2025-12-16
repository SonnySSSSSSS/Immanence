// src/state/displayModeStore.js
// Display Mode: Sanctuary (cosmic immersive) vs Hearth (portrait focused)
// Persists preference to localStorage

import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-DETECT DEFAULT MODE
// ═══════════════════════════════════════════════════════════════════════════
function detectDefaultMode() {
    // Portrait viewport or small width → hearth
    if (typeof window !== 'undefined') {
        const isPortrait = window.innerHeight > window.innerWidth;
        const isSmall = window.innerWidth < 768;
        if (isPortrait || isSmall) {
            return 'hearth';
        }
    }
    return 'sanctuary';
}

// ═══════════════════════════════════════════════════════════════════════════
// LOAD STORED PREFERENCE (respects user choice over auto-detect)
// ═══════════════════════════════════════════════════════════════════════════
function loadStoredMode() {
    try {
        const stored = localStorage.getItem('immanenceOS.displayMode');
        if (stored === 'sanctuary' || stored === 'hearth') {
            return stored; // Always respect stored preference
        }
    } catch {
        // localStorage not available
    }
    return null; // No stored preference → use auto-detect
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY MODE STORE
// ═══════════════════════════════════════════════════════════════════════════
export const useDisplayModeStore = create((set, get) => ({
    // Mode: 'sanctuary' | 'hearth'
    mode: loadStoredMode() ?? detectDefaultMode(),

    // Toggle between modes
    toggleMode: () => {
        const current = get().mode;
        const newMode = current === 'sanctuary' ? 'hearth' : 'sanctuary';
        set({ mode: newMode });

        // Persist to localStorage
        try {
            localStorage.setItem('immanenceOS.displayMode', newMode);
        } catch {
            // ignore
        }
    },

    // Set specific mode
    setMode: (mode) => {
        if (mode !== 'sanctuary' && mode !== 'hearth') return;
        set({ mode });

        // Persist to localStorage
        try {
            localStorage.setItem('immanenceOS.displayMode', mode);
        } catch {
            // ignore
        }
    },

    // Check if current mode is sanctuary
    isSanctuary: () => get().mode === 'sanctuary',

    // Check if current mode is hearth
    isHearth: () => get().mode === 'hearth',
}));
