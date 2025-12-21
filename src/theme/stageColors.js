// Theme colors for each avatar stage

export const STAGE_THEMES = {
    SEEDLING: {
        name: 'Seedling',
        accent: {
            primary: '#4ade80',      // Bright green
            secondary: '#22c55e',    // Medium green
            muted: '#166534',        // Dark green
            glow: 'rgba(74, 222, 128, 0.4)',
            particleColor: '#86efac',
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
