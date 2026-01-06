// src/state/curriculumStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RITUAL_FOUNDATION_14 } from '../data/ritualFoundation14.js';
import { getProgramDefinition, getProgramDay } from '../data/programRegistry.js';

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

export const useCurriculumStore = create(
    persist(
        (set, get) => ({
            // ONBOARDING STATE
            onboardingComplete: false,
            onboardingDismissed: false,
            onboardingDismissedAt: null,
            practiceTimeSlots: [],
            thoughtCatalog: [], // User's 5-8 personal thoughts for ritual observation

            // CURRICULUM STATE
            activeCurriculumId: 'ritual-foundation-14',
            curriculumStartDate: null,
            dayCompletions: {},
			legCompletions: {},

            // ACTIVE PRACTICE SESSION
            activePracticeSession: null,
            activePracticeLeg: null,
            activePracticeStartedAt: null,

            // LEGACY STATE
            paths: {
                breath: { name: 'Breath Path', description: 'Pranayama and breath regulation', exercises: [] },
                focus: { name: 'Focus Path', description: 'Concentration and mental clarity', exercises: [] },
                body: { name: 'Body Path', description: 'Somatic awareness and embodied presence', exercises: [] },
            },
            circuits: [FOUNDATION_CIRCUIT],
            progress: {},

            // ONBOARDING ACTIONS
            completeOnboarding: (timeSlots = [], thoughts = []) => {
                const now = new Date().toISOString();
                set({
                    onboardingComplete: true,
                    onboardingDismissed: false,
                    practiceTimeSlots: timeSlots,
                    thoughtCatalog: thoughts.map((t, idx) => ({
                        id: `thought-${Date.now()}-${idx}`,
                        text: t.text,
                        weight: t.weight || 0, // 0 = normal, 1 = priority
                        createdAt: now,
                    })),
                    curriculumStartDate: now,
                });
            },

            dismissOnboarding: () => {
                set({
                    onboardingDismissed: true,
                    onboardingDismissedAt: new Date().toISOString(),
                });
            },

            shouldShowOnboarding: () => {
                const state = get();
                if (state.onboardingComplete) return false;
                if (!state.onboardingDismissed) return true;
                if (state.onboardingDismissedAt) {
                    const dismissedAt = new Date(state.onboardingDismissedAt);
                    const hoursSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60);
                    return hoursSince >= 24;
                }
                return true;
            },

            // CURRICULUM ACTIONS
            getActiveCurriculum: () => {
                const state = get();
                const program = getProgramDefinition(state.activeCurriculumId);
                if (program?.curriculum) return program.curriculum;
                if (state.activeCurriculumId === 'ritual-foundation-14') {
                    return RITUAL_FOUNDATION_14;
                }
                return null;
            },

            getCurrentDayNumber: () => {
                const state = get();
                if (!state.curriculumStartDate) return 1;
                const start = new Date(state.curriculumStartDate);
                start.setHours(0, 0, 0, 0);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const daysDiff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                return Math.max(1, Math.min(daysDiff + 1, 15));
            },

            getTodaysPractice: () => {
                const state = get();
                const dayNumber = state.getCurrentDayNumber();
                return state.getCurriculumDay(dayNumber);
            },

            /**
             * Get a weighted random thought from the catalog
             * Weight 1 (priority) thoughts are 3x more likely to be selected
             */
            getWeightedRandomThought: () => {
                const state = get();
                const { thoughtCatalog } = state;
                if (!thoughtCatalog || thoughtCatalog.length === 0) return null;

                // Build weighted array (priority thoughts appear 3x)
                const weighted = [];
                thoughtCatalog.forEach(thought => {
                    const count = thought.weight === 1 ? 3 : 1;
                    for (let i = 0; i < count; i++) {
                        weighted.push(thought);
                    }
                });

                // Random selection
                const randomIndex = Math.floor(Math.random() * weighted.length);
                return weighted[randomIndex];
            },

            getCurriculumDay: (dayNumber) => {
                const state = get();
                const programDay = getProgramDay(state.activeCurriculumId, dayNumber);
                if (programDay) return programDay;

                const curriculum = state.getActiveCurriculum();
                if (!curriculum) return null;
                return curriculum.days.find(d => d.dayNumber === dayNumber) || null;
            },

            isTodayComplete: () => {
                const state = get();
                const dayNumber = state.getCurrentDayNumber();
                return state.dayCompletions[dayNumber]?.completed === true;
            },

            // ACTIVE PRACTICE SESSION ACTIONS
            setActivePracticeSession: (dayNumber, legNumber = null) => {
                set({
                    activePracticeSession: dayNumber,
                    activePracticeLeg: legNumber,
                    activePracticeStartedAt: new Date().toISOString(),
                });
            },

            clearActivePracticeSession: () => {
                set({
                    activePracticeSession: null,
                    activePracticeLeg: null,
                    activePracticeStartedAt: null,
                });
            },

            getActivePracticeDay: () => {
                const state = get();
                if (!state.activePracticeSession) return null;
                return state.getCurriculumDay(state.activePracticeSession);
            },

            getActivePracticeLeg: () => {
                const state = get();
                if (!state.activePracticeSession || !state.activePracticeLeg) return null;
                const day = state.getActivePracticeDay();
                if (!day || !day.legs) return null;
                return day.legs.find(leg => leg.legNumber === state.activePracticeLeg) || null;
            },

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
                    return 'missed';
                }
                return 'future';
            },

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
			
			/**
 * Log completion for a specific leg (day + leg number)
 * @param {number} dayNumber - Day (1-14)
 * @param {number} legNumber - Leg within day (1, 2, etc)
 * @param {Object} data - Session data { duration, focusRating, challenges, notes }
 */
logLegCompletion: (dayNumber, legNumber, data = {}) => {
    const legKey = `${dayNumber}-${legNumber}`;
    set((state) => {
        const existingLeg = state.legCompletions[legKey] || {};
        const existingMeta = existingLeg.meta || {};
        
        // Pattern A: Safe merge of metadata
        const newMeta = { ...existingMeta };
        
        // Explicitly add fields from data if they are not undefined
        if (data.durationSeconds !== undefined) newMeta.durationSeconds = data.durationSeconds;
        if (data.thoughtObserved !== undefined) newMeta.thoughtObserved = data.thoughtObserved;
        if (data.thoughtId !== undefined) newMeta.thoughtId = data.thoughtId;

        return {
            legCompletions: {
                ...state.legCompletions,
                [legKey]: {
                    completed: true,
                    date: new Date().toISOString(),
                    duration: data.duration !== undefined ? data.duration : (existingLeg.duration || 0),
                    focusRating: data.focusRating !== undefined ? data.focusRating : (existingLeg.focusRating || null),
                    challenges: data.challenges || existingLeg.challenges || [],
                    notes: data.notes !== undefined ? data.notes : (existingLeg.notes || ''),
                    meta: newMeta
                },
            },
        };
    });
},

/**
 * Check if a specific leg is completed
 */
isLegComplete: (dayNumber, legNumber) => {
    const state = get();
    const legKey = `${dayNumber}-${legNumber}`;
    return state.legCompletions[legKey]?.completed === true;
},

/**
 * Get the next incomplete leg for today
 */
getNextIncompleteLeg: () => {
    const state = get();
    const dayNumber = state.getCurrentDayNumber();
    const day = state.getCurriculumDay(dayNumber);
    if (!day || !day.legs) return null;
    
    for (const leg of day.legs) {
        if (!state.isLegComplete(dayNumber, leg.legNumber)) {
            return { dayNumber, legNumber: leg.legNumber, leg };
        }
    }
    return null;
},

/**
 * Get the next available leg for a given day (respects completion state)
 */
getNextLeg: (dayNumber, offset = 1) => {
    const state = get();
    const day = state.getCurriculumDay(dayNumber);
    if (!day?.legs) return null;

    const remainingLegs = day.legs.filter(leg => !state.isLegComplete(dayNumber, leg.legNumber));
    if (remainingLegs.length === 0) return null;

    const targetIndex = Math.min(offset - 1, remainingLegs.length - 1);
    return remainingLegs[targetIndex] || null;
},

/**
 * Get all legs for a day with their completion status and time slots
 */
            getDayLegsWithStatus: (dayNumber) => {
                const state = get();
                const day = state.getCurriculumDay(dayNumber);
                if (!day || !day.legs) return [];

                const { practiceTimeSlots } = state;

                return day.legs.map((leg, index) => ({
                    ...leg,
                    // Inject time from onboarding slots (leg 1 = slot 0, leg 2 = slot 1, etc.)
                    time: practiceTimeSlots && practiceTimeSlots[index] ? practiceTimeSlots[index] : leg.time,
                    completed: state.isLegComplete(dayNumber, leg.legNumber),
                    completion: state.legCompletions[`${dayNumber}-${leg.legNumber}`] || null,
                }));
            },

            // PROGRESS & STATS
            getProgress: () => {
                const state = get();
                const program = getProgramDefinition(state.activeCurriculumId);
                const curriculum = program?.curriculum || state.getActiveCurriculum();
                if (!curriculum) return { completed: 0, total: 0, rate: 0 };

                // Calculate based on leg completions for flexibility
                let totalLegs = 0;
                let completedLegs = 0;

                curriculum.days.forEach(day => {
                    const mergedDay = state.getCurriculumDay(day.dayNumber) || day;
                    if (!mergedDay.legs || !Array.isArray(mergedDay.legs)) return;

                    totalLegs += mergedDay.legs.length;
                    mergedDay.legs.forEach(leg => {
                        const legKey = `${mergedDay.dayNumber}-${leg.legNumber}`;
                        if (state.legCompletions[legKey]?.completed) {
                            completedLegs++;
                        }
                    });
                });

                // Legacy fallback if no merged days were processed
                if (totalLegs === 0 && curriculum.days) {
                    curriculum.days.forEach(day => {
                        if (!day.legs || !Array.isArray(day.legs)) return;
                        totalLegs += day.legs.length;
                        day.legs.forEach(leg => {
                            const legKey = `${day.dayNumber}-${leg.legNumber}`;
                            if (state.legCompletions[legKey]?.completed) {
                                completedLegs++;
                            }
                        });
                    });
                }

                return {
                    completed: completedLegs,
                    total: totalLegs,
                    rate: totalLegs > 0 ? Math.round((completedLegs / totalLegs) * 100) : 0,
                };
            },

            getStreak: () => {
                const state = get();
                const currentDay = state.getCurrentDayNumber();
                let streak = 0;
                for (let day = currentDay; day >= 1; day--) {
                    if (state.dayCompletions[day]?.completed) {
                        streak++;
                    } else {
                        break;
                    }
                }
                return streak;
            },

            getAverageFocus: () => {
                const state = get();
                const ratings = Object.values(state.dayCompletions)
                    .filter(d => d.completed && d.focusRating != null)
                    .map(d => d.focusRating);
                if (ratings.length === 0) return null;
                return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
            },

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

            getTotalPracticeMinutes: () => {
                const state = get();
                return Object.values(state.dayCompletions)
                    .filter(d => d.completed)
                    .reduce((total, d) => total + (d.duration || 0), 0);
            },

            isCurriculumComplete: () => {
                const state = get();
                const progress = state.getProgress();
                const currentDay = state.getCurrentDayNumber();
                return progress.completed >= progress.total || currentDay > 14;
            },

            // LEGACY ACTIONS
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

            // DEV HELPERS
            _devReset: () => {
                set({
                    onboardingComplete: false,
                    onboardingDismissed: false,
                    onboardingDismissedAt: null,
                    practiceTimeSlots: [],
                    thoughtCatalog: [],
                    activeCurriculumId: 'ritual-foundation-14',
                    curriculumStartDate: null,
                    dayCompletions: {},
					legCompletions: {},
                    activePracticeSession: null,
                    activePracticeLeg: null,
                    activePracticeStartedAt: null,
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
            version: 3,
        }
    )
);
