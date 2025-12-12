export const LOWER_DAN_TIEN = {
    id: 'lowerDanTien',
    name: 'Lower Dan Tien Settling',
    tradition: 'Taoist Neidan (Internal Alchemy)',
    category: 'grounding',
    icon: '🔋',
    iconName: 'foundation', // For Icon component

    // Unlock requirements
    unlockStage: 'seedling',
    prerequisite: null,

    // Metadata
    duration: { min: 13, max: 20 }, // 2+5+3+3 = 13 mins min
    recommendation: 'Best done before bed or when feeling anxious/ungrounded.',
    description: 'Gathering scattered Qi back into the vital storage center.',

    // Historical context
    history: `The Lower Dan Tien (Elixir Field) is the primary energy storage center in the body, located about two inches below the navel and inside the body. In Taoist alchemy, this is where Jing (essence) is converted into Qi (vitality).`,

    // Step-by-step guidance
    steps: [
        {
            id: 'locating',
            name: 'Locating the Center',
            duration: 120, // 2 minutes
            instruction: 'Sit comfortably. Place your palms over your lower abdomen, left hand touching the body, right hand over left. Focus your attention deep inside, behind the navel.',
            sensoryCues: [
                'Feel the warmth of your hands penetrating the skin.',
                'Direct your mind to the physical center of gravity of your body.',
                'Relax the belly muscles completely.',
                'Feel the rise and fall of the abdomen against your hands.'
            ],
            image: 'rituals/lower-dan-tien/step-1-locating.png',
            imagePrompt: 'Seated front view, lower abdomen glows with amber orb. Hand rests showing location.'
        },
        {
            id: 'gathering',
            name: 'Gathering Breath',
            duration: 300, // 5 minutes
            instruction: 'Visualize that you are breathing directly through your navel. With every inhale, draw energy from the universe into a sphere in your center. Exhale and condense it.',
            sensoryCues: [
                'See scattered lights from your limbs flowing back to the center.',
                'Feel the sphere growing heavier and denser, not larger.',
                'Imagine filling a battery or reservoir.',
                'Any excess thought energy drains down into this pool.'
            ],
            image: 'rituals/lower-dan-tien/step-2-gathering.png',
            imagePrompt: 'Full body, streams flow inward from limbs/organs to dan tien sphere. Show inhale/exhale.'
        },
        {
            id: 'compression',
            name: 'Compression',
            duration: 180, // 3 minutes
            instruction: 'Now, use your mind to gently compress this sphere of energy. Make it smaller but brighter, like a miniature sun. Pack the Qi deep into the bone marrow and fascia.',
            sensoryCues: [
                'Feel a pleasant pressure or fullness in the abdomen.',
                'The point of light becomes white-hot but stable.',
                'Sense the energy connecting to your kidneys (lower back).',
                'You feel solid, integrated, and heavy.'
            ],
            image: 'rituals/lower-dan-tien/step-3-compression.png',
            imagePrompt: 'Lower body emphasis, sphere becomes smaller and brighter across 3-4 frames.'
        },
        {
            id: 'resting',
            name: 'Resting the Mind',
            duration: 180, // 3 minutes
            instruction: 'Drop your mind *into* the Dan Tien. Do not look at it; *be* in it. Rest your awareness in this warm, dark ocean of vitality.',
            sensoryCues: [
                'Your "head center" feels empty and cool.',
                'Your "belly center" feels full and warm.',
                'Enjoy the feeling of having nothing to do.',
                'Rest in the source of your vitality.'
            ],
            image: 'rituals/lower-dan-tien/step-4-resting.png',
            imagePrompt: 'Full meditation pose, steady warm glow radiating subtly outward. Deep settledness.'
        }
    ],

    // Completion guidance
    completion: {
        expectedOutput: [
            'Deep sense of calm and centeredness',
            'Warmth radiating from the abdomen',
            'Heavy eyelids and relaxation (sleepiness is good)',
            'Recharged vitality'
        ],
        closingInstruction: 'Rub your hands together until hot, then massage your face and kidneys. Keep your awareness low as you return to activity.'
    }
};
