// src/state/lunarStore.js
// Lunar tracking system — meso rhythm visualization
// Tracks progress toward next stage via moon orbit metaphor

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STAGES, STAGE_THRESHOLDS, getStageForDays } from './stageConfig';

function normalizeUserId(userId) {
    if (typeof userId !== 'string') return null;
    const trimmed = userId.trim();
    return trimmed || null;
}

function buildInitialLunarState() {
    return {
        progress: 0,
        totalPracticeDays: 0,
        recentActivity: [],
        ceilingCyclesCompleted: 0,
        decayAccumulated: 0,
        consecutiveDays: 0,
        lastPracticeDate: null,
        intention: {
            text: null,
            createdAt: null,
            expiresAt: null,
        },
        vacationMode: false,
        vacationStartDate: null,
        moonSkin: 'default',
        sparkleMode: 'static',
    };
}

export const useLunarStore = create(
    persist(
        (set, get) => ({
            ownerUserId: null,
            activeUserId: null,
            ...buildInitialLunarState(),

            setActiveUserId: (userId) => {
                const normalizedUserId = normalizeUserId(userId);
                set((state) => {
                    if (!normalizedUserId) {
                        return { activeUserId: null };
                    }

                    if (state.ownerUserId === normalizedUserId) {
                        return { activeUserId: normalizedUserId };
                    }

                    return {
                        ...buildInitialLunarState(),
                        ownerUserId: normalizedUserId,
                        activeUserId: normalizedUserId,
                    };
                });
            },

            resetForIdentityBoundary: (userId = null) => {
                const normalizedUserId = normalizeUserId(userId);
                set({
                    ...buildInitialLunarState(),
                    ownerUserId: normalizedUserId,
                    activeUserId: normalizedUserId,
                });
            },

            // ═══════════════════════════════════════════════════════════════════
            // ACTIONS
            // ═══════════════════════════════════════════════════════════════════

            /**
             * Record a practice day. Called when user completes a session.
             * Advances moon position and potentially triggers stage advancement.
             */
            recordPracticeDay: (dateKey = null) => {
                const { progress, totalPracticeDays, vacationMode, recentActivity, consecutiveDays, lastPracticeDate, decayAccumulated } = get();
                if (vacationMode) return { advanced: false, blocked: 'vacation' };

                const today = dateKey || new Date().toISOString().split('T')[0];

                // Check if already recorded today
                const alreadyRecorded = recentActivity.some(a => a.date === today && a.completed);
                if (alreadyRecorded) {
                    return { advanced: false, blocked: 'alreadyRecorded' };
                }

                // ── Decay: apply gap penalty for missed days ──────────────────
                let updatedDecay = decayAccumulated;
                let newConsecutiveDays = 1;

                if (lastPracticeDate) {
                    const lastDate = new Date(lastPracticeDate + 'T00:00:00');
                    const todayDate = new Date(today + 'T00:00:00');
                    const gapDays = Math.max(0, Math.round((todayDate - lastDate) / 86400000) - 1);
                    const isConsecutive = gapDays === 0;
                    newConsecutiveDays = isConsecutive ? consecutiveDays + 1 : 1;

                    if (gapDays > 0) {
                        // stability grows with history — more days = slower decay per miss
                        const stability = Math.log2(totalPracticeDays + 1) * 8;
                        const decayPerMissedDay = stability > 0 ? 1 / stability : 0.5;
                        const rawNewDecay = decayPerMissedDay * gapDays;

                        // floor: can never decay below start of current stage
                        const effectiveNow = Math.max(0, totalPracticeDays - updatedDecay);
                        const stageFloor = STAGE_THRESHOLDS[getStageForDays(effectiveNow)];
                        const maxDecay = Math.max(0, totalPracticeDays - stageFloor);
                        updatedDecay = Math.min(maxDecay, updatedDecay + rawNewDecay);
                    }
                }

                // ── Recovery: reduce accumulated decay on sustained streak ────
                if (newConsecutiveDays >= 14) {
                    updatedDecay = Math.max(0, updatedDecay - 0.5);
                } else if (newConsecutiveDays >= 7) {
                    updatedDecay = Math.max(0, updatedDecay - 0.25);
                }

                const stage = get().getCurrentStage();
                const stageConfig = STAGES[stage];
                const duration = stageConfig.duration;
                const progressPerDay = 12 / duration;

                const newProgress = progress + progressPerDay;
                const newTotalDays = totalPracticeDays + 1;

                // Update recent activity
                const newActivity = [
                    ...recentActivity.slice(-6), // Keep last 6
                    { date: today, completed: true }
                ];

                const decayFields = {
                    decayAccumulated: updatedDecay,
                    consecutiveDays: newConsecutiveDays,
                    lastPracticeDate: today,
                };

                if (newProgress >= 12) {
                    // Stage complete — moon completed orbit
                    const nextStage = stageConfig.next;

                    if (stageConfig.isCeiling) {
                        set({
                            progress: 0,
                            totalPracticeDays: newTotalDays,
                            ceilingCyclesCompleted: get().ceilingCyclesCompleted + 1,
                            recentActivity: newActivity,
                            ...decayFields,
                        });
                        return { advanced: true, newStage: stage, ceilingCycle: true };
                    } else {
                        set({
                            progress: 0,
                            totalPracticeDays: newTotalDays,
                            recentActivity: newActivity,
                            ...decayFields,
                        });
                        return { advanced: true, newStage: nextStage };
                    }
                }

                set({
                    progress: newProgress,
                    totalPracticeDays: newTotalDays,
                    recentActivity: newActivity,
                    ...decayFields,
                });

                return { advanced: false };
            },

            /**
             * Get current stage key from total practice days
             */
            getCurrentStage: () => {
                const { totalPracticeDays } = get();
                return getStageForDays(totalPracticeDays);
            },

            /**
             * Get moon position in radians (0 = top/12 o'clock)
             * Progress 0-12 maps to full circle
             */
            getMoonPosition: () => {
                const { progress } = get();
                // Returns angle in radians, starting from top (12 o'clock)
                return (progress / 12) * 2 * Math.PI - Math.PI / 2;
            },

            /**
             * Get moon phase based on progress
             * 0-3: new (dark)
             * 3-6: first quarter (half illuminated, waxing)
             * 6-9: full (bright)
             * 9-12: last quarter (half illuminated, waning)
             */
            getMoonPhase: () => {
                const { progress } = get();
                if (progress < 3) return 'new';
                if (progress < 6) return 'firstQuarter';
                if (progress < 9) return 'full';
                return 'lastQuarter';
            },

            /**
             * Get trail length based on 7-day consistency (0.0 - 1.0)
             */
            getTrailLength: () => {
                const { recentActivity } = get();
                const recentDays = recentActivity.slice(-7);
                const activeDays = recentDays.filter(d => d.completed).length;
                return activeDays / 7;
            },

            /**
             * Get days until next stage
             */
            getDaysUntilNextStage: () => {
                const { totalPracticeDays } = get();
                const stage = get().getCurrentStage();
                const stageConfig = STAGES[stage];

                if (stageConfig.isCeiling) {
                    // At ceiling, show days until cycle completion
                    const threshold = STAGE_THRESHOLDS[stage];
                    const daysInStage = totalPracticeDays - threshold;
                    return Math.max(0, stageConfig.duration - daysInStage);
                }

                const nextStage = stageConfig.next;
                if (!nextStage) return null;

                const nextThreshold = STAGE_THRESHOLDS[nextStage];
                return Math.max(0, nextThreshold - totalPracticeDays);
            },

            /**
             * Get effective practice days (total minus accumulated decay)
             */
            getEffectiveDays: () => {
                const { totalPracticeDays, decayAccumulated } = get();
                return Math.max(0, totalPracticeDays - (decayAccumulated || 0));
            },

            /**
             * Get days until next stage using effective (decay-adjusted) days
             */
            getDaysUntilNextStageEffective: () => {
                const effectiveDays = get().getEffectiveDays();
                const stage = getStageForDays(effectiveDays);
                const stageConfig = STAGES[stage];

                if (stageConfig.isCeiling) {
                    const threshold = STAGE_THRESHOLDS[stage];
                    const daysInStage = effectiveDays - threshold;
                    return Math.max(0, stageConfig.duration - daysInStage);
                }

                const nextStage = stageConfig.next;
                if (!nextStage) return null;
                return Math.max(0, STAGE_THRESHOLDS[nextStage] - effectiveDays);
            },

            /**
             * Get decay diagnostics for the tooltip
             * Returns per-miss rate, recovery state, and total decay accrued
             */
            getDecayInfo: () => {
                const { totalPracticeDays, decayAccumulated, consecutiveDays } = get();
                const stability = Math.log2((totalPracticeDays || 0) + 1) * 8;
                const decayPerMissedDay = stability > 0 ? 1 / stability : 0.5;

                let recoveryRate = null;
                if ((consecutiveDays || 0) >= 14) recoveryRate = 0.5;
                else if ((consecutiveDays || 0) >= 7) recoveryRate = 0.25;

                return {
                    decayPerMissedDay: +decayPerMissedDay.toFixed(3),
                    decayAccumulated: +(decayAccumulated || 0).toFixed(1),
                    consecutiveDays: consecutiveDays || 0,
                    recoveryRate,
                    isRecovering: (consecutiveDays || 0) >= 7,
                };
            },

            // ═══════════════════════════════════════════════════════════════════
            // INTENTION SYSTEM
            // ═══════════════════════════════════════════════════════════════════

            setIntention: (text) => {
                const now = Date.now();
                const expiresAt = now + (14 * 24 * 60 * 60 * 1000); // 14 days
                set({
                    intention: {
                        text,
                        createdAt: now,
                        expiresAt,
                    },
                });
            },

            clearIntention: () => {
                set({
                    intention: { text: null, createdAt: null, expiresAt: null },
                });
            },

            clearExpiredIntention: () => {
                const { intention } = get();
                if (intention.expiresAt && Date.now() > intention.expiresAt) {
                    set({
                        intention: { text: null, createdAt: null, expiresAt: null },
                    });
                }
            },

            getIntentionDaysRemaining: () => {
                const { intention } = get();
                if (!intention.expiresAt) return null;
                const remaining = intention.expiresAt - Date.now();
                return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
            },

            // ═══════════════════════════════════════════════════════════════════
            // VACATION MODE
            // ═══════════════════════════════════════════════════════════════════

            startVacation: () => {
                set({
                    vacationMode: true,
                    vacationStartDate: Date.now(),
                });
            },

            endVacation: () => {
                set({
                    vacationMode: false,
                    vacationStartDate: null,
                });
            },

            getVacationDays: () => {
                const { vacationMode, vacationStartDate } = get();
                if (!vacationMode || !vacationStartDate) return 0;
                return Math.floor((Date.now() - vacationStartDate) / (24 * 60 * 60 * 1000));
            },

            // Set moon skin (for future customization)
            setMoonSkin: (skin) => set({ moonSkin: skin }),
            
            // Cycle through sparkle modes
            cycleSparkleMode: () => {
                const { sparkleMode } = get();
                const modes = ['none', 'static', 'floating'];
                const currentIndex = modes.indexOf(sparkleMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                set({ sparkleMode: nextMode });
            },

            // ═══════════════════════════════════════════════════════════════════
            // DEV HELPERS
            // ═══════════════════════════════════════════════════════════════════

            _devSetProgress: (progress) => set({ progress }),
            _devSetTotalDays: (days) => set({ totalPracticeDays: days }),
            _devAddDays: (days) => {
                const { totalPracticeDays } = get();
                set({ totalPracticeDays: totalPracticeDays + days });
            },
            _devReset: () => set({
                ...buildInitialLunarState(),
            }),
        }),
        {
            name: 'immanence-lunar',
            version: 3,
            partialize: (state) => ({
                ownerUserId: normalizeUserId(state.ownerUserId),
                ...buildInitialLunarState(),
                progress: state.progress ?? 0,
                totalPracticeDays: state.totalPracticeDays ?? 0,
                recentActivity: Array.isArray(state.recentActivity) ? state.recentActivity : [],
                ceilingCyclesCompleted: state.ceilingCyclesCompleted ?? 0,
                decayAccumulated: state.decayAccumulated ?? 0,
                consecutiveDays: state.consecutiveDays ?? 0,
                lastPracticeDate: state.lastPracticeDate ?? null,
                intention: state.intention || buildInitialLunarState().intention,
                vacationMode: Boolean(state.vacationMode),
                vacationStartDate: state.vacationStartDate ?? null,
                moonSkin: state.moonSkin || 'default',
                sparkleMode: state.sparkleMode || 'static',
            }),
            migrate: (persistedState, version) => {
                if (version < 2) {
                    return {
                        ...buildInitialLunarState(),
                        ...persistedState,
                        decayAccumulated: 0,
                        consecutiveDays: 0,
                        lastPracticeDate: null,
                        ownerUserId: normalizeUserId(persistedState?.ownerUserId),
                    };
                }
                return {
                    ...buildInitialLunarState(),
                    ...(persistedState || {}),
                    ownerUserId: normalizeUserId(persistedState?.ownerUserId),
                };
            },
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...buildInitialLunarState(),
                ...(persistedState || {}),
                ownerUserId: normalizeUserId(persistedState?.ownerUserId),
                activeUserId: null,
            }),
        }
    )
);
