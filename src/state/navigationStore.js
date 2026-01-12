// src/state/navigationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDateKey } from '../utils/dateUtils';
import { useCurriculumStore } from './curriculumStore';

const SCHEDULE_ADHERENCE_WINDOW_MIN = 15;
const SCHEDULE_MATCH_RADIUS_MIN = 90;

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

            // Schedule adherence tracking
            scheduleSlots: [], // [{ slotId: 1, time: "HH:mm" }, ...]
            scheduleAdherenceLog: [],

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
            },

            /**
             * Set daily schedule slots (1..3)
             */
            setScheduleSlots: (slots = []) => {
                const normalized = slots
                    .filter(slot => slot && slot.time)
                    .map((slot, index) => ({
                        slotId: slot.slotId || index + 1,
                        time: slot.time
                    }))
                    .slice(0, 3);
                set({ scheduleSlots: normalized });
            },

            /**
             * Get schedule slots (fallback to curriculum onboarding slots)
             */
            getScheduleSlots: () => {
                const state = get();
                if (state.scheduleSlots && state.scheduleSlots.length > 0) {
                    return state.scheduleSlots;
                }
                const curriculumSlots = useCurriculumStore.getState().practiceTimeSlots || [];
                return curriculumSlots
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((time, index) => ({
                        slotId: index + 1,
                        time
                    }));
            },

            /**
             * Log schedule adherence when practice starts
             */
            logScheduleAdherenceStart: ({ actualStartTime = Date.now(), pathId = null } = {}) => {
                const state = get();
                const activePathId = pathId || state.activePath?.pathId;
                if (!activePathId) return null;

                const slots = state.getScheduleSlots ? state.getScheduleSlots() : [];
                if (!slots || slots.length === 0) return null;

                const actualDate = new Date(actualStartTime);
                const dayKey = getDateKey(actualDate);

                const parseTimeToMinutes = (timeStr) => {
                    const [h, m] = (timeStr || '').split(':').map(Number);
                    if (Number.isNaN(h) || Number.isNaN(m)) return null;
                    return h * 60 + m;
                };

                const candidates = slots
                    .map(slot => {
                        const scheduledMinutes = parseTimeToMinutes(slot.time);
                        if (scheduledMinutes === null) return null;

                        const scheduledDate = new Date(actualDate);
                        scheduledDate.setHours(Math.floor(scheduledMinutes / 60), scheduledMinutes % 60, 0, 0);
                        const deltaMinutes = Math.round((actualStartTime - scheduledDate.getTime()) / 60000);
                        return {
                            slotId: slot.slotId,
                            scheduledTime: slot.time,
                            deltaMinutes,
                            absDelta: Math.abs(deltaMinutes)
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.absDelta - b.absDelta);

                if (candidates.length === 0 || candidates[0].absDelta > SCHEDULE_MATCH_RADIUS_MIN) {
                    return null;
                }

                const match = candidates[0];
                const exists = state.scheduleAdherenceLog.some(entry =>
                    entry.day === dayKey &&
                    entry.pathId === activePathId &&
                    entry.slotId === match.slotId
                );
                if (exists) return null;

                const withinWindow = Math.abs(match.deltaMinutes) <= SCHEDULE_ADHERENCE_WINDOW_MIN;
                const entry = {
                    id: `${dayKey}-${activePathId}-${match.slotId}`,
                    day: dayKey,
                    pathId: activePathId,
                    slotId: match.slotId,
                    scheduledTime: match.scheduledTime,
                    actualStartTime,
                    deltaMinutes: match.deltaMinutes,
                    withinWindow
                };

                set({
                    scheduleAdherenceLog: [...state.scheduleAdherenceLog, entry]
                });

                return entry;
            },

            /**
             * Get schedule adherence summary for the last N days
             */
            getScheduleAdherenceSummary: (days = 7, pathId = null) => {
                const state = get();
                const now = new Date();
                const cutoff = new Date(now);
                cutoff.setDate(cutoff.getDate() - (days - 1));
                cutoff.setHours(0, 0, 0, 0);

                const entries = state.scheduleAdherenceLog.filter(entry => {
                    if (pathId && entry.pathId !== pathId) return false;
                    const entryDate = new Date(`${entry.day}T00:00:00`);
                    return entryDate >= cutoff;
                });

                const total = entries.length;
                const withinCount = entries.filter(e => e.withinWindow).length;
                const sumDelta = entries.reduce((sum, e) => sum + (e.deltaMinutes || 0), 0);
                const sumAbs = entries.reduce((sum, e) => sum + Math.abs(e.deltaMinutes || 0), 0);

                const buildSlotSummary = (slotId) => {
                    const slotEntries = entries.filter(e => e.slotId === slotId);
                    const slotTotal = slotEntries.length;
                    if (slotTotal === 0) {
                        return { adherenceRate: 0, avgAbsDeltaMinutes: null };
                    }
                    const slotWithin = slotEntries.filter(e => e.withinWindow).length;
                    const slotAbs = slotEntries.reduce((sum, e) => sum + Math.abs(e.deltaMinutes || 0), 0);
                    return {
                        adherenceRate: Math.round((slotWithin / slotTotal) * 100),
                        avgAbsDeltaMinutes: Math.round(slotAbs / slotTotal)
                    };
                };

                return {
                    adherenceRate: total > 0 ? Math.round((withinCount / total) * 100) : 0,
                    avgDeltaMinutes: total > 0 ? Math.round(sumDelta / total) : null,
                    avgAbsDeltaMinutes: total > 0 ? Math.round(sumAbs / total) : null,
                    bySlot: {
                        1: buildSlotSummary(1),
                        2: buildSlotSummary(2),
                        3: buildSlotSummary(3)
                    }
                };
            },

            /**
             * Get raw schedule adherence log (for reports)
             */
            getScheduleAdherenceLog: () => {
                return get().scheduleAdherenceLog;
            }
        }),
        {
            name: 'immanenceOS.navigationState',
            version: 2,  // Bumped version for new fields
            migrate: (persistedState) => {
                return persistedState;
            }
        }
    )
);
