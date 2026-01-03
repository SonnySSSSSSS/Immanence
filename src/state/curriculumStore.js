// src/state/curriculumStore.js
// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM STORE — 14-Day Ritual Curriculum System
// ═══════════════════════════════════════════════════════════════════════════
//
// Manages:
// - Onboarding state (skippable)
// - Practice time preferences
// - Day-by-day completion tracking
// - Progress metrics and reporting
//
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RITUAL_FOUNDATION_14 } from '../data/ritualFoundation14.js';

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY CIRCUIT DATA (kept for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

export const FOUNDATION_CIRCUIT = {
    id: 'intro_circuit',
    name: 'Foundation Circuit',
    description: 'Balanced introduction to all three primary paths',
    totalDuration: 15,
    exercises: [
        {
            type: 'breath',
            name: 'Box Breathing',
            duration: 5,
            instructions: '4 counts in, 4 hold, 4 out, 4 hold',
            practiceType: 'Breath & Stillness',
            preset: 'box',
        },
        {
            type: 'focus',
            name: 'Cognitive Vipassana',
            duration: 5,
            instructions: 'Label and observe thoughts as they arise',
            practiceType: 'Somatic Vipassana',
            sensoryType: 'cognitive',
        },
        {
            type: 'body',
            name: 'Body Scan',
            duration: 5,
            instructions: 'Systematic awareness from crown to toes',
            practiceType: 'Somatic Vipassana',
            sensoryType: 'body',
        },
    ],
    recommendedFor: 'foundation_cycle',
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useCurriculumStore = create(
    persist(
        (set, get) => ({
            // ════════════════════════════════════════════════════════════════
            // ONBOARDING STATE
            // ════════════════════════════════════════════════════════════════

            // Whether user has completed the curriculum onboarding (skippable)
            onboardingComplete: false,
            
            // Whether user has dismissed the onboarding prompt (for "remind later")
            onboardingDismissed: false,
            onboardingDismissedAt: null,

            // User's preferred practice time slots
            // Format: [{ time: '06:00', period: 'morning' }, { time: '19:00', period: 'evening' }]
            practiceTimeSlots: [],

            // ════════════════════════════════════════════════════════════════
            // CURRICULUM STATE
            // ════════════════════════════════════════════════════════════════

            // Currently active curriculum ID
            activeCurriculumId: 'ritual-foundation-14',

            // When the curriculum was started
            curriculumStartDate: null,

            // Day completion records
            // Format: { '1': { completed: true, date: 'ISO', duration: 12, focusRating: 4, challenges: [], notes: '' }, ... }
            dayCompletions: {},

            // ════════════════════════════════════════════════════════════════
            // LEGACY STATE (kept for backward compatibility)
            // ════════════════════════════════════════════════════════════════

            paths: {
                breath: {
                    name: 'Breath Path',
                    description: 'Pranayama and breath regulation',
                    exercises: [],
                },
                focus: {
                    name: 'Focus Path',
                    description: 'Concentration and mental clarity',
                    exercises: [],
                },
                body: {
                    name: 'Body Path',
                    description: 'Somatic awareness and embodied presence',
                    exercises: [],
                },
            },

            circuits: [FOUNDATION_CIRCUIT],
            progress: {},

            // ════════════════════════════════════════════════════════════════
            // ONBOARDING ACTIONS
            // ════════════════════════════════════════════════════════════════

            /**
             * Complete the onboarding flow
             * @param {Array} timeSlots - User's preferred practice times
             */
            completeOnboarding: (timeSlots = []) => {
                const now = new Date().toISOString();
                set({
                    onboardingComplete: true,
                    onboardingDismissed: false,
                    practiceTimeSlots: timeSlots,
                    curriculumStartDate: now,
                });
            },

            /**
             * Dismiss onboarding temporarily (skippable)
             */
            dismissOnboarding: () => {
                set({
                    onboardingDismissed: true,
                    onboardingDismissedAt: new Date().toISOString(),
                });
            },

            /**
             * Check if we should show onboarding prompt
             * Shows if: not complete AND (not dismissed OR dismissed > 24 hours ago)
             */
            shouldShowOnboarding: () => {
                const state = get();
                if (state.onboardingComplete) return false;
                if (!state.onboardingDismissed) return true;
                
                // If dismissed, check if 24 hours have passed
                if (state.onboardingDismissedAt) {
                    const dismissedAt = new Date(state.onboardingDismissedAt);
                    const hoursSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60);
                    return hoursSince >= 24;
                }
                return true;
            },

            // ════════════════════════════════════════════════════════════════
            // CURRICULUM ACTIONS
            // ════════════════════════════════════════════════════════════════

            /**
             * Get the active curriculum definition
             */
            getActiveCurriculum: () => {
                const state = get();
                if (state.activeCurriculumId === 'ritual-foundation-14') {
                    return RITUAL_FOUNDATION_14;
                }
                return null;
            },

            /**
             * Get current day number (1-based)
             * Calculated from curriculumStartDate
             */
            getCurrentDayNumber: () => {
                const state = get();
                if (!state.curriculumStartDate) return 1;

                const start = new Date(state.curriculumStartDate);
                start.setHours(0, 0, 0, 0);
                
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                
                const daysDiff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                return Math.max(1, Math.min(daysDiff + 1, 15)); // Cap at 15 (completion day)
            },

            /**
             * Get today's curriculum day data
             */
            getTodaysPractice: () => {
                const state = get();
                const curriculum = state.getActiveCurriculum();
                if (!curriculum) return null;

                const dayNumber = state.getCurrentDayNumber();
                return curriculum.days.find(d => d.dayNumber === dayNumber) || null;
            },

            /**
             * Check if today is already completed
             */
            isTodayComplete: () => {
                const state = get();
                const dayNumber = state.getCurrentDayNumber();
                return state.dayCompletions[dayNumber]?.completed === true;
            },

            /**
             * Get status for a specific day: 'pending' | 'complete' | 'today' | 'future'
             */
            getDayStatus: (dayNumber) => {
                const state = get();
                const currentDay = state.getCurrentDayNumber();
                
                if (state.dayCompletions[dayNumber]?.completed) {
                    return 'complete';
                }
                if (dayNumber === currentDay) {
                    return 'today';
                }
                if (dayNumber < currentDay) {
                    return 'missed'; // Past day not completed
                }
                return 'future';
            },

            /**
             * Log completion for a day
             * @param {number} dayNumber - Day to mark complete
             * @param {Object} data - Session data { duration, focusRating, challenges, notes }
             */
            logDayCompletion: (dayNumber, data = {}) => {
                set((state) => ({
                    dayCompletions: {
                        ...state.dayCompletions,
                        [dayNumber]: {
                            completed: true,
                            date: new Date().toISOString(),
                            duration: data.duration || 0,
                            focusRating: data.focusRating || null,
                            challenges: data.challenges || [],
                            notes: data.notes || '',
                        },
                    },
                }));
            },

            // ════════════════════════════════════════════════════════════════
            // PROGRESS & STATS ACTIONS
            // ════════════════════════════════════════════════════════════════

            /**
             * Get overall progress stats
             */
            getProgress: () => {
                const state = get();
                const curriculum = state.getActiveCurriculum();
                if (!curriculum) return { completed: 0, total: 0, rate: 0 };

                const completedDays = Object.values(state.dayCompletions).filter(d => d.completed).length;
                const totalDays = curriculum.duration;
                
                return {
                    completed: completedDays,
                    total: totalDays,
                    rate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
                };
            },

            /**
             * Get current streak (consecutive days completed)
             */
            getStreak: () => {
                const state = get();
                const currentDay = state.getCurrentDayNumber();
                let streak = 0;

                // Count backwards from current day
                for (let day = currentDay; day >= 1; day--) {
                    if (state.dayCompletions[day]?.completed) {
                        streak++;
                    } else {
                        break;
                    }
                }
                return streak;
            },

            /**
             * Get average focus rating
             */
            getAverageFocus: () => {
                const state = get();
                const ratings = Object.values(state.dayCompletions)
                    .filter(d => d.completed && d.focusRating != null)
                    .map(d => d.focusRating);
                
                if (ratings.length === 0) return null;
                return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
            },

            /**
             * Get challenge frequency map
             */
            getChallengeStats: () => {
                const state = get();
                const challengeMap = {};

                Object.values(state.dayCompletions).forEach(day => {
                    if (day.challenges) {
                        day.challenges.forEach(challenge => {
                            challengeMap[challenge] = (challengeMap[challenge] || 0) + 1;
                        });
                    }
                });

                return challengeMap;
            },

            /**
             * Get total practice hours
             */
            getTotalPracticeMinutes: () => {
                const state = get();
                return Object.values(state.dayCompletions)
                    .filter(d => d.completed)
                    .reduce((total, d) => total + (d.duration || 0), 0);
            },

            /**
             * Check if curriculum is complete (all 14 days done OR day 15 reached)
             */
            isCurriculumComplete: () => {
                const state = get();
                const progress = state.getProgress();
                const currentDay = state.getCurrentDayNumber();
                
                return progress.completed >= progress.total || currentDay > 14;
            },

            // ════════════════════════════════════════════════════════════════
            // LEGACY ACTIONS (kept for backward compatibility)
            // ════════════════════════════════════════════════════════════════

            getAvailableCircuits: () => {
                const state = get();
                return state.circuits;
            },

            getCircuit: (circuitId) => {
                const state = get();
                return state.circuits.find((c) => c.id === circuitId) || null;
            },

            getPathCurriculum: (pathType) => {
                const state = get();
                return state.paths[pathType] || null;
            },

            // ════════════════════════════════════════════════════════════════
            // DEV HELPERS
            // ════════════════════════════════════════════════════════════════

            _devReset: () => {
                set({
                    onboardingComplete: false,
                    onboardingDismissed: false,
                    onboardingDismissedAt: null,
                    practiceTimeSlots: [],
                    activeCurriculumId: 'ritual-foundation-14',
                    curriculumStartDate: null,
                    dayCompletions: {},
                    paths: {
                        breath: { name: 'Breath Path', description: '', exercises: [] },
                        focus: { name: 'Focus Path', description: '', exercises: [] },
                        body: { name: 'Body Path', description: '', exercises: [] },
                    },
                    circuits: [FOUNDATION_CIRCUIT],
                    progress: {},
                });
            },

            _devSetDay: (dayNumber) => {
                // Set curriculum start date to make getCurrentDayNumber return the specified day
                const now = new Date();
                now.setDate(now.getDate() - (dayNumber - 1));
                set({ curriculumStartDate: now.toISOString() });
            },

            _devCompleteDay: (dayNumber) => {
                const state = get();
                state.logDayCompletion(dayNumber, {
                    duration: 10,
                    focusRating: 4,
                    challenges: ['distraction'],
                    notes: 'Dev test',
                });
            },
        }),
        {
            name: 'immanenceOS.curriculum',
            version: 2, // Bumped version for new schema
        }
    )
);
