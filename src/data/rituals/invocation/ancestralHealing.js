// src/data/rituals/invocation/ancestralHealing.js
// Ancestral Healing Ritual - Connecting with the lineage

export const ANCESTRAL_HEALING = {
    id: 'ancestralHealing',
    name: 'Ancestral Healing',
    tradition: 'Shamanic / Family Constellation',
    category: 'invocation',
    icon: '👥',
    iconName: 'ancestors',

    unlockStage: 'flame',
    prerequisite: null,

    duration: { min: 12, max: 18 },
    recommendation: 'Perform on ancestor days, during grief, or when feeling disconnected.',
    description: 'Connect with and receive blessings from the ancestral lineage.',

    history: `Every mystical tradition honors the ancestors. This practice draws from shamanic journeying, Tibetan merit dedication, and family constellation therapy to heal the intergenerational field.`,

    steps: [
        {
            id: 'lineage',
            name: 'The Lineage',
            duration: 180,
            instruction: 'Turn to face your lineage. See the infinite line of ancestors stretching back through time.',
            sensoryCues: [
                'Glowing figures stand in a line behind you, fading into golden mist.',
                'Each one gave life to the next—an unbroken chain.',
                'Some you recognize; most are strangers. All are family.',
                'Feel the weight and support of ten thousand generations.'
            ],
            image: 'rituals/ritual_00007_.png',
        },
        {
            id: 'offering',
            name: 'The Offering',
            duration: 180,
            instruction: 'Bow deeply to your ancestors. Offer them your gratitude, your forgiveness, and your love.',
            sensoryCues: [
                'Golden dust and sparks float between you and them.',
                'Your bow carries the weight of genuine humility.',
                'You release any blame; you honor their struggles.',
                'The ancestors receive your offering with open hands.'
            ],
            image: 'rituals/ritual_00008_.png',
        },
        {
            id: 'reception',
            name: 'The Reception',
            duration: 180,
            instruction: 'Feel ancestral hands resting on your shoulders. Receive their blessing, strength, and wisdom.',
            sensoryCues: [
                'Warm, golden hands press gently on your shoulders.',
                'Their strength flows into you like warm honey.',
                'You inherit their resilience, their love, their lessons.',
                'You are not alone. You never were.'
            ],
            image: 'rituals/ritual_00009_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Feeling of support and connection',
            'Sense of belonging to something larger',
            'Release of inherited burdens',
            'Gratitude and peace'
        ],
        closingInstruction: 'Bow once more. Turn and face forward, carrying their blessing into your life.'
    }
};
