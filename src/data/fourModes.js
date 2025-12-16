// src/data/fourModes.js
// The Four Modes - Immanence Engine v1
// Linear chain: Mirror → Prism → Wave → Sword

export const FOUR_MODES = [
    {
        id: 'mirror',
        name: 'Mirror',
        tagline: 'Observation. What happened.',
        color: '--gold-80',
        icon: '◐',
        description: 'Establish a neutral, immutable anchor. Record what a camera would capture.',
        constraint: 'No adjectives. No identity labels. No assumed intent.',
        test: 'Would a video camera capture this?',
        sequence: 0,
    },
    {
        id: 'prism',
        name: 'Prism',
        tagline: 'Separation. Fact from narrative.',
        color: '--gold-60',
        icon: '⌗',
        description: 'Distinguish what happened from the story you tell about it.',
        constraint: 'You must categorize every thought.',
        test: 'Does the locked Mirror sentence prove this?',
        sequence: 1,
    },
    {
        id: 'wave',
        name: 'Wave',
        tagline: 'Capacity. Ride the intensity.',
        color: '--accent-10',
        icon: '☷',
        description: 'Endure intensity without acting out. Observe sensation until it moves.',
        constraint: 'You cannot act on impulses during the timer.',
        test: 'Can you hold this without discharge?',
        sequence: 2,
    },
    {
        id: 'sword',
        name: 'Sword',
        tagline: 'Commitment. Values-aligned action.',
        color: '--accent-ember',
        icon: '⚔',
        description: 'Define a specific, time-bound behavior. Commit with acknowledged cost.',
        constraint: 'No vague intentions. Action must be concrete.',
        test: 'Is this specific enough to verify?',
        sequence: 3,
    },
];

export const FOUR_MODES_BY_ID = FOUR_MODES.reduce((acc, mode) => {
    acc[mode.id] = mode;
    return acc;
}, {});

// Mode sequence for linear enforcement
export const MODE_SEQUENCE = ['mirror', 'prism', 'wave', 'sword'];

// Chain states
export const CHAIN_STATES = {
    NOT_STARTED: 'not_started',
    MIRROR_ACTIVE: 'mirror_active',
    MIRROR_LOCKED: 'mirror_locked',
    PRISM_ACTIVE: 'prism_active',
    PRISM_LOCKED: 'prism_locked',
    PRISM_SKIPPED: 'prism_skipped',
    WAVE_ACTIVE: 'wave_active',
    WAVE_LOCKED: 'wave_locked',
    WAVE_SKIPPED: 'wave_skipped',
    WAVE_ABORTED: 'wave_aborted',
    SWORD_ACTIVE: 'sword_active',
    SWORD_LOCKED: 'sword_locked',
    CHAIN_COMPLETE: 'chain_complete',
};

// Validation: E-Prime violations (verbs of being that encourage identity statements)
export const E_PRIME_VIOLATIONS = [
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
    "isn't", "aren't", "wasn't", "weren't",
    "i'm", "you're", "he's", "she's", "it's", "we're", "they're",
];

// Validation: Subjective modifiers to flag (soft warning, not rejection)
export const SUBJECTIVE_MODIFIERS = [
    'angrily', 'rudely', 'aggressively', 'purposefully', 'deliberately',
    'clearly', 'obviously', 'apparently', 'probably', 'definitely',
    'always', 'never', 'constantly', 'completely', 'totally',
    'good', 'bad', 'wrong', 'right', 'stupid', 'smart', 'crazy',
    'tried to', 'wanted to', 'meant to', 'intended to',
];

// Validation: Intent attribution words (hard rejection in Mirror)
export const INTENT_WORDS = [
    'ignored', 'dismissed', 'rejected', 'attacked', 'manipulated',
    'pretended', 'lied', 'betrayed', 'abandoned', 'threatened',
    'insulted', 'mocked', 'sabotaged', 'undermined',
];

// Context categories for Pattern Review
export const CONTEXT_CATEGORIES = [
    'workplace',
    'home',
    'relationship',
    'family',
    'digital',
    'public',
    'internal', // self-directed
    'other',
];

// Action types for Sword mode
export const ACTION_TYPES = {
    ACTION: 'action',           // I will do X
    RESTRAINT: 'restraint',     // I will not do X
    NON_ACTION: 'non_action',   // Conscious non-action
};
