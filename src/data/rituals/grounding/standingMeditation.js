export const STANDING_MEDITATION = {
    id: 'standingMeditation',
    name: 'Standing Meditation (Zhang Zhuang)',
    tradition: 'Qigong / Taoist Internal Arts',
    category: 'grounding',
    icon: '🧘',
    iconName: 'practice', // For Icon component

    // Unlock requirements
    unlockStage: 'seedling',  // Available from start
    prerequisite: null,

    // Metadata
    duration: { min: 12, max: 20 }, // 2+3+5+2 = 12 mins min
    recommendation: 'Daily practice, morning. Best done barefoot.',
    description: 'Root stabilization and energetic foundation building.',

    // Historical context
    history: `Zhang Zhuang (Standing Like a Post) is one of the oldest and most powerful Qigong practices, dating back over 2,000 years. It emphasizes stillness as the foundation of motion, accumulating Qi in the lower body and developing deep structural integrity ("internal iron shirt").`,

    // Step-by-step guidance
    steps: [
        {
            id: 'stance',
            name: 'The Stance',
            duration: 120, // 2 minutes
            instruction: 'Stand with feet shoulder-width apart, knees slightly bent. Tuck your tailbone slightly and relax your shoulders. Imagine holding a large ball in front of your chest.',
            sensoryCues: [
                'Feel your feet melting into the ground like wax.',
                'Sense a "suspension" string pulling the crown of your head upward.',
                'Relax your chest and allow your breathing to sink deep into your belly.',
                'Feel the space between your arms and your body.'
            ],
            image: 'rituals/standing-meditation/step-1-stance.png',
            imagePrompt: 'First-person view from shoulders down, figure in perfect standing posture with bent knees. Golden meridian lines visible. Dark background.'
        },
        {
            id: 'rooting',
            name: 'Rooting the Feet',
            duration: 180, // 3 minutes
            instruction: 'Visualize roots extending from the bubbling well points (K1) in the soles of your feet deep into the earth. With every exhale, send your energy down.',
            sensoryCues: [
                'Feel a magnetic pull connecting your feet to the earth core.',
                'Notice heat or tingling building in the soles of your feet.',
                'Your legs may begin to shake slightly; welcome this as "changing the tendons".',
                'Feel as immovable as an ancient mountain.'
            ],
            image: 'rituals/standing-meditation/step-2-rooting.png',
            imagePrompt: 'Side profile, thick glowing root systems spiral from feet into dark soil. Luminescent gold/amber roots.'
        },
        {
            id: 'breathing',
            name: 'Microcosmic Breathing',
            duration: 300, // 5 minutes
            instruction: 'Inhale earth energy up through your legs to the Lower Dan Tien (below navel). Exhale and pack the energy into a dense pearl of light in your center.',
            sensoryCues: [
                'Visualize golden earth mist rising up your legs on the inhale.',
                'Feel warmth gathering and condensing in your lower abdomen.',
                'The "pearl" grows brighter and denser with each breath.',
                'Your center of gravity drops lower and lower.'
            ],
            image: 'rituals/standing-meditation/step-3-breathing.png',
            imagePrompt: 'Full body front view, amber energy spirals up from earth on inhale, golden orb below navel. Two-frame sequence.'
        },
        {
            id: 'integration',
            name: 'Integration',
            duration: 120, // 2 minutes
            instruction: 'Release the visualization. Stand in pure awareness of your body structure. Feel the unified connection between heaven (crown) and earth (feet).',
            sensoryCues: [
                'Sense the vibration of your entire energy field.',
                'Feel light, yet incredibly heavy and stable.',
                'Notice the silence in your mind.',
                'Gently harvest this energy into your navel before closing.'
            ],
            image: 'rituals/standing-meditation/step-4-integration.png',
            imagePrompt: 'Full silhouette, golden light from center grounding down and radiating up. Vast space feel.'
        }
    ],

    // Completion guidance
    completion: {
        expectedOutput: [
            'Felt sense of solid stability and "heaviness" below the waist',
            'Warmth in the lower abdomen and feet',
            'Reduced mental chatter and anxiety',
            'Feeling "charged" yet calm'
        ],
        closingInstruction: 'Slowly straighten your legs, place hands over your navel, and massage in a circle 9 times. Walk slowly to transition back.'
    }
};
