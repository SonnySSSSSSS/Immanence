// src/state/trackingStore.js
// ═══════════════════════════════════════════════════════════════════════════
// AUTHORITATIVE TRACKING CENTER
// All practice data flows INTO this store. Other stores READ from it.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const getDateKey = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
};

const getWeekKey = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const getMonthKey = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useTrackingStore = create(
    persist(
        (set, get) => ({
            // ═══════════════════════════════════════════════════════════════
            // RAW SESSIONS (source of truth for all practice)
            // ═══════════════════════════════════════════════════════════════
            sessions: [],
            /*
            Each session:
            {
                id: string,
                dateKey: "YYYY-MM-DD",
                timestamp: number (ms),
                
                // Practice identification
                practiceType: 'breath' | 'cognitive_vipassana' | 'somatic_vipassana' | 
                              'visualization' | 'cymatics' | 'sound' | 'ritual' | 'circuit',
                practiceFamily: 'attention' | 'insight' | 'integration',
                
                // Timing
                scheduledTime: "HH:MM" | null,  // user's intended practice time
                actualTime: "HH:MM",            // when they actually started
                duration: number,               // minutes
                durationMs: number,             // precise milliseconds
                
                // Completion
                exitType: 'completed' | 'early_exit' | 'abandoned',
                completionRatio: 0-1,           // % of intended duration completed
                
                // Precision metrics (practice-specific)
                precision: {
                    breath: {
                        rhythmAccuracy: 0-1,    // % of taps within target window
                        totalCycles: number,
                        accurateCycles: number,
                        avgDeviation: number,   // ms off from target
                    },
                    // other practice types add their metrics here
                },
                
                // Engagement signals
                pauseCount: number,
                pauseTotalMs: number,
                aliveSignalCount: number,       // taps, interactions during session
                
                // For circuits
                circuitExercises: [
                    { type: 'breath', duration: 5, precision: {...} },
                    { type: 'visualization', duration: 5, precision: {...} }
                ] | null,
                
                // Metadata
                metadata: {}
            }
            */

            // ═══════════════════════════════════════════════════════════════
            // DAILY LOGS (user-entered reflection data)
            // ═══════════════════════════════════════════════════════════════
            dailyLogs: {},
            /*
            {
                "2025-01-01": {
                    effort: 1-5,                // subjective effort level
                    karmaCount: number,         // intentional responses logged
                    dharmaCount: number,        // habitual/reactive responses logged
                    notes: string,              // optional reflection
                    mood: string | null,        // optional mood tag
                    updatedAt: timestamp
                }
            }
            */

            // ═══════════════════════════════════════════════════════════════
            // STREAK & CONSISTENCY
            // ═══════════════════════════════════════════════════════════════
            streak: {
                current: 0,
                longest: 0,
                lastPracticeDate: null,         // "YYYY-MM-DD"
            },

            vacation: {
                active: false,
                startDate: null,
                frozenStreak: 0,
                resumeDate: null,               // user-entered expected return
            },

            honorLogs: [],
            /*
            Each: { id, dateKey, practiceType, duration, note, timestamp }
            For off-app practice that should count toward streaks
            */

            // ═══════════════════════════════════════════════════════════════
            // SCHEDULE & TIMING
            // ═══════════════════════════════════════════════════════════════
            schedule: {
                preferredTime: null,            // "HH:MM" - daily target
                reminderEnabled: false,
                reminderOffset: 0,              // minutes before preferredTime
            },

            // ═══════════════════════════════════════════════════════════════
            // PATH TRACKING
            // ═══════════════════════════════════════════════════════════════
            activePath: null,
            /*
            {
                pathId: string,
                pathName: string,
                startDate: "YYYY-MM-DD",
                currentWeek: number,
                totalWeeks: number,
                completedWeeks: [1, 2, 3...],
                weekCompletionDates: { 1: "YYYY-MM-DD", ... }
            }
            */

            // ═══════════════════════════════════════════════════════════════
            // TREATISE & VIDEO ENGAGEMENT
            // ═══════════════════════════════════════════════════════════════
            treatiseProgress: {
                sessionsCount: 0,
                totalTimeMs: 0,
                sectionsVisited: [],            // unique section IDs
                lastSection: null,
                completionEstimate: 0,          // 0-1 based on sections visited
            },

            videoProgress: {
                totalWatched: 0,
                completedIds: [],
                totalWatchTimeMs: 0,
            },

            // ═══════════════════════════════════════════════════════════════
            // AGGREGATED ROLLUPS (computed on demand, cached)
            // ═══════════════════════════════════════════════════════════════
            rollupCache: {
                daily: {},      // { "YYYY-MM-DD": {...} }
                weekly: {},     // { "YYYY-Wnn": {...} }
                monthly: {},    // { "YYYY-MM": {...} }
                lastComputed: null,
            },

            // ═══════════════════════════════════════════════════════════════
            // ACTIONS: SESSION RECORDING
            // ═══════════════════════════════════════════════════════════════

            /**
             * Record a practice session
             * This is the PRIMARY entry point for all practice data
             */
            recordSession: (sessionData) => {
                const state = get();
                const now = Date.now();
                const dateKey = getDateKey();
                const timeStr = new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                const session = {
                    id: crypto?.randomUUID?.() || `session_${now}`,
                    dateKey,
                    timestamp: now,

                    // Required fields with defaults
                    practiceType: sessionData.practiceType || 'breath',
                    practiceFamily: sessionData.practiceFamily || 'attention',

                    // Timing
                    scheduledTime: state.schedule.preferredTime,
                    actualTime: timeStr,
                    duration: sessionData.duration || 0,
                    durationMs: sessionData.durationMs || (sessionData.duration * 60 * 1000),

                    // Completion
                    exitType: sessionData.exitType || 'completed',
                    completionRatio: sessionData.completionRatio ?? 1,

                    // Precision
                    precision: sessionData.precision || {},

                    // Engagement
                    pauseCount: sessionData.pauseCount || 0,
                    pauseTotalMs: sessionData.pauseTotalMs || 0,
                    aliveSignalCount: sessionData.aliveSignalCount || 0,

                    // Circuit data
                    circuitExercises: sessionData.circuitExercises || null,

                    // Layer 1: Post-Session Micro-Note (Journal)
                    journal: sessionData.journal || null,
                    /*
                    journal: {
                        attentionQuality: 'scattered' | 'settling' | 'stable' | 'absorbed' | null,
                        technicalNote: string | null,     // 140 char max
                        resistanceFlag: boolean,
                        challengeTag: 'physical' | 'attention' | 'emotional' | 'consistency' | 'technique' | null,
                        submittedAt: timestamp | null,
                    }
                    */

                    // Pass-through metadata
                    metadata: sessionData.metadata || {},
                };

                // Update streak
                const newStreak = get()._updateStreak(dateKey);

                set({
                    sessions: [...state.sessions, session],
                    streak: newStreak,
                });

                // Invalidate rollup cache
                get()._invalidateCache(dateKey);

                return session;
            },

            /**
             * Record honor (off-app) practice
             */
            recordHonorPractice: ({ practiceType, duration, note = '', date = null }) => {
                const state = get();
                const targetDate = date ? new Date(date) : new Date();
                const dateKey = getDateKey(targetDate);
                const now = Date.now();

                const honorLog = {
                    id: crypto?.randomUUID?.() || `honor_${now}`,
                    dateKey,
                    timestamp: now,
                    practiceType,
                    duration,
                    note,
                };

                const newStreak = get()._updateStreak(dateKey);

                set({
                    honorLogs: [...state.honorLogs, honorLog],
                    streak: newStreak,
                });

                get()._invalidateCache(dateKey);
                return honorLog;
            },

            // ═══════════════════════════════════════════════════════════════
            // ACTIONS: DAILY LOG ENTRY
            // ═══════════════════════════════════════════════════════════════

            /**
             * Log daily reflection data (effort, karma/dharma, notes)
             */
            logDaily: ({ effort, karmaCount, dharmaCount, notes, mood }) => {
                const state = get();
                const dateKey = getDateKey();
                const existing = state.dailyLogs[dateKey] || {};

                const updated = {
                    ...existing,
                    ...(effort !== undefined && { effort }),
                    ...(karmaCount !== undefined && { karmaCount }),
                    ...(dharmaCount !== undefined && { dharmaCount }),
                    ...(notes !== undefined && { notes }),
                    ...(mood !== undefined && { mood }),
                    updatedAt: Date.now(),
                };

                set({
                    dailyLogs: {
                        ...state.dailyLogs,
                        [dateKey]: updated,
                    },
                });

                return updated;
            },

            /**
             * Increment karma or dharma count (quick-tap action)
             */
            incrementKarma: () => {
                const state = get();
                const dateKey = getDateKey();
                const existing = state.dailyLogs[dateKey] || {};

                set({
                    dailyLogs: {
                        ...state.dailyLogs,
                        [dateKey]: {
                            ...existing,
                            karmaCount: (existing.karmaCount || 0) + 1,
                            updatedAt: Date.now(),
                        },
                    },
                });
            },

            incrementDharma: () => {
                const state = get();
                const dateKey = getDateKey();
                const existing = state.dailyLogs[dateKey] || {};

                set({
                    dailyLogs: {
                        ...state.dailyLogs,
                        [dateKey]: {
                            ...existing,
                            dharmaCount: (existing.dharmaCount || 0) + 1,
                            updatedAt: Date.now(),
                        },
                    },
                });
            },

            // ═══════════════════════════════════════════════════════════════
            // ACTIONS: VACATION MODE
            // ═══════════════════════════════════════════════════════════════

            startVacation: (resumeDate = null) => {
                const state = get();
                set({
                    vacation: {
                        active: true,
                        startDate: getDateKey(),
                        frozenStreak: state.streak.current,
                        resumeDate,
                    },
                });
            },

            endVacation: () => {
                const state = get();
                set({
                    vacation: {
                        active: false,
                        startDate: null,
                        frozenStreak: 0,
                        resumeDate: null,
                    },
                    streak: {
                        ...state.streak,
                        current: state.vacation.frozenStreak,
                        lastPracticeDate: getDateKey(),
                    },
                });
            },

            // ═══════════════════════════════════════════════════════════════
            // ACTIONS: PATH TRACKING
            // ═══════════════════════════════════════════════════════════════

            beginPath: (pathId, pathName, totalWeeks) => {
                set({
                    activePath: {
                        pathId,
                        pathName,
                        startDate: getDateKey(),
                        currentWeek: 1,
                        totalWeeks,
                        completedWeeks: [],
                        weekCompletionDates: {},
                    },
                });
            },

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
                            [weekNumber]: getDateKey(),
                        },
                    },
                });
            },

            abandonPath: () => {
                set({ activePath: null });
            },

            // ═══════════════════════════════════════════════════════════════
            // ACTIONS: SCHEDULE
            // ═══════════════════════════════════════════════════════════════

            setSchedule: ({ preferredTime, reminderEnabled, reminderOffset }) => {
                const state = get();
                set({
                    schedule: {
                        ...state.schedule,
                        ...(preferredTime !== undefined && { preferredTime }),
                        ...(reminderEnabled !== undefined && { reminderEnabled }),
                        ...(reminderOffset !== undefined && { reminderOffset }),
                    },
                });
            },

            // ═══════════════════════════════════════════════════════════════
            // ACTIONS: TREATISE & VIDEO TRACKING
            // ═══════════════════════════════════════════════════════════════

            recordTreatiseSession: ({ sectionId, durationMs }) => {
                const state = get();
                const visited = state.treatiseProgress.sectionsVisited;
                const newVisited = visited.includes(sectionId)
                    ? visited
                    : [...visited, sectionId];

                set({
                    treatiseProgress: {
                        sessionsCount: state.treatiseProgress.sessionsCount + 1,
                        totalTimeMs: state.treatiseProgress.totalTimeMs + durationMs,
                        sectionsVisited: newVisited,
                        lastSection: sectionId,
                        completionEstimate: newVisited.length / 100, // rough estimate
                    },
                });
            },

            recordVideoProgress: ({ videoId, completed, watchTimeMs }) => {
                const state = get();
                const completedIds = state.videoProgress.completedIds;
                const newCompletedIds = (completed && !completedIds.includes(videoId))
                    ? [...completedIds, videoId]
                    : completedIds;

                set({
                    videoProgress: {
                        totalWatched: state.videoProgress.totalWatched + (completed ? 1 : 0),
                        completedIds: newCompletedIds,
                        totalWatchTimeMs: state.videoProgress.totalWatchTimeMs + (watchTimeMs || 0),
                    },
                });
            },

            // ═══════════════════════════════════════════════════════════════
            // SELECTORS: TODAY'S DATA
            // ═══════════════════════════════════════════════════════════════

            getToday: () => {
                const state = get();
                const dateKey = getDateKey();

                const todaySessions = state.sessions.filter(s => s.dateKey === dateKey);
                const todayLog = state.dailyLogs[dateKey] || {};
                const todayHonor = state.honorLogs.filter(h => h.dateKey === dateKey);

                const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0)
                    + todayHonor.reduce((sum, h) => sum + h.duration, 0);

                const practiceTypes = [...new Set(todaySessions.map(s => s.practiceType))];

                // Precision scores (average across today's sessions that have precision data)
                const breathSessions = todaySessions.filter(s => s.precision?.breath?.rhythmAccuracy != null);
                const avgBreathPrecision = breathSessions.length > 0
                    ? breathSessions.reduce((sum, s) => sum + s.precision.breath.rhythmAccuracy, 0) / breathSessions.length
                    : null;

                // Schedule precision
                let schedulePrecision = null;
                if (state.schedule.preferredTime && todaySessions.length > 0) {
                    const firstSession = todaySessions[0];
                    const [schedH, schedM] = state.schedule.preferredTime.split(':').map(Number);
                    const [actualH, actualM] = firstSession.actualTime.split(':').map(Number);
                    const diffMinutes = Math.abs((actualH * 60 + actualM) - (schedH * 60 + schedM));
                    schedulePrecision = Math.max(0, 1 - (diffMinutes / 60)); // 0-1, 1hr = 0%
                }

                return {
                    dateKey,
                    practiced: todaySessions.length > 0 || todayHonor.length > 0,
                    sessionCount: todaySessions.length,
                    totalMinutes,
                    practiceTypes,
                    effort: todayLog.effort || null,
                    karmaCount: todayLog.karmaCount || 0,
                    dharmaCount: todayLog.dharmaCount || 0,
                    notes: todayLog.notes || '',
                    breathPrecision: avgBreathPrecision,
                    schedulePrecision,
                    streak: state.vacation.active ? state.vacation.frozenStreak : state.streak.current,
                };
            },

            // ═══════════════════════════════════════════════════════════════
            // SELECTORS: WEEKLY DATA
            // ═══════════════════════════════════════════════════════════════

            getWeek: (weekOffset = 0) => {
                const state = get();
                const now = new Date();
                now.setDate(now.getDate() - (weekOffset * 7));

                // Get start of week (Sunday)
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7);

                const weekSessions = state.sessions.filter(s => {
                    const sDate = new Date(s.timestamp);
                    return sDate >= startOfWeek && sDate < endOfWeek;
                });

                const weekHonor = state.honorLogs.filter(h => {
                    const hDate = new Date(h.timestamp);
                    return hDate >= startOfWeek && hDate < endOfWeek;
                });

                // Days practiced
                const daysWithPractice = new Set([
                    ...weekSessions.map(s => s.dateKey),
                    ...weekHonor.map(h => h.dateKey),
                ]);

                // Time per practice type
                const timeByType = {};
                weekSessions.forEach(s => {
                    timeByType[s.practiceType] = (timeByType[s.practiceType] || 0) + s.duration;
                });

                // Precision trend (array of daily averages)
                const precisionByDay = {};
                weekSessions.forEach(s => {
                    if (s.precision?.breath?.rhythmAccuracy != null) {
                        if (!precisionByDay[s.dateKey]) precisionByDay[s.dateKey] = [];
                        precisionByDay[s.dateKey].push(s.precision.breath.rhythmAccuracy);
                    }
                });
                const precisionTrend = Object.entries(precisionByDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, scores]) => ({
                        date,
                        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
                    }));

                // Daily logs for the week
                const dailyLogs = {};
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startOfWeek);
                    d.setDate(startOfWeek.getDate() + i);
                    const key = getDateKey(d);
                    dailyLogs[key] = state.dailyLogs[key] || null;
                }

                return {
                    weekKey: getWeekKey(startOfWeek),
                    startDate: getDateKey(startOfWeek),
                    daysPracticed: daysWithPractice.size,
                    totalSessions: weekSessions.length,
                    totalMinutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
                    timeByType,
                    precisionTrend,
                    dailyLogs,
                    karmaTotal: Object.values(dailyLogs).reduce((sum, d) => sum + (d?.karmaCount || 0), 0),
                    dharmaTotal: Object.values(dailyLogs).reduce((sum, d) => sum + (d?.dharmaCount || 0), 0),
                };
            },

            // ═══════════════════════════════════════════════════════════════
            // SELECTORS: MONTHLY DATA
            // ═══════════════════════════════════════════════════════════════

            getMonth: (monthOffset = 0) => {
                const state = get();
                const now = new Date();
                now.setMonth(now.getMonth() - monthOffset);

                const year = now.getFullYear();
                const month = now.getMonth();
                const monthKey = getMonthKey(now);

                const monthSessions = state.sessions.filter(s => {
                    const sDate = new Date(s.timestamp);
                    return sDate.getFullYear() === year && sDate.getMonth() === month;
                });

                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const daysWithPractice = new Set(monthSessions.map(s => s.dateKey));

                return {
                    monthKey,
                    year,
                    month: month + 1,
                    daysPracticed: daysWithPractice.size,
                    daysInMonth,
                    consistencyRate: daysWithPractice.size / daysInMonth,
                    totalSessions: monthSessions.length,
                    totalMinutes: monthSessions.reduce((sum, s) => sum + s.duration, 0),
                };
            },

            // ═══════════════════════════════════════════════════════════════
            // SELECTORS: LIFETIME STATS
            // ═══════════════════════════════════════════════════════════════

            getLifetime: () => {
                const state = get();

                const totalSessions = state.sessions.length;
                const totalMinutes = state.sessions.reduce((sum, s) => sum + s.duration, 0);
                const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

                const uniqueDays = new Set(state.sessions.map(s => s.dateKey));

                const firstSession = state.sessions[0];
                const firstDate = firstSession ? getDateKey(new Date(firstSession.timestamp)) : null;

                // Time by practice type (all time)
                const timeByType = {};
                state.sessions.forEach(s => {
                    timeByType[s.practiceType] = (timeByType[s.practiceType] || 0) + s.duration;
                });

                return {
                    totalSessions,
                    totalMinutes,
                    totalHours,
                    uniqueDays: uniqueDays.size,
                    firstPracticeDate: firstDate,
                    longestStreak: state.streak.longest,
                    currentStreak: state.vacation.active ? state.vacation.frozenStreak : state.streak.current,
                    timeByType,
                    pathProgress: state.activePath ? {
                        name: state.activePath.pathName,
                        currentWeek: state.activePath.currentWeek,
                        totalWeeks: state.activePath.totalWeeks,
                        completion: state.activePath.completedWeeks.length / state.activePath.totalWeeks,
                    } : null,
                    treatise: state.treatiseProgress,
                    videos: state.videoProgress,
                };
            },

            // ═══════════════════════════════════════════════════════════════
            // SELECTORS: TRAJECTORY (MULTI-WEEK TRENDS)
            // ═══════════════════════════════════════════════════════════════

            /**
             * Get trajectory data for the past N weeks
             * Returns weekly summaries with computed trends and insights
             */
            getTrajectory: (weekCount = 8) => {
                const state = get();
                const weeks = [];

                // Collect weekly data
                for (let offset = weekCount - 1; offset >= 0; offset--) {
                    const weekData = get().getWeek(offset);

                    // Compute session-level averages
                    const now = new Date();
                    now.setDate(now.getDate() - (offset * 7));

                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);

                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 7);

                    const weekSessions = state.sessions.filter(s => {
                        const sDate = new Date(s.timestamp);
                        return sDate >= startOfWeek && sDate < endOfWeek;
                    });

                    // Average precision across all breath sessions
                    const breathSessions = weekSessions.filter(s => s.precision?.breath?.rhythmAccuracy != null);
                    const avgBreathPrecision = breathSessions.length > 0
                        ? breathSessions.reduce((sum, s) => sum + s.precision.breath.rhythmAccuracy, 0) / breathSessions.length
                        : null;

                    // Completion rate (% of sessions completed vs early exit)
                    const completed = weekSessions.filter(s => s.exitType === 'completed').length;
                    const completionRate = weekSessions.length > 0 ? completed / weekSessions.length : 0;

                    // Practice type diversity
                    const practiceTypes = [...new Set(weekSessions.map(s => s.practiceType))];

                    weeks.push({
                        weekKey: weekData.weekKey,
                        startDate: weekData.startDate,
                        daysActive: weekData.daysPracticed,
                        totalMinutes: weekData.totalMinutes,
                        sessionCount: weekData.totalSessions,
                        avgPrecision: {
                            breath: avgBreathPrecision,
                        },
                        karmaCount: weekData.karmaTotal,
                        dharmaCount: weekData.dharmaTotal,
                        completionRate,
                        practiceTypes,
                    });
                }

                // Compute trends (simple linear regression slope)
                const getTrend = (data, key) => {
                    if (data.length < 2) return 0;
                    const yValues = data.map(w => w[key] || 0);
                    const n = yValues.length;
                    const xMean = (n - 1) / 2;
                    const yMean = yValues.reduce((a, b) => a + b, 0) / n;

                    let numerator = 0;
                    let denominator = 0;

                    for (let i = 0; i < n; i++) {
                        numerator += (i - xMean) * (yValues[i] - yMean);
                        denominator += Math.pow(i - xMean, 2);
                    }

                    return denominator === 0 ? 0 : numerator / denominator;
                };

                // Compute lulls (2+ consecutive weeks below 50% of personal average)
                const avgDaysActive = weeks.reduce((sum, w) => sum + w.daysActive, 0) / weeks.length;
                const lullThreshold = Math.max(avgDaysActive * 0.5, 2);

                const lulls = [];
                let lullStart = null;

                weeks.forEach((week, idx) => {
                    if (week.daysActive < lullThreshold) {
                        if (lullStart === null) lullStart = idx;
                    } else {
                        if (lullStart !== null && idx - lullStart >= 2) {
                            lulls.push({
                                startWeek: weeks[lullStart].weekKey,
                                endWeek: weeks[idx - 1].weekKey,
                                duration: idx - lullStart,
                            });
                        }
                        lullStart = null;
                    }
                });

                // Detect milestones
                const peakWeek = weeks.reduce((max, w) => w.daysActive > max.daysActive ? w : max, weeks[0]);
                const mostMinutes = weeks.reduce((max, w) => w.totalMinutes > max.totalMinutes ? w : max, weeks[0]);

                // Precision delta (first vs last week with data)
                const firstWeekPrecision = weeks.find(w => w.avgPrecision.breath !== null)?.avgPrecision.breath;
                const lastWeekPrecision = [...weeks].reverse().find(w => w.avgPrecision.breath !== null)?.avgPrecision.breath;
                const precisionDelta = (firstWeekPrecision && lastWeekPrecision)
                    ? ((lastWeekPrecision - firstWeekPrecision) / firstWeekPrecision) * 100
                    : null;

                // Practice type changes
                const practiceChanges = [];
                for (let i = 1; i < weeks.length; i++) {
                    const newTypes = weeks[i].practiceTypes.filter(t => !weeks[i - 1].practiceTypes.includes(t));
                    if (newTypes.length > 0) {
                        practiceChanges.push({
                            weekKey: weeks[i].weekKey,
                            added: newTypes,
                        });
                    }
                }

                // Overall trajectory direction
                const consistencyTrend = getTrend(weeks, 'daysActive');
                const volumeTrend = getTrend(weeks, 'totalMinutes');
                const direction = consistencyTrend > 0.1 ? 'ascending' :
                    consistencyTrend < -0.1 ? 'declining' : 'steady';

                return {
                    weeks,
                    period: {
                        weekCount,
                        startDate: weeks[0]?.startDate,
                        endDate: weeks[weeks.length - 1]?.startDate,
                    },
                    trends: {
                        consistency: consistencyTrend,
                        volume: volumeTrend,
                        precision: getTrend(weeks.map(w => ({ avgPrecision: w.avgPrecision.breath || 0 })), 'avgPrecision'),
                        direction,
                        directionLabel: direction === 'ascending' ? 'Ascending' :
                            direction === 'declining' ? 'Declining' : 'Steady',
                    },
                    insights: {
                        peakWeek: peakWeek?.weekKey,
                        peakDays: peakWeek?.daysActive,
                        mostProductiveWeek: mostMinutes?.weekKey,
                        mostMinutes: mostMinutes?.totalMinutes,
                        precisionDelta,
                        practiceChanges,
                    },
                    lulls,
                };
            },

            // ═══════════════════════════════════════════════════════════════
            // EXPORT
            // ═══════════════════════════════════════════════════════════════

            exportData: (format = 'json') => {
                const state = get();

                const data = {
                    exportedAt: new Date().toISOString(),
                    version: 1,
                    sessions: state.sessions,
                    dailyLogs: state.dailyLogs,
                    honorLogs: state.honorLogs,
                    streak: state.streak,
                    vacation: state.vacation,
                    schedule: state.schedule,
                    activePath: state.activePath,
                    treatiseProgress: state.treatiseProgress,
                    videoProgress: state.videoProgress,
                };

                if (format === 'json') {
                    return JSON.stringify(data, null, 2);
                }

                // CSV format - flatten sessions
                if (format === 'csv') {
                    const headers = [
                        'date', 'time', 'practiceType', 'duration', 'exitType',
                        'breathPrecision', 'pauseCount', 'effort', 'karmaCount', 'dharmaCount'
                    ];

                    const rows = state.sessions.map(s => {
                        const dayLog = state.dailyLogs[s.dateKey] || {};
                        return [
                            s.dateKey,
                            s.actualTime,
                            s.practiceType,
                            s.duration,
                            s.exitType,
                            s.precision?.breath?.rhythmAccuracy ?? '',
                            s.pauseCount,
                            dayLog.effort ?? '',
                            dayLog.karmaCount ?? '',
                            dayLog.dharmaCount ?? '',
                        ].join(',');
                    });

                    return [headers.join(','), ...rows].join('\n');
                }

                return data;
            },

            // ═══════════════════════════════════════════════════════════════
            // INTERNAL HELPERS
            // ═══════════════════════════════════════════════════════════════

            _updateStreak: (dateKey) => {
                const state = get();
                const { lastPracticeDate, current, longest } = state.streak;

                // If vacation active, don't update
                if (state.vacation.active) {
                    return state.streak;
                }

                // If already practiced today
                if (lastPracticeDate === dateKey) {
                    return state.streak;
                }

                const today = new Date(dateKey);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayKey = getDateKey(yesterday);

                let newCurrent = current;

                if (lastPracticeDate === yesterdayKey) {
                    // Consecutive day
                    newCurrent = current + 1;
                } else if (!lastPracticeDate) {
                    // First practice ever
                    newCurrent = 1;
                } else {
                    // Streak broken
                    newCurrent = 1;
                }

                return {
                    current: newCurrent,
                    longest: Math.max(longest, newCurrent),
                    lastPracticeDate: dateKey,
                };
            },

            _invalidateCache: (dateKey) => {
                const state = get();
                const weekKey = getWeekKey(new Date(dateKey));
                const monthKey = getMonthKey(new Date(dateKey));

                set({
                    rollupCache: {
                        ...state.rollupCache,
                        daily: { ...state.rollupCache.daily, [dateKey]: undefined },
                        weekly: { ...state.rollupCache.weekly, [weekKey]: undefined },
                        monthly: { ...state.rollupCache.monthly, [monthKey]: undefined },
                    },
                });
            },
        }),
        {
            name: 'immanenceOS.tracking',
            version: 1,
            migrate: (persistedState, version) => {
                return persistedState;
            },
        }
    )
);

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { getDateKey, getWeekKey, getMonthKey };
