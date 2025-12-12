// src/data/rituals/transmutation/forgiveness.js
// Forgiveness Ritual - Cord Cutting and Release

export const FORGIVENESS = {
    id: 'forgiveness',
    name: 'Cord Cutting (Forgiveness)',
    tradition: 'Energy Healing / Shamanic',
    category: 'transmutation',
    icon: '⚔️',
    iconName: 'sword',

    unlockStage: 'flame',
    prerequisite: null,

    duration: { min: 10, max: 15 },
    recommendation: 'Perform when feeling bound to past hurts or relationships.',
    description: 'Sever energetic cords of attachment and resentment.',

    history: `Cord cutting appears in Huna, Reiki, and shamanic traditions. Energetic cords form between people through intense emotional experiences. This practice severs unhealthy attachments while preserving love.`,

    steps: [
        {
            id: 'cord',
            name: 'The Cord',
            duration: 120,
            instruction: 'See the thick, dark cord connecting you to the person or situation. Feel its weight.',
            sensoryCues: [
                'A heavy, fibrous cord connects your solar plexus to theirs.',
                'The cord looks like tar or heavy rope.',
                'It drains energy, creates tension, binds you.',
                'Acknowledge it without judgment.'
            ],
            image: 'rituals/ritual_00010_.png',
        },
        {
            id: 'severing',
            name: 'The Severing',
            duration: 120,
            instruction: 'A sword of pure white light appears. With one decisive cut, sever the cord completely.',
            sensoryCues: [
                'The sword is impossibly sharp, made of laser-white fire.',
                'One clean slice—sparks fly, the cord splits.',
                'Feel the immediate release of pressure.',
                'The cut is clean, final, complete.'
            ],
            image: 'rituals/ritual_00011_.png',
        },
        {
            id: 'release',
            name: 'The Release',
            duration: 180,
            instruction: 'Watch the severed cord dissolve into golden dust. Feel the lightness. Send blessings to the other.',
            sensoryCues: [
                'The dark cord crumbles into golden particles.',
                'The dust drifts away, dissolving into light.',
                'Your solar plexus heals and seals itself.',
                'You wish them well from a place of freedom.'
            ],
            image: 'rituals/ritual_00012_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Feeling lighter and freer',
            'Release of resentment or obsession',
            'Peace and closure',
            'Ability to wish the other well'
        ],
        closingInstruction: 'Place your hand over your solar plexus. Affirm: "I am free. I release you with love."'
    }
};
