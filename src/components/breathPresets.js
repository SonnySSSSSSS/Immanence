// Breathing pattern presets
export const BREATH_PRESETS = {
    Box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    "4-7-8": { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
    Kumbhaka: { inhale: 4, hold1: 16, exhale: 8, hold2: 0 },
    Relax: { inhale: 4, hold1: 4, exhale: 6, hold2: 2 },
    Energy: { inhale: 3, hold1: 0, exhale: 3, hold2: 0 },
};

export const PRESET_NAMES = Object.keys(BREATH_PRESETS);
