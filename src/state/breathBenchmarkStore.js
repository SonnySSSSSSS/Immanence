import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const EMPTY_LIFETIME_MAX = Object.freeze({
    inhale: 0,
    hold1: 0,
    exhale: 0,
    hold2: 0,
    total: 0,
});

const ATTEMPT_STATUS = Object.freeze({
    NOT_STARTED: 'not_started',
    SATISFIED: 'satisfied',
});

const DEFAULT_REUSE_MAX_AGE_DAYS = 14;

const normalizePositive = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n);
};

const sanitizeBenchmarkInput = (results = {}) => {
    const inhale = normalizePositive(results.inhale);
    const hold1 = normalizePositive(results.hold1);
    const exhale = normalizePositive(results.exhale);
    const hold2 = normalizePositive(results.hold2);
    const measuredAt = Number.isFinite(Number(results.measuredAt))
        ? Number(results.measuredAt)
        : Date.now();
    const total = inhale + hold1 + exhale + hold2;

    return {
        inhale,
        hold1,
        exhale,
        hold2,
        total,
        measuredAt,
    };
};

const mergeLifetimeMax = (current = EMPTY_LIFETIME_MAX, snapshot = null) => {
    if (!snapshot) return current;
    const currentSafe = { ...EMPTY_LIFETIME_MAX, ...(current || {}) };
    return {
        inhale: Math.max(normalizePositive(currentSafe.inhale), normalizePositive(snapshot.inhale)),
        hold1: Math.max(normalizePositive(currentSafe.hold1), normalizePositive(snapshot.hold1)),
        exhale: Math.max(normalizePositive(currentSafe.exhale), normalizePositive(snapshot.exhale)),
        hold2: Math.max(normalizePositive(currentSafe.hold2), normalizePositive(snapshot.hold2)),
        total: Math.max(normalizePositive(currentSafe.total), normalizePositive(snapshot.total)),
    };
};

/**
 * Breath Benchmark Store
 *
 * Stores user's measured breath capacity and provides progressive pattern scaling.
 *
 * Progression: 75% → 85% → 100% through session thirds based on breath count.
 */
