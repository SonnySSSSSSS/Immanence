// src/icons/iconNames.js
// Central registry of all icon names

export const ICON_NAMES = {
    // Domain icons
    BREATHWORK: 'breathwork',
    VISUALIZATION: 'visualization',
    WISDOM: 'wisdom',
    FOUNDATION: 'foundation',
    PRACTICE: 'practice',

    // Sensory type icons
    BODY_SCAN: 'bodyScan',
    BHAKTI: 'bhakti',
    VIPASSANA: 'vipassana',
    SAKSHI: 'sakshi',

    // Ritual category icons
    GROUNDING: 'grounding',
    FLOW: 'flow',
    TRANSITION: 'transition',
    DEVOTION: 'devotion',
    FIRE: 'fire',
    COSMOS: 'cosmos',
    HEART: 'heart',
    SPIRAL: 'spiral',

    // Individual ritual icons
    STANDING_MEDITATION: 'standingMeditation',
    ROOT_LOCK: 'rootLock',
    LOWER_DANTIEN: 'lowerDantien',

    // Bhakti ritual icons
    GRATITUDE: 'gratitude',
    HEART_OPENING: 'heartOpening',
    BLESSING: 'blessing',
    PEACE: 'peace',
    LOVING_KINDNESS: 'lovingKindness',
    NATURE: 'nature',
    TREE: 'tree',
    SOLAR: 'solar',
    FLAME: 'flame',
    INFINITY: 'infinity',

    // Streak state icons
    STREAK_ACTIVE: 'streakActive',
    MILESTONE: 'milestone',
    WARNING: 'warning',
    FROZEN: 'frozen',
    BROKEN: 'broken',

    // Utility icons
    EXPORT: 'export',
    COPY: 'copy',
    BOOKMARK: 'bookmark',
    UNWITNESSED: 'unwitnessed'
};

// Emoji to icon name mapping for easy migration
export const EMOJI_TO_ICON = {
    '🫁': ICON_NAMES.BREATHWORK,
    '👁️': ICON_NAMES.VISUALIZATION,
    '📖': ICON_NAMES.WISDOM,
    '🌱': ICON_NAMES.FOUNDATION,
    '🧘': ICON_NAMES.PRACTICE,
    '🫸': ICON_NAMES.BODY_SCAN,
    '💗': ICON_NAMES.BHAKTI,
    '🌊': ICON_NAMES.FLOW,
    '◯': ICON_NAMES.SAKSHI,
    '🌍': ICON_NAMES.GROUNDING,
    '🔄': ICON_NAMES.TRANSITION,
    '🙏': ICON_NAMES.DEVOTION,
    '🔥': ICON_NAMES.FIRE,
    '🌌': ICON_NAMES.COSMOS,
    '💖': ICON_NAMES.HEART,
    '🌀': ICON_NAMES.SPIRAL,
    '🔒': ICON_NAMES.ROOT_LOCK,
    '🔋': ICON_NAMES.LOWER_DANTIEN,
    '✨': ICON_NAMES.BLESSING,
    '🕊️': ICON_NAMES.PEACE,
    '💛': ICON_NAMES.LOVING_KINDNESS,
    '🌿': ICON_NAMES.NATURE,
    '🌳': ICON_NAMES.TREE,
    '☀️': ICON_NAMES.SOLAR,
    '♾️': ICON_NAMES.INFINITY,
    '⚠️': ICON_NAMES.WARNING,
    '❄️': ICON_NAMES.FROZEN,
    '💔': ICON_NAMES.BROKEN,
    '📤': ICON_NAMES.EXPORT,
    '📋': ICON_NAMES.COPY,
    '🔖': ICON_NAMES.BOOKMARK,
    '👁️‍🗨️': ICON_NAMES.UNWITNESSED
};
