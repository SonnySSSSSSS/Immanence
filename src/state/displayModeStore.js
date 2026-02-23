// src/state/displayModeStore.js
// Display preferences (color scheme + stage asset style).
// NOTE: The app now uses a single, fixed app-frame aspect ratio and a single content rail.
// "Hearth/Sanctuary" width modes were removed to prevent per-screen aspect drift.

import { create } from 'zustand';

function loadStoredColorScheme() {
    try {
        const stored = localStorage.getItem('immanenceOS.colorScheme');
        if (stored === 'dark' || stored === 'light') {
            return stored;
        }
    } catch {
        // localStorage not available
    }
    return 'dark'; // Default to dark
}

// Apply color scheme class to document
function applyColorSchemeClass(scheme) {
    if (typeof document !== 'undefined') {
        if (scheme === 'light') {
            document.documentElement.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
        }
    }
}

function loadStoredStageAssetStyle() {
    try {
        const stored = localStorage.getItem('immanenceOS.stageAssetStyle');
        return stored ? parseInt(stored, 10) : 1;
    } catch {
        return 1;
    }
}

// Initialize on load
const initialColorScheme = loadStoredColorScheme();
applyColorSchemeClass(initialColorScheme);

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY MODE STORE
// ═══════════════════════════════════════════════════════════════════════════
export const useDisplayModeStore = create((set, get) => ({
    // Color Scheme: 'dark' | 'light'
    colorScheme: initialColorScheme,

    // Stage Asset Style Set: 1-5
    stageAssetStyle: loadStoredStageAssetStyle(),

    // Toggle between color schemes
    toggleColorScheme: () => {
        const current = get().colorScheme;
        const newScheme = current === 'dark' ? 'light' : 'dark';
        set({ colorScheme: newScheme });
        applyColorSchemeClass(newScheme);

        try {
            localStorage.setItem('immanenceOS.colorScheme', newScheme);
        } catch {
            // ignore
        }
    },

    // Set specific color scheme
    setColorScheme: (scheme) => {
        if (scheme !== 'dark' && scheme !== 'light') return;
        set({ colorScheme: scheme });
        applyColorSchemeClass(scheme);

        try {
            localStorage.setItem('immanenceOS.colorScheme', scheme);
        } catch {
            // ignore
        }
    },

    // Set stage asset style set
    setStageAssetStyle: (style) => {
        const styleNum = parseInt(style, 10);
        if (isNaN(styleNum) || styleNum < 1 || styleNum > 5) return;
        set({ stageAssetStyle: styleNum });

        try {
            localStorage.setItem('immanenceOS.stageAssetStyle', styleNum);
        } catch {
            // ignore
        }
    },

    // Helpers
    isDark: () => get().colorScheme === 'dark',
    isLight: () => get().colorScheme === 'light',
}));
