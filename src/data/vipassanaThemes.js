// src/data/vipassanaThemes.js
// Scene themes and practice invariant for Vipassana thought labeling

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE INVARIANT — Same mechanics across all themes
// ─────────────────────────────────────────────────────────────────────────────

// Weighted lifetime distribution (matches real Vipassana rhythms)
// Median reduced by ~12% to prevent clutter while preserving contrast
function getWeightedLifetime() {
    const roll = Math.random();

    if (roll < 0.60) {
        // Fleeting (60%): sensory noise, passing thoughts
        return 5 + Math.random() * 5; // 5-10s (was 6-12s)
    } else if (roll < 0.90) {
        // Sticky (30%): planning, memory, light narrative
        return 10 + Math.random() * 7; // 10-17s (was 12-20s)
    } else {
        // Heavy (10%): rumination, emotional charge (rare but salient)
        return 25 + Math.random() * 15; // 25-40s (unchanged - preserves long tail)
    }
}

export const PRACTICE_INVARIANT = {
    getWeightedLifetime,           // Function for weighted lifetime
    thoughtLifetime: 22,           // Deprecated: kept for compatibility
    releaseReduction: 0.4,         // 40% lifetime reduction on tap
    maxActiveThoughts: 30,         // graceful coalescing beyond
    allowOneSticky: true,          // only one sticky marker at a time
    classifyRequiresLongPress: true,
    longPressThreshold: 350,       // ms
    accumulationAffectsBg: false,  // never darken background

    // Dissolution timing
    dissolutionStart: 0.75,        // starts at 75% of lifetime
    dissolutionPhases: {
        coherent: 0.75,              // 0-75%: normal appearance
        loosening: 0.15,             // 75-90%: edges feather
        dispersing: 0.10,            // 90-100%: wisps scatter
    },

    // Accumulation thresholds (thought-layer only)
    accumulation: {
        normal: { max: 5, saturation: 1.0, motionContrast: 1.0 },
        busy: { max: 12, saturation: 0.9, motionContrast: 0.9 },
        crowded: { max: 20, saturation: 0.85, motionContrast: 0.8 },
        coalescing: { max: 30, saturation: 0.8, motionContrast: 0.7 },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// THOUGHT CATEGORIES — Neutral phenomenological labels
// ─────────────────────────────────────────────────────────────────────────────
export const THOUGHT_CATEGORIES = {
    neutral: {
        id: 'neutral',
        label: 'Noticed',
        color: 'rgba(180, 180, 180, 0.6)',
        tint: '#9CA3AF',
        symbol: null,
    },
    future: {
        id: 'future',
        label: 'Future',
        color: 'rgba(96, 165, 250, 0.6)',
        tint: '#60A5FA',
        symbol: '○→',
    },
    past: {
        id: 'past',
        label: 'Past',
        color: 'rgba(251, 191, 36, 0.6)',
        tint: '#FBBF24',
        symbol: '←○',
    },
    evaluating: {
        id: 'evaluating',
        label: 'Evaluating',
        color: 'rgba(244, 114, 182, 0.6)',
        tint: '#F472B6',
        symbol: '⊖',
    },
    body: {
        id: 'body',
        label: 'Body',
        color: 'rgba(74, 222, 128, 0.6)',
        tint: '#4ADE80',
        symbol: '◎',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE THEMES — Aesthetic skins with matching thought elements
// ─────────────────────────────────────────────────────────────────────────────
export const VIPASSANA_THEMES = {
    dawnSky: {
        id: 'dawnSky',
        name: 'Dawn Sky',
        description: 'Peaceful, awakening',
        wallpaper: 'vipassana/dawn-sky.png',
        thoughtElement: 'bird',
        elementVariants: ['bird-1', 'bird-2', 'bird-3'],
        driftDirection: { x: 0.3, y: -0.1 },  // rightward, slight up
        ambientColor: 'rgba(255, 200, 180, 0.1)',
        videoType: 'birds',
    },
    autumnForest: {
        id: 'autumnForest',
        name: 'Autumn Forest',
        description: 'Grounding, letting go',
        wallpaper: 'vipassana/autumn-forest.png',
        thoughtElement: 'leaf',
        elementVariants: ['leaf-oak', 'leaf-maple', 'leaf-birch'],
        driftDirection: { x: 0.1, y: 0.4 },   // slight right, downward
        ambientColor: 'rgba(200, 150, 100, 0.1)',
        videoType: 'leaves',
    },
    oceanHorizon: {
        id: 'oceanHorizon',
        name: 'Ocean Horizon',
        description: 'Expansive, spacious',
        wallpaper: 'vipassana/ocean-horizon.png',
        thoughtElement: 'cloud',
        elementVariants: ['cloud-wisp', 'cloud-puff', 'cloud-streak'],
        driftDirection: { x: 0.2, y: 0 },     // horizontal drift
        ambientColor: 'rgba(150, 200, 255, 0.1)',
        videoType: null, // no video for ocean (keep clean horizon)
    },
    nightGarden: {
        id: 'nightGarden',
        name: 'Night Garden',
        description: 'Introspective, quiet',
        wallpaper: 'vipassana/night-garden.png',
        thoughtElement: 'lantern',
        elementVariants: ['lantern-soft', 'firefly', 'orb'],
        driftDirection: { x: 0, y: -0.15 },   // gentle upward float
        ambientColor: 'rgba(100, 150, 200, 0.1)',
        videoType: 'lanterns',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO CUES — Anti-gamification volume discipline
// ─────────────────────────────────────────────────────────────────────────────
export const VIPASSANA_AUDIO = {
    thoughtNoticed: {
        file: 'vipassana/thought-noticed.mp3',
        volume: 0.15,  // very soft
    },
    thoughtRelease: {
        file: 'vipassana/thought-release.mp3',
        volume: 0.12,  // gentle exhale
    },
    thoughtSticky: {
        file: 'vipassana/thought-release.mp3', // reuse release sound, slightly louder
        volume: 0.20,
    },
    sessionEnd: {
        file: 'vipassana/session-end.mp3',
        volume: 0.25,  // single bowl tone
    },
    // No sound for classification — intentional
};

export default VIPASSANA_THEMES;
