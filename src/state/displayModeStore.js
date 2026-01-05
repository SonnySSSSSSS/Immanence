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
    // Mode: 'sanctuary' | 'hearth' (user preference)
    mode: loadStoredMode() ?? detectDefaultMode(),

    // Viewport Mode: live viewport-based mode (updates on resize)
    viewportMode: detectDefaultMode(),

    // Color Scheme: 'dark' | 'light'
    colorScheme: initialColorScheme,

    // Stage Asset Style Set: 1-5
    stageAssetStyle: loadStoredStageAssetStyle(),

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

    // Set viewport mode (for live resize updates)
    setViewportMode: (viewportMode) => set({ viewportMode }),

    // Initialize viewport resize listener
    initViewportListener: () => {
        if (typeof window === 'undefined') return;

        const update = () => {
            const next = detectDefaultMode();
            const cur = get().viewportMode;
            console.log('[displayModeStore] resize check - next:', next, 'cur:', cur, 'windowW:', window.innerWidth);
            if (next !== cur) {
                console.log('[displayModeStore] UPDATING viewportMode to:', next);
                get().setViewportMode(next);
            }
        };

        window.addEventListener('resize', update, { passive: true });
        window.addEventListener('orientationchange', update, { passive: true });
        update();
    },

    // Helpers
    isSanctuary: () => get().mode === 'sanctuary',
    isHearth: () => get().mode === 'hearth',
    isDark: () => get().colorScheme === 'dark',
    isLight: () => get().colorScheme === 'light',
}));
