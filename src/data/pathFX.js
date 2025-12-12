// src/data/pathFX.js
// Visual effects definitions for each Avatar PATH
// Stage controls COLOR, Path controls FX/PARTICLES

/**
 * Avatar Path FX Configuration
 * 
 * Each path has a unique visual signature based on its Sanskrit meaning:
 * - Soma (Body): Grounded, earthy, settling particles
 * - Prana (Breath): Flowing, wave-like breath energy
 * - Dhyana (Meditation): Still, centered, subtle glow
 * - Drishti (Vision): Focused, converging, sharp awareness
 * - Jnana (Knowledge): Geometric, crystalline structure
 * - Samyoga (Union): All-encompassing, integrating, unified field
 */
export const PATH_FX = {
    // ═══════════════════════════════════════════════════════════════════════════
    // SOMA - Body/Somatic
    // Grounded, visceral, earthy - particles that settle and ground
    // ═══════════════════════════════════════════════════════════════════════════
    'Soma': {
        name: 'Somatic Ground',
        symbol: '◇',
        particleType: 'dust',
        motionPattern: 'fall-settle',
        particleCount: 18,
        particleSize: { min: 2, max: 5 },
        colorModifier: {
            hueShift: -15, // Warmer/earthier
            saturation: 0.7,
            brightness: 0.85,
            opacity: 0.6
        },
        trailLength: 0.25,
        breathSync: {
            inhale: { speed: 0.15, gather: true, glow: 0.3 },
            hold: { speed: 0.05, shimmer: false, glow: 0.5 },
            exhale: { speed: 0.35, disperse: false, glow: 0.4 },
            rest: { speed: 0.03, settle: true, glow: 0.25 }
        },
        description: 'Earthy particles fall and settle like dust returning to ground'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PRANA - Breath/Life Force
    // Flowing, wave-like, breath energy - particles that flow like vital force
    // ═══════════════════════════════════════════════════════════════════════════
    'Prana': {
        name: 'Vital Flow',
        symbol: '≋',
        particleType: 'wisp',
        motionPattern: 'wave-dissolve',
        particleCount: 14,
        particleSize: { min: 4, max: 10 },
        colorModifier: {
            hueShift: 0,
            saturation: 0.85,
            brightness: 1.0,
            opacity: 0.7
        },
        trailLength: 0.6,
        breathSync: {
            inhale: { speed: 0.4, gather: true, glow: 0.7 },
            hold: { speed: 0.1, shimmer: true, glow: 0.9 },
            exhale: { speed: 0.5, disperse: true, glow: 0.6 },
            rest: { speed: 0.08, settle: true, glow: 0.35 }
        },
        description: 'Flowing wisps move like breath energy, gathering and releasing'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // DHYANA - Meditation/Stillness
    // Still, subtle, centered - minimal motion, soft presence
    // ═══════════════════════════════════════════════════════════════════════════
    'Dhyana': {
        name: 'Still Presence',
        symbol: '◯',
        particleType: 'soft-circle',
        motionPattern: 'orbit-steady',
        particleCount: 8,
        particleSize: { min: 8, max: 16 },
        colorModifier: {
            hueShift: 0,
            saturation: 0.4,
            brightness: 1.0,
            opacity: 0.35
        },
        trailLength: 0.15,
        breathSync: {
            inhale: { speed: 0.08, gather: false, glow: 0.4 },
            hold: { speed: 0.03, shimmer: false, glow: 0.6 },
            exhale: { speed: 0.08, disperse: false, glow: 0.4 },
            rest: { speed: 0.02, settle: true, glow: 0.3 }
        },
        description: 'Soft diffuse circles orbit slowly, embodying stillness'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // DRISHTI - Vision/Focus
    // Sharp, converging, focused - particles drawn to center point
    // ═══════════════════════════════════════════════════════════════════════════
    'Drishti': {
        name: 'Focused Point',
        symbol: '◉',
        particleType: 'spark',
        motionPattern: 'converge',
        particleCount: 16,
        particleSize: { min: 2, max: 5 },
        colorModifier: {
            hueShift: 0,
            saturation: 1.15,
            brightness: 1.3,
            opacity: 0.9
        },
        trailLength: 0.35,
        breathSync: {
            inhale: { speed: 0.7, gather: true, glow: 0.9 },
            hold: { speed: 0.15, shimmer: true, glow: 1.0 },
            exhale: { speed: 0.25, disperse: true, glow: 0.5 },
            rest: { speed: 0.35, settle: false, glow: 0.45 }
        },
        description: 'Sharp sparks converge to center point with focused intensity'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // JNANA - Knowledge/Wisdom
    // Geometric, crystalline, structured - diamond/hex shapes with precision
    // ═══════════════════════════════════════════════════════════════════════════
    'Jnana': {
        name: 'Crystal Wisdom',
        symbol: '◈',
        particleType: 'diamond',
        motionPattern: 'orbit-steady',
        particleCount: 10,
        particleSize: { min: 5, max: 10 },
        colorModifier: {
            hueShift: 0,
            saturation: 1.0,
            brightness: 1.2,
            opacity: 0.85
        },
        trailLength: 0.2,
        breathSync: {
            inhale: { speed: 0.35, gather: false, glow: 0.6 },
            hold: { speed: 0.15, shimmer: true, glow: 0.9 },
            exhale: { speed: 0.35, disperse: false, glow: 0.6 },
            rest: { speed: 0.1, settle: false, glow: 0.45 }
        },
        description: 'Crystalline diamonds orbit with precise geometric motion'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SAMYOGA - Union/Integration
    // All-encompassing, unified, integrating - many particles merging as one
    // ═══════════════════════════════════════════════════════════════════════════
    'Samyoga': {
        name: 'Unified Field',
        symbol: '⬡',
        particleType: 'fog',
        motionPattern: 'wave-dissolve',
        particleCount: 22,
        particleSize: { min: 12, max: 30 },
        colorModifier: {
            hueShift: 0,
            saturation: 0.5,
            brightness: 1.0,
            opacity: 0.25
        },
        trailLength: 0.8,
        breathSync: {
            inhale: { speed: 0.12, gather: true, glow: 0.45 },
            hold: { speed: 0.04, shimmer: false, glow: 0.6 },
            exhale: { speed: 0.15, disperse: true, glow: 0.5 },
            rest: { speed: 0.02, settle: true, glow: 0.35 }
        },
        description: 'Luminous fog particles merge and dissolve as unified field'
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
