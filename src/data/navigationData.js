// src/data/navigationData.js
// 12 structured paths for self-integration
// 3 detailed, 9 placeholders

export const paths = [
    // ========== DETAILED PATH 1: Shadow Work ==========
    {
        id: "shadow-work",
        title: "Integrate Shadow Work",
        subtitle: "Notice reactivity patterns",
        glyph: "◐",
        duration: 8,

        practices: [
            { type: "Breathing", pattern: "Box", duration: 5 },
            { type: "Meditation", duration: 15 }
        ],

        chapters: [
            "chapter-7-shadow-integration",
            "chapter-12-defensive-patterns",
            "chapter-23-wound-as-teacher",
            "chapter-44-the-four-modes"
        ],

        applicationItems: [
            "Journal after conflict",
            "Notice defensive patterns",
            "Practice opposite action",
            "Track emotional triggers"
        ],

        weeks: [
            {
                number: 1,
                title: "Notice Reactivity Patterns",
                focus: "Observe without judgment when you feel defensive, angry, or triggered",
                practices: [
                    "Box breathing (5min before bed)",
                    "Meditation (10min in morning)"
                ],
                reading: ["chapter-7-shadow-integration"],
                tracking: "Journal immediately after any conflict or strong emotional reaction"
            },
            {
                number: 2,
                title: "Map Your Triggers",
                focus: "Identify the specific situations and people that consistently activate you",
                practices: [
                    "Box breathing when triggered (2-3min)",
                    "Meditation (15min)"
                ],
                reading: ["chapter-12-defensive-patterns"],
                tracking: "Log 5 trigger moments - what happened, who was there, how you felt"
            },
            {
                number: 3,
                title: "Examine the Wound",
                focus: "Ask: what fear or pain underneath makes this trigger so powerful?",
                practices: [
                    "4-7-8 breathing when examining wounds",
                    "Meditation focusing on the felt sense of the wound"
                ],
                reading: ["chapter-23-wound-as-teacher"],
                tracking: "Write 3 paragraphs on the origin story of your primary trigger"
            },
            {
                number: 4,
                title: "Practice Opposite Action",
                focus: "When triggered, do the opposite of your habitual defensive move",
                practices: [
                    "Breathing before responding (not reacting)",
                    "Meditation on spaciousness"
                ],
                reading: ["chapter-44-the-four-modes"],
                tracking: "Record 3 instances of choosing opposite action and what happened"
            },
            {
                number: 5,
                title: "Dialogue with the Shadow",
                focus: "What does the reactive part of you want? What is it protecting?",
                practices: [
                    "Kumbhaka breathing for depth",
                    "Meditation as listening"
                ],
                reading: ["chapter-7-shadow-integration"],
                tracking: "Write a letter from your shadow self to your conscious self"
            },
            {
                number: 6,
                title: "Integrate the Disowned",
                focus: "Reclaim the energy you spent repressing this part of yourself",
                practices: [
                    "Box breathing with gratitude",
                    "Meditation visualizing integration"
                ],
                reading: ["chapter-12-defensive-patterns"],
                tracking: "Name 3 ways this shadow aspect has actually served you"
            },
            {
                number: 7,
                title: "Embody the Lessons",
                focus: "Live as if the trigger no longer controls you",
                practices: [
                    "Any breathing pattern that feels right",
                    "Meditation on wholeness"
                ],
                reading: ["chapter-23-wound-as-teacher"],
                tracking: "Notice moments where you would have reacted but didn't"
            },
            {
                number: 8,
                title: "Review and Commit",
                focus: "What has shifted? What practice remains?",
                practices: [
                    "Breathing as celebration",
                    "Meditation as gratitude"
                ],
                reading: ["chapter-44-the-four-modes"],
                tracking: "Write a summary: before, during, after this path"
            }
        ]
    },

    // ========== DETAILED PATH 2: Consistency ==========
    {
        id: "consistency",
        title: "Build Consistency",
        subtitle: "Small daily wins compound",
        glyph: "◈",
        duration: 6,

        practices: [
            { type: "Breathing", pattern: "Box", duration: 5 },
            { type: "Meditation", duration: 10 }
        ],

        chapters: [
            "chapter-4-the-four-modes",
            "chapter-18-ritual-as-structure",
            "chapter-31-habit-formation"
        ],

        applicationItems: [
            "Same time daily practice",
            "Track streak without breaking",
            "Notice resistance patterns",
            "Celebrate micro-wins"
        ],

        weeks: [
            {
                number: 1,
                title: "Anchor Practice",
                focus: "Same time, same place, every single day - no exceptions",
                practices: [
                    "5min breathing (any pattern you choose)",
                    "No meditation yet - just breathing"
                ],
                reading: ["chapter-4-the-four-modes"],
                tracking: "Check in: Did I do 5min breathing today? (yes/no)"
            },
            {
                number: 2,
                title: "Add Meditation",
                focus: "Breathing + 5min meditation, still same time/place",
                practices: [
                    "5min breathing",
                    "5min meditation"
                ],
                reading: ["chapter-18-ritual-as-structure"],
                tracking: "Log the exact time you practiced each day"
            },
            {
                number: 3,
                title: "Increase Duration",
                focus: "Breathing 5min + meditation 10min",
                practices: [
                    "5min breathing (Box pattern)",
                    "10min meditation"
                ],
                reading: ["chapter-31-habit-formation"],
                tracking: "Notice: when does resistance arise? Beginning, middle, or before starting?"
            },
            {
                number: 4,
                title: "Handle Disruption",
                focus: "Life will interrupt - practice anyway, even if different time/place",
                practices: [
                    "5min breathing (maintain)",
                    "10min meditation (maintain)"
                ],
                reading: ["chapter-4-the-four-modes"],
                tracking: "If you miss morning slot, when did you make it up?"
            },
            {
                number: 5,
                title: "Optimize Conditions",
                focus: "What environment, cues, and setup make practice easier?",
                practices: [
                    "5min breathing",
                    "10min meditation",
                    "Optional: add 5min evening breathing"
                ],
                reading: ["chapter-18-ritual-as-structure"],
                tracking: "List 5 things that help you practice consistently"
            },
            {
                number: 6,
                title: "Commit Long-Term",
                focus: "This is now part of your identity, not something you 'try' to do",
                practices: [
                    "5min+ breathing",
                    "10min+ meditation",
                    "Choose your sustainable rhythm"
                ],
                reading: ["chapter-31-habit-formation"],
                tracking: "Write: 'I am someone who...' completion based on this 6-week streak"
            }
        ]
    },

    // ========== DETAILED PATH 3: Non-Duality ==========
    {
        id: "non-duality",
        title: "Explore Non-Duality",
        subtitle: "The self is a verb, not a noun",
        glyph: "◯",
        duration: 10,

        practices: [
            { type: "Meditation", duration: 20 },
            { type: "Breathing", pattern: "4-7-8", duration: 10 }
        ],

        chapters: [
            "chapter-2-the-self-illusion",
            "chapter-9-witness-consciousness",
            "chapter-15-emptiness-fullness",
            "chapter-27-no-doer",
            "chapter-38-reality-interface"
        ],

        applicationItems: [
            "Notice the noticer",
            "Question 'my thoughts'",
            "Find the gap between thoughts",
            "Practice acting without attachment to outcomes"
        ],

        weeks: [
            {
                number: 1,
                title: "Inspect the Observer",
                focus: "Who is it that's aware of your thoughts?",
                practices: [
                    "Meditation: rest as awareness (20min)",
                    "4-7-8 breathing to settle before meditating"
                ],
                reading: ["chapter-2-the-self-illusion"],
                tracking: "Journal: Can you find the 'I' that's looking?"
            },
            {
                number: 2,
                title: "Thoughts Without a Thinker",
                focus: "Thoughts arise, but there's no entity authoring them",
                practices: [
                    "Meditation: watch thoughts like clouds (20min)",
                    "Notice the gap between thoughts"
                ],
                reading: ["chapter-9-witness-consciousness"],
                tracking: "Count 10 thoughts that appeared without your deliberate choice"
            },
            {
                number: 3,
                title: "No-Self in Action",
                focus: "During daily activities, notice: is there really someone doing this?",
                practices: [
                    "Meditation: choiceless awareness",
                    "Breathing while questioning the doer"
                ],
                reading: ["chapter-27-no-doer"],
                tracking: "Describe an action (eating, walking) without using 'I' or 'me'"
            },
            {
                number: 4,
                title: "Emptiness is Not Nothing",
                focus: "The absence of a fixed self doesn't mean nihilism",
                practices: [
                    "Meditation: fullness within emptiness",
                    "Breathing into spaciousness"
                ],
                reading: ["chapter-15-emptiness-fullness"],
                tracking: "What arises when there's no 'you' to defend or maintain?"
            },
            {
                number: 5,
                title: "The Self as Process",
                focus: "You are a verb (happening) not a noun (thing)",
                practices: [
                    "Meditation: observe the process of experience",
                    "Breathing as flow, not static"
                ],
                reading: ["chapter-2-the-self-illusion"],
                tracking: "Describe yourself using only process words (verbs), no identity nouns"
            },
            {
                number: 6,
                title: "Reality as Interface",
                focus: "What you perceive is not 'objective reality' but a constructed interface",
                practices: [
                    "Meditation: notice constructedness of experience",
                    "Breathing while questioning perception"
                ],
                reading: ["chapter-38-reality-interface"],
                tracking: "Find 3 examples where your perception shaped 'reality'"
            },
            {
                number: 7,
                title: "No Center, No Periphery",
                focus: "Experience arises without a central experiencer",
                practices: [
                    "Meditation: awareness without location",
                    "Breathing without a breather"
                ],
                reading: ["chapter-9-witness-consciousness"],
                tracking: "Try to locate where awareness 'is' - what do you find?"
            },
            {
                number: 8,
                title: "Acting from Not-Knowing",
                focus: "Effective action doesn't require a solid self",
                practices: [
                    "Meditation: rest in uncertainty",
                    "Breathing into the unknown"
                ],
                reading: ["chapter-27-no-doer"],
                tracking: "Make a decision without referring to 'what I want' or 'who I am'"
            },
            {
                number: 9,
                title: "Collapse the Dualities",
                focus: "Self/other, inside/outside, sacred/profane - all conceptual overlays",
                practices: [
                    "Meditation: non-dual awareness",
                    "Breathing as one continuous field"
                ],
                reading: ["chapter-15-emptiness-fullness"],
                tracking: "Notice where you create separation. What happens when you don't?"
            },
            {
                number: 10,
                title: "Living Non-Dual",
                focus: "This isn't a philosophical position but a lived reality",
                practices: [
                    "Meditation: simply being",
                    "Breathing as life breathing itself"
                ],
                reading: ["chapter-38-reality-interface"],
                tracking: "How does daily life change when the 'me' who struggles isn't there?"
            }
        ]
    },

    // ========== PLACEHOLDER PATHS ==========
    {
        id: "grounding",
        title: "Ground & Earth",
        subtitle: "Body as anchor",
        glyph: "▽",
        duration: 4,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    },
    {
        id: "resonance",
        title: "Heart Resonance",
        subtitle: "Connect authentically",
        glyph: "◇",
        duration: 6,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    },
    {
        id: "expression",
        title: "Authentic Expression",
        subtitle: "Voice your truth",
        glyph: "△",
        duration: 5,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    },
    {
        id: "self-knowledge",
        title: "Self-Knowledge",
        subtitle: "Know thyself",
        glyph: "◎",
        duration: 8,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    },
    {
        id: "emotional-regulation",
        title: "Emotional Mastery",
        subtitle: "Feel without drowning",
        glyph: "≋",
        duration: 7,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    },
    {
        id: "attention-training",
        title: "Attention Training",
        subtitle: "Focus is freedom",
        glyph: "◉",
        duration: 6,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    },
    {
        id: "energy-work",
        title: "Energy Cultivation",
        subtitle: "Vitality as practice",
        glyph: "✦",
        duration: 8,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    },
    {
        id: "integration",
        title: "Holistic Integration",
        subtitle: "All modes together",
        glyph: "⬡",
        duration: 12,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    },
    {
        id: "wisdom-embodiment",
        title: "Wisdom → Action",
        subtitle: "Philosophy made flesh",
        glyph: "⟁",
        duration: 10,
        practices: [],
        chapters: [],
        applicationItems: [],
        weeks: [],
        placeholder: true
    }
];

// Helper to get path by ID
export function getPathById(id) {
    return paths.find(p => p.id === id);
}

// Get all non-placeholder paths
export function getActivePaths() {
    return paths.filter(p => !p.placeholder);
}

// Get all paths (including placeholders)
export function getAllPaths() {
    return paths;
}
