// src/data/rituals/invocation/deityYoga.js
// Deity Yoga Ritual - Summoning and merging with the divine

export const DEITY_YOGA = {
    id: 'deityYoga',
    name: 'Deity Yoga',
    tradition: 'Tibetan Buddhist / Tantric',
    category: 'invocation',
    icon: '👁',
    iconName: 'eye',

    unlockStage: 'ember',
    prerequisite: null,

    duration: { min: 15, max: 25 },
    recommendation: 'Perform for deep transformation and accessing higher qualities.',
    description: 'Invoke a divine form and merge with its qualities.',

    history: `Deity Yoga is central to Vajrayana Buddhism. By visualizing oneself as the deity, one accesses enlightened qualities directly. This practice is found similarly in Hindu puja and Western ceremonial magic.`,

    steps: [
        {
            id: 'summoning',
            name: 'The Summoning',
            duration: 180,
            instruction: 'Call forth the deity. See a towering luminous figure manifest before you, made of golden light.',
            sensoryCues: [
                'A vast being of pure light coalesces from the void.',
                'They sit in perfect stillness, radiating power.',
                'Their form is geometric, ancient, beyond human.',
                'Feel their presence fill the space.'
            ],
            image: 'rituals/ritual_00025_.png',
        },
        {
            id: 'gaze',
            name: 'The Gaze',
            duration: 180,
            instruction: 'Meet the deity\'s eyes. In their gaze, see your own reflection—you are already what you seek.',
            sensoryCues: [
                'Golden eyes like mirrors regard you.',
                'In the reflection, you see your own face—luminous.',
                'The boundary between you and them blurs.',
                'There is recognition. You were never separate.'
            ],
            image: 'rituals/ritual_00026_.png',
        },
        {
            id: 'merge',
            name: 'The Merge',
            duration: 180,
            instruction: 'Step forward. Merge with the deity. Your body becomes light. You ARE the divine form.',
            sensoryCues: [
                'You step into their luminous body.',
                'Light floods every cell—you dissolve and reform.',
                'Looking down, your hands are golden, translucent.',
                'You wear their form. Their qualities are yours.'
            ],
            image: 'rituals/ritual_00027_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Feeling of expanded identity',
            'Access to divine qualities',
            'Dissolution of ordinary self-image',
            'Profound stillness and power'
        ],
        closingInstruction: 'Press palms together at heart. The deity dissolves into a seed of light in your heart. Carry them with you.'
    }
};
