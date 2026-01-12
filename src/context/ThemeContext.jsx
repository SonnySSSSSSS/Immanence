// ThemeContext - provides stage-based theming throughout the app

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { STAGE_THEMES, BASE_THEME, STAGE_NAME_MAP } from '../theme/stageColors';
import { useDisplayModeStore } from '../state/displayModeStore.js';

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

// Helper to convert hex to RGB components
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
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

        // RGB components for rgba() usage
        const primaryRgb = hexToRgb(stageTheme.accent.primary);
        root.style.setProperty('--accent-r', String(primaryRgb.r));
        root.style.setProperty('--accent-g', String(primaryRgb.g));
        root.style.setProperty('--accent-b', String(primaryRgb.b));

        // Pre-computed alpha variants (most commonly used)
        root.style.setProperty('--accent-10', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
        root.style.setProperty('--accent-15', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`);
        root.style.setProperty('--accent-20', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
        root.style.setProperty('--accent-25', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.25)`);
        root.style.setProperty('--accent-30', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
        root.style.setProperty('--accent-40', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`);
        root.style.setProperty('--accent-50', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.5)`);
        root.style.setProperty('--accent-60', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.6)`);
        root.style.setProperty('--accent-70', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.7)`);
        root.style.setProperty('--accent-80', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);

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

        // Practice card label color: gold by default, indigo when in Flame stage
        const practiceLabelColor = stageKey === 'FLAME' ? '#4f46e5' : '#ffd700';
        const practiceLabelGlow = stageKey === 'FLAME'
            ? 'rgba(79, 70, 229, 0.9)'
            : 'rgba(255, 215, 0, 1)';

        root.style.setProperty('--practice-card-text', practiceLabelColor);
        root.style.setProperty('--practice-card-glow', practiceLabelGlow);

        // Light mode specific stage variables (for adaptive manuscript look)
        if (stageTheme.light) {
            root.style.setProperty('--light-bg-base', stageTheme.light.bgBase);
            root.style.setProperty('--light-bg-surface', stageTheme.light.bgSurface);
            root.style.setProperty('--light-text-primary', stageTheme.light.textPrimary);
            root.style.setProperty('--light-text-secondary', stageTheme.light.textSecondary);
            root.style.setProperty('--light-accent', stageTheme.light.accent);
            root.style.setProperty('--light-accent-muted', stageTheme.light.accentMuted);
            root.style.setProperty('--light-border', stageTheme.light.border);
            root.style.setProperty('--light-shadow-tint', stageTheme.light.shadowTint);
        }

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
