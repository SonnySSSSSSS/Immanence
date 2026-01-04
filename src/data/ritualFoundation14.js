// src/data/ritualFoundation14.js
// 14-Day Ritual Foundation Curriculum
// Morning: Breath Meditation | Evening: Thought Observation Ritual

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
    description: 'A 2-week foundation program: morning breath meditation and evening thought observation ritual.',
    author: 'Immanence OS',
    version: '2.0',

    days: [
        {
            dayNumber: 1,
            title: 'Settling',
            subtitle: 'Day 1 of 14',
            description: 'Begin with morning breath and evening thought observation.',
            intention: 'I arrive fully in this moment.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 2,
            title: 'Deepening',
            subtitle: 'Day 2 of 14',
            description: 'Continue with morning breath and evening ritual.',
            intention: 'I remain present without forcing.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 3,
            title: 'Awareness',
            subtitle: 'Day 3 of 14',
            description: 'Notice how your practice is developing.',
            intention: 'I listen to what arises.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 4,
            title: 'Anchoring',
            subtitle: 'Day 4 of 14',
            description: 'Let the rhythm become familiar.',
            intention: 'I establish my foundation.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 5,
            title: 'Witnessing',
            subtitle: 'Day 5 of 14',
            description: 'Observe thoughts without engaging them.',
            intention: 'I am not my thoughts. I witness them.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 6,
            title: 'Integration',
            subtitle: 'Day 6 of 14',
            description: 'Let the practice integrate into your day.',
            intention: 'I carry presence forward.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 7,
            title: 'Week One Complete',
            subtitle: 'Day 7 of 14',
            description: 'First week complete. Notice what has shifted.',
            intention: 'I honor what I have begun.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 8,
            title: 'Extending',
            subtitle: 'Day 8 of 14',
            description: 'Second week begins. Deepen your practice.',
            intention: 'I expand my container for stillness.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 9,
            title: 'Clarity',
            subtitle: 'Day 9 of 14',
            description: 'The practice reveals patterns.',
            intention: 'I rest as awareness itself.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 10,
            title: 'Grounding',
            subtitle: 'Day 10 of 14',
            description: 'Find stability in the practice.',
            intention: 'I anchor myself in any storm.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 11,
            title: 'Consistency',
            subtitle: 'Day 11 of 14',
            description: 'The power is in showing up.',
            intention: 'I honor my commitment.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 12,
            title: 'Vision',
            subtitle: 'Day 12 of 14',
            description: 'See the practice with clarity.',
            intention: 'I see with inner eyes.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 13,
            title: 'Embodiment',
            subtitle: 'Day 13 of 14',
            description: 'The practice becomes you.',
            intention: 'I embody the practice.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
                }
            ]
        },
        {
            dayNumber: 14,
            title: 'Completion',
            subtitle: 'Day 14 of 14',
            description: 'The foundation is complete. This is a beginning.',
            intention: 'I complete this beginning.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    practiceConfig: { breathPattern: 'box', duration: 10 },
                    description: 'Breath meditation',
                    focusArea: 'stability',
                },
                {
                    legNumber: 2,
                    label: 'Evening Ritual',
                    practiceType: 'Cognitive Vipassana',
                    practiceConfig: { variant: 'thought-labeling', duration: 10 },
                    description: 'Observe your thoughts',
                    focusArea: 'awareness',
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
