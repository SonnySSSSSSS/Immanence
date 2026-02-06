// src/data/pathMotionGrammar.js
// Motion grammar presets keyed by attention-interface path

export const PATH_MOTION_GRAMMAR = {
    Yantra: {
        rotationStyle: 'stepped',
        rotationStepDeg: 60,
        scaleBreathMin: 0.99,
        scaleBreathMax: 1.01,
        glowPulse: 0.12,
    },
    Kaya: {
        rotationStyle: 'still',
        rotationStepDeg: 0,
        scaleBreathMin: 0.94,
        scaleBreathMax: 1.06,
        glowPulse: 0.28,
    },
    Chitra: {
        rotationStyle: 'drift',
        rotationStepDeg: 0,
        scaleBreathMin: 0.97,
        scaleBreathMax: 1.03,
        glowPulse: 0.22,
    },
    Nada: {
        rotationStyle: 'oscillate',
        rotationStepDeg: 0,
        scaleBreathMin: 0.96,
        scaleBreathMax: 1.04,
        glowPulse: 0.35,
    },
};

export function getPathMotionGrammar(pathId) {
    return PATH_MOTION_GRAMMAR[pathId] || PATH_MOTION_GRAMMAR.Yantra;
}
