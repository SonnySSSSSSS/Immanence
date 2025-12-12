// src/data/rituals/bhakti/divineLight.js
// Divine Light Ritual - Purification through divine light descent

export const DIVINE_LIGHT = {
    id: 'divineLight',
    name: 'Divine Light Descent',
    tradition: 'Universal Mysticism',
    category: 'purification',
    icon: '✦',
    iconName: 'star',

    unlockStage: 'seedling',
    prerequisite: null,

    duration: { min: 10, max: 15 },
    recommendation: 'Best performed at dawn or before sleep.',
    description: 'Invoke divine light to purify and illuminate the energy body.',

    history: `The descent of divine light is found across all mystical traditions—from the Kabbalistic "Or Ein Sof" to the Christian "Holy Spirit" to the Hindu "Jyoti." This practice channels primordial light through the central axis of the body, cleansing and illuminating.`,

    steps: [
        {
            id: 'source',
            name: 'The Source',
            duration: 180,
            instruction: 'Visualize a brilliant, diamond-white star hovering six inches above the crown of your head. Feel its radiant presence.',
            sensoryCues: [
                'The star is impossibly bright yet does not hurt your inner eye.',
                'Feel a warmth and pressure at the very top of your skull.',
                'Hear a high, crystalline tone emanating from the light.',
                'The star pulses gently, alive and aware.'
            ],
            image: 'rituals/ritual_00001_.png',
        },
        {
            id: 'flush',
            name: 'The Flush',
            duration: 240,
            instruction: 'Allow the light to pour down through your crown, flooding your entire body. Feel it push out all darkness and debris.',
            sensoryCues: [
                'Liquid light cascades through your skull, your throat, your chest.',
                'Dark smoke exits through your pores, dissolving harmlessly.',
                'Your spine becomes a pillar of brilliant white fire.',
                'Every cell is washed clean, vibrating at a higher frequency.'
            ],
            image: 'rituals/ritual_00002_.png',
        },
        {
            id: 'anchor',
            name: 'The Anchor',
            duration: 180,
            instruction: 'Ground the light by sending golden roots from your base deep into the earth. The circuit is complete.',
            sensoryCues: [
                'Feel roots of ember-gold extending from your perineum.',
                'The roots dig deep into warm, dark soil.',
                'You are a conduit between heaven and earth.',
                'The energy stabilizes, humming steadily.'
            ],
            image: 'rituals/ritual_00003_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Feeling cleansed and light',
            'Warmth in the central channel',
            'Mental clarity and stillness',
            'Sense of protection and blessing'
        ],
        closingInstruction: 'Seal the energy by placing both palms over your heart. Bow to the Source.'
    }
};
