// src/data/navigationData.js
// PILOT: Initiation Paths configuration

export const paths = [
    {
        id: "initiation",
        title: "Initiation Path",
        subtitle: "14-day initiation",
        description: "A strict 14-day initiation contract built on consistency and attention stability.",
        overviewNotes: [
            "Establish a strict two-leg daily rhythm that stabilizes attention.",
            "Complete six active practice days each week with one deliberate rest day."
        ],
        glyph: "🌟",
        duration: 2, // 2 weeks
        showBreathBenchmark: true,
        scheduleSelection: {
            requiredCount: 2,
            maxCount: 2,
            errorMessage: "Please select exactly 2 time slots to begin this path.",
        },

        practices: [
            {
                type: "Breathing",
                pattern: "Resonance",
                duration: 10,
                guidance: {
                    audioUrl: "/audio/breathing guidance/meditation guidance 1.wav",
                    startMode: "onPracticeStart",
                    resumeMode: "resume",
                    volume: 0.8,
                },
            },
            {
                type: "Body Scan",
                duration: 12,
                guidance: {
                    audioUrl: "/audio/breathing guidance/meditation guidance 2.wav",
                    startMode: "onPracticeStart",
                    resumeMode: "resume",
                    volume: 0.8,
                },
            }
        ],

        chapters: [],
        applicationItems: [],

        weeks: [
            {
                number: 1,
                title: "Establish the Contract",
                focus: "Morning resonance (10min) + Evening body scan (12min)",
                practices: [
                    "Morning: Resonance breathing (10min)",
                    "Evening: Body scan (12min)"
                ],
                reading: [],
                tracking: "Complete both daily sessions across six active days."
            },
            {
                number: 2,
                title: "Stabilize Attention",
                focus: "Maintain the rhythm, refine body clarity and steadiness",
                practices: [
                    "Morning: Resonance breathing (10min)",
                    "Evening: Body scan (12min)"
                ],
                reading: [],
                tracking: "Final day: re-benchmark and compare your first and last attempts."
            }
        ],

        contract: {
            totalDays: 14,
            practiceDaysPerWeek: 6,
            requiredTimeSlots: 2,
            maxLegsPerDay: 2,
            requiredLegsPerDay: 2,
        },

        tracking: {
            curriculumId: 'ritual-initiation-14-v2',
            durationDays: 14,
            summary: "Strict 14-day initiation with two required daily legs.",
            defaultCommitment: {
                frequency: "daily",
                sessionsPerWeek: 6,
            },
            allowedPractices: ["breath", "circuit"],
            tags: ["foundation", "initiation"],
        }
    }
];

// Helper functions
export function getPathById(id) {
    const normalizedId = id === 'initiation-2' ? 'initiation' : id;
    return paths.find(p => p.id === normalizedId);
}

export function getActivePaths() {
    return paths.filter(p => !p.placeholder);
}

export function getAllPaths() {
    return paths;
}
