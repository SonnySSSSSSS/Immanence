import { MATCH_POLICY } from './curriculumMatching.js';

const DAY_COPY = [
    {
        title: 'Threshold',
        subtitle: 'Day 1 of 14',
        intention: 'I keep my word to begin.',
        narrative: 'Today establishes the contract. You measure your current breath capacity, then complete the evening circuit without bargaining.',
        isBenchmark: true,
    },
    {
        title: 'Stability',
        subtitle: 'Day 2 of 14',
        intention: 'I return at the appointed hour.',
        narrative: 'Repetition builds reliability. Keep both sessions simple, clean, and on schedule.',
    },
    {
        title: 'Containment',
        subtitle: 'Day 3 of 14',
        intention: 'I stay inside the practice.',
        narrative: 'Notice the impulse to drift. Hold attention in the structure you committed to.',
    },
    {
        title: 'Witness',
        subtitle: 'Day 4 of 14',
        intention: 'I observe before I react.',
        narrative: 'The morning breath steadies the system. The evening sequence trains precise observation.',
    },
    {
        title: 'Rhythm',
        subtitle: 'Day 5 of 14',
        intention: 'I honor cadence over mood.',
        narrative: 'A contract survives changing emotion. Continue both legs whether the day feels easy or heavy.',
    },
    {
        title: 'Depth',
        subtitle: 'Day 6 of 14',
        intention: 'I move from effort to consistency.',
        narrative: 'Less forcing, more continuity. Let clean repetition do the work.',
    },
    {
        title: 'Week One Seal',
        subtitle: 'Day 7 of 14',
        intention: 'I complete what I started.',
        narrative: 'Close week one with full adherence. You are proving execution, not collecting motivation.',
    },
    {
        title: 'Renewal',
        subtitle: 'Day 8 of 14',
        intention: 'I recommit without drama.',
        narrative: 'Second week starts with the same standard. Protect the schedule and execute both legs.',
    },
    {
        title: 'Precision',
        subtitle: 'Day 9 of 14',
        intention: 'I make each session deliberate.',
        narrative: 'Attend to posture, breath quality, and transitions. Keep the practice exact and repeatable.',
    },
    {
        title: 'Clarity',
        subtitle: 'Day 10 of 14',
        intention: 'I choose clean attention.',
        narrative: 'Distraction is expected. Returning is the practice.',
    },
    {
        title: 'Pressure Test',
        subtitle: 'Day 11 of 14',
        intention: 'I keep the contract under strain.',
        narrative: 'External friction is not an exception. Keep both slots and finish what is required.',
    },
    {
        title: 'Refinement',
        subtitle: 'Day 12 of 14',
        intention: 'I remove unnecessary movement.',
        narrative: 'Simplify execution. Fewer adjustments, stronger follow-through.',
    },
    {
        title: 'Consolidation',
        subtitle: 'Day 13 of 14',
        intention: 'I hold the line to the end.',
        narrative: 'One day before close, keep discipline identical to day one.',
    },
    {
        title: 'Completion',
        subtitle: 'Day 14 of 14',
        intention: 'I finish in full alignment.',
        narrative: 'You re-run the benchmark and compare against day one. Completion is measured by fidelity to the contract.',
        isBenchmark: true,
        isComparison: true,
    },
];

function buildInitiationV2Days() {
    return DAY_COPY.map((day, index) => {
        const dayNumber = index + 1;
        return {
            dayNumber,
            title: day.title,
            subtitle: day.subtitle,
            intention: day.intention,
            narrative: day.narrative,
            ...(day.isBenchmark ? { isBenchmark: true } : {}),
            ...(day.isComparison ? { isComparison: true } : {}),
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath Practice',
                    practiceType: 'Breath & Stillness',
                    categoryId: 'breathwork',
                    matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY,
                    required: true,
                    practiceConfig: { breathPattern: 'box', duration: 7 },
                    description: 'Morning breath practice (7 minutes).',
                    focusArea: 'breath',
                },
                {
                    legNumber: 2,
                    label: 'Evening Awareness Circuit',
                    practiceType: 'Circuit',
                    categoryId: 'circuit_training',
                    matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY,
                    required: true,
                    practiceConfig: { circuitId: 'evening-awareness-circuit', duration: 14 },
                    description: 'Evening awareness circuit (14 minutes total: 7 + 7).',
                    focusArea: 'awareness',
                },
            ],
        };
    });
}

export const RITUAL_INITIATION_14_V2 = {
    id: 'ritual-initiation-14-v2',
    curriculumId: 'ritual-initiation-14-v2',
    name: 'Ritual Initiation v2',
    duration: 14,
    durationDays: 14,
    description: '14-day initiation contract with morning breath and evening awareness circuit.',
    author: 'Immanence OS',
    version: '1.0',
    days: buildInitiationV2Days(),
};
