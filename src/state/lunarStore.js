// src/state/lunarStore.js
// Lunar tracking system — meso rhythm visualization
// Tracks progress toward next stage via moon orbit metaphor

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STAGES, STAGE_THRESHOLDS, getStageForDays } from './stageConfig';

export const useLunarStore = create(
    persist(
        (set, get) => ({
            // Progress within current stage (0.0 - 12.0)
            // 12 segments = one full moon orbit = one stage completed
            progress: 0,

            // Cumulative practice days (drives stage calculation)
            totalPracticeDays: 0,

            // Momentum tracking (last 7 entries for activity trail)
            recentActivity: [], // [{ date: 'YYYY-MM-DD', completed: bool }]

            // Stellar cycles (only relevant at Stellar III ceiling)
            ceilingCyclesCompleted: 0,

            // Intention system
            intention: {
                text: null,
                createdAt: null,
                expiresAt: null,
            },

            // Vacation mode (pause tracking)
            vacationMode: false,
            vacationStartDate: null,

            // Moon skin for future customization
            moonSkin: 'default', // 'default' | future skins

            // Moon sparkle trail style
            sparkleMode: 'static', // 'none' | 'static' | 'floating'

            // ═══════════════════════════════════════════════════════════════════
            // ACTIONS
            // ═══════════════════════════════════════════════════════════════════

            /**
             * Record a practice day. Called when user completes a session.
             * Advances moon position and potentially triggers stage advancement.
             */
            recordPracticeDay: (dateKey = null) => {
                const { progress, totalPracticeDays, vacationMode, recentActivity } = get();
                if (vacationMode) return { advanced: false, blocked: 'vacation' };

                const today = dateKey || new Date().toISOString().split('T')[0];

                // Check if already recorded today
                const alreadyRecorded = recentActivity.some(a => a.date === today && a.completed);
                if (alreadyRecorded) {
                    return { advanced: false, blocked: 'alreadyRecorded' };
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

                if (newProgress >= 12) {
                    // Stage complete — moon completed orbit
                    const nextStage = stageConfig.next;

                    if (stageConfig.isCeiling) {
                        // At ceiling (Stellar III), increment cycle counter
                        set({
                            progress: 0,
                            totalPracticeDays: newTotalDays,
                            ceilingCyclesCompleted: get().ceilingCyclesCompleted + 1,
                            recentActivity: newActivity,
                        });
                        return { advanced: true, newStage: stage, ceilingCycle: true };
                    } else {
                        // Advance to next stage
                        set({
                            progress: 0,
                            totalPracticeDays: newTotalDays,
                            recentActivity: newActivity,
                        });
                        return { advanced: true, newStage: nextStage };
                    }
                }

                set({
                    progress: newProgress,
                    totalPracticeDays: newTotalDays,
                    recentActivity: newActivity,
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
                progress: 0,
                totalPracticeDays: 0,
                recentActivity: [],
                ceilingCyclesCompleted: 0,
                intention: { text: null, createdAt: null, expiresAt: null },
                vacationMode: false,
                vacationStartDate: null,
            }),
        }),
        {
            name: 'immanence-lunar',
            version: 1,
            migrate: (persistedState) => {
                return persistedState;
            },
        }
    )
);
