// src/services/circuitManager.js
// Circuit Training Logic
// Handles multi-path training sessions

import { useCurriculumStore } from '../state/curriculumStore';
import { recordPracticeSession } from './sessionRecorder';

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all available circuits
 */
export function getAvailableCircuits() {
    const curriculumState = useCurriculumStore.getState();
    return curriculumState.getAvailableCircuits();
}

/**
 * Get a specific circuit by ID
 */
export function getCircuit(circuitId) {
    const curriculumState = useCurriculumStore.getState();
    return curriculumState.getCircuit(circuitId);
}

/**
 * Start a circuit session
 * @param {string} circuitId
 * @returns {Object} Circuit session data
 */
export function startCircuit(circuitId) {
    const circuit = getCircuit(circuitId);

    if (!circuit) {
        return { success: false, error: 'Circuit not found' };
    }

    const totalDuration = circuit.exercises.reduce((sum, ex) => sum + ex.duration, 0);

    // Generate transition times
    const transitions = generateTransitionTimes(circuit.exercises);

    return {
        success: true,
        circuit,
        totalDuration,
        exercises: circuit.exercises,
        currentExercise: 0,
        transitions,
        startTime: Date.now(),
    };
}

/**
 * Log circuit completion
 * @param {string} circuitId
 * @param {Array} exercisesCompleted - Array of completed exercises
 */
export function logCircuitCompletion(circuitId, exercisesCompleted) {
    const circuit = getCircuit(circuitId);

    if (!circuit) {
        return { success: false, error: 'Circuit not found' };
    }

    // Calculate contributions per path
    const contributions = {};

    exercisesCompleted.forEach((ex) => {
        const pathType = ex.type;
        if (!contributions[pathType]) {
            contributions[pathType] = 0;
        }
        contributions[pathType] += ex.duration;
    });

    // Total duration
    const totalDuration = Object.values(contributions).reduce((a, b) => a + b, 0);

    // Get current time of day
    const now = new Date();
    const timeOfDay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Log to practice history
    recordPracticeSession({
        persistSession: false,
        cycleEnabled: true,
        cycleMinDuration: 0,
        cyclePracticeData: {
            type: 'circuit',
            duration: totalDuration,
            timeOfDay,
            exercises: exercisesCompleted.map((ex) => ex.type),
            contributions,
        },
    });

    return {
        success: true,
        circuitId,
        totalDuration,
        contributions,
        exercisesCompleted: exercisesCompleted.length,
    };
}

/**
 * Get circuit progress/statistics
 * @param {string} circuitId
 */
export function getCircuitStats(circuitId) {
    void circuitId;
    // TODO: Implement circuit-specific stats from practiceHistory
    // For now, return placeholder
    return {
        timesCompleted: 0,
        lastCompleted: null,
        averageDuration: 0,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate transition timestamps for circuit exercises
 * @param {Array} exercises
 * @returns {Array} Array of { exerciseIndex, startTime, endTime }
 */
function generateTransitionTimes(exercises) {
    const transitions = [];
    let accumulated = 0;

    exercises.forEach((exercise, index) => {
        transitions.push({
            exerciseIndex: index,
            startTime: accumulated,
            endTime: accumulated + exercise.duration,
            duration: exercise.duration,
        });
        accumulated += exercise.duration;
    });

    return transitions;
}

/**
 * Calculate which exercise should be active at a given time
 * @param {Array} transitions
 * @param {number} elapsedMinutes
 */
export function getCurrentExercise(transitions, elapsedMinutes) {
    for (let i = 0; i < transitions.length; i++) {
        const t = transitions[i];
        if (elapsedMinutes >= t.startTime && elapsedMinutes < t.endTime) {
            return {
                index: i,
                exerciseIndex: t.exerciseIndex,
                remainingTime: t.endTime - elapsedMinutes,
                progress: (elapsedMinutes - t.startTime) / t.duration,
            };
        }
    }

    // Circuit complete
    return {
        index: transitions.length,
        exerciseIndex: transitions.length,
        remainingTime: 0,
        progress: 1,
        complete: true,
    };
}
