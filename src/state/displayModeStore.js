// src/state/displayModeStore.js
// Display Mode: Sanctuary (cosmic immersive) vs Hearth (portrait focused)
// Color Scheme: Dark vs Light
// Persists preferences to localStorage

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
// LOAD STORED PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════
function loadStoredMode() {
    try {
        const stored = localStorage.getItem('immanenceOS.displayMode');
        if (stored === 'sanctuary' || stored === 'hearth') {
            return stored;
        }
    } catch {
        // localStorage not available
    }
    return null;
}

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

// Initialize on load
const initialColorScheme = loadStoredColorScheme();
applyColorSchemeClass(initialColorScheme);

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY MODE STORE
// ═══════════════════════════════════════════════════════════════════════════
export const useDisplayModeStore = create((set, get) => ({
    // Mode: 'sanctuary' | 'hearth'
    mode: loadStoredMode() ?? detectDefaultMode(),

    // Color Scheme: 'dark' | 'light'
    colorScheme: initialColorScheme,

    // Toggle between display modes
    toggleMode: () => {
        const current = get().mode;
        const newMode = current === 'sanctuary' ? 'hearth' : 'sanctuary';
        set({ mode: newMode });

        try {
            localStorage.setItem('immanenceOS.displayMode', newMode);
        } catch {
            // ignore
        }
    },

    // Set specific display mode
    setMode: (mode) => {
        if (mode !== 'sanctuary' && mode !== 'hearth') return;
        set({ mode });

        try {
            localStorage.setItem('immanenceOS.displayMode', mode);
        } catch {
            // ignore
        }
    },

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

    // Helpers
    isSanctuary: () => get().mode === 'sanctuary',
    isHearth: () => get().mode === 'hearth',
    isDark: () => get().colorScheme === 'dark',
    isLight: () => get().colorScheme === 'light',
}));
