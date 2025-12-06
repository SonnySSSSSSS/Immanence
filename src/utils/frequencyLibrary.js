// src/utils/frequencyLibrary.js
// Curated frequency sets for cymatics visualization

/**
 * Each frequency entry contains:
 * - hz: frequency in Hertz
 * - n, m: Chladni mode numbers for visualization
 * - name: Display name
 * - quality: Descriptive quality/association
 */

export const SOLFEGGIO_SET = [
    { hz: 174, n: 2, m: 3, name: 'Foundation', quality: 'Grounding, security' },
    { hz: 285, n: 3, m: 4, name: 'Quantum', quality: 'Cellular healing' },
    { hz: 396, n: 4, m: 5, name: 'Liberation', quality: 'Release of fear' },
    { hz: 417, n: 4, m: 6, name: 'Change', quality: 'Transformation' },
    { hz: 528, n: 5, m: 7, name: 'Love', quality: 'Harmony, "Miracle"' },
    { hz: 639, n: 6, m: 8, name: 'Connection', quality: 'Relationships' },
    { hz: 741, n: 7, m: 9, name: 'Expression', quality: 'Creativity' },
    { hz: 852, n: 8, m: 11, name: 'Intuition', quality: 'Third eye' },
    { hz: 963, n: 9, m: 13, name: 'Unity', quality: 'Crown, oneness' }
];

export const PLANETARY_SET = [
    { hz: 126.22, n: 2, m: 3, name: 'Sun', quality: 'Vitality, identity' },
    { hz: 141.27, n: 2, m: 4, name: 'Mercury', quality: 'Communication' },
    { hz: 136.10, n: 2, m: 3, name: 'Om/Earth', quality: 'Grounding' },
    { hz: 144.72, n: 3, m: 4, name: 'Mars', quality: 'Action, will' },
    { hz: 183.58, n: 3, m: 5, name: 'Jupiter', quality: 'Expansion' },
    { hz: 147.85, n: 3, m: 4, name: 'Saturn', quality: 'Structure' },
    { hz: 221.23, n: 3, m: 5, name: 'Venus', quality: 'Love, beauty' }
];

export const FUNDAMENTAL_SET = [
    { hz: 256, n: 4, m: 5, name: 'C (Scientific)', quality: 'Mathematical purity' },
    { hz: 288, n: 4, m: 6, name: 'D', quality: '9:8 ratio' },
    { hz: 320, n: 5, m: 6, name: 'E', quality: '5:4 ratio' },
    { hz: 341.3, n: 5, m: 7, name: 'F', quality: '4:3 ratio' },
    { hz: 384, n: 6, m: 7, name: 'G', quality: '3:2 ratio' },
    { hz: 426.7, n: 6, m: 8, name: 'A', quality: '5:3 ratio' },
    { hz: 480, n: 7, m: 9, name: 'B', quality: '15:8 ratio' },
    { hz: 512, n: 8, m: 10, name: 'C (octave)', quality: '2:1 ratio' }
];

export const FREQUENCY_SETS = {
    solfeggio: SOLFEGGIO_SET,
    planetary: PLANETARY_SET,
    fundamental: FUNDAMENTAL_SET
};

/**
 * Get a frequency entry by hz value
 */
export function getFrequencyByHz(hz, setName = 'solfeggio') {
    const set = FREQUENCY_SETS[setName];
    if (!set) return null;

    return set.find(f => Math.abs(f.hz - hz) < 0.1);
}

/**
 * Get a frequency entry by name
 */
export function getFrequencyByName(name, setName = 'solfeggio') {
    const set = FREQUENCY_SETS[setName];
    if (!set) return null;

    return set.find(f => f.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all frequency sets as array
 */
export function getAllSets() {
    return [
        { id: 'solfeggio', name: 'Solfeggio', frequencies: SOLFEGGIO_SET },
        { id: 'planetary', name: 'Planetary', frequencies: PLANETARY_SET },
        { id: 'fundamental', name: 'Fundamental', frequencies: FUNDAMENTAL_SET }
    ];
}
