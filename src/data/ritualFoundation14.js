// src/data/ritualFoundation14.js
// 14-Day Ritual Foundation Curriculum

export const CURRICULUM_CHALLENGES = [
    { id: 'fatigue', label: 'Fatigue', icon: '😴' },
    { id: 'distraction', label: 'Distraction', icon: '🌀' },
    { id: 'restlessness', label: 'Restlessness', icon: '⚡' },
    { id: 'resistance', label: 'Resistance', icon: '🛡️' },
    { id: 'nothing', label: 'Nothing notable', icon: '✨' },
];

export const FOCUS_RATINGS = [
    { value: 1, label: 'Very scattered' },
    { value: 2, label: 'Struggled to settle' },
    { value: 3, label: 'Moderate focus' },
    { value: 4, label: 'Good focus' },
    { value: 5, label: 'Deep focus' },
];

export const RITUAL_FOUNDATION_14 = {
    id: 'ritual-foundation-14',
    name: 'Ritual Foundation',
    duration: 14,
    description: 'A 2-week introduction to structured daily practice.',
    author: 'Immanence OS',
    version: '1.0',
    
    days: [
        {
            dayNumber: 1,
            title: 'First Breath',
            subtitle: 'Establishing the anchor',
            description: 'Begin with observing breath. No technique, just awareness.',
            intention: 'I arrive fully in this moment.',
            journalPrompts: [
                'What did you notice when you first settled?',
                'Where did your attention want to go?',
                'How do you feel now compared to before?'
            ],
            // Multiple practice legs throughout the day
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 5 },
                    description: 'Morning anchor',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 5 },
                    description: 'Evening integration',
                    focusArea: 'stability',
                }
            ]
        },
        {
            dayNumber: 2,
            title: 'Deepening Stillness',
            subtitle: 'Extending the gap',
            description: 'Same practice, slightly longer.',
            intention: 'I remain present without forcing.',
            journalPrompts: [
                'Was it easier or harder to settle today?',
                'What patterns of thought arose?',
                'What remained when thoughts quieted?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 7 },
                    description: 'Morning deepening',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 7 },
                    description: 'Evening deepening',
                    focusArea: 'stability',
                }
            ]
        },
        {
            dayNumber: 3,
            title: 'Body Awakening',
            subtitle: 'Attention moves inward',
            description: 'Shift from breath to body. Scan systematically.',
            intention: 'I listen to what the body knows.',
            journalPrompts: [
                'Where did you find tension or holding?',
                'What areas felt alive or numb?',
                'Did any emotions surface with body awareness?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Somatic Vipassana',
                    practiceConfig: { sensoryType: 'bodyScan', duration: 10 },
                    description: 'Morning body scan',
                    focusArea: 'soma',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Somatic Vipassana',
                    practiceConfig: { sensoryType: 'bodyScan', duration: 10 },
                    description: 'Evening body scan',
                    focusArea: 'soma',
                }
            ]
        },
        {
            dayNumber: 4,
            title: 'Breath & Body',
            subtitle: 'First circuit',
            description: 'Your first circuit: two practices in sequence.',
            intention: 'I flow between anchors with ease.',
            journalPrompts: [
                'How did the transition feel between practices?',
                'Which practice felt more natural today?',
                'What carried over from one to the other?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Circuit',
                    circuit: {
                        name: 'Breath & Body Circuit',
                        exercises: [
                            { type: 'breath', name: 'Box Breathing', duration: 5, practiceType: 'Breath & Stillness', preset: 'box' },
                            { type: 'body', name: 'Quick Body Scan', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'bodyScan' }
                        ],
                        totalDuration: 10
                    },
                    description: 'Morning circuit',
                    focusArea: 'integration',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Circuit',
                    circuit: {
                        name: 'Breath & Body Circuit',
                        exercises: [
                            { type: 'breath', name: 'Box Breathing', duration: 5, practiceType: 'Breath & Stillness', preset: 'box' },
                            { type: 'body', name: 'Quick Body Scan', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'bodyScan' }
                        ],
                        totalDuration: 10
                    },
                    description: 'Evening circuit',
                    focusArea: 'integration',
                }
            ]
        },
        {
            dayNumber: 5,
            title: 'Observing Mind',
            subtitle: 'Thoughts as objects',
            description: 'Practice cognitive vipassana: observe thoughts without engaging.',
            intention: 'I am not my thoughts. I witness them.',
            journalPrompts: [
                'What kinds of thoughts appeared most?',
                'Could you observe without engaging?',
                'What is the space between thoughts like?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Somatic Vipassana',
                    practiceConfig: { sensoryType: 'vipassana', duration: 10 },
                    description: 'Morning witness',
                    focusArea: 'dhyana',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Somatic Vipassana',
                    practiceConfig: { sensoryType: 'vipassana', duration: 10 },
                    description: 'Evening witness',
                    focusArea: 'dhyana',
                }
            ]
        },
        {
            dayNumber: 6,
            title: 'Integration Day',
            subtitle: 'Full foundation circuit',
            description: 'The full foundation circuit: breath, mind, body.',
            intention: 'I integrate all dimensions of presence.',
            journalPrompts: [
                'How did moving through all three feel?',
                'Which practice anchored you most?',
                'What wants more attention next week?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Circuit',
                    circuit: {
                        name: 'Foundation Circuit',
                        exercises: [
                            { type: 'breath', name: 'Box Breathing', duration: 5, practiceType: 'Breath & Stillness', preset: 'box' },
                            { type: 'focus', name: 'Cognitive Vipassana', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'vipassana' },
                            { type: 'body', name: 'Body Scan', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'bodyScan' }
                        ],
                        totalDuration: 15
                    },
                    description: 'Morning integration',
                    focusArea: 'integration',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Circuit',
                    circuit: {
                        name: 'Foundation Circuit',
                        exercises: [
                            { type: 'breath', name: 'Box Breathing', duration: 5, practiceType: 'Breath & Stillness', preset: 'box' },
                            { type: 'focus', name: 'Cognitive Vipassana', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'vipassana' },
                            { type: 'body', name: 'Body Scan', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'bodyScan' }
                        ],
                        totalDuration: 15
                    },
                    description: 'Evening integration',
                    focusArea: 'integration',
                }
            ]
        },
        {
            dayNumber: 7,
            title: 'Week One Reflection',
            subtitle: 'Consolidation',
            description: 'Rest day. Simple breathing with a calming ratio.',
            intention: 'I honor what I have begun.',
            journalPrompts: [
                'What was your biggest insight this week?',
                'What practice resonated most?',
                'What do you want to deepen next week?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'relaxing', duration: 10 },
                    description: 'Morning reflection',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'relaxing', duration: 10 },
                    description: 'Evening reflection',
                    focusArea: 'stability',
                }
            ]
        },
        {
            dayNumber: 8,
            title: 'Extended Stillness',
            subtitle: 'Increasing duration',
            description: 'Same practice as Day 1, now longer.',
            intention: 'I expand my container for stillness.',
            journalPrompts: [
                'How does 12 minutes feel compared to 5?',
                'What arises in the extended time?',
                'Where is your edge of patience?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 12 },
                    description: 'Morning extension',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 12 },
                    description: 'Evening extension',
                    focusArea: 'stability',
                }
            ]
        },
        {
            dayNumber: 9,
            title: 'Sakshi Distance',
            subtitle: 'The Witness expands',
            description: 'Sakshi training: observe the observer.',
            intention: 'I rest as awareness itself.',
            journalPrompts: [
                'Could you find the witness behind the watcher?',
                'What is it like to observe observation?',
                'How does distance change reactivity?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Somatic Vipassana',
                    practiceConfig: { sensoryType: 'sakshi', duration: 12 },
                    description: 'Morning sakshi',
                    focusArea: 'drishti',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Somatic Vipassana',
                    practiceConfig: { sensoryType: 'sakshi', duration: 12 },
                    description: 'Evening sakshi',
                    focusArea: 'drishti',
                }
            ]
        },
        {
            dayNumber: 10,
            title: 'Grounding Ritual',
            subtitle: 'Structured practice',
            description: 'Your first full ritual: Storm Anchor.',
            intention: 'I anchor myself in any storm.',
            journalPrompts: [
                'How did the ritual structure feel?',
                'Which step was most powerful?',
                'When might you use this ritual in daily life?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Ritual',
                    practiceConfig: { ritualId: 'storm-anchor', duration: 15 },
                    description: 'Morning ritual',
                    focusArea: 'soma',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Ritual',
                    practiceConfig: { ritualId: 'storm-anchor', duration: 15 },
                    description: 'Evening ritual',
                    focusArea: 'soma',
                }
            ]
        },
        {
            dayNumber: 11,
            title: 'Sound & Stillness',
            subtitle: 'Frequency immersion',
            description: 'Binaural tones followed by silence.',
            intention: 'I tune my inner frequency.',
            journalPrompts: [
                'How did the sound affect your state?',
                'What did the silence after feel like?',
                'What frequency do you carry forward?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Circuit',
                    circuit: {
                        name: 'Sound & Stillness',
                        exercises: [
                            { type: 'sound', name: 'Binaural Foundation', duration: 7, practiceType: 'Sound', soundConfig: { hz: 200, type: 'binaural' } },
                            { type: 'breath', name: 'Silent Stillness', duration: 5, practiceType: 'Breath & Stillness', preset: 'natural' }
                        ],
                        totalDuration: 12
                    },
                    description: 'Morning sound',
                    focusArea: 'prana',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Circuit',
                    circuit: {
                        name: 'Sound & Stillness',
                        exercises: [
                            { type: 'sound', name: 'Binaural Foundation', duration: 7, practiceType: 'Sound', soundConfig: { hz: 200, type: 'binaural' } },
                            { type: 'breath', name: 'Silent Stillness', duration: 5, practiceType: 'Breath & Stillness', preset: 'natural' }
                        ],
                        totalDuration: 12
                    },
                    description: 'Evening sound',
                    focusArea: 'prana',
                }
            ]
        },
        {
            dayNumber: 12,
            title: 'Visualization',
            subtitle: 'Inner sight',
            description: 'Hold a simple geometric form in your mind.',
            intention: 'I see with inner eyes.',
            journalPrompts: [
                'How stable was the visualization?',
                'When did it dissolve or shift?',
                'What is the relationship between seeing and being?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Visualization',
                    practiceConfig: { geometry: 'sphere', duration: 10 },
                    description: 'Morning visualization',
                    focusArea: 'drishti',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Visualization',
                    practiceConfig: { geometry: 'sphere', duration: 10 },
                    description: 'Evening visualization',
                    focusArea: 'drishti',
                }
            ]
        },
        {
            dayNumber: 13,
            title: 'Complete Circuit',
            subtitle: 'All paths merged',
            description: 'Your most complete practice: breath, body, witness, vision.',
            intention: 'I embody the complete practice.',
            journalPrompts: [
                'How does this full sequence feel?',
                'What is your natural rhythm between practices?',
                'What do you want to continue after the curriculum?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Circuit',
                    circuit: {
                        name: 'Complete Practice',
                        exercises: [
                            { type: 'breath', name: 'Centering Breath', duration: 3, practiceType: 'Breath & Stillness', preset: 'box' },
                            { type: 'body', name: 'Body Awareness', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'bodyScan' },
                            { type: 'focus', name: 'Witness Practice', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'sakshi' },
                            { type: 'visualization', name: 'Inner Light', duration: 5, practiceType: 'Visualization', geometry: 'sphere' }
                        ],
                        totalDuration: 18
                    },
                    description: 'Morning complete',
                    focusArea: 'integration',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Circuit',
                    circuit: {
                        name: 'Complete Practice',
                        exercises: [
                            { type: 'breath', name: 'Centering Breath', duration: 3, practiceType: 'Breath & Stillness', preset: 'box' },
                            { type: 'body', name: 'Body Awareness', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'bodyScan' },
                            { type: 'focus', name: 'Witness Practice', duration: 5, practiceType: 'Somatic Vipassana', sensoryType: 'sakshi' },
                            { type: 'visualization', name: 'Inner Light', duration: 5, practiceType: 'Visualization', geometry: 'sphere' }
                        ],
                        totalDuration: 18
                    },
                    description: 'Evening complete',
                    focusArea: 'integration',
                }
            ]
        },
        {
            dayNumber: 14,
            title: 'Completion',
            subtitle: 'The circle closes',
            description: 'Return to simplicity. 15 minutes of natural breath.',
            intention: 'I complete this beginning.',
            journalPrompts: [
                'What has shifted over these two weeks?',
                'What practice will you carry forward?',
                'What does a daily practice mean to you now?'
            ],
            legs: [
                {
                    legNumber: 1,
                    time: '06:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'natural', duration: 15 },
                    description: 'Morning completion',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    time: '18:00',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'natural', duration: 15 },
                    description: 'Evening completion',
                    focusArea: 'stability',
                }
            ]
        }
    ]
};

export function getCurriculumDay(dayNumber) {
    return RITUAL_FOUNDATION_14.days.find(d => d.dayNumber === dayNumber) || null;
}

export function isDayCircuit(dayNumber) {
    const day = getCurriculumDay(dayNumber);
    return day?.legs?.some(leg => leg.practiceType === 'Circuit');
}

export function getCurriculumLeg(dayNumber, legNumber) {
    const day = getCurriculumDay(dayNumber);
    if (!day || !day.legs) return null;
    return day.legs.find(leg => leg.legNumber === legNumber) || null;
}

export function getNextLeg(dayNumber, currentLegNumber) {
    const day = getCurriculumDay(dayNumber);
    if (!day || !day.legs) return null;
    return day.legs.find(leg => leg.legNumber > currentLegNumber) || null;
}