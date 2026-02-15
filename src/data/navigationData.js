// src/data/navigationData.js
// PILOT: Initiation Paths configuration

export const paths = [
    {
        id: "initiation",
        title: "Initiation Path",
        subtitle: "A simple beginning",
        description: "A foundational 2-week journey to establish daily practice rhythms and begin your integration path.",
        overviewNotes: [
            "Establish a breath practice that expands capacity across this leg.",
            "Familiarize yourself with the other fundamental practices."
        ],
        glyph: "✨",
        duration: 2, // 2 weeks
        showBreathBenchmark: true,
        scheduleSelection: {
            requiredCount: 2,
            maxCount: 2,
            errorMessage: "Please select exactly 2 time slots to begin this path.",
        },

        practices: [
            { type: "Breathing", pattern: "Box", duration: 7 },
            { type: "Circuit", duration: 14, circuitId: "evening-awareness-circuit" }
        ],

        chapters: [],
        applicationItems: [],

        weeks: [
            {
                number: 1,
                title: "Establish Daily Practice",
                focus: "Morning breath (7min) + Evening circuit (14min)",
                practices: [
                    "Morning: Box breathing (7min)",
                    "Evening: Circuit: Sitting awareness (7m) -> Body scan (7m)"
                ],
                reading: [],
                tracking: "Complete both sessions daily"
            },
            {
                number: 2,
                title: "Deepen the Pattern",
                focus: "Build consistency, notice effects",
                practices: [
                    "Morning: Box breathing (7min)",
                    "Evening: Circuit: Sitting awareness (7m) -> Body scan (7m)"
                ],
                reading: [],
                tracking: "Final day: after your closing ritual, re-benchmark and compare your first and last attempts."
            }
        ],

        tracking: {
            curriculumId: 'ritual-initiation-14-v2',
            durationDays: 14,
            summary: "Foundational two-week rhythm for daily practice.",
            defaultCommitment: {
                frequency: "daily",
                sessionsPerWeek: 7,
            },
            allowedPractices: ["breath", "circuit"],
            tags: ["foundation", "initiation"],
        }
    },
    {
        id: "initiation-2",
        title: "Initiation Path 2",
        subtitle: "An alternate beginning",
        description: "A strict 14-day initiation contract built on consistency and attention stability.",
        glyph: "🌟",
        duration: 2, // 14 days
        showBreathBenchmark: true,

        practices: [
            { type: "Breathing", pattern: "Resonance", duration: 10 },
            { type: "Body Scan", duration: 12 }
        ],

        chapters: [],
        applicationItems: [],

        weeks: [],
        scheduleSelection: {
            requiredCount: 2,
            maxCount: 2,
            errorMessage: "Please select exactly 2 time slots to begin this path.",
        },
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
    return paths.find(p => p.id === id);
}

export function getActivePaths() {
    return paths.filter(p => !p.placeholder);
}

export function getAllPaths() {
    return paths;
}
