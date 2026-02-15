export const EVENING_AWARENESS_CIRCUIT = {
    id: 'evening-awareness-circuit',
    name: 'Evening Awareness Circuit',
    description: 'Two-part evening circuit: sit, then scan.',
    totalDuration: 14,
    intervalBreakSec: 8,
    exercises: [
        {
            id: 'sitting-awareness',
            type: 'awareness',
            name: 'Sitting Awareness',
            duration: 7,
            instructions: 'Sit still. Track breath and thought movement without narration.',
            practiceType: 'Insight Meditation',
            sensoryType: 'cognitive',
        },
        {
            id: 'body-scan-grounding',
            type: 'body',
            name: 'Body Scan',
            duration: 7,
            instructions: 'Move attention from head to feet. Name sensations directly and continue.',
            practiceType: 'Body Scan',
            sensoryType: 'body',
        },
    ],
};

export default EVENING_AWARENESS_CIRCUIT;
