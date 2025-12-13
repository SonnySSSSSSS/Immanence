// src/state/practiceConfig.js
// Shared practice definitions for Mode Training system
// NOTE: This file is for Application ONLY - do NOT import into Compass

export const PRACTICE_DEFINITIONS = {
    mirror: {
        type: 'stillness',
        duration: 90,
        accent: 'rgba(147, 197, 253, 0.8)', // blue
        whisper: 'See it clean.',
        introText: 'Let what is be enough.',
        reflectionPrompts: {
            early: 'What made you stop?',
            complete: 'What tried to change?',
        },
    },
    resonator: {
        type: 'iteration',
        iterations: 5,
        accent: 'rgba(167, 139, 250, 0.8)', // purple
        whisper: "Feel it. Don't fix it.",
        allowSkip: true,
        steps: [
            'What is the sensation?',
            'What is the emotion?',
            'What is the story?',
            'What is it asking for?',
            'What changed in the body?', // Bookend - return to sensation
        ],
        reflectionPrompts: {
            manySkips: 'What made words unavailable?',
            fewSkips: 'What shifted when you named it?',
        },
        antiInflation: 'Treat this as a fit for today, not a verdict.',
    },
    prism: {
        type: 'frames',
        frames: 3,
        accent: 'rgba(251, 191, 36, 0.8)', // amber
        whisper: 'Loosen your grip.',
        steps: [
            'What happened?',
            'What else could this mean?',
            'Which frame gives you a next move?',
        ],
        constraints: [
            null,
            'Choose a frame you could defend in a calm conversation.',
            null,
        ],
        reflectionPrompts: {
            early: 'Which frame felt hardest?',
            complete: 'What loosened?',
        },
        consequenceBridge: 'What does that loosened feeling allow you to do next?',
    },
    sword: {
        type: 'compression',
        timerOptional: true,
        defaultTimer: 60,
        accent: 'rgba(248, 113, 113, 0.8)', // red
        whisper: 'Choose the cut.',
        steps: [
            'What needs to stop?',
            'What needs to start?',
            'Smallest real step you can take today?',
        ],
        reflectionPrompts: {
            early: 'What made you hesitate?',
            complete: 'What became clear?',
        },
        deEscalation: 'If you feel righteous instead of clear, return to Mirror.',
        // Words that trigger righteousness warning
        blameIndicators: ['they', 'you people', 'everyone', 'nobody', 'always', 'never'],
    },
};

// Mode Check (Harmony) options
export const MODE_CHECK_OPTIONS = [
    { id: 'yes', label: 'Yes' },
    { id: 'stayed_too_long', label: 'No — I stayed too long' },
    { id: 'switched_too_early', label: 'No — I switched too early' },
];
