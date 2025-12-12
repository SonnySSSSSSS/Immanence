// src/state/stageConfig.js
// Stage progression configuration for Immanence OS
// Tracks macro identity evolution over practice days

/**
 * Stage Definitions
 * 
 * Each stage has:
 * - order: progression rank
 * - duration: days required to complete this stage
 * - color: base color for avatar/UI
 * - next: next stage key (null if ceiling)
 * - isCeiling: true if this is the highest progression
 */
export const STAGES = {
    SEEDLING: {
        order: 0,
        duration: 90,      // days
        color: 'green',
        displayName: 'Seedling',
        next: 'EMBER',
    },
    EMBER: {
        order: 1,
        duration: 90,
        color: 'orange',
        displayName: 'Ember',
        next: 'FLAME',
    },
    FLAME: {
        order: 2,
        duration: 90,
        color: 'gold',
        displayName: 'Flame',
        next: 'BEACON',
    },
    BEACON: {
        order: 3,
        duration: 90,
        color: 'blue',
        displayName: 'Beacon',
        next: 'STELLAR_I',
    },
    STELLAR_I: {
        order: 4,
        duration: 180,
        color: 'purple',
        displayName: 'Stellar I',
        next: 'STELLAR_II',
        stellarSubstage: 1,
    },
    STELLAR_II: {
        order: 5,
        duration: 180,
        color: 'purple',     // Same base, visual modifiers differ
        displayName: 'Stellar II',
        next: 'STELLAR_III',
        stellarSubstage: 2,
    },
    STELLAR_III: {
        order: 6,
        duration: 180,
        color: 'purple',
        displayName: 'Stellar III',
        next: null,          // Ceiling for now
        isCeiling: true,
        stellarSubstage: 3,
    },
};

/**
 * Total practice days required to REACH each stage
 * 
 * SEEDLING: 0 days (starting point)
 * EMBER: 90 days (3 months)
 * FLAME: 180 days (6 months)
 * BEACON: 270 days (9 months)
 * STELLAR_I: 360 days (12 months)
 * STELLAR_II: 540 days (18 months)
 * STELLAR_III: 720 days (24 months)
 * 
 * 720 days = ~24 months to reach Stellar III
 * Then 180 more days to "complete" Stellar III = 30 months total
 */
export const STAGE_THRESHOLDS = {
    SEEDLING: 0,
    EMBER: 90,
    FLAME: 180,
    BEACON: 270,
    STELLAR_I: 360,
    STELLAR_II: 540,
    STELLAR_III: 720,
};

/**
 * Get stage key from total practice days
 */
export function getStageForDays(totalPracticeDays) {
    // Find highest threshold crossed (sort descending)
    const stages = Object.entries(STAGE_THRESHOLDS)
        .sort((a, b) => b[1] - a[1]);

    for (const [stage, threshold] of stages) {
        if (totalPracticeDays >= threshold) {
            return stage;
        }
    }
    return 'SEEDLING';
}

/**
 * Get display name for a stage key
 */
export function getStageDisplayName(stageKey) {
    return STAGES[stageKey]?.displayName || stageKey;
}

/**
 * Get progress within current stage (0.0 - 1.0)
 */
export function getStageProgress(totalPracticeDays) {
    const currentStage = getStageForDays(totalPracticeDays);
    const stageConfig = STAGES[currentStage];
    const threshold = STAGE_THRESHOLDS[currentStage];

    const daysInStage = totalPracticeDays - threshold;
    const progress = Math.min(1, daysInStage / stageConfig.duration);

    return progress;
}

/**
 * Stellar substage differentiation
 * 
 * | Substage | Visual Treatment | Implication |
 * |----------|------------------|-------------|
 * | Stellar I | Base Stellar palette | Established practitioner |
 * | Stellar II | Deeper saturation, additional particle layer | Deepening mastery |
 * | Stellar III | Crown element or halo refinement | Approaching transmission capacity |
 */
export function getStellarSubstage(stageKey) {
    return STAGES[stageKey]?.stellarSubstage || null;
}
