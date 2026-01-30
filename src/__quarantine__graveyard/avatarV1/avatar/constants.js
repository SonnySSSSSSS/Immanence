// src/components/avatar/constants.js
// Shared constants and utilities for Avatar components

// ─── LABELS ───────────────────────────────────────────────────
export const LABELS = {
    hub: "Center",
    practice: "Practice",
    wisdom: "Wisdom",
    application: "Application",
    navigation: "Navigation",
};

// ─── STAGE GLOW COLORS ────────────────────────────────────────
export const STAGE_GLOW_COLORS = {
    seedling: { h: 180, s: 70, l: 50 },
    ember: { h: 25, s: 85, l: 55 },
    flame: { h: 42, s: 95, l: 58 },
    beacon: { h: 200, s: 85, l: 60 },
    stellar: { h: 270, s: 80, l: 65 },
};

// ─── RUNE RING COLORS ─────────────────────────────────────────
export const STAGE_RUNE_COLORS = {
    seedling: "rgba(75, 192, 192, 0.6)",
    ember: "rgba(255, 140, 0, 0.6)",
    flame: "rgba(255, 247, 216, 0.8)",
    beacon: "rgba(100, 200, 255, 0.6)",
    stellar: "rgba(200, 150, 255, 0.6)",
};

// ─── MANDALA STATE FALLBACK ───────────────────────────────────
// Local fallback until ../state/mandalaStore.js exists
export function getMandalaState() {
    return {
        avgAccuracy: 0,
        weeklyConsistency: 0,
        weeklyPracticeLog: [true, true, false, true, false, true, false],
        phase: "foundation",
        transient: {
            focus: 0,
            clarity: 0,
            distortion: 0,
        },
    };
}
