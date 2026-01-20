// src/data/navigationData.js
// PILOT: Single Initiation Path configuration

export const paths = [
    {
        id: "initiation",
        title: "Initiation Path",
        subtitle: "A simple beginning",
        glyph: "✨",
        duration: 2, // 2 weeks

        practices: [
            { type: "Breathing", pattern: "Box", duration: 7 },
            { type: "Circuit", duration: 15 }
        ],

        chapters: [],
        applicationItems: [],

        weeks: [
            {
                number: 1,
                title: "Establish Daily Practice",
                focus: "Morning breath (7min) + Evening circuit (15min)",
                practices: [
                    "Box breathing (7min upon waking)",
                    "Circuit: Breath(5m) → Visualization(5m) → Feeling(5m) (evening)"
                ],
                reading: [],
                tracking: "Complete both sessions daily"
            },
            {
                number: 2,
                title: "Deepen the Pattern",
                focus: "Build consistency, notice effects",
                practices: [
                    "Box breathing (7min upon waking)",
                    "Circuit: Breath(5m) → Visualization(5m) → Feeling(5m) (evening)"
                ],
                reading: [],
                tracking: "Journal: What shifted this week?"
            }
        ]
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
