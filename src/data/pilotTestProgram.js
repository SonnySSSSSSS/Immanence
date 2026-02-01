// src/data/pilotTestProgram.js

import { MATCH_POLICY } from './curriculumMatching.js';

export const EVENING_TEST_CIRCUIT = {
    id: 'evening-test-circuit',
    name: 'Evening Test Circuit',
    description: 'Breath, visualization, then feeling meditation.',
    totalDuration: 15,
    exercises: [
        {
            type: 'breath',
            name: 'Breath Practice',
            duration: 5,
            instructions: 'Settle the breath and lengthen the exhale.',
            practiceType: 'Breath & Stillness',
            preset: 'box',
        },
        {
            type: 'visualization',
            name: 'Visualization',
            duration: 5,
            instructions: 'Hold a steady inner image.',
            practiceType: 'Perception',
        },
        {
            type: 'feeling',
            name: 'Feeling Meditation',
            duration: 5,
            instructions: 'Hold the feeling; when it fades, return.',
            practiceType: 'Feeling Meditation',
        },
    ],
};

const buildPilotDays = (totalDays = 14) => {
    return Array.from({ length: totalDays }, (_, index) => {
        const dayNumber = index + 1;
        return {
            dayNumber,
            title: 'Test Program',
            subtitle: `Day ${dayNumber} of ${totalDays}`,
            description: 'Morning breath and evening circuit practice.',
            intention: 'Show up twice, keep it simple.',
            legs: [
                {
                    legNumber: 1,
                    label: 'Morning Breath',
                    practiceType: 'Breath & Stillness',
                    categoryId: 'breathwork',
                    matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY,
                    required: true,
                    practiceConfig: { breathPattern: 'box', duration: 7 },
                    description: 'Pranayama/Breath',
                    focusArea: 'breath',
                },
                {
                    legNumber: 2,
                    label: 'Evening Circuit',
                    practiceType: 'Circuit',
                    categoryId: 'circuit_training',
                    matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY,
                    required: true,
                    practiceConfig: { circuitId: 'evening-test-circuit', duration: 15 },
                    description: 'Breath / Visualization / Feeling Meditation',
                    focusArea: 'integration',
                },
            ],
        };
    });
};

export const PILOT_TEST_PROGRAM = {
    id: 'pilot-test-program',
    name: 'Pilot Test Program',
    duration: 14,
    description: 'Morning breath + evening circuit pilot program.',
    author: 'Immanence OS',
    version: '0.1',
    days: buildPilotDays(14),
};
