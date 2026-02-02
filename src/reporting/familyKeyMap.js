// src/reporting/familyKeyMap.js
// Canonical practice family key mapping
// Maps session practiceId/mode to standardized family keys for aggregation

// Canonical family keys: breathwork, stillness, awareness_emotion, awareness_body_scan,
// awareness_sakshi, ritual, treatise, video, quiz, other

const FAMILY_KEY_MAPPINGS = {
    // Breathwork family
    'box-breath': 'breathwork',
    '4-7-8': 'breathwork',
    'resonance-breath': 'breathwork',
    'custom-breath': 'breathwork',
    'breath': 'breathwork',
    'breathwork': 'breathwork',

    // Stillness family
    'stillness': 'stillness',
    'body-scan': 'stillness',
    'scan': 'stillness',
    'meditation': 'stillness',

    // Awareness - Emotion family
    'awareness-emotion': 'awareness_emotion',
    'emotion-tracking': 'awareness_emotion',
    'emotion': 'awareness_emotion',

    // Awareness - Body Scan family
    'awareness-body-scan': 'awareness_body_scan',
    'somatic-awareness': 'awareness_body_scan',
    'body-awareness': 'awareness_body_scan',

    // Awareness - Sakshi (Observer) family
    'awareness-sakshi': 'awareness_sakshi',
    'sakshi': 'awareness_sakshi',
    'observer': 'awareness_sakshi',

    // Ritual family
    'ritual': 'ritual',
    'ritual-mode': 'ritual',
    'ceremony': 'ritual',
    'circuit-mode': 'ritual',
    'circuit': 'ritual',
    'circuit-training': 'ritual',

    // Wisdom family (Treatise)
    'treatise': 'treatise',
    'wisdom': 'treatise',
    'codex': 'treatise',
    'reading': 'treatise',

    // Video family
    'video': 'video',
    'guidance': 'video',

    // Quiz family
    'quiz': 'quiz',
    'assessment': 'quiz',

    // Visualization family
    'visualization': 'stillness',
    'sacred-geometry': 'stillness',
    'flower-of-life': 'stillness',
    'sri-yantra': 'stillness',

    // Sound family
    'sound': 'stillness',
    'sound-bath': 'stillness',
    'binaural': 'stillness',
    'cymatics': 'stillness',
};

/**
 * Map a session to its canonical family key
 * Supports multi-tier resolution: practiceId → practiceMode → configSnapshot.practiceType → fallback
 * @param {Object} session - Session object
 * @returns {string} - One of: breathwork, stillness, awareness_emotion, awareness_body_scan,
 *                             awareness_sakshi, ritual, treatise, video, quiz, other
 */
export function familyKeyOfSession(session) {
    if (!session) return 'other';

    // Tier 1: Check practiceId directly
    if (session.practiceId) {
        const mapped = FAMILY_KEY_MAPPINGS[session.practiceId.toLowerCase()];
        if (mapped) return mapped;
    }

    // Tier 2: Check practiceMode
    if (session.practiceMode) {
        const mapped = FAMILY_KEY_MAPPINGS[session.practiceMode.toLowerCase()];
        if (mapped) return mapped;
    }

    // Tier 3: Check configSnapshot.practiceType (for legacy compatibility)
    if (session.configSnapshot?.practiceType) {
        const mapped = FAMILY_KEY_MAPPINGS[session.configSnapshot.practiceType.toLowerCase()];
        if (mapped) return mapped;
    }

    // Tier 4: Check metadata.isHonor (honor logs)
    if (session.metadata?.isHonor) {
        // Honor logs use their domain field
        if (session.practiceId) {
            const mapped = FAMILY_KEY_MAPPINGS[session.practiceId.toLowerCase()];
            if (mapped) return mapped;
        }
        return 'treatise'; // Default honor to treatise family
    }

    // Fallback
    return 'other';
}

/**
 * Get all canonical family keys
 * @returns {string[]} - Array of valid family key values
 */
export function getAllFamilyKeys() {
    return [
        'breathwork',
        'stillness',
        'awareness_emotion',
        'awareness_body_scan',
        'awareness_sakshi',
        'ritual',
        'treatise',
        'video',
        'quiz',
        'other',
    ];
}

/**
 * Get human-readable label for a family key
 * @param {string} familyKey - One of the canonical family keys
 * @returns {string} - Display label
 */
export function labelForFamilyKey(familyKey) {
    const labels = {
        breathwork: 'Breath',
        stillness: 'Stillness',
        awareness_emotion: 'Emotion',
        awareness_body_scan: 'Body',
        awareness_sakshi: 'Observer',
        ritual: 'Ritual',
        treatise: 'Wisdom',
        video: 'Guidance',
        quiz: 'Learning',
        other: 'Other',
    };
    return labels[familyKey] || familyKey;
}
