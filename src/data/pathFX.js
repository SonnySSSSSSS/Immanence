// src/data/pathFX.js
// Visual effects definitions for each Avatar PATH
// Stage controls COLOR, Path controls FX/PARTICLES

/**
 * Avatar Path FX Configuration
 * 
 * Each path has a unique visual signature based on its attention interface:
 * - Yantra (Ritual): Geometric, phase-locked, intentional structure
 * - Kaya (Somatic): Minimal, field-like, breathing presence
 * - Chitra (Imaginal): Luminous, morphing, color-rich vision
 * - Nada (Sonic): Pulsing, resonant, time-based rhythm
 */
export const PATH_FX = {
    // ═══════════════════════════════════════════════════════════════════════════
    // YANTRA - Symbolic / Ritual / Meaning
    // Geometric, phase-locked, intentional
    // ═══════════════════════════════════════════════════════════════════════════
    'Yantra': {
        name: 'Structured Ritual',
        symbol: '△',
        particleType: 'geom-fragment',
        motionPattern: 'phase-locked',
        particleCount: 12,
        particleSize: { min: 3, max: 8 },
        colorModifier: {
            hueShift: 0,
            saturation: 0.85,
            brightness: 1.1,
            opacity: 0.75
        },
        trailLength: 0.2,
        breathSync: {
            inhale: { speed: 0.25, gather: true, glow: 0.6 },
            hold: { speed: 0.08, shimmer: false, glow: 0.8 },
            exhale: { speed: 0.25, disperse: true, glow: 0.55 },
            rest: { speed: 0.05, settle: true, glow: 0.35 }
        },
        description: 'Geometric fragments align and release in precise cycles'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // KAYA - Somatic / Perceptual
    // Field-like, minimal, breathing presence
    // ═══════════════════════════════════════════════════════════════════════════
    'Kaya': {
        name: 'Somatic Field',
        symbol: '◍',
        particleType: 'field',
        motionPattern: 'breathing-field',
        particleCount: 6,
        particleSize: { min: 16, max: 32 },
        colorModifier: {
            hueShift: -8,
            saturation: 0.6,
            brightness: 0.95,
            opacity: 0.35
        },
        trailLength: 0.1,
        breathSync: {
            inhale: { speed: 0.12, gather: false, glow: 0.45 },
            hold: { speed: 0.05, shimmer: false, glow: 0.55 },
            exhale: { speed: 0.18, disperse: false, glow: 0.4 },
            rest: { speed: 0.04, settle: true, glow: 0.3 }
        },
        description: 'Soft fields expand and contract with somatic presence'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CHITRA - Visual / Imaginal
    // Luminous, morphing, color-rich
    // ═══════════════════════════════════════════════════════════════════════════
    'Chitra': {
        name: 'Imaginal Drift',
        symbol: '✶',
        particleType: 'mote',
        motionPattern: 'morph-drift',
        particleCount: 14,
        particleSize: { min: 4, max: 10 },
        colorModifier: {
            hueShift: 6,
            saturation: 1.0,
            brightness: 1.2,
            opacity: 0.8
        },
        trailLength: 0.55,
        breathSync: {
            inhale: { speed: 0.35, gather: true, glow: 0.7 },
            hold: { speed: 0.12, shimmer: true, glow: 0.9 },
            exhale: { speed: 0.4, disperse: true, glow: 0.6 },
            rest: { speed: 0.1, settle: false, glow: 0.4 }
        },
        description: 'Luminous motes drift and shift through imaginal space'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // NADA - Sonic / Rhythmic
    // Pulsing, resonant, time-based
    // ═══════════════════════════════════════════════════════════════════════════
    'Nada': {
        name: 'Rhythmic Resonance',
        symbol: '≋',
        particleType: 'wave-ring',
        motionPattern: 'pulse-interference',
        particleCount: 10,
        particleSize: { min: 6, max: 14 },
        colorModifier: {
            hueShift: 0,
            saturation: 0.9,
            brightness: 1.15,
            opacity: 0.75
        },
        trailLength: 0.4,
        breathSync: {
            inhale: { speed: 0.5, gather: true, glow: 0.8 },
            hold: { speed: 0.2, shimmer: true, glow: 0.95 },
            exhale: { speed: 0.55, disperse: true, glow: 0.7 },
            rest: { speed: 0.12, settle: false, glow: 0.45 }
        },
        description: 'Resonant rings pulse in rhythm with breath and sound'
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get FX config for an Avatar path
 */
export function getPathFX(pathName) {
    return PATH_FX[pathName] || null;
}

/**
 * Get default FX (when no path selected or showCore is true)
 */
export function getDefaultFX() {
    return {
        name: 'Neutral',
        symbol: '○',
        particleType: 'soft-circle',
        motionPattern: 'orbit-steady',
        particleCount: 6,
        particleSize: { min: 4, max: 8 },
        colorModifier: { hueShift: 0, saturation: 0.7, brightness: 1.0, opacity: 0.45 },
        trailLength: 0.25,
        breathSync: {
            inhale: { speed: 0.25, gather: true, glow: 0.45 },
            hold: { speed: 0.1, shimmer: true, glow: 0.55 },
            exhale: { speed: 0.25, disperse: true, glow: 0.45 },
            rest: { speed: 0.05, settle: true, glow: 0.3 }
        },
        description: 'Default neutral particles'
    };
}

/**
 * Get breath sync parameters for current phase
 */
export function getBreathSyncParams(pathName, phase) {
    const fx = getPathFX(pathName) || getDefaultFX();
    return fx.breathSync[phase] || fx.breathSync.rest;
}
