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
        description: "A 3-week journey focusing on resonance breathing and body awareness for deeper somatic integration.",
        glyph: "🌟",
        duration: 3, // 3 weeks

        practices: [
            { type: "Breathing", pattern: "Resonance", duration: 10 },
            { type: "Body Scan", duration: 12 }
        ],

        chapters: [],
        applicationItems: [],

        weeks: [
            {
                number: 1,
                title: "Ground in the Body",
                focus: "Morning resonance breath (10min) + Evening body scan (12min)",
                practices: [
                    "Resonance breathing (10min upon waking)",
                    "Body scan meditation (12min before sleep)"
                ],
                reading: [],
                tracking: "Notice physical sensations throughout the day"
            },
            {
                number: 2,
                title: "Expand Awareness",
                focus: "Lengthen practice, deepen attention",
                practices: [
                    "Resonance breathing (10min upon waking)",
                    "Body scan with breath integration (12min)"
                ],
                reading: [],
                tracking: "Journal: Where does tension live in your body?"
            },
            {
                number: 3,
                title: "Integrate the Practice",
                focus: "Consolidate gains, establish rhythm",
                practices: [
                    "Resonance breathing (10min upon waking)",
                    "Full body awareness circuit (15min evening)"
                ],
                reading: [],
                tracking: "Reflect: How has your body awareness changed?"
            }
        ],

        tracking: {
            durationDays: 21,
            summary: "Three-week somatic integration with resonance and body awareness.",
            defaultCommitment: {
                frequency: "daily",
                sessionsPerWeek: 7,
            },
            allowedPractices: ["breath", "body_scan"],
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
