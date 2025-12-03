// ThemeContext - provides stage-based theming throughout the app

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { STAGE_THEMES, BASE_THEME, STAGE_NAME_MAP } from '../theme/stageColors';

const ThemeContext = createContext(null);

// Helper to convert hex to HSL
function hexToHSL(hex) {
    hex = hex.replace('#', '');

    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
            default: h = 0;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

export function ThemeProvider({ children, currentStage = 'Flame' }) {
    // Map stage name to theme key
    const stageKey = STAGE_NAME_MAP[currentStage] || 'FLAME';

    const theme = useMemo(() => {
        const stageTheme = STAGE_THEMES[stageKey] || STAGE_THEMES.FLAME;
        return {
            ...BASE_THEME,
            stage: currentStage,
            stageKey,
            accent: stageTheme.accent,
            text: { ...BASE_THEME.text, ...stageTheme.text },
            ui: stageTheme.ui,
        };
    }, [currentStage, stageKey]);

    // Set CSS custom properties on the root element
    useEffect(() => {
        const stageTheme = STAGE_THEMES[stageKey] || STAGE_THEMES.FLAME;
        const root = document.documentElement;

        console.log('🎨 ThemeProvider updating for stage:', currentStage, '→', stageKey);

        // Convert primary color to HSL for backward compatibility
        const hsl = hexToHSL(stageTheme.accent.primary);

        console.log('  Primary color:', stageTheme.accent.primary, '→ HSL:', hsl);

        // Backward compatibility - existing components use these
        root.style.setProperty('--accent-h', String(hsl.h));
        root.style.setProperty('--accent-s', `${hsl.s}%`);
        root.style.setProperty('--accent-l', `${hsl.l}%`);
        root.style.setProperty('--accent-color', `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`);

        console.log('  Set --accent-color to:', `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`);

        // New semantic variables
        root.style.setProperty('--accent-primary', stageTheme.accent.primary);
        root.style.setProperty('--accent-secondary', stageTheme.accent.secondary);
        root.style.setProperty('--accent-muted', stageTheme.accent.muted);
        root.style.setProperty('--accent-glow', stageTheme.accent.glow);

        // UI colors
        root.style.setProperty('--ui-selected-bg', stageTheme.ui.selectedBg);
        root.style.setProperty('--ui-selected-border', stageTheme.ui.selectedBorder);
        root.style.setProperty('--ui-hover-bg', stageTheme.ui.hoverBg);
        root.style.setProperty('--ui-progress-bar', stageTheme.ui.progressBar);
        root.style.setProperty('--ui-button-gradient', stageTheme.ui.buttonGradient);

        // Text
        root.style.setProperty('--text-accent', stageTheme.text.accent);
        root.style.setProperty('--text-accent-muted', stageTheme.text.accentMuted);

    }, [stageKey, currentStage]);

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
