// src/data/rituals/devotional/gratitude.js
// Gratitude Ritual - The Overflowing Cup

export const GRATITUDE = {
    id: 'gratitude',
    name: 'The Overflowing Cup',
    tradition: 'Universal / Abundance Practice',
    category: 'devotional',
    icon: '🏆',
    iconName: 'chalice',

    unlockStage: 'seedling',
    prerequisite: null,

    duration: { min: 8, max: 12 },
    recommendation: 'Daily practice, especially when feeling lack or scarcity.',
    description: 'Cultivate the felt sense of overflowing abundance and gratitude.',

    history: `The chalice symbol appears across traditions—the Holy Grail, the Cup of Jamshid, the ceremonial vessel. This practice uses visualization to shift from scarcity to abundance consciousness.`,

    steps: [
        {
            id: 'cup',
            name: 'The Cup',
            duration: 120,
            instruction: 'See an ornate golden chalice before you, empty and waiting. It represents your capacity to receive.',
            sensoryCues: [
                'The cup gleams in a spotlight, polished and perfect.',
                'Feel the emptiness—the space for receiving.',
                'This cup can never break, never be stolen.',
                'It is already precious before it is filled.'
            ],
            image: 'rituals/ritual_00016_.png',
        },
        {
            id: 'rain',
            name: 'The Rain',
            duration: 180,
            instruction: 'Drops of liquid gold begin falling. With each blessing you recall, more gold pours into the cup.',
            sensoryCues: [
                'Viscous, glowing gold drips from above.',
                'Name your blessings—each one adds to the flow.',
                'The gold splashes and pools, warm and luminous.',
                'The cup fills faster than you expected.'
            ],
            image: 'rituals/ritual_00017_.png',
        },
        {
            id: 'spill',
            name: 'The Spill',
            duration: 180,
            instruction: 'The cup overflows. Where the gold touches, flowers bloom. You have more than enough.',
            sensoryCues: [
                'Gold cascades over the rim, pooling on the ground.',
                'Tiny golden flowers sprout where it lands.',
                'You cannot contain all your blessings—they must be shared.',
                'This is the true nature of abundance.'
            ],
            image: 'rituals/ritual_00018_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Genuine feeling of gratitude',
            'Shift from scarcity to abundance mindset',
            'Desire to give and share',
            'Contentment and peace'
        ],
        closingInstruction: 'Open your hands. Imagine golden light flowing from them to others. Say: "I have enough. I am enough."'
    }
};
