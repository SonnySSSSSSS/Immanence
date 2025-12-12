// src/data/rituals/witnessing/union.js
// Union Ritual - Dissolving into the infinite

export const UNION = {
    id: 'union',
    name: 'Union (Oceanic Dissolution)',
    tradition: 'Non-Dual / Advaita',
    category: 'witnessing',
    icon: '💧',
    iconName: 'droplet',

    unlockStage: 'star',
    prerequisite: null,

    duration: { min: 12, max: 20 },
    recommendation: 'For experienced practitioners. Best in deep stillness.',
    description: 'Experience the dissolution of the separate self into infinite awareness.',

    history: `The "oceanic feeling" was described by Romain Rolland to Freud as the essence of mystical experience. This practice induces the direct experience of non-separation through the metaphor of the drop returning to the ocean.`,

    steps: [
        {
            id: 'drop',
            name: 'The Drop',
            duration: 180,
            instruction: 'You are a single drop of water, suspended in space. Within you is reflected the entire cosmos.',
            sensoryCues: [
                'Feel the surface tension of your individuality.',
                'You are complete, perfect, alone.',
                'Inside you, a galaxy swirls in miniature.',
                'Is the cosmos in you, or you in it?'
            ],
            image: 'rituals/ritual_00028_.png',
        },
        {
            id: 'impact',
            name: 'The Impact',
            duration: 120,
            instruction: 'You fall. The moment of contact with the infinite ocean. Ripples spread outward forever.',
            sensoryCues: [
                'The surface approaches—dark, vast, waiting.',
                'Contact. Ripples radiate in perfect circles.',
                'The membrane of self begins to dissolve.',
                'Where do you end and the ocean begin?'
            ],
            image: 'rituals/ritual_00029_.png',
        },
        {
            id: 'ocean',
            name: 'The Ocean',
            duration: 180,
            instruction: 'You are the ocean. There is no drop. There never was. Only this infinite expanse of awareness.',
            sensoryCues: [
                'Boundless dark water under starlight.',
                'No horizon—infinite in all directions.',
                'The "you" that was the drop is everywhere and nowhere.',
                'This is your true nature. Rest here.'
            ],
            image: 'rituals/ritual_00030_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Dissolution of ego boundaries',
            'Experience of vastness and peace',
            'Loss of sense of separate self',
            'Profound stillness and void'
        ],
        closingInstruction: 'Remain in the ocean as long as you wish. When ready, a new drop will condense—and you will return.'
    }
};
