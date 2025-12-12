// src/data/rituals/devotional/metta.js
// Metta Ritual - Loving Kindness expanding to all beings

export const METTA = {
    id: 'metta',
    name: 'Metta (Loving Kindness)',
    tradition: 'Buddhist / Theravada',
    category: 'devotional',
    icon: '🔥',
    iconName: 'fire',

    unlockStage: 'seedling',
    prerequisite: null,

    duration: { min: 10, max: 15 },
    recommendation: 'Daily practice, especially when feeling isolated or judgmental.',
    description: 'Expand loving kindness from self to all beings.',

    history: `Metta Bhavana is one of the oldest Buddhist meditation practices. It systematically cultivates unconditional love, starting with oneself and expanding to embrace all sentient beings without exception.`,

    steps: [
        {
            id: 'ember',
            name: 'The Ember',
            duration: 120,
            instruction: 'Find a small ember of warmth in your heart. Fan it gently with your breath.',
            sensoryCues: [
                'A single warm ember glows in the darkness of your chest.',
                'It is fragile but alive.',
                'Breathe gently—it brightens with each breath.',
                'This is your innate capacity for love.'
            ],
            image: 'rituals/ritual_00019_.png',
        },
        {
            id: 'campfire',
            name: 'The Campfire',
            duration: 180,
            instruction: 'The ember grows into a campfire. See loved ones gathering around, warmed by your light.',
            sensoryCues: [
                'The flame grows, crackling and warm.',
                'Familiar faces appear in the circle of light.',
                'You wish them happiness, health, peace.',
                'The warmth is shared, multiplied.'
            ],
            image: 'rituals/ritual_00020_.png',
        },
        {
            id: 'infinite',
            name: 'The Infinite',
            duration: 180,
            instruction: 'The fire expands to embrace the entire world. Every being is touched by your loving kindness.',
            sensoryCues: [
                'Your love becomes a web of golden light covering Earth.',
                'Every node is a being—human, animal, spirit.',
                'You wish happiness for all, without exception.',
                'There is no enemy, no stranger—only family.'
            ],
            image: 'rituals/ritual_00021_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Warmth and openness in the heart',
            'Reduced feelings of separation',
            'Compassion for self and others',
            'Sense of interconnection'
        ],
        closingInstruction: 'Silently repeat: "May all beings be happy. May all beings be free from suffering. May all beings be at peace."'
    }
};
