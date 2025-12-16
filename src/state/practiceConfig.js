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
    wave: {
        type: 'capacity',
        duration: 90, // seconds
        accent: 'rgba(167, 139, 250, 0.8)', // purple
        whisper: 'Ride the wave.',
        phases: ['inventory', 'somatic', 'impulse', 'ride', 'complete'],
        reflectionPrompts: {
            aborted: 'Capacity exceeded. This is data, not failure.',
            complete: 'What moved when you held it?',
        },
        antiInflation: 'Endurance is not victory. Just presence.',
    },
    // Legacy alias for resonator
    resonator: {
        type: 'capacity',
        duration: 90,
        accent: 'rgba(167, 139, 250, 0.8)',
        whisper: 'Ride the wave.',
        phases: ['inventory', 'somatic', 'impulse', 'ride', 'complete'],
        reflectionPrompts: {
            aborted: 'Capacity exceeded. This is data, not failure.',
            complete: 'What moved when you held it?',
        },
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
