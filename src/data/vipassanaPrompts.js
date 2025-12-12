// src/data/vipassanaPrompts.js
// Prompts for Vipassana practice with noting and watching modes

export const VIPASSANA_PROMPTS = {
    noting: [
        { text: "Sit with spine upright. Let the body settle.", timing: 0 },
        { text: "When a thought arises, silently note 'thinking'...", timing: 30 },
        { text: "When emotion surfaces, note 'feeling'...", timing: 75 },
        { text: "When a sound catches attention, note 'hearing'...", timing: 120 },
        { text: "When the body calls, note 'sensation'...", timing: 165 },
        { text: "Note without judgment. Just a gentle label.", timing: 210 },
        { text: "If you get lost in thought, simply note 'wandering' and return.", timing: 270 },
        { text: "Each noting creates a small gap. Rest in that gap.", timing: 330 },
        { text: "Continue noting whatever arises...", timing: 400 },
        { text: "The noting itself becomes effortless.", timing: 480 },
        { text: "Simply observe the stream of experience.", timing: 560 },
    ],
    watching: [
        { text: "Let everything arise and pass like clouds in the sky...", timing: 0 },
        { text: "No need to chase or push away.", timing: 60 },
        { text: "You are the sky, not the clouds.", timing: 120 },
        { text: "Thoughts appear, linger, dissolve. Let them.", timing: 180 },
        { text: "Emotions rise and fall like waves. You are the ocean.", timing: 250 },
        { text: "Nothing to fix. Nothing to improve.", timing: 320 },
        { text: "Just watching. Just presence.", timing: 400 },
        { text: "The stream of experience flows on its own.", timing: 480 },
        { text: "Rest in open awareness.", timing: 560 },
        { text: "Everything belongs here.", timing: 640 },
    ],
};

// Get the appropriate prompt for a given elapsed time and mode
export function getVipassanaPrompt(elapsedSeconds, mode = 'noting') {
    const prompts = VIPASSANA_PROMPTS[mode] || VIPASSANA_PROMPTS.noting;
    let activePrompt = prompts[0];

    for (const prompt of prompts) {
        if (elapsedSeconds >= prompt.timing) {
            activePrompt = prompt;
        } else {
            break;
        }
    }

    return activePrompt;
}
