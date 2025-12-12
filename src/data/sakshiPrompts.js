// src/data/sakshiPrompts.js
// Sparse prompts for Sakshi (Witness) practice
// Prompts appear every 60-90 seconds - minimal guidance

export const SAKSHI_PROMPTS = [
    {
        text: "Notice that you are aware.",
        timing: 0, // Start immediately
    },
    {
        text: "Awareness is already present. You don't need to create it.",
        timing: 90,
    },
    {
        text: "Thoughts arise in awareness. You are that in which they arise.",
        timing: 180,
    },
    {
        text: "Rest as the witness.",
        timing: 270,
    },
    {
        text: "Nothing to do. Nothing to fix. Just this.",
        timing: 360,
    },
    {
        text: "The observer cannot be observed. Rest there.",
        timing: 450,
    },
    {
        text: "Let everything be exactly as it is.",
        timing: 540,
    },
    {
        text: "You are not your thoughts. You are the space in which they appear.",
        timing: 630,
    },
    {
        text: "This awareness has always been here.",
        timing: 720,
    },
    {
        text: "Simply be.",
        timing: 810,
    },
];

// Get the appropriate prompt for a given elapsed time
export function getActivePrompt(elapsedSeconds) {
    let activePrompt = SAKSHI_PROMPTS[0];

    for (const prompt of SAKSHI_PROMPTS) {
        if (elapsedSeconds >= prompt.timing) {
            activePrompt = prompt;
        } else {
            break;
        }
    }

    return activePrompt;
}
