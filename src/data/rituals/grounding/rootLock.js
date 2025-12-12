export const ROOT_LOCK = {
    id: 'rootLock',
    name: 'Root Lock (Mula Bandha)',
    tradition: 'Hatha Yoga / Kundalini',
    category: 'grounding',
    icon: '🔒',
    iconName: 'grounding', // For Icon component

    // Unlock requirements
    unlockStage: 'seedling',
    prerequisite: null,

    // Metadata
    duration: { min: 9, max: 15 }, // 1+1+5+2 = 9 mins min
    recommendation: 'Use when feeling "spaced out" or before intense breathwork.',
    description: 'Sealing the pelvic floor to prevent energy leakage and stimulate the root.',

    // Historical context
    history: `Mula Bandha (Root Lock) is one of the three great locks in Hatha Yoga. It involves the contraction of the perineum/cervix to seal Prana (vital force) within the body and awaken the dormant Kundalini energy at the base of the spine.`,

    // Step-by-step guidance
    steps: [
        {
            id: 'finding',
            name: 'Finding the Root',
            duration: 90, // 1.5 minutes
            instruction: 'Sit comfortably with a straight spine. Bring your awareness to the perineum (the space between the genitals and anus). Relax this area completely.',
            sensoryCues: [
                'Feel the contact of your sitz bones with the cushion.',
                'Soften the glutes and thighs—they should not participate.',
                'Isolate the sensation of the pelvic floor muscles.',
                'Breathe deeply into the pelvic bowl.'
            ],
            image: 'rituals/root-lock/step-1-finding.png',
            imagePrompt: 'Seated cross-legged, pelvic floor highlighted in soft gold. Anatomical but respectful.'
        },
        {
            id: 'contraction',
            name: 'The Contraction',
            duration: 60, // 1 minute
            instruction: 'Gently contract the perineum muscles, pulling them upwards towards the navel. Hold for a moment, then release fully. Repeat slowly.',
            sensoryCues: [
                'Like lifting a tissue with just the pelvic floor muscles.',
                'Feel a subtle lift in your lower spine.',
                'Ensure your face and jaw remain relaxed.',
                'Distinguish this from the urinary or anal sphincter muscles.'
            ],
            image: 'rituals/root-lock/step-2-contraction.png',
            imagePrompt: 'Seated side view, golden thread rises from pelvic floor along spine. Show contraction/release phases.'
        },
        {
            id: 'rhythm',
            name: 'The Rhythm',
            duration: 300, // 5 minutes
            instruction: 'Coordinate with breath: Inhale and Relax. Exhale and Engage the Root Lock (Mula Bandha). Feel the energy rising up the spine with each contraction.',
            sensoryCues: [
                'Exhale: Squeeze and lift (Root).',
                'Inhale: Soften and expand (Flower).',
                'Feel a pump-like action at the base of your spine.',
                'Visualize golden oil traveling up the spinal column.'
            ],
            image: 'rituals/root-lock/step-3-rhythm.png',
            imagePrompt: 'Cross-section seated figure, spine as luminous column, pelvic floor pulses gold on exhale cycles.'
        },
        {
            id: 'integration',
            name: 'Integration Hold',
            duration: 120, // 2 minutes
            instruction: 'Take a deep inhale, hold the breath, and apply the Root Lock firmly. Hold as long as comfortable. Then exhale and release everything into stillness.',
            sensoryCues: [
                'Feel the pressure building benignly at the navel.',
                'Sense the containment of energy—no leakage.',
                'Upon release, feel the flood of warmth throughout the body.',
                'Rest in the afterglow.'
            ],
            image: 'rituals/root-lock/step-4-integration.png',
            imagePrompt: 'Seated full body, entire lower body glows golden, spine bright column, aura surrounds.'
        }
    ],

    // Completion guidance
    completion: {
        expectedOutput: [
            'Increased alertness and focus',
            'Sensation of heat at the base of the spine',
            'Feeling "contained" and secure',
            'Solid connection to the earth'
        ],
        closingInstruction: 'Release all muscular effort. Sit quietly for a moment before moving.'
    }
};
