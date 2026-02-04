// Theme colors for each avatar stage
import extractedColors from '../data/extractedStageColors.json';

// Helper function to extract RGB values from hex for glow colors
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const STAGE_THEMES = {
    SEEDLING: {
        name: 'Seedling',
        accent: {
            primary: extractedColors.seedling?.primary || '#4ade80',      // Extracted from wallpaper
            secondary: extractedColors.seedling?.secondary || '#22c55e',  // Extracted secondary
            muted: extractedColors.seedling?.muted || '#16a34a',          // Extracted muted
            glow: hexToRgba(extractedColors.seedling?.primary || '#4ade80', 0.4),
            particleColor: extractedColors.seedling?.highlight || '#86efac',
        },
        text: {
            accent: '#4ade80',
            accentMuted: 'rgba(74, 222, 128, 0.7)',
        },
        ui: {
            selectedBg: 'rgba(74, 222, 128, 0.15)',
            selectedBorder: 'rgba(74, 222, 128, 0.4)',
            hoverBg: 'rgba(74, 222, 128, 0.08)',
            progressBar: '#4ade80',
            buttonGradient: 'linear-gradient(135deg, #4ade80, #22c55e)',
        },
        light: {
            bgBase: '#F0F9F4',          // Light mint
            bgSurface: '#F8FCF9',       // Soft white with green tint
            textPrimary: '#14532d',     // Deep forest green
            textSecondary: '#166534',   // Medium forest green
            accent: '#4ade80',          // Vibrant green
            accentMuted: '#86efac',     // Lighter green for contrast
            border: 'rgba(74, 222, 128, 0.25)',
            shadowTint: 'rgba(34, 197, 94, 0.12)',
        }
    },

    EMBER: {
        name: 'Ember',
        accent: {
            primary: extractedColors.ember?.primary || '#f97316',      // Extracted from wallpaper
            secondary: extractedColors.ember?.secondary || '#ea580c',  // Extracted secondary
            muted: extractedColors.ember?.muted || '#9a3412',          // Extracted muted
            glow: hexToRgba(extractedColors.ember?.primary || '#f97316', 0.4),
            particleColor: extractedColors.ember?.highlight || '#fb923c',
        },
        text: {
            accent: '#fb923c',
            accentMuted: 'rgba(251, 146, 60, 0.7)',
        },
        ui: {
            selectedBg: 'rgba(249, 115, 22, 0.15)',
            selectedBorder: 'rgba(249, 115, 22, 0.4)',
            hoverBg: 'rgba(249, 115, 22, 0.08)',
            progressBar: '#f97316',
            buttonGradient: 'linear-gradient(135deg, #fb923c, #ea580c)',
        },
        light: {
            bgBase: '#FDF6F0',          // Warm cream
            bgSurface: '#FFFEFC',       // Pure warm white
            textPrimary: '#4A3B32',     // Burnt umber
            textSecondary: '#8B4513',   // Saddle brown
            accent: '#B8654A',          // Terra cotta
            accentMuted: '#D99F8B',     // Faded clay
            border: 'rgba(184,101,74,0.25)',
            shadowTint: 'rgba(184,101,74,0.12)',
        }
    },

    FLAME: {
        name: 'Flame',
        accent: {
            primary: extractedColors.flame?.primary || '#fcd34d',      // Extracted from wallpaper
            secondary: extractedColors.flame?.secondary || '#f59e0b',  // Extracted secondary
            muted: extractedColors.flame?.muted || '#92400e',          // Extracted muted
            glow: hexToRgba(extractedColors.flame?.primary || '#fcd34d', 0.4),
            particleColor: extractedColors.flame?.highlight || '#FF6B35',
        },
        text: {
            accent: '#fcd34d',
            accentMuted: 'rgba(252, 211, 77, 0.7)',
        },
        ui: {
            selectedBg: 'rgba(252, 211, 77, 0.15)',
            selectedBorder: 'rgba(252, 211, 77, 0.4)',
            hoverBg: 'rgba(252, 211, 77, 0.08)',
            progressBar: '#fcd34d',
            buttonGradient: 'linear-gradient(135deg, #fcd34d, #f59e0b)',
        },
        light: {
            bgBase: '#F5F0E6',          // Papyrus
            bgSurface: '#F8F3EB',       // Refined parchment
            textPrimary: '#3D3425',     // Ink brown
            textSecondary: '#6B5E43',   // Deep bronze
            accent: '#D4AF37',          // Classic gold
            accentMuted: '#E5D38A',     // Pale gold
            border: 'rgba(180,155,110,0.25)',
            shadowTint: 'rgba(100,70,50,0.15)',
        }
    },

    BEACON: {
        name: 'Beacon',
        accent: {
            primary: extractedColors.beacon?.primary || '#22d3ee',      // Extracted from wallpaper
            secondary: extractedColors.beacon?.secondary || '#06b6d4',  // Extracted secondary
            muted: extractedColors.beacon?.muted || '#0e7490',          // Extracted muted
            glow: hexToRgba(extractedColors.beacon?.primary || '#22d3ee', 0.4),
            particleColor: extractedColors.beacon?.highlight || '#67e8f9',
        },
        text: {
            accent: '#22d3ee',
            accentMuted: 'rgba(34, 211, 238, 0.7)',
        },
        ui: {
            selectedBg: 'rgba(34, 211, 238, 0.15)',
            selectedBorder: 'rgba(34, 211, 238, 0.4)',
            hoverBg: 'rgba(34, 211, 238, 0.08)',
            progressBar: '#22d3ee',
            buttonGradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
        },
        light: {
            bgBase: '#F0F5F7',          // Arctic cream
            bgSurface: '#F9FCFD',       // Pure snow
            textPrimary: '#2A3B4A',     // Deep slate
            textSecondary: '#4A6175',   // Steel blue
            accent: '#0E7490',          // Deep cyan
            accentMuted: '#5EA9C0',     // Soft teal
            border: 'rgba(14,116,144,0.25)',
            shadowTint: 'rgba(14,116,144,0.12)',
        }
    },

    STELLAR: {
        name: 'Stellar',
        accent: {
            primary: extractedColors.stellar?.primary || '#a78bfa',      // Extracted from wallpaper
            secondary: extractedColors.stellar?.secondary || '#8b5cf6',  // Extracted secondary
            muted: extractedColors.stellar?.muted || '#5b21b6',          // Extracted muted
            glow: hexToRgba(extractedColors.stellar?.primary || '#a78bfa', 0.4),
            particleColor: extractedColors.stellar?.highlight || '#c084fc',
        },
        text: {
            accent: '#a78bfa',
            accentMuted: 'rgba(167, 139, 250, 0.7)',
        },
        ui: {
            selectedBg: 'rgba(167, 139, 250, 0.15)',
            selectedBorder: 'rgba(167, 139, 250, 0.4)',
            hoverBg: 'rgba(167, 139, 250, 0.08)',
            progressBar: '#a78bfa',
            buttonGradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
        },
        light: {
            bgBase: '#F5F2F8',          // Lavender cream
            bgSurface: '#FCFBFE',       // Pure lilac white
            textPrimary: '#3D2A4A',     // Deep amethyst
            textSecondary: '#624A75',   // Muted violet
            accent: '#7C5CAE',          // Royal purple
            accentMuted: '#A792C9',     // Soft lavender
            border: 'rgba(124,92,174,0.25)',
            shadowTint: 'rgba(124,92,174,0.12)',
        }
    },
};

// Constants that DON'T change with stage
export const BASE_THEME = {
    background: {
        primary: '#0a0a12',
        secondary: '#0f0f1a',
        card: '#161625',
        cardBorder: 'rgba(255, 255, 255, 0.06)',
    },
    text: {
        primary: 'rgba(255, 255, 255, 0.92)',
        secondary: 'rgba(255, 255, 255, 0.6)',
        muted: 'rgba(255, 255, 255, 0.4)',
        label: 'rgba(255, 255, 255, 0.5)',
    },
    fonts: {
        heading: "var(--font-display)",
        body: "var(--font-body)",
        ui: "var(--font-ui)",
    }
};

// Map from avatar stage names to theme keys
export const STAGE_NAME_MAP = {
    'Seedling': 'SEEDLING',
    'Ember': 'EMBER',
    'Flame': 'FLAME',
    'Beacon': 'BEACON',
    'Stellar': 'STELLAR',
};