export const useBreathBenchmarkStore = create(
    persist(
        (set, get) => ({
            // Benchmark data: user's max capacity for each phase (in seconds)
            benchmark: null, // compatibility alias for current effective benchmark
            lastBenchmark: null, // latest completed benchmark snapshot
            benchmarkHistory: [], // append-only snapshots
            benchmarksByRunId: {}, // { [runId]: { day1: snapshot, day14: snapshot } }
            attemptBenchmarksByRunId: {}, // { [runId]: { status, benchmark, source, createdAt, updatedAt } }
            lifetimeMax: { ...EMPTY_LIFETIME_MAX },

            // Set benchmark after completing the 4-phase test
            setBenchmark: (results) => set((state) => {
                const snapshot = sanitizeBenchmarkInput(results);
                return {
                    benchmark: snapshot,
                    lastBenchmark: snapshot,
                    benchmarkHistory: [...(state.benchmarkHistory || []), snapshot],
                    lifetimeMax: mergeLifetimeMax(state.lifetimeMax, snapshot),
                };
            }),

            // Save benchmark snapshot for a specific run and contract day (day1/day14)
            saveRunBenchmark: ({ runId, dayNumber, results }) => set((state) => {
                const safeRunId = typeof runId === 'string' ? runId : null;
                const dayNum = Number(dayNumber);
                const dayKey = dayNum === 1 ? 'day1' : dayNum === 14 ? 'day14' : null;
                const snapshot = sanitizeBenchmarkInput(results);

                if (!safeRunId || !dayKey) {
                    return {
                        benchmark: snapshot,
                        lastBenchmark: snapshot,
                        benchmarkHistory: [...(state.benchmarkHistory || []), snapshot],
                        lifetimeMax: mergeLifetimeMax(state.lifetimeMax, snapshot),
                    };
                }

                const existingForRun = state.benchmarksByRunId?.[safeRunId] || {};
                return {
                    benchmark: snapshot,
                    lastBenchmark: snapshot,
                    benchmarkHistory: [...(state.benchmarkHistory || []), snapshot],
                    benchmarksByRunId: {
                        ...(state.benchmarksByRunId || {}),
                        [safeRunId]: {
                            ...existingForRun,
                            [dayKey]: snapshot,
                        },
                    },
                    lifetimeMax: mergeLifetimeMax(state.lifetimeMax, snapshot),
                };
            }),

            resetAttemptBenchmark: (runId) => set((state) => {
                const safeRunId = typeof runId === 'string' ? runId : null;
                if (!safeRunId) return {};
                const now = Date.now();
                return {
                    attemptBenchmarksByRunId: {
                        ...(state.attemptBenchmarksByRunId || {}),
                        [safeRunId]: {
                            status: ATTEMPT_STATUS.NOT_STARTED,
                            benchmark: null,
                            source: null,
                            createdAt: now,
                            updatedAt: now,
                        },
                    },
                };
            }),

            completeAttemptBenchmark: ({ runId, results, source = 'fresh' }) => set((state) => {
                const safeRunId = typeof runId === 'string' ? runId : null;
                if (!safeRunId) return {};
                const now = Date.now();
                const snapshot = sanitizeBenchmarkInput(results);
                return {
                    benchmark: snapshot,
                    lastBenchmark: snapshot,
                    benchmarkHistory: [...(state.benchmarkHistory || []), snapshot],
                    attemptBenchmarksByRunId: {
                        ...(state.attemptBenchmarksByRunId || {}),
                        [safeRunId]: {
                            status: ATTEMPT_STATUS.SATISFIED,
                            benchmark: snapshot,
                            source,
                            createdAt: state.attemptBenchmarksByRunId?.[safeRunId]?.createdAt || now,
                            updatedAt: now,
                        },
                    },
                    lifetimeMax: mergeLifetimeMax(state.lifetimeMax, snapshot),
                };
            }),

            canReuseLastBenchmark: (maxAgeDays = DEFAULT_REUSE_MAX_AGE_DAYS) => {
                const { lastBenchmark } = get();
                if (!lastBenchmark?.measuredAt) return false;
                const maxAgeMs = Number(maxAgeDays) * 24 * 60 * 60 * 1000;
                if (!Number.isFinite(maxAgeMs) || maxAgeMs <= 0) return false;
                return (Date.now() - Number(lastBenchmark.measuredAt)) <= maxAgeMs;
            },

            reuseLastBenchmarkForAttempt: (runId, { maxAgeDays = DEFAULT_REUSE_MAX_AGE_DAYS } = {}) => set((state) => {
                const safeRunId = typeof runId === 'string' ? runId : null;
                const last = state.lastBenchmark || null;
                if (!safeRunId || !last?.measuredAt) return {};
                const maxAgeMs = Number(maxAgeDays) * 24 * 60 * 60 * 1000;
                if (!Number.isFinite(maxAgeMs) || maxAgeMs <= 0) return {};
                if ((Date.now() - Number(last.measuredAt)) > maxAgeMs) return {};

                const now = Date.now();
                return {
                    benchmark: last,
                    attemptBenchmarksByRunId: {
                        ...(state.attemptBenchmarksByRunId || {}),
                        [safeRunId]: {
                            status: ATTEMPT_STATUS.SATISFIED,
                            benchmark: last,
                            source: 'reuse',
                            createdAt: state.attemptBenchmarksByRunId?.[safeRunId]?.createdAt || now,
                            updatedAt: now,
                        },
                    },
                };
            }),

            hasBenchmarkForRun: (runId) => {
                const safeRunId = typeof runId === 'string' ? runId : null;
                if (!safeRunId) return false;
                const attempt = get().attemptBenchmarksByRunId?.[safeRunId];
                return Boolean(attempt?.status === ATTEMPT_STATUS.SATISFIED && attempt?.benchmark);
            },

            getAttemptBenchmark: (runId) => {
                const safeRunId = typeof runId === 'string' ? runId : null;
                if (!safeRunId) return null;
                return get().attemptBenchmarksByRunId?.[safeRunId] || null;
            },

            getRunBenchmark: (runId, dayNumber) => {
                const safeRunId = typeof runId === 'string' ? runId : null;
                if (!safeRunId) return null;
                const dayNum = Number(dayNumber);
                const dayKey = dayNum === 1 ? 'day1' : dayNum === 14 ? 'day14' : null;
                if (!dayKey) return null;
                return get().benchmarksByRunId?.[safeRunId]?.[dayKey] || null;
            },

            // Clear benchmark data
            clearBenchmark: () => set({ benchmark: null }),

            // Check if user has completed benchmark
            hasBenchmark: () => get().benchmark !== null,

            // Get days since last benchmark
            daysSinceBenchmark: () => {
                const { benchmark } = get();
                if (!benchmark?.measuredAt) return Infinity;
                const msPerDay = 24 * 60 * 60 * 1000;
                return Math.floor((Date.now() - benchmark.measuredAt) / msPerDay);
            },

            // Check if re-benchmark is needed (weekly)
            needsRebenchmark: () => {
                const { benchmark } = get();
                if (!benchmark?.measuredAt) return false;
                return get().daysSinceBenchmark() >= 7;
            },

            // Get progressive pattern for a given cycle number
            // Progression: first third = 75%, middle third = 85%, final third = 100%
            getPatternForCycle: (cycleNumber, totalCycles) => {
                const { benchmark } = get();
                if (!benchmark) return null;
                if (totalCycles <= 0) return null;

                // Determine which third of the session we're in
                const third = Math.max(1, totalCycles / 3);
                let multiplier;

                if (cycleNumber <= third) {
                    multiplier = 0.75; // First third: warm-up
                } else if (cycleNumber <= third * 2) {
                    multiplier = 0.85; // Middle third: building
                } else {
                    multiplier = 1.0;  // Final third: full capacity
                }

                return {
                    inhale: Math.round(benchmark.inhale * multiplier),
                    hold1: Math.round(benchmark.hold1 * multiplier),
                    exhale: Math.round(benchmark.exhale * multiplier),
                    hold2: Math.round(benchmark.hold2 * multiplier),
                };
            },

            // Get the starting pattern (75% of benchmark)
            getStartingPattern: () => {
                const { benchmark } = get();
                if (!benchmark) return null;

                return {
                    inhale: Math.round(benchmark.inhale * 0.75),
                    hold1: Math.round(benchmark.hold1 * 0.75),
                    exhale: Math.round(benchmark.exhale * 0.75),
                    hold2: Math.round(benchmark.hold2 * 0.75),
                };
            },

            // Calculate total cycles for a given duration and pattern
            calculateTotalCycles: (durationMinutes, pattern) => {
                if (!pattern) return 0;
                const cycleDuration = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;
                if (cycleDuration <= 0) return 0;
                return Math.floor((durationMinutes * 60) / cycleDuration);
            },
        }),
        {
            name: 'immanence-breath-benchmark',
            version: 3,
            migrate: (persistedState) => {
                const next = persistedState || {};
                const benchmark = next.benchmark ? sanitizeBenchmarkInput(next.benchmark) : null;
                const lastBenchmark = next.lastBenchmark
                    ? sanitizeBenchmarkInput(next.lastBenchmark)
                    : benchmark;
                const benchmarkHistory = Array.isArray(next.benchmarkHistory)
                    ? next.benchmarkHistory
                        .map((entry) => (entry ? sanitizeBenchmarkInput(entry) : null))
                        .filter(Boolean)
                    : (lastBenchmark ? [lastBenchmark] : []);
                const benchmarksByRunId = next.benchmarksByRunId && typeof next.benchmarksByRunId === 'object'
                    ? next.benchmarksByRunId
                    : {};
                const attemptBenchmarksByRunId = next.attemptBenchmarksByRunId && typeof next.attemptBenchmarksByRunId === 'object'
                    ? next.attemptBenchmarksByRunId
                    : {};
                const seedLifetime = next.lifetimeMax && typeof next.lifetimeMax === 'object'
                    ? { ...EMPTY_LIFETIME_MAX, ...next.lifetimeMax }
                    : { ...EMPTY_LIFETIME_MAX };
                const lifetimeMax = (benchmarkHistory.length > 0 ? benchmarkHistory : [lastBenchmark].filter(Boolean))
                    .reduce((acc, snapshot) => mergeLifetimeMax(acc, snapshot), seedLifetime);

                return {
                    ...next,
                    benchmark: benchmark || lastBenchmark || null,
                    lastBenchmark: lastBenchmark || null,
                    benchmarkHistory,
                    benchmarksByRunId,
                    attemptBenchmarksByRunId,
                    lifetimeMax,
                };
            },
        }
    )
);
