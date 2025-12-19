// src/services/benchmarkManager.js
// Benchmark Tracking & Management
// Handles self-reported metrics for breath, focus, body paths

import { useProgressStore } from '../state/progressStore';
import { useCycleStore } from '../state/cycleStore';

// ═══════════════════════════════════════════════════════════════════════════
// STAGE REQUIREMENTS (for avatar progression)
// ═══════════════════════════════════════════════════════════════════════════

export const STAGE_REQUIREMENTS = {
    Seedling: {
        cycles: 0,
        benchmarks: {},
    },
    Ember: {
        cycles: 1, // 1 foundation cycle
        benchmarks: {
            consistency: 0.75, // 75% over cycle
            anyPathProgress: true, // some measurable improvement
        },
    },
    Flame: {
        cycles: 3, // 3 of any cycle type
        benchmarks: {
            consistency: 0.80,
            pathDepth: 2, // demonstrated progress in 2+ paths
        },
    },
    Beacon: {
        cycles: 6,
        benchmarks: {
            consistency: 0.85,
            pathDepth: 3,
        },
    },
    Stellar: {
        cycles: 10,
        benchmarks: {
            consistency: 0.90,
            pathDepth: 3,
            mastery: true, // significant progress in all paths
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log a self-reported benchmark
 * @param {string} pathType - 'breath' | 'focus' | 'body'
 * @param {string} metricName - specific metric (e.g., 'holdDuration', 'flameDuration')
 * @param {number} value - metric value
 */
export function logBenchmark(pathType, metricName, value) {
    const progressState = useProgressStore.getState();
    const cycleState = useCycleStore.getState();

    const entry = {
        date: Date.now(),
        value,
        cycleDay: calculateCycleDay(),
        cycleType: cycleState.currentCycle?.type || null,
    };

    const benchmarks = progressState.benchmarks;
    if (!benchmarks[pathType] || !benchmarks[pathType][metricName]) {
        console.warn(`Unknown benchmark: ${pathType}.${metricName}`);
        return { success: false, error: 'Unknown benchmark' };
    }

    const updatedMetric = [...benchmarks[pathType][metricName], entry];

    useProgressStore.setState({
        benchmarks: {
            ...benchmarks,
            [pathType]: {
                ...benchmarks[pathType],
                [metricName]: updatedMetric,
                lastMeasured: Date.now(),
            },
        },
    });

    return { success: true, entry };
}

/**
 * Get benchmark progress for a specific metric
 * @param {string} pathType
 * @param {string} metricName
 */
export function getBenchmarkProgress(pathType, metricName) {
    const progressState = useProgressStore.getState();
    const data = progressState.benchmarks[pathType]?.[metricName] || [];

    if (data.length === 0) {
        return {
            current: null,
            starting: null,
            trend: 'no_data',
            improvement: 0,
            history: [],
        };
    }

    const current = data[data.length - 1];
    const starting = data[0];
    const trend = calculateTrend(data);
    const improvement = calculateImprovement(data);

    return {
        current,
        starting,
        trend,
        improvement,
        history: data,
    };
}

/**
 * Check if metrics are sufficient for stage advancement
 * @param {string} targetStage - 'Ember' | 'Flame' | 'Beacon' | 'Stellar'
 */
export function metricsCheckForStage(targetStage) {
    const cycleState = useCycleStore.getState();
    const requirements = STAGE_REQUIREMENTS[targetStage];

    if (!requirements) {
        return { sufficient: false, missing: ['Unknown stage'] };
    }

    const missing = [];

    // Check cycle completion count
    if (cycleState.totalCyclesCompleted < requirements.cycles) {
        missing.push(
            `Need ${requirements.cycles} completed cycles, have ${cycleState.totalCyclesCompleted}`
        );
    }

    // Check specific benchmarks
    const required = requirements.benchmarks;

    if (required.consistency) {
        const avgConsistency = calculateAverageConsistency();
        if (avgConsistency < required.consistency) {
            missing.push(
                `Need ${Math.round(required.consistency * 100)}% consistency, have ${Math.round(avgConsistency * 100)}%`
            );
        }
    }

    if (required.anyPathProgress) {
        if (!hasAnyPathProgress()) {
            missing.push('Need measurable progress in at least one path');
        }
    }

    if (required.pathDepth) {
        const pathsWithProgress = countPathsWithProgress();
        if (pathsWithProgress < required.pathDepth) {
            missing.push(
                `Need progress in ${required.pathDepth} paths, have ${pathsWithProgress}`
            );
        }
    }

    if (required.mastery) {
        if (!hasMastery()) {
            missing.push('Need significant progress in all paths');
        }
    }

    return {
        sufficient: missing.length === 0,
        missing,
        requirements,
    };
}

/**
 * Detect capacity regression
 * @param {string} pathType
 */
export function checkCapacityRegression(pathType) {
    const progressState = useProgressStore.getState();
    const benchmarks = progressState.benchmarks[pathType];

    if (!benchmarks) {
        return { regressed: false };
    }

    // Gather all metrics for this path
    const allMetrics = Object.keys(benchmarks)
        .filter((key) => Array.isArray(benchmarks[key]))
        .map((key) => benchmarks[key]);

    if (allMetrics.length === 0 || allMetrics.every((m) => m.length < 5)) {
        return { regressed: false, reason: 'insufficient_data' };
    }

    // Check each metric for regression
    for (const metricData of allMetrics) {
        if (metricData.length < 5) continue;

        const recentData = metricData.slice(-5).map((d) => d.value);
        const historicalData = metricData.map((d) => d.value);
        const historicalBest = Math.max(...historicalData);
        const recentAverage = recentData.reduce((a, b) => a + b, 0) / recentData.length;

        // 20% drop from historical best
        if (recentAverage < historicalBest * 0.8) {
            return {
                regressed: true,
                metric: metricData,
                historicalBest,
                recentAverage,
                dropPercentage: Math.round((1 - recentAverage / historicalBest) * 100),
                recommendation: 'stage_demotion_or_focus',
            };
        }
    }

    return { regressed: false };
}

/**
 * Get all benchmark summary (for dashboard)
 */
export function getAllBenchmarkSummary() {
    const progressState = useProgressStore.getState();
    const { benchmarks } = progressState;

    const summary = {};

    ['breath', 'focus', 'body'].forEach((pathType) => {
        const pathBenchmarks = benchmarks[pathType];
        if (!pathBenchmarks) return;

        summary[pathType] = {};

        Object.keys(pathBenchmarks).forEach((metricName) => {
            if (Array.isArray(pathBenchmarks[metricName])) {
                summary[pathType][metricName] = getBenchmarkProgress(pathType, metricName);
            }
        });
    });

    return summary;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate current cycle day
 */
function calculateCycleDay() {
    const cycleState = useCycleStore.getState();
    if (!cycleState.currentCycle) return null;

    return cycleState.calculateElapsedDays();
}

/**
 * Calculate trend from data points
 */
function calculateTrend(data) {
    if (data.length < 2) return 'no_data';

    const values = data.map((d) => d.value);
    const n = values.length;
    const half = Math.floor(n / 2);
    const firstHalf = values.slice(0, half);
    const secondHalf = values.slice(-half);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgSecond > avgFirst * 1.1) return 'improving';
    if (avgSecond < avgFirst * 0.9) return 'declining';
    return 'stable';
}

/**
 * Calculate improvement percentage
 */
function calculateImprovement(data) {
    if (data.length < 2) return 0;

    const first = data[0].value;
    const last = data[data.length - 1].value;

    if (first === 0) return last > 0 ? 100 : 0;

    return Math.round(((last - first) / first) * 100);
}

/**
 * Calculate average consistency across all completed cycles
 */
function calculateAverageConsistency() {
    const cycleState = useCycleStore.getState();
    const { completedCycles } = cycleState;

    if (completedCycles.length === 0) return 0;

    const consistencies = completedCycles
        .filter((c) => !c.failed)
        .map((c) => c.finalConsistencyRate);

    if (consistencies.length === 0) return 0;

    return consistencies.reduce((a, b) => a + b, 0) / consistencies.length;
}

/**
 * Check if user has any path progress
 */
function hasAnyPathProgress() {
    const progressState = useProgressStore.getState();
    const { benchmarks } = progressState;

    for (const pathType of ['breath', 'focus', 'body']) {
        const pathBenchmarks = benchmarks[pathType];
        const hasData = Object.keys(pathBenchmarks).some(
            (key) => Array.isArray(pathBenchmarks[key]) && pathBenchmarks[key].length > 0
        );
        if (hasData) return true;
    }

    return false;
}

/**
 * Count paths with measurable progress
 */
function countPathsWithProgress() {
    const progressState = useProgressStore.getState();
    const { benchmarks } = progressState;

    let count = 0;

    for (const pathType of ['breath', 'focus', 'body']) {
        const pathBenchmarks = benchmarks[pathType];
        const hasData = Object.keys(pathBenchmarks).some(
            (key) => Array.isArray(pathBenchmarks[key]) && pathBenchmarks[key].length >= 3
        );
        if (hasData) count++;
    }

    return count;
}

/**
 * Check for mastery (significant progress in all paths)
 */
function hasMastery() {
    const progressState = useProgressStore.getState();
    const { benchmarks } = progressState;

    for (const pathType of ['breath', 'focus', 'body']) {
        const pathBenchmarks = benchmarks[pathType];
        const hasSignificantData = Object.keys(pathBenchmarks).some((key) => {
            const data = pathBenchmarks[key];
            if (!Array.isArray(data) || data.length < 5) return false;

            // Check for improvement
            const first = data[0].value;
            const last = data[data.length - 1].value;
            return last > first * 1.5; // 50% improvement
        });

        if (!hasSignificantData) return false;
    }

    return true;
}
