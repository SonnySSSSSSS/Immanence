// src/state/navigationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDaysToDateKey, getDateKey, getLocalDateKey } from '../utils/dateUtils';
import { getPathById } from '../data/navigationData.js';
import { useProgressStore } from './progressStore';
import { generatePathReport, savePathReport } from '../reporting/pathReport.js';
import { useCurriculumStore } from './curriculumStore';
import { computeScheduleAnchorStartAt, normalizeAndSortTimeSlots } from '../utils/scheduleUtils.js';
import { getScheduleConstraintForPath, validateSelectedTimes } from '../utils/scheduleSelectionConstraints.js';
import {
    computeContractDayCompletionStats,
    computeContractMissState,
    computeContractObligationSummary,
    createPathRunSessionFilter,
} from '../services/infographics/contractObligations.js';

const SCHEDULE_ADHERENCE_WINDOW_MIN = 15;
const SCHEDULE_MATCH_RADIUS_MIN = 90;

const getPathDurationDays = (pathId) => {
    const path = getPathById(pathId);
    if (!path) return null;
    if (typeof path?.tracking?.durationDays === 'number') return path.tracking.durationDays;
    if (typeof path?.duration === 'number') return path.duration * 7;
    return null;
};

const computeEndsAt = (startedAt, durationDays) => {
    if (!startedAt || !durationDays) return null;
    const start = new Date(startedAt);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + (durationDays * 24 * 60 * 60 * 1000));
    return end.toISOString();
};

const getTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
        return null;
    }
};

const normalizeDayOfWeekList = (days = []) => {
    const normalized = Array.isArray(days)
        ? days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        : [];
    return [...new Set(normalized)].sort((a, b) => a - b);
};

const selectedDaysFromOffDays = (offDays = []) => {
    const offSet = new Set(normalizeDayOfWeekList(offDays));
    return [0, 1, 2, 3, 4, 5, 6].filter((day) => !offSet.has(day));
};

