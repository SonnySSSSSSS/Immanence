// src/state/cycleStore.js
// Cycle & Consistency System State Management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const CYCLE_TYPES = {
    FOUNDATION: 'foundation',
    TRANSFORMATION: 'transformation',
    INTEGRATION: 'integration',
};

export const CYCLE_MODES = {
    CONSECUTIVE: 'consecutive',
    FLEXIBLE: 'flexible',
};

export const CYCLE_STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
};

// Target days for each cycle type
export const CYCLE_TARGET_DAYS = {
    foundation: 14,
    transformation: 90,
    integration: 180,
};

// Mode baselines (required consistency rate)
export const MODE_BASELINES = {
    consecutive: 1.0,   // 100% required (14/14, 90/90, etc.)
    flexible: 0.67,      // 67% required (14/21, 60/90, etc.)
};

// Checkpoint intervals (every 2 weeks)
const CHECKPOINT_INTERVAL_DAYS = 14;

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useCycleStore = create(
    persist(
        (set, get) => ({
            // ════════════════════════════════════════════════════════════════
            // STATE
            // ════════════════════════════════════════════════════════════════

            // Current cycle
            currentCycle: null,
            /* Structure:
            {
              type: 'foundation' | 'transformation' | 'integration',
              mode: 'consecutive' | 'flexible',
              startDate: timestamp,
              targetDays: 14 | 90 | 180,
              practiceDays: [timestamp1, timestamp2, ...], // dates with 10+ min practice
              elapsedDays: number,
              consistencyRate: number, // actual practice rate
              effectiveDays: number, // weighted by mode baseline
              status: 'active' | 'paused' | 'completed' | 'failed',
              checkpoints: [
                { day: 14, reached: false, modeSwitchAvailable: false },
                { day: 28, reached: false, modeSwitchAvailable: false },
                ...
              ]
            }
            */

            // Completed cycles history
            completedCycles: [],
            /* Structure:
            [{
              type: 'foundation',
              mode: 'flexible',
              startDate: timestamp,
              endDate: timestamp,
              actualDays: 14,
              targetDays: 14,
              finalConsistencyRate: 0.82,
              metricsAchieved: { breath: 45, focus: 3 },
              failed: false
            }]
            */

            // Next checkpoint date
            nextCheckpoint: null,

            // Can switch mode flag
            canSwitchMode: false,

            // Total completed cycles (for avatar progression)
            totalCyclesCompleted: 0,

            // ════════════════════════════════════════════════════════════════
            // ACTIONS
            // ════════════════════════════════════════════════════════════════

            /**
             * Start a new cycle
             */
            startCycle: (type, mode) => {
                const now = Date.now();
                const targetDays = CYCLE_TARGET_DAYS[type];

                // Generate checkpoints
                const checkpoints = [];
                for (let day = CHECKPOINT_INTERVAL_DAYS; day < targetDays; day += CHECKPOINT_INTERVAL_DAYS) {
                    checkpoints.push({
                        day,
                        reached: false,
                        modeSwitchAvailable: false,
                    });
                }

                const newCycle = {
                    type,
                    mode,
                    startDate: now,
                    targetDays,
                    practiceDays: [],
                    elapsedDays: 0,
                    consistencyRate: 0,
                    effectiveDays: 0,
                    status: CYCLE_STATUS.ACTIVE,
                    checkpoints,
                };

                set({
                    currentCycle: newCycle,
                    nextCheckpoint: checkpoints.length > 0 ? now + (CHECKPOINT_INTERVAL_DAYS * 24 * 60 * 60 * 1000) : null,
                    canSwitchMode: false,
                });

                return newCycle;
            },

            /**
             * Log a practice day (10+ minutes)
             */
            logPracticeDay: (practiceDate = Date.now()) => {
                const state = get();
                if (!state.currentCycle || state.currentCycle.status !== CYCLE_STATUS.ACTIVE) {
                    return;
                }

                // Normalize date to start of day
                const dateOnly = new Date(practiceDate);
                dateOnly.setHours(0, 0, 0, 0);
                const timestamp = dateOnly.getTime();

                // Check if already logged today
                if (state.currentCycle.practiceDays.includes(timestamp)) {
                    return; // Already logged
                }

                // Add practice day
                const updatedPracticeDays = [...state.currentCycle.practiceDays, timestamp].sort();

                // Calculate metrics
                const elapsedDays = get().calculateElapsedDays();
                const consistencyRate = updatedPracticeDays.length / elapsedDays;
                const effectiveDays = get().calculateEffectiveDays(updatedPracticeDays, consistencyRate);

                set({
                    currentCycle: {
                        ...state.currentCycle,
                        practiceDays: updatedPracticeDays,
                        elapsedDays,
                        consistencyRate,
                        effectiveDays,
                    },
                });

                // Check for checkpoint
                get().checkCheckpoint();

                // Check for completion
                get().checkCompletion();
            },

            /**
             * Switch cycle mode
             */
            switchMode: (newMode) => {
                const state = get();
                if (!state.currentCycle || !state.canSwitchMode) {
                    return { success: false, error: 'Cannot switch mode' };
                }

                const oldMode = state.currentCycle.mode;
                const oldBaseline = MODE_BASELINES[oldMode];
                const newBaseline = MODE_BASELINES[newMode];

                const { consistencyRate, practiceDays } = state.currentCycle;

                // Recalibrate effective days for new mode
                const recalibratedDays = get().calculateEffectiveDays(practiceDays, consistencyRate, newMode);

                // Calculate new projected completion
                const remainingDays = state.currentCycle.targetDays - recalibratedDays;
                const projectedElapsedDays = Math.ceil(remainingDays / newBaseline);

                set({
                    currentCycle: {
                        ...state.currentCycle,
                        mode: newMode,
                        effectiveDays: recalibratedDays,
                    },
                    canSwitchMode: false, // Lock for next 2 weeks
                });

                return {
                    success: true,
                    recalibratedDays,
                    projectedElapsedDays,
                    oldMode,
                    newMode,
                };
            },

            /**
             * Check for checkpoint reached
             */
            checkCheckpoint: () => {
                const state = get();
                if (!state.currentCycle) return;

                const elapsedDays = get().calculateElapsedDays();

                state.currentCycle.checkpoints.forEach((cp, index) => {
                    if (elapsedDays >= cp.day && !cp.reached) {
                        cp.reached = true;
                        cp.modeSwitchAvailable = true;

                        // Find next checkpoint
                        const nextCp = state.currentCycle.checkpoints[index + 1];
                        const nextCheckpointDate = nextCp
                            ? state.currentCycle.startDate + (nextCp.day * 24 * 60 * 60 * 1000)
                            : null;

                        set({
                            currentCycle: { ...state.currentCycle },
                            canSwitchMode: true,
                            nextCheckpoint: nextCheckpointDate,
                        });

                        // TODO: Trigger checkpoint UI notification
                        console.log(`Checkpoint reached: Day ${cp.day}`);
                    }
                });
            },

            /**
             * Check if cycle is complete
             */
            checkCompletion: () => {
                const state = get();
                if (!state.currentCycle) return false;

                const { effectiveDays, targetDays } = state.currentCycle;

                if (effectiveDays >= targetDays) {
                    return get().completeCycle();
                }

                return false;
            },

            /**
             * Complete current cycle
             */
            completeCycle: () => {
                const state = get();
                if (!state.currentCycle) return { success: false };

                const completedCycle = {
                    ...state.currentCycle,
                    endDate: Date.now(),
                    actualDays: state.currentCycle.practiceDays.length,
                    finalConsistencyRate: state.currentCycle.consistencyRate,
                    metricsAchieved: {}, // TODO: Pull from benchmarkManager
                    status: CYCLE_STATUS.COMPLETED,
                    failed: false,
                };

                set({
                    currentCycle: null,
                    completedCycles: [...state.completedCycles, completedCycle],
                    totalCyclesCompleted: state.totalCyclesCompleted + 1,
                    nextCheckpoint: null,
                    canSwitchMode: false,
                });

                // TODO: Trigger avatar progression check
                console.log('Cycle completed!', completedCycle);

                return {
                    success: true,
                    cycle: completedCycle,
                    totalCompleted: state.totalCyclesCompleted + 1,
                };
            },

            /**
             * Fail/stop current cycle
             */
            stopCycle: () => {
                const state = get();
                if (!state.currentCycle) return;

                const failedCycle = {
                    ...state.currentCycle,
                    endDate: Date.now(),
                    actualDays: state.currentCycle.practiceDays.length,
                    finalConsistencyRate: state.currentCycle.consistencyRate,
                    status: CYCLE_STATUS.FAILED,
                    failed: true,
                };

                set({
                    currentCycle: null,
                    completedCycles: [...state.completedCycles, failedCycle],
                    nextCheckpoint: null,
                    canSwitchMode: false,
                });

                console.log('Cycle stopped/failed', failedCycle);
            },

            // ════════════════════════════════════════════════════════════════
            // HELPER FUNCTIONS
            // ════════════════════════════════════════════════════════════════

            /**
             * Calculate elapsed days since cycle start
             */
            calculateElapsedDays: () => {
                const state = get();
                if (!state.currentCycle) return 0;

                const now = Date.now();
                const elapsedMs = now - state.currentCycle.startDate;
                return Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
            },

            /**
             * Calculate effective days (weighted by mode baseline)
             */
            calculateEffectiveDays: (practiceDays, consistencyRate, mode = null) => {
                const state = get();
                const cycleMode = mode || state.currentCycle?.mode;
                if (!cycleMode) return 0;

                const baseline = MODE_BASELINES[cycleMode];
                const actualRate = consistencyRate;

                // Effective days = practice days * (actualRate / baseline)
                // For consecutive (1.0): must maintain 100%
                // For flexible (0.67): can maintain 67%
                return practiceDays.length * (actualRate / baseline);
            },

            /**
             * Get current cycle info for UI
             */
            getCycleInfo: () => {
                const state = get();
                if (!state.currentCycle) {
                    return null;
                }

                const elapsedDays = get().calculateElapsedDays();
                const { practiceDays, targetDays, mode, type, consistencyRate, effectiveDays } = state.currentCycle;

                const baseline = MODE_BASELINES[mode];
                const remainingEffectiveDays = targetDays - effectiveDays;
                const projectedTotalDays = elapsedDays + Math.ceil(remainingEffectiveDays / baseline / consistencyRate);

                return {
                    type,
                    mode,
                    currentDay: elapsedDays,
                    targetDays,
                    practiceDays: practiceDays.length,
                    consistencyRate: Math.round(consistencyRate * 100),
                    effectiveDays: Math.round(effectiveDays),
                    projectedCompletion: projectedTotalDays,
                    baseline: Math.round(baseline * 100),
                    nextCheckpoint: state.nextCheckpoint,
                    canSwitchMode: state.canSwitchMode,
                };
            },

            // ════════════════════════════════════════════════════════════════
            // DEV HELPERS
            // ════════════════════════════════════════════════════════════════

            _devReset: () => {
                set({
                    currentCycle: null,
                    completedCycles: [],
                    nextCheckpoint: null,
                    canSwitchMode: false,
                    totalCyclesCompleted: 0,
                });
            },

            _devAddPracticeDays: (count) => {
                const state = get();
                if (!state.currentCycle) return;

                const now = Date.now();
                const newDays = [];
                for (let i = 0; i < count; i++) {
                    const date = new Date(now - (i * 24 * 60 * 60 * 1000));
                    date.setHours(0, 0, 0, 0);
                    newDays.push(date.getTime());
                }

                const updatedPracticeDays = [...state.currentCycle.practiceDays, ...newDays].sort();
                const elapsedDays = get().calculateElapsedDays();
                const consistencyRate = updatedPracticeDays.length / elapsedDays;
                const effectiveDays = get().calculateEffectiveDays(updatedPracticeDays, consistencyRate);

                set({
                    currentCycle: {
                        ...state.currentCycle,
                        practiceDays: updatedPracticeDays,
                        elapsedDays,
                        consistencyRate,
                        effectiveDays,
                    },
                });
            },
        }),
        {
            name: 'immanenceOS.cycles',
            version: 1,
        }
    )
);
