// src/data/rituals/invocation/heartOpening.js
// Heart Opening Ritual - Breaking the armor, blooming the lotus

export const HEART_OPENING = {
    id: 'heartOpening',
    name: 'Heart Opening',
    tradition: 'Bhakti Yoga / Heart Chakra Work',
    category: 'invocation',
    icon: '🪷',
    iconName: 'lotus',

    unlockStage: 'seedling',
    prerequisite: null,

    duration: { min: 10, max: 15 },
    recommendation: 'Perform when feeling closed, defended, or disconnected from love.',
    description: 'Soften the armor around the heart and allow love to bloom.',

    history: `The armored heart is a universal human condition. This practice draws from Hindu heart chakra work (Anahata), Christian mystical prayer, and Sufi heart practices to crack open the protective shell.`,

    steps: [
        {
            id: 'armor',
            name: 'The Armor',
            duration: 120,
            instruction: 'Feel the protective armor around your heart. See it as dark stone—heavy, cracked, with light pushing through.',
            sensoryCues: [
                'Your chest is encased in heavy stone plates.',
                'The armor was once necessary—honor its protection.',
                'Cracks glow with pink light, straining to break free.',
                'Feel the tension of holding on.'
            ],
            image: 'rituals/ritual_00013_.png',
        },
        {
            id: 'bloom',
            name: 'The Bloom',
            duration: 180,
            instruction: 'The armor shatters. A luminous lotus flower blooms in its place, emerald and pink, glowing with life.',
            sensoryCues: [
                'Stone falls away, dissolving before it hits the ground.',
                'A lotus unfolds petal by petal in your chest.',
                'Emerald green and soft pink light radiate outward.',
                'You feel vulnerable, alive, tender.'
            ],
            image: 'rituals/ritual_00014_.png',
        },
        {
            id: 'radiance',
            name: 'The Radiance',
            duration: 180,
            instruction: 'The lotus blazes with light. Love radiates from your heart in all directions, touching everything.',
            sensoryCues: [
                'The lotus becomes blindingly bright.',
                'Waves of pink and green light fill the room, the world.',
                'You cannot contain this love—it overflows.',
                'Everything you touch is blessed.'
            ],
            image: 'rituals/ritual_00015_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Warmth and expansion in the chest',
            'Feeling of vulnerability and openness',
            'Spontaneous gratitude or tears',
            'Desire to connect and give'
        ],
        closingInstruction: 'Cross your arms over your chest in a self-embrace. Whisper: "I am love."'
    }
};
