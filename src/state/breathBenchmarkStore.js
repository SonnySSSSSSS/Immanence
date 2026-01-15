import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
            benchmark: null, // { inhale, hold1, exhale, hold2, measuredAt }

            // Set benchmark after completing the 4-phase test
            setBenchmark: (results) => set({
                benchmark: {
                    inhale: results.inhale,
                    hold1: results.hold1,
                    exhale: results.exhale,
                    hold2: results.hold2,
                    measuredAt: Date.now(),
                }
            }),

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
            version: 1,
        }
    )
);
