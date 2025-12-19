// src/services/cycleManager.js
// Cycle Management Logic
// Integrates with cycleStore to handle complex cycle operations

import { useCycleStore } from '../state/cycleStore';
import { useProgressStore } from '../state/progressStore';

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log a practice session (integrates with cycleStore)
 * @param {Object} practiceData
 * @param {string} practiceData.type - 'breath' | 'flame' | 'body' | 'circuit'
 * @param {number} practiceData.duration - minutes
 * @param {string} practiceData.timeOfDay - 'HH:MM'
 * @param {Array} practiceData.exercises - for circuits
 * @param {Object} practiceData.contributions - for multi-path
 */
export function logPractice(practiceData) {
    const now = Date.now();
    const date = new Date(now);
    const timeOfDay = practiceData.timeOfDay || `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

    // Add to practiceHistory in progressStore
    const progressState = useProgressStore.getState();
    const newHistoryEntry = {
        date: now,
        type: practiceData.type,
        duration: practiceData.duration,
        timeOfDay,
        exercises: practiceData.exercises || [],
        contributions: practiceData.contributions || { [practiceData.type]: practiceData.duration },
    };

    useProgressStore.setState({
        practiceHistory: [...(progressState.practiceHistory || []), newHistoryEntry],
    });

    // Log to cycleStore if 10+ minutes
    if (practiceData.duration >= 10) {
        const cycleState = useCycleStore.getState();
        cycleState.logPracticeDay(now);
    }

    // Recalculate consistency metrics
    calculateAndUpdateConsistencyMetrics();

    return { success: true, logged: newHistoryEntry };
}

/**
 * Calculate current effective progress
 */
export function calculateEffectiveProgress() {
    const cycleState = useCycleStore.getState();
    if (!cycleState.currentCycle) {
        return { effectiveDays: 0, consistencyRate: 0 };
    }

    return {
        effectiveDays: cycleState.currentCycle.effectiveDays,
        consistencyRate: cycleState.currentCycle.consistencyRate,
    };
}

/**
 * Recalibrate when switching modes
 * Returns new projections
 */
export function recalibrateOnModeSwitch(newMode) {
    const cycleState = useCycleStore.getState();
    const result = cycleState.switchMode(newMode);

    if (!result.success) {
        return result;
    }

    // Calculate projected completion date
    const { projectedElapsedDays } = result;
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + projectedElapsedDays);

    return {
        ...result,
        projectedCompletionDate: projectedDate.toISOString(),
    };
}

/**
 * Check if cycle is complete
 */
export function checkCycleCompletion() {
    const cycleState = useCycleStore.getState();
    return cycleState.checkCompletion();
}

/**
 * Stop/fail current cycle
 */
export function stopCycle() {
    const cycleState = useCycleStore.getState();
    cycleState.stopCycle();
    return { success: true };
}

/**
 * Get metrics for completed cycle (for avatar progression)
 */
export function gatherMetrics() {
    const progressState = useProgressStore.getState();
    const benchmarks = progressState.benchmarks;

    // Gather latest metrics from each path
    const metrics = {};

    if (benchmarks.breath.holdDuration.length > 0) {
        const latest = benchmarks.breath.holdDuration[benchmarks.breath.holdDuration.length - 1];
        metrics.breathHold = latest.value;
    }

    if (benchmarks.focus.flameDuration.length > 0) {
        const latest = benchmarks.focus.flameDuration[benchmarks.focus.flameDuration.length - 1];
        metrics.focusDuration = latest.value;
    }

    if (benchmarks.body.scanCompletionTime.length > 0) {
        const latest = benchmarks.body.scanCompletionTime[benchmarks.body.scanCompletionTime.length - 1];
        metrics.bodyScanTime = latest.value;
    }

    return metrics;
}

/**
 * Determine next available cycle type based on completion history
 */
export function determineNextCycle() {
    const cycleState = useCycleStore.getState();
    const { completedCycles } = cycleState;

    // Check if foundation completed
    const hasFoundation = completedCycles.some(
        (c) => c.type === 'foundation' && !c.failed
    );

    if (!hasFoundation) {
        return { type: 'foundation', unlocked: true };
    }

    // Check if transformation completed
    const hasTransformation = completedCycles.some(
        (c) => c.type === 'transformation' && !c.failed
    );

    return {
        type: hasTransformation ? 'integration' : 'transformation',
        unlocked: true,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate and update consistency metrics
 */
function calculateAndUpdateConsistencyMetrics() {
    const progressState = useProgressStore.getState();
    const history = progressState.practiceHistory || [];

    if (history.length === 0) {
        return;
    }

    // Calculate time consistency
    const timeConsistency = calculateTimeConsistency(history);

    // Calculate duration consistency
    const durationConsistency = calculateDurationConsistency(history);

    // Determine frequency pattern
    const frequencyPattern = determineFrequencyPattern(history);

    // Calculate average time of day
    const averageTimeOfDay = calculateAverageTimeOfDay(history);

    useProgressStore.setState({
        consistencyMetrics: {
            averageTimeOfDay,
            timeConsistencyScore: timeConsistency,
            durationConsistency,
            frequencyPattern,
        },
    });
}

/**
 * Calculate time-of-day consistency (0-1, higher = more consistent)
 */
function calculateTimeConsistency(history) {
    if (history.length < 2) return 1;

    const times = history.map((p) => {
        const [hours, minutes] = p.timeOfDay.split(':').map(Number);
        return hours * 60 + minutes; // Convert to minutes since midnight
    });

    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    // Max possible std dev is ~720 minutes (12 hours)
    const maxStdDev = 720;
    return Math.max(0, 1 - stdDev / maxStdDev);
}

/**
 * Calculate duration consistency (0-1, higher = more consistent)
 */
function calculateDurationConsistency(history) {
    if (history.length < 2) return 1;

    const durations = history.map((p) => p.duration);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // Lower CV = more consistent
    // CV of 0 = perfect consistency, CV > 1 = very variable
    return Math.max(0, 1 - Math.min(1, coefficientOfVariation));
}

/**
 * Determine frequency pattern
 */
function determineFrequencyPattern(history) {
    if (history.length === 0) return 'irregular';

    // Look at last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recent = history.filter((p) => p.date >= thirtyDaysAgo);

    if (recent.length === 0) return 'irregular';

    // Count unique days with practice
    const uniqueDays = new Set();
    recent.forEach((p) => {
        const date = new Date(p.date);
        date.setHours(0, 0, 0, 0);
        uniqueDays.add(date.getTime());
    });

    const daysWithPractice = uniqueDays.size;

    if (daysWithPractice >= 28) return 'daily';
    if (daysWithPractice >= 20) return 'flexible';
    return 'irregular';
}

/**
 * Calculate average time of day
 */
function calculateAverageTimeOfDay(history) {
    if (history.length === 0) return null;

    const times = history.map((p) => {
        const [hours, minutes] = p.timeOfDay.split(':').map(Number);
        return hours * 60 + minutes;
    });

    const avgMinutes = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Calculate projected completion date
 */
export function calculateProjectedCompletion(remainingDays) {
    const projected = new Date();
    projected.setDate(projected.getDate() + remainingDays);
    return projected.toISOString();
}
