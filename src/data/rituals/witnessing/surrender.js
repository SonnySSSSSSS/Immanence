// src/data/rituals/witnessing/surrender.js
// Surrender Ritual - Letting go and floating downstream

export const SURRENDER = {
    id: 'surrender',
    name: 'Surrender',
    tradition: 'Taoist / Christian Mysticism',
    category: 'witnessing',
    icon: '🌊',
    iconName: 'wave',

    unlockStage: 'flame',
    prerequisite: null,

    duration: { min: 10, max: 15 },
    recommendation: 'Perform when feeling controlling, anxious, or resistant to change.',
    description: 'Release control and surrender to the flow of life.',

    history: `"Let go and let God." The practice of surrender appears in Taoism (wu wei), Christian mysticism (abandonment to Divine Providence), and Twelve-Step programs. It is the antidote to the ego's grip.`,

    steps: [
        {
            id: 'grip',
            name: 'The Grip',
            duration: 120,
            instruction: 'Feel where you are holding on. See your hands as stone, clenched tight around your fears.',
            sensoryCues: [
                'Your hands are like cold grey stone.',
                'Every muscle is tense, holding desperately.',
                'You cannot remember when you started gripping.',
                'Acknowledge the exhaustion of control.'
            ],
            image: 'rituals/ritual_00022_.png',
        },
        {
            id: 'release',
            name: 'The Release',
            duration: 180,
            instruction: 'Let go. Watch your hands turn to sand and blow away in the wind.',
            sensoryCues: [
                'Your stone fingers loosen, crumble, fall away.',
                'Sand slips through where grip once was.',
                'The wind carries it into the distance.',
                'What you were holding dissolves. It was never yours.'
            ],
            image: 'rituals/ritual_00023_.png',
        },
        {
            id: 'float',
            name: 'The Float',
            duration: 180,
            instruction: 'You are floating on a dark river under the stars. The current carries you. You need do nothing.',
            sensoryCues: [
                'Cool water supports your weightless body.',
                'Stars wheel slowly overhead.',
                'The river knows where to go.',
                'You surrender. You are carried. You are safe.'
            ],
            image: 'rituals/ritual_00024_.png',
        }
    ],

    completion: {
        expectedOutput: [
            'Deep physical relaxation',
            'Release of mental tension',
            'Trust in the process of life',
            'Peace and acceptance'
        ],
        closingInstruction: 'Open your palms. Whisper: "Thy will, not mine. I surrender."'
    }
};
