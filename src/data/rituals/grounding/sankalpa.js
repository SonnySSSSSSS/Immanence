// src/data/rituals/grounding/sankalpa.js
// Sankalpa Ritual - Planting the Seed of Intention

export const SANKALPA = {
    id: 'sankalpa',
    name: 'Sankalpa (Intention Seed)',
    tradition: 'Yoga Nidra / Vedic',
    category: 'grounding',
    icon: '🌱',
    iconName: 'seed',

    unlockStage: 'seedling',
    prerequisite: null,

    duration: { min: 8, max: 12 },
    recommendation: 'Perform at new moon or when beginning new ventures.',
    description: 'Plant a deep intention in the fertile void of consciousness.',

    history: `Sankalpa is an ancient Vedic practice of planting a resolve in the subconscious mind during states of deep relaxation. Unlike goals, a Sankalpa is felt as already true—a seed that will inevitably bloom.`,

    steps: [
        {
            id: 'void',
            name: 'The Void',
            duration: 120,
            instruction: 'Enter the fertile darkness. Sense infinite potential in the stillness before creation.',
            sensoryCues: [
                'You float in a warm, dark womb of possibility.',
                'There is no form here, only potential.',
                'A faint golden horizon glimmers in the distance.',
                'Feel the quiet power of the unmanifest.'
            ],
            image: 'rituals/ritual_00004_.png',
        },
        {
            id: 'formation',
            name: 'The Formation',
            duration: 180,
            instruction: 'A single golden seed appears, containing your deepest intention. See it clearly. Feel its weight.',
            sensoryCues: [
                'The seed glows with concentrated purpose.',
                'Sacred geometry spirals around it—the Flower of Life.',
                'Your intention is encoded in its crystalline structure.',
                'It hums with quiet certainty.'
            ],
            image: 'rituals/ritual_00005_.png',
        },
        {
            id: 'planting',
            name: 'The Planting',
            duration: 180,
            instruction: 'Bury the seed deep within your being. It pulses beneath the surface, already beginning to grow.',
            sensoryCues: [
                'The seed descends into the dark earth of your subconscious.',
                'A faint vertical pulse of light—the first shoot.',
                'It needs no tending; it grows on its own.',
                'Trust the process. It is already done.'
            ],
            image: 'rituals/ritual_00006_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Clear sense of your core intention',
            'Feeling of quiet confidence',
            'The intention feels inevitable, not effortful',
            'Deep relaxation and trust'
        ],
        closingInstruction: 'Whisper your Sankalpa three times silently. Then release it completely.'
    }
};
