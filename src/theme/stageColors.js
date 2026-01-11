// Theme colors for each avatar stage

export const STAGE_THEMES = {
    SEEDLING: {
        name: 'Seedling',
        accent: {
            primary: '#00A382',      // Soma Green (vibrant emerald/seafoam)
            secondary: '#008C6E',    // Deeper soma
            muted: '#005F4B',        // Dark teal
            glow: 'rgba(0, 163, 130, 0.4)',
            particleColor: '#00C9A0',
        },
        text: {
            accent: '#00A382',
            accentMuted: 'rgba(0, 163, 130, 0.7)',
        },
        ui: {
            selectedBg: 'rgba(0, 163, 130, 0.15)',
            selectedBorder: 'rgba(0, 163, 130, 0.4)',
            hoverBg: 'rgba(0, 163, 130, 0.08)',
            progressBar: '#00A382',
            buttonGradient: 'linear-gradient(135deg, #00A382, #008C6E)',
        },
        light: {
            bgBase: '#F0F8F6',          // Mint cream
            bgSurface: '#FAFDFB',       // Soft white with hint of green
            textPrimary: '#004D3D',     // Deep teal
            textSecondary: '#006B56',   // Medium teal
            accent: '#00A382',          // Soma green
            accentMuted: '#4DD4B8',     // Lighter seafoam for contrast
            border: 'rgba(0, 163, 130, 0.25)',
            shadowTint: 'rgba(0, 109, 86, 0.12)',
        }
    },

    EMBER: {
        name: 'Ember',
        accent: {
            primary: '#f97316',      // Orange
            secondary: '#ea580c',    // Deep orange
            muted: '#9a3412',        // Dark orange
            glow: 'rgba(249, 115, 22, 0.4)',
            particleColor: '#fb923c',
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
            primary: '#fcd34d',      // Gold (current default)
            secondary: '#f59e0b',    // Amber
            muted: '#92400e',        // Dark amber
            glow: 'rgba(252, 211, 77, 0.4)',
            particleColor: '#FF6B35', // Orange-red for particles to stand out
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
            primary: '#22d3ee',      // Cyan
            secondary: '#06b6d4',    // Teal
            muted: '#0e7490',        // Dark cyan
            glow: 'rgba(34, 211, 238, 0.4)',
            particleColor: '#67e8f9',
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
            primary: '#a78bfa',      // Violet
            secondary: '#8b5cf6',    // Purple
            muted: '#5b21b6',        // Dark purple
            glow: 'rgba(167, 139, 250, 0.4)',
            particleColor: '#c084fc',
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
