// src/state/navigationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNavigationStore = create(
    persist(
        (set, get) => ({
            // Selection state (before beginning a path)
            selectedPathId: null,
            setSelectedPath: (id) => set({ selectedPathId: id }),

            // Active path state (after beginning)
            activePath: null, // { pathId, startDate, currentWeek, completedWeeks: [] }

            // Begin a new path
            beginPath: (pathId) => {
                set({
                    activePath: {
                        pathId,
                        startDate: new Date().toISOString(),
                        currentWeek: 1,
                        completedWeeks: [],
                        weekCompletionDates: {} // { 1: "2024-01-15", 2: "2024-01-22", ... }
                    },
                    selectedPathId: pathId // Keep selection synced
                });
            },

            // Mark current week as complete and advance
            completeWeek: (weekNumber) => {
                const state = get();
                if (!state.activePath) return;

                set({
                    activePath: {
                        ...state.activePath,
                        currentWeek: weekNumber + 1,
                        completedWeeks: [...state.activePath.completedWeeks, weekNumber],
                        weekCompletionDates: {
                            ...state.activePath.weekCompletionDates,
                            [weekNumber]: new Date().toISOString()
                        }
                    }
                });
            },

            // Abandon current path
            abandonPath: () => {
                set({
                    activePath: null,
                    selectedPathId: null
                });
            },

            // Check if a week is completed
            isWeekCompleted: (weekNumber) => {
                const state = get();
                return state.activePath?.completedWeeks.includes(weekNumber) || false;
            },

            // Check if path is completed
            isPathCompleted: () => {
                const state = get();
                if (!state.activePath) return false;

                // Path is completed if current week is beyond the total duration
                // We'll need to check this against the path data
                return false; // Will implement when we have path duration
            },

            // Foundation video tracking
            hasWatchedFoundation: false,
            setWatchedFoundation: (watched) => set({ hasWatchedFoundation: watched }),

            // Path assessment tracking
            pathAssessment: null, // Selected prompt ID from PathFinderCard
            setPathAssessment: (promptId) => set({ pathAssessment: promptId }),

            // Last activity tracking
            lastActivityDate: null,
            updateActivity: () => set({ lastActivityDate: new Date().toISOString() }),

            // ========================================
            // SECTION UNLOCKING (for quiz-gated content)
            // ========================================
            unlockedSections: [],

            /**
             * Unlock a section (e.g., after passing a quiz)
             */
            unlockSection: (sectionId) => {
                const state = get();
                if (state.unlockedSections.includes(sectionId)) return;
                set({
                    unlockedSections: [...state.unlockedSections, sectionId]
                });
            },

            /**
             * Check if a section is unlocked
             */
            isSectionUnlocked: (sectionId) => {
                const state = get();
                return state.unlockedSections.includes(sectionId);
            },

            /**
             * Get all unlocked sections
             */
            getUnlockedSections: () => {
                return get().unlockedSections;
            }
        }),
        {
            name: 'immanenceOS.navigationState',
            version: 2,  // Bumped version for new fields
            migrate: (persistedState, version) => {
                return persistedState;
            }
        }
    )
);
