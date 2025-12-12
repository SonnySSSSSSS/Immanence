// src/data/fourModes.js
// The Four Modes of Participation - configuration data

export const FOUR_MODES = [
    {
        id: 'mirror',
        name: 'Mirror',
        tagline: 'Seeing what is.',
        color: '--gold-80',
        icon: '◐',
        description: 'Pure observation without judgment. Witnessing experience as it arises.',
    },
    {
        id: 'resonator',
        name: 'Resonator',
        tagline: 'Feeling with.',
        color: '--accent-10',
        icon: '☷',
        description: 'Attuning to the emotional frequency. Empathic presence.',
    },
    {
        id: 'prism',
        name: 'Prism',
        tagline: 'Reframing and patterning.',
        color: '--gold-60',
        icon: '⌗',
        description: 'Transforming perspective. Finding new angles on old patterns.',
    },
    {
        id: 'sword',
        name: 'Sword',
        tagline: 'Cutting and choosing.',
        color: '--accent-ember',
        icon: '⚔',
        description: 'Decisive action. Discernment and commitment.',
    },
];

export const FOUR_MODES_BY_ID = FOUR_MODES.reduce((acc, mode) => {
    acc[mode.id] = mode;
    return acc;
}, {});