export const useNavigationStore = create(
    persist(
        (set, get) => ({
            // Selection state (before beginning a path)
            selectedPathId: null,
            setSelectedPath: (id) => {
                console.log("[navigationStore] setSelectedPath ->", id);
                console.trace("[navigationStore] setSelectedPath stack");
                set({ selectedPathId: id });
            },
            
            // Pilot session tracking moved to curriculumStore

            // Active path state (after beginning)
            activePath: null, // Canonical fields only

            // Begin a new path
            beginPath: (pathId) => {
                const runId = crypto?.randomUUID?.() || String(Date.now());
                // Align Day 1 to the selected first slot time:
                // if the first slot window has already passed today, Day 1 begins tomorrow.
                const selectedTimesRaw = useCurriculumStore.getState().getPracticeTimeSlots() || [];
                const scheduleConstraint = getScheduleConstraintForPath(pathId);
                const selectedTimes = normalizeAndSortTimeSlots(selectedTimesRaw, {
                    maxCount: scheduleConstraint?.maxCount ?? 3,
                });
                const frozenSelectedDaysOfWeek = selectedDaysFromOffDays(useCurriculumStore.getState().offDaysOfWeek || [0]);
                const validation = validateSelectedTimes(selectedTimes, scheduleConstraint);
                if (!validation.ok) {
                    return { ok: false, error: validation.error };
                }
                const startedAtDate = computeScheduleAnchorStartAt({
                    now: new Date(),
                    firstSlotTime: selectedTimes[0],
                });
                const startedAt = startedAtDate.toISOString();
                const durationDays = getPathDurationDays(pathId);
                const endsAt = computeEndsAt(startedAt, durationDays);
                // Read schedule from canonical curriculum store

                set({
                    activePath: {
                        // Canonical tracking fields
                        runId,
                        activePathId: pathId,
                        startedAt,
                        endsAt,
                        status: 'active',
                        schedule: {
                            selectedTimes,
                            selectedDaysOfWeek: frozenSelectedDaysOfWeek,
                            timezone: getTimezone(),
                        },
                        progress: {
                            sessionsCompleted: 0,
                            totalMinutes: 0,
                            daysPracticed: 0,
                            streakCurrent: 0,
                            streakBest: 0,
                            lastSessionAt: null,
                        },
                        weekCompletionDates: {} // { 1: "2024-01-15", 2: "2024-01-22", ... }
                    },
                    selectedPathId: pathId // Keep selection synced
                });

                return { ok: true };
            },

            // Mark current week as complete and advance
            completeWeek: (weekNumber) => {
                const state = get();
                if (!state.activePath) return;

                const path = getPathById(state.activePath.activePathId);
                const totalWeeks = path?.duration || null;
                const isComplete = totalWeeks ? weekNumber >= totalWeeks : false;

                const nextActivePath = {
                    ...state.activePath,
                    weekCompletionDates: {
                        ...state.activePath.weekCompletionDates,
                        [weekNumber]: new Date().toISOString()
                    },
                    status: isComplete ? 'completed' : state.activePath.status
                };

                set({
                    activePath: nextActivePath
                });

                if (isComplete) {
                    const sessionsV2 = useProgressStore.getState().sessionsV2 || [];
                    const report = generatePathReport({
                        activePath: nextActivePath,
                        sessions: sessionsV2,
                    });
                    if (report) {
                        savePathReport(report);
                    }
                }
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
                if (!state.activePath?.weekCompletionDates) return false;
                return state.activePath.weekCompletionDates[weekNumber] !== undefined;
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

            // Long-term tracking (annual adherence stats)
            annualAdherenceStats: [],
            /* Structure:
            [{
              year: 2024,
              totalScheduledSessions: 156,
              adherentSessions: 120,
              adherenceRate: 0.77,
              avgDeviationMinutes: 12,
              bestMonth: 5,
              worstMonth: 2
            }]
            */

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
             * REDIRECTS to curriculumStore as canonical source
             * Kept for UI compatibility but internally delegates to curriculum store
             */
            setScheduleSlots: (slots = []) => {
                const pathId = get().activePath?.activePathId || get().selectedPathId || null;
                const scheduleConstraint = getScheduleConstraintForPath(pathId);
                const maxAllowed = scheduleConstraint?.maxCount || 3;
                // Extract times from slot objects
                const times = slots
                    .filter(slot => slot && slot.time)
                    .map(slot => slot.time)
                    .slice(0, maxAllowed);

                // Write to canonical curriculum store
                useCurriculumStore.getState().setPracticeTimeSlots(times);

                // Update activePath.schedule.selectedTimes for consistency
                set((state) => ({
                    activePath: state.activePath ? {
                        ...state.activePath,
                        schedule: {
                            ...(state.activePath.schedule || {}),
                            selectedTimes: times,
                            timezone: state.activePath.schedule?.timezone || getTimezone(),
                        }
                    } : state.activePath
                }));
            },

            /**
             * Get schedule slots (reads from canonical curriculum store)
             */
            getScheduleSlots: () => {
                const curriculumTimes = useCurriculumStore.getState().getPracticeTimeSlots() || [];
                return curriculumTimes.map((time, index) => ({
                    slotId: index + 1,
                    time
                }));
            },

            /**
             * Log schedule adherence when practice starts
             */
            logScheduleAdherenceStart: ({ actualStartTime = Date.now(), pathId = null } = {}) => {
                const state = get();
                const activePathId = pathId || state.activePath?.activePathId;
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
            },

            /**
             * Compute progress metrics for the active path
             * Returns: { durationDays, dayIndex, timePct, expectedSessionsSoFar, completedSessionsSoFar, adherencePct }
             */
            computeProgressMetrics: () => {
                const state = get();
                if (!state.activePath) {
                    return {
                        durationDays: 0,
                        dayIndex: 0,
                        timePct: 0,
                        expectedSessionsSoFar: 0,
                        completedSessionsSoFar: 0,
                        adherencePct: 0
                    };
                }

                const path = getPathById(state.activePath.activePathId);
                const durationDays = path?.tracking?.durationDays || (path?.duration * 7) || 0;
                
                if (!state.activePath.startedAt || durationDays === 0) {
                    return {
                        durationDays,
                        dayIndex: 0,
                        timePct: 0,
                        expectedSessionsSoFar: 0,
                        completedSessionsSoFar: 0,
                        adherencePct: 0
                    };
                }

                // Compute day index (1-based, local date)
                const startedAtDate = new Date(state.activePath.startedAt);
                const startedAtLocalKey = getLocalDateKey(startedAtDate); // YYYY-MM-DD in local timezone
                const todayKey = getLocalDateKey(); // Today in local timezone
                
                const startDay = new Date(startedAtLocalKey);
                const today = new Date(todayKey);
                const daysSinceStart = Math.floor((today - startDay) / (1000 * 60 * 60 * 24));
                const dayIndex = Math.min(Math.max(daysSinceStart + 1, 1), durationDays);
                const timePct = Math.round((dayIndex / durationDays) * 100);

                // Contract obligations are the source of truth for expected/completed adherence metrics.
                const progressState = useProgressStore.getState();
                const curriculumState = useCurriculumStore.getState();
                const isSessionInActiveRun = createPathRunSessionFilter({
                    runId: state.activePath.runId || null,
                    activePathId: state.activePath.activePathId || null,
                    startedAt: state.activePath.startedAt || null,
                });
                const frozenSelectedDaysOfWeek = normalizeDayOfWeekList(
                    state.activePath.schedule?.selectedDaysOfWeek || []
                );
                const selectedDaysArg = frozenSelectedDaysOfWeek.length > 0 ? frozenSelectedDaysOfWeek : null;
                const frozenSelectedTimes = normalizeAndSortTimeSlots(
                    state.activePath.schedule?.selectedTimes || [],
                    { maxCount: 3 }
                );

                const pathEndLocalKey = addDaysToDateKey(startedAtLocalKey, durationDays - 1);
                const windowEndLocalKey = pathEndLocalKey && pathEndLocalKey < todayKey
                    ? pathEndLocalKey
                    : todayKey;

                let expectedSessionsSoFar = 0;
                let completedSessionsSoFar = 0;
                let daysPracticed = 0;
                let streakCurrent = 0;
                let streakBest = 0;

                if (windowEndLocalKey && startedAtLocalKey <= windowEndLocalKey) {
                    const contractSummary = computeContractObligationSummary({
                        windowStartLocalDateKey: startedAtLocalKey,
                        windowEndLocalDateKey: windowEndLocalKey,
                        selectedDaysOfWeek: selectedDaysArg,
                        selectedTimes: frozenSelectedTimes,
                        curriculumStoreState: curriculumState,
                        progressStoreState: progressState,
                        isSessionEligible: isSessionInActiveRun,
                    });
                    expectedSessionsSoFar = contractSummary.totalObligations;
                    completedSessionsSoFar = contractSummary.satisfiedObligations;
                    const completionStats = computeContractDayCompletionStats(contractSummary.dayStates);
                    daysPracticed = completionStats.daysPracticed;
                    streakCurrent = completionStats.streakCurrent;
                    streakBest = completionStats.streakBest;
                }

                // Adherence %
                const adherencePct = expectedSessionsSoFar === 0 
                    ? 0 
                    : Math.min(Math.round((completedSessionsSoFar / expectedSessionsSoFar) * 100), 100);

                return {
                    durationDays,
                    dayIndex,
                    timePct,
                    expectedSessionsSoFar,
                    completedSessionsSoFar,
                    adherencePct,
                    // Strict day integrity metrics (all obligations required for a practiced day).
                    daysPracticed,
                    streakCurrent,
                    streakBest,
                };
            },

            /**
             * Compute consecutive missed days and broken state
             * Contract miss rule: a day is missed when it is an obligation day and not fully satisfied.
             * Path broken if: consecutiveMissedDays >= 2
             */
            computeMissState: () => {
                const state = get();
                if (!state.activePath) {
                    return { consecutiveMissedDays: 0, broken: false };
                }

                if (!state.activePath.startedAt) {
                    return { consecutiveMissedDays: 0, broken: false };
                }

                const progressState = useProgressStore.getState();
                const curriculumState = useCurriculumStore.getState();
                const startedAtLocalKey = getLocalDateKey(new Date(state.activePath.startedAt));
                const todayKey = getLocalDateKey();
                if (startedAtLocalKey > todayKey) {
                    return { consecutiveMissedDays: 0, broken: false };
                }

                const isSessionInActiveRun = createPathRunSessionFilter({
                    runId: state.activePath.runId || null,
                    activePathId: state.activePath.activePathId || null,
                    startedAt: state.activePath.startedAt || null,
                });
                const frozenSelectedDaysOfWeek = normalizeDayOfWeekList(
                    state.activePath.schedule?.selectedDaysOfWeek || []
                );
                const selectedDaysArg = frozenSelectedDaysOfWeek.length > 0 ? frozenSelectedDaysOfWeek : null;
                const frozenSelectedTimes = normalizeAndSortTimeSlots(
                    state.activePath.schedule?.selectedTimes || [],
                    { maxCount: 3 }
                );

                const contractSummary = computeContractObligationSummary({
                    windowStartLocalDateKey: startedAtLocalKey,
                    windowEndLocalDateKey: todayKey,
                    selectedDaysOfWeek: selectedDaysArg,
                    selectedTimes: frozenSelectedTimes,
                    curriculumStoreState: curriculumState,
                    progressStoreState: progressState,
                    isSessionEligible: isSessionInActiveRun,
                });

                return computeContractMissState(contractSummary.dayStates);
            },

            /**
             * Restart the current path
             * Generates new runId for clean state tracking
             * Resets activePath timestamps, clears progress tracking, maintains session history
             */
            restartPath: () => {
                console.log('[restartPath] invoked', { prevRunId: get().activePath?.runId });
                const state = get();
                if (!state.activePath) return;

                const runId = crypto.randomUUID();
                console.log('[restartPath] NEW RUN', runId);
                const pathId = state.activePath.activePathId;
                const durationDays = getPathDurationDays(pathId);
                const scheduleConstraint = getScheduleConstraintForPath(pathId);
                const selectedTimes = normalizeAndSortTimeSlots(state.activePath.schedule?.selectedTimes || [], {
                    maxCount: scheduleConstraint?.maxCount ?? 3,
                });
                const frozenSelectedDaysOfWeek = selectedDaysFromOffDays(useCurriculumStore.getState().offDaysOfWeek || [0]);
                const startedAtDate = computeScheduleAnchorStartAt({
                    now: new Date(),
                    firstSlotTime: selectedTimes[0],
                });
                const startedAt = startedAtDate.toISOString();
                const endsAt = computeEndsAt(startedAt, durationDays);

                set({
                    activePath: {
                        ...state.activePath,
                        runId,
                        startedAt,
                        endsAt,
                        status: 'active',
                        schedule: {
                            ...(state.activePath.schedule || {}),
                            selectedTimes,
                            selectedDaysOfWeek: frozenSelectedDaysOfWeek,
                        },
                        progress: {
                            sessionsCompleted: 0,
                            totalMinutes: 0,
                            daysPracticed: 0,
                            streakCurrent: 0,
                            streakBest: 0,
                            lastSessionAt: null,
                        },
                        weekCompletionDates: {},
                        missState: { consecutiveMissedDays: 0, broken: false }
                    }
                });

                console.assert(!!runId, '[restartPath] runId missing after restart');
                console.log('[restartPath] NEW RUN', {
                    runId,
                    activePathId: pathId,
                    startedAt,
                });
            }
        }),
        {
            name: 'immanenceOS.navigationState',
            version: 5,  // Bumped for run-frozen selectedDaysOfWeek schedule migration
            // Do not persist transient UI selections to avoid auto-opening overlays on load
            partialize: (state) => {
                const { selectedPathId, ...rest } = state;
                void selectedPathId;
                return rest;
            },
            migrate: (persistedState) => {
                // Drop any legacy selections to prevent auto-open after hydration
                const { selectedPathId: _legacySelection, ...rest } = persistedState || {};
                
                // Clean up legacy fields from activePath if present
                if (rest?.activePath) {
                    const { pathId: _, startDate: __, currentWeek: ___, completedWeeks: ____, ...cleanPath } = rest.activePath;
                    const scheduleConstraint = getScheduleConstraintForPath(cleanPath?.activePathId);
                    const selectedTimes = normalizeAndSortTimeSlots(cleanPath?.schedule?.selectedTimes || [], {
                        maxCount: scheduleConstraint?.maxCount ?? 3,
                    });
                    const selectedDaysOfWeek = normalizeDayOfWeekList(cleanPath?.schedule?.selectedDaysOfWeek || []);
                    const frozenSelectedDaysOfWeek = selectedDaysOfWeek.length > 0
                        ? selectedDaysOfWeek
                        : selectedDaysFromOffDays(useCurriculumStore.getState().offDaysOfWeek || [0]);
                    rest.activePath = {
                        ...cleanPath,
                        schedule: {
                            ...(cleanPath.schedule || {}),
                            selectedTimes,
                            selectedDaysOfWeek: frozenSelectedDaysOfWeek,
                        },
                    };
                }
                 
                return { ...rest, selectedPathId: null };
            },
            onRehydrateStorage: () => (state) => {
                // Force-clear selection after every hydration cycle
                if (state?.selectedPathId) {
                    state.selectedPathId = null;
                }

                // Ensure no legacy fields in activePath after rehydration
                if (state?.activePath) {
                    const legacyKeys = ['pathId', 'startDate', 'currentWeek', 'completedWeeks'];
                    legacyKeys.forEach(key => {
                        if (key in state.activePath) {
                            delete state.activePath[key];
                        }
                    });

                    const selectedDays = normalizeDayOfWeekList(state.activePath?.schedule?.selectedDaysOfWeek || []);
                    if (selectedDays.length === 0) {
                        const frozenSelectedDaysOfWeek = selectedDaysFromOffDays(useCurriculumStore.getState().offDaysOfWeek || [0]);
                        const nextActivePath = {
                            ...state.activePath,
                            schedule: {
                                ...(state.activePath.schedule || {}),
                                selectedDaysOfWeek: frozenSelectedDaysOfWeek,
                            },
                        };
                        state.activePath = nextActivePath;
                        // Persist the one-time freeze migration so future reloads stay stable.
                        useNavigationStore.setState({ activePath: nextActivePath });
                    }
                }

                // One-time migration: nav schedule → curriculum store (canonical)
                // If curriculum store is empty but nav has schedule, copy it over
                const curriculumState = useCurriculumStore.getState();
                const curriculumTimes = curriculumState.practiceTimeSlots || [];
                if (curriculumTimes.length === 0 && state?.scheduleSlots && state.scheduleSlots.length > 0) {
                    // Copy scheduleSlots from navigation store to curriculum store
                    const times = state.scheduleSlots.map(slot => slot.time).filter(Boolean);
                    if (times.length > 0) {
                        curriculumState.setPracticeTimeSlots(times);
                    }
                } else if (curriculumTimes.length === 0 && state?.activePath?.schedule?.selectedTimes && state.activePath.schedule.selectedTimes.length > 0) {
                    // Fallback: copy from activePath.schedule.selectedTimes if it exists
                    curriculumState.setPracticeTimeSlots(state.activePath.schedule.selectedTimes);
                }
            }
        }
    )
);
