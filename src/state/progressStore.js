// src/state/progressStore.js
// Single source of truth for all practice tracking
// Other stores (mandalaStore, pathStore, lunarStore) should derive from this

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDateKey, getWeekStart, addDaysToDateKey, diffDateKeysInDays } from '../utils/dateUtils';
import { updateAnnualRollups, updateLifetimeMilestones } from '../utils/lifetimeTracking';

// ========================================
// V2 COMPATIBILITY HELPERS
// ========================================

const IS_DEV =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

let hasWarnedLegacyOnly = false;

function resolveSessionTimestamp(session) {
    const raw =
        session?.date ||
        session?.timestamp ||
        session?.startedAt ||
        session?.endedAt ||
        null;

    if (raw) return raw;
    if (session?.dateKey) return `${session.dateKey}T00:00:00`;
    return null;
}

function resolveSessionDateKey(session) {
    if (session?.dateKey) return session.dateKey;
    const raw = resolveSessionTimestamp(session);
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return getDateKey(date);
}

function inferDomainFromV2Session(sessionV2) {
    const explicit = sessionV2?.domain || sessionV2?.practiceDomain || null;
    if (explicit) return explicit;

    const practiceId = String(sessionV2?.practiceId || '').toLowerCase();
    const practiceMode = String(sessionV2?.practiceMode || '').toLowerCase();
    const token = `${practiceId} ${practiceMode}`.trim();

    if (token.includes('breath') || practiceId === 'breath') return 'breathwork';
    if (token.includes('visual') || token.includes('cymatic') || token.includes('photic')) return 'visualization';
    if (token.includes('sound')) return 'sound';
    if (token.includes('ritual') || practiceId === 'integration') return 'ritual';
    if (token.includes('feel')) return 'focus';
    if (token.includes('vipassana') || practiceId === 'awareness') return 'focus';
    if (practiceId === 'circuit') return 'circuit-training';

    return 'unknown';
}

function asLegacySessionFromV2(sessionV2) {
    const iso = resolveSessionTimestamp(sessionV2);
    const dateKey = resolveSessionDateKey(sessionV2);
    const durationMinutes =
        typeof sessionV2?.durationSec === 'number'
            ? sessionV2.durationSec / 60
            : null;

    return {
        id: sessionV2?.id || null,
        date: iso,
        dateKey,
        domain: inferDomainFromV2Session(sessionV2),
        duration: typeof durationMinutes === 'number' ? durationMinutes : 0,
        metadata: sessionV2?.configSnapshot || sessionV2?.metadata || {},
        _source: 'sessionsV2',
    };
}

/**
 * Canonical session accessor.
 * Precedence: normalize `sessionsV2` first, then append legacy `sessions` as fallback.
 * This keeps V2 authoritative while preserving backward compatibility with existing data.
 */
function getCanonicalSessions(state) {
    const legacy = Array.isArray(state?.sessions) ? state.sessions : [];
    const v2 = Array.isArray(state?.sessionsV2) ? state.sessionsV2 : [];

    if (IS_DEV && !hasWarnedLegacyOnly && legacy.length > 0 && v2.length === 0) {
        console.warn('[progressStore] legacy-only sessions detected; consider migrating to sessionsV2.');
        hasWarnedLegacyOnly = true;
    }

    const v2AsLegacy = v2.map(asLegacySessionFromV2).filter(s => !!s.dateKey && !!s.date);
    return [...v2AsLegacy, ...legacy];
}

function deriveLastPracticeDateFromEvents(state) {
    const sessions = getCanonicalSessions(state);
    const honorLogs = Array.isArray(state?.honorLogs) ? state.honorLogs : [];

    const keys = [];
    for (const s of sessions) {
        if (s?.dateKey) keys.push(s.dateKey);
    }
    for (const h of honorLogs) {
        if (h?.dateKey) keys.push(h.dateKey);
    }

    if (keys.length === 0) return null;
    keys.sort();
    return keys[keys.length - 1] || null;
}

// Helper: get days between two UTC date keys
function daysBetween(dateKey1, dateKey2) {
    return diffDateKeysInDays(dateKey1, dateKey2);
}

// Helper: check if date is today
function isToday(dateKey) {
    return dateKey === getDateKey();
}

// Helper: check if date is yesterday (UTC date keys)
function isYesterday(dateKey) {
    const todayKey = getDateKey();
    const yesterdayKey = addDaysToDateKey(todayKey, -1);
    return dateKey === yesterdayKey;
}

export const useProgressStore = create(
    persist(
        (set, get) => {
            // DEV assertion: Catch legacy sessions field regression
            if (import.meta.env.DEV) {
                const state = get?.() || {};
                if (state.sessions && Array.isArray(state.sessions)) {
                    console.error('[LEGACY] progressStore.sessions still exists in state');
                }
            }
            return {
            // === Raw Events (source of truth) ===
            sessions: [],
            // Each session: { id, date, domain, duration, metadata }
            // domain: 'breathwork' | 'visualization' | 'wisdom'
            // metadata varies by domain

            sessionsV2: [],
            // Each normalized session: { id, startedAt, endedAt, durationSec, practiceId, practiceMode, configSnapshot, completion, pathContext }

            honorLogs: [],
            // Each: { id, date, domain, duration, note }

            // === Streak (minimal stored state) ===
            streak: {
                lastPracticeDate: null,  // "YYYY-MM-DD"
                longest: 0               // All-time record
            },

            // === Vacation ===
            vacation: {
                active: false,
                startDate: null,
                frozenStreak: 0
            },

            // === Display Preferences ===
            displayPreference: 'lastUsed',  // 'lastUsed' | 'userSelected'
            userSelectedDomain: null,
            lastPracticeType: 'breathwork',

            // === Goals (Daily Targets in minutes) ===
            goals: {
                breathwork: 30,
                visualization: 20,
                wisdom: 15,
            },
            durationConsistency: 0,
            frequencyPattern: 'irregular', // 'daily' | 'flexible' | 'irregular'

            // ========================================
            // ACTIONS
            // ========================================

            /**
             * Record a normalized session (schema-aligned)
             */
            recordSessionV2: (normalizedSession) => {
                const state = get();
                const session = normalizedSession || null;
                if (!session) return null;

                set({
                    sessionsV2: [...state.sessionsV2, session]
                });

                return session;
            },

            /**
             * Log off-app (honor) practice
             */
            logHonorPractice: ({ domain, duration, note = '', date = null }) => {
                const state = get();
                const targetDate = date ? new Date(date) : new Date();
                const dateKey = getDateKey(targetDate);

                const newLog = {
                    id: crypto?.randomUUID?.() || String(Date.now()),
                    date: targetDate.toISOString(),
                    dateKey,
                    domain,
                    duration,
                    note,
                    isHonor: true
                };

                // Honor logs also count toward streak
                const streakUpdate = calculateStreakUpdate(state, dateKey);

                set({
                    honorLogs: [...state.honorLogs, newLog],
                    streak: streakUpdate,
                    lastPracticeType: domain
                });
            },

            /**
             * Start vacation mode
             */
            startVacation: () => {
                const state = get();
                const currentStreak = deriveCurrentStreak(state);

                set({
                    vacation: {
                        active: true,
                        startDate: getDateKey(),
                        frozenStreak: currentStreak
                    }
                });
            },

            /**
             * End vacation mode
             */
            endVacation: () => {
                const state = get();

                set({
                    vacation: {
                        active: false,
                        startDate: null,
                        frozenStreak: 0
                    },
                    // Reset lastPracticeDate to today so streak doesn't immediately decay
                    streak: {
                        ...state.streak,
                        lastPracticeDate: getDateKey()
                    }
                });
            },

            /**
             * Set display preference
             */
            setDisplayPreference: (mode, domain = null) => {
                set({
                    displayPreference: mode,
                    userSelectedDomain: mode === 'userSelected' ? domain : null
                });
            },

            /**
             * Delete a session
             * Legacy-only: edit/delete flows still operate on legacy session entries.
             */
            deleteSession: (sessionId) => {
                const state = get();
                const newSessions = state.sessions.filter(s => s.id !== sessionId);
                
                // Re-calculate lastPracticeDate if we deleted the latest one
                const sortedDates = [...new Set([...newSessions.map(s => s.dateKey), ...state.honorLogs.map(h => h.dateKey)])].sort();
                const lastPracticeDate = sortedDates[sortedDates.length - 1] || null;

                set({
                    sessions: newSessions,
                    streak: {
                        ...state.streak,
                        lastPracticeDate
                    }
                });
            },

            /**
             * Update session journal or metadata
             * Legacy-only: journal edits currently target legacy sessions.
             */
            updateSession: (sessionId, updates) => {
                set(state => ({
                    sessions: state.sessions.map(s =>
                        s.id === sessionId ? { ...s, ...updates } : s
                    )
                }));
            },

            /**
             * Set daily goal for a domain
             */
            setGoal: (domain, minutes) => {
                set(state => ({
                    goals: {
                        ...state.goals,
                        [domain]: minutes
                    }
                }));
            },

            /**
             * Export all data
             */
            exportAllData: () => {
                const state = get();
                return {
                    exportVersion: state.exportVersion,
                    exportDate: new Date().toISOString(),
                    sessions: state.sessions,
                    sessionsV2: state.sessionsV2,
                    honorLogs: state.honorLogs,
                    streak: state.streak,
                    vacation: state.vacation,
                    displayPreference: state.displayPreference,
                    userSelectedDomain: state.userSelectedDomain
                };
            },

            // ========================================
            // DERIVED SELECTORS (computed on demand)
            // ========================================

            /**
             * Get streak info
             */
            getStreakInfo: () => {
                const state = get();
                const effectiveLastPracticeDate =
                    state?.streak?.lastPracticeDate || deriveLastPracticeDateFromEvents(state);

                if (state.vacation.active) {
                    return {
                        current: state.vacation.frozenStreak,
                        longest: state.streak.longest,
                        decayWarning: false,
                        broken: false,
                        onVacation: true
                    };
                }

                const current = deriveCurrentStreak(state);
                const lastPracticeDate = effectiveLastPracticeDate;

                return {
                    current,
                    longest: state.streak.longest,
                    decayWarning: lastPracticeDate && isYesterday(lastPracticeDate),
                    broken: lastPracticeDate && daysBetween(lastPracticeDate, getDateKey()) >= 2,
                    onVacation: false
                };
            },

            /**
             * Get stats for a specific domain
             */
            getDomainStats: (domain) => {
                const state = get();
                const practiceSessions = getCanonicalSessions(state);
                const legacyDomainSessions = (Array.isArray(state.sessions) ? state.sessions : []).filter(s => s.domain === domain);
                const domainSessions = practiceSessions.filter(s => s.domain === domain);
                const domainHonor = state.honorLogs.filter(h => h.domain === domain);

                // Map domain to consistency history types
                const historyType = domain === 'breathwork' ? 'breath' : 
                                  domain === 'visualization' ? 'focus' : 'body';
                
                // Get circuit contributions from history
                const circuitHistory = (state.practiceHistory || []).filter(h => h.type === 'circuit');
                const circuitMinutes = circuitHistory.reduce((sum, h) => sum + (h.contributions?.[historyType] || 0), 0);

                const practiceSessionsCount = domainSessions.length;
                const practiceSessionMinutes = domainSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                const totalHonor = domainHonor.length;
                const honorMinutes = domainHonor.reduce((sum, h) => sum + (h.duration || 0), 0);
                const activityMinutes = practiceSessionMinutes + honorMinutes + circuitMinutes;
                const activityCount = practiceSessionsCount + totalHonor + circuitHistory.length;

                const lastSession = domainSessions[domainSessions.length - 1];
                const lastHonor = domainHonor[domainHonor.length - 1];
                const lastCircuit = circuitHistory
                    .filter(h => (h.contributions?.[historyType] || 0) > 0)
                    .pop();

                const lastPracticed = [lastSession?.date, lastHonor?.date, lastCircuit?.date]
                    .filter(Boolean)
                    .sort()
                    .pop() || null;

                // Domain-specific aggregations
                let domainSpecific = {};

                if (domain === 'breathwork') {
                    // Count pattern types (using subType which is the pattern name like 'Box', '4-7-8')
                    const patterns = {};
                    legacyDomainSessions.forEach(s => {
                        // Use subType (pattern name) not pattern (the object)
                        const p = s.metadata?.subType || 'custom';
                        patterns[p] = (patterns[p] || 0) + 1;
                    });

                    // Calculate avg accuracy
                    const accuracies = legacyDomainSessions
                        .map(s => s.metadata?.accuracy)
                        .filter(a => typeof a === 'number');
                    const avgAccuracy = accuracies.length > 0
                        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
                        : null;

                    domainSpecific = { patterns, avgAccuracy };
                }

                if (domain === 'visualization') {
                    // Count geometry types
                    const geometries = {};
                    domainSessions.forEach(s => {
                        const g = s.metadata?.subType || 'unknown';
                        geometries[g] = (geometries[g] || 0) + 1;
                    });
                    domainSpecific = { geometries };
                }

                // === NEW: Calculate last 7 days (Mon-Sun) ===
                const today = new Date();
                const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
                const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1); // Days back to Monday
                const monday = new Date(today);
                monday.setDate(today.getDate() + mondayOffset);
                monday.setHours(0, 0, 0, 0);

                const last7Days = [];
                const dailyMinutesMap = new Map(); // dateKey -> total minutes

                // Helper to get entries for last 7 days aggregation
                const circuitEntries = circuitHistory
                    .filter(h => (h.contributions?.[historyType] || 0) > 0)
                    .map(h => ({
                        date: h.date,
                        duration: h.contributions[historyType],
                        dateKey: getDateKey(new Date(h.date))
                    }));

                // Aggregate all practice minutes by day for this domain
                [...domainSessions, ...domainHonor, ...circuitEntries].forEach(item => {
                    const key = item.dateKey || getDateKey(new Date(item.date));
                    dailyMinutesMap.set(key, (dailyMinutesMap.get(key) || 0) + (item.duration || 0));
                });

                // Build last 7 days array (Mon-Sun)
                for (let i = 0; i < 7; i++) {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + i);
                    const key = getDateKey(d);
                    last7Days.push(dailyMinutesMap.get(key) || 0);
                }

                return {
                    totalSessions: practiceSessionsCount,
                    totalHonor,
                    totalMinutes: activityMinutes,
                    practiceSessionsCount,
                    practiceSessionMinutes,
                    activityCount,
                    activityMinutes,
                    lastPracticed,
                    last7Days,        // NEW: [Mon, Tue, Wed, Thu, Fri, Sat, Sun] minutes
                    ...domainSpecific
                };
            },

            /**
             * Get weekly pattern (Mon-Sun bools)
             */
            getWeeklyPattern: () => {
                const state = get();
                const weekStart = getWeekStart();
                const practiceSessions = getCanonicalSessions(state);

                // Collect all practice dates this week
                const allDates = new Set([
                    ...practiceSessions.map(s => s.dateKey),
                    ...state.honorLogs.map(h => h.dateKey)
                ]);

                // Build Mon-Sun array
                const pattern = [];
                const d = new Date(weekStart);
                for (let i = 0; i < 7; i++) {
                    pattern.push(allDates.has(getDateKey(d)));
                    d.setDate(d.getDate() + 1);
                }

                return pattern;
            },

            /**
             * Get honor system status
             */
            getHonorStatus: () => {
                const state = get();
                const practiceSessions = getCanonicalSessions(state);
                const totalPractices = practiceSessions.length + state.honorLogs.length;
                const honorCount = state.honorLogs.length;
                const ratio = totalPractices > 0 ? honorCount / totalPractices : 0;

                // Weekly count
                // Weekly count
                const weekStart = getDateKey(getWeekStart());
                const weeklyHonor = state.honorLogs.filter(h => h.dateKey >= weekStart).length;

                return {
                    totalCount: honorCount,
                    weeklyCount: weeklyHonor,
                    ratio,
                    // Dishonor badge: only show if enough data and ratio > 50%
                    hasDishonorBadge: totalPractices >= 10 && ratio > 0.5
                };
            },

            /**
             * Get primary domain based on display preference
             */
            getPrimaryDomain: () => {
                const state = get();

                if (state.displayPreference === 'userSelected' && state.userSelectedDomain) {
                    return state.userSelectedDomain;
                }

                // Default to last used
                return state.lastPracticeType || 'breathwork';
            },

            /**
             * Get sessions that have journal entries (memoized)
             */
            getSessionsWithJournal: () => {
                const state = get();
                const sessions = getCanonicalSessions(state);
                // We'll return the filtered array. Note: In Zustand, if we want actual memoization
                // against the sessions array specifically, we'd usually use a creation function 
                // or a selector outside the store, but adding it here as a helper is common.
                // However, the infinite loop in components usually happens because of:
                // const filtered = useStore(s => s.sessions.filter(...))
                // This creates a new array every time ANY part of the state changes.
                return sessions.filter(s => s.journal);
            },

            /**
             * Get all sessions (chronological)
             */
            getSessions: () => {
                const state = get();
                return getCanonicalSessions(state);
            },

            /**
             * Get totals from practice sessions only (spine)
             */
            getPracticeSessionTotals: () => {
                const state = get();
                const sessions = getCanonicalSessions(state);
                const minutesTotal = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                const sessionsCount = sessions.length;
                return {
                    sessionsCount,
                    minutesTotal
                };
            },

            /**
             * Get compact stats per domain
             */
            getAllStats: () => {
                const state = get();
                const sessions = getCanonicalSessions(state);
                const domainTotals = {};

                sessions.forEach(s => {
                    const key = s.domain || 'unknown';
                    if (!domainTotals[key]) {
                        domainTotals[key] = { count: 0, totalMinutes: 0 };
                    }
                    domainTotals[key].count += 1;
                    domainTotals[key].totalMinutes += s.duration || 0;
                });

                return domainTotals;
            },

            /**
             * Canonical selector: sessions/minutes by domain, optionally windowed.
             *
             * @param {{ range: '30D'|'90D'|'12M'|'ALL' }} params
             * @returns {Record<string, { count: number, totalMinutes: number }>}
             */
            getStatsByDomain: ({ range } = {}) => {
                const state = get();
                const sessions = getCanonicalSessions(state);

                if (!range || range === 'ALL') {
                    return state.getAllStats();
                }

                const end = new Date();
                end.setHours(23, 59, 59, 999);

                const days = range === '30D' ? 30 : range === '90D' ? 90 : 365;
                const start = new Date(end);
                start.setDate(start.getDate() - (days - 1));
                start.setHours(0, 0, 0, 0);

                const domainTotals = {};

                sessions.forEach((session) => {
                    const raw = resolveSessionTimestamp(session);
                    if (!raw) return;
                    const date = new Date(raw);
                    if (Number.isNaN(date.getTime())) return;
                    if (date < start || date > end) return;

                    const key = session?.domain || 'unknown';
                    if (!domainTotals[key]) {
                        domainTotals[key] = { count: 0, totalMinutes: 0 };
                    }
                    domainTotals[key].count += 1;
                    domainTotals[key].totalMinutes += session?.duration || 0;
                });

                return domainTotals;
            },

            /**
             * Get timing offsets for the past 7 days (Mon-Sun)
             * Uses average time-of-day as the baseline when no schedule exists
             */
            getWeeklyTimingOffsets: (domain = 'breathwork') => {
                const state = get();
                const practiceSessions = getCanonicalSessions(state);
                const now = new Date();
                const weekStart = getWeekStart(now);
                weekStart.setHours(0, 0, 0, 0);

                const weekSessions = practiceSessions
                    .filter(s => s.domain === domain)
                    .filter(s => {
                        const raw = resolveSessionTimestamp(s);
                        if (!raw) return false;
                        const sDate = new Date(raw);
                        if (Number.isNaN(sDate.getTime())) return false;
                        return sDate >= weekStart && sDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                    });

                if (weekSessions.length === 0) {
                    return Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(weekStart);
                        d.setDate(weekStart.getDate() + i);
                        return { dateKey: getDateKey(d), offsetMinutes: null, practiced: false };
                    });
                }

                const toMinutes = (dateStr) => {
                    const d = new Date(dateStr);
                    return d.getHours() * 60 + d.getMinutes();
                };

                const allMinutes = weekSessions.map(s => toMinutes(resolveSessionTimestamp(s)));
                const baseline = allMinutes.reduce((a, b) => a + b, 0) / allMinutes.length;

                const weekOffsets = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(weekStart);
                    d.setDate(weekStart.getDate() + i);
                    const dateKey = getDateKey(d);

                    const daySessions = weekSessions.filter(s => resolveSessionDateKey(s) === dateKey);
                    if (daySessions.length === 0) {
                        weekOffsets.push({ dateKey, offsetMinutes: null, practiced: false });
                        continue;
                    }

                    const dayAvg = daySessions
                        .map(s => toMinutes(resolveSessionTimestamp(s)))
                        .reduce((a, b) => a + b, 0) / daySessions.length;

                    weekOffsets.push({
                        dateKey,
                        offsetMinutes: Math.round(baseline - dayAvg),
                        practiced: true
                    });
                }

                return weekOffsets;
            },

            /**
             * Get trajectory data for the past N weeks
             */
            getTrajectory: (weekCount = 8) => {
                const state = get();
                const practiceSessions = getCanonicalSessions(state);
                const weeks = [];

                for (let offset = weekCount - 1; offset >= 0; offset--) {
                    const now = new Date();
                    now.setDate(now.getDate() - (offset * 7));

                    const startOfWeek = getWeekStart(now);
                    startOfWeek.setHours(0, 0, 0, 0);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 7);

                    const weekSessions = practiceSessions.filter(s => {
                        const raw = resolveSessionTimestamp(s);
                        if (!raw) return false;
                        const sDate = new Date(raw);
                        if (Number.isNaN(sDate.getTime())) return false;
                        return sDate >= startOfWeek && sDate < endOfWeek;
                    });

                    const dayKeys = new Set(weekSessions.map(s => s.dateKey));
                    const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

                    const breathPrecisionValues = weekSessions
                        .map(s => s.metadata?.accuracy)
                        .filter(a => typeof a === 'number');
                    const avgBreathPrecision = breathPrecisionValues.length > 0
                        ? breathPrecisionValues.reduce((sum, v) => sum + v, 0) / breathPrecisionValues.length
                        : null;

                    const completed = weekSessions.filter(s => s.exit_type === 'completed').length;
                    const completionRate = weekSessions.length > 0 ? completed / weekSessions.length : 0;

                    const practiceTypes = [...new Set(weekSessions.map(s => s.domain))];

                    weeks.push({
                        weekKey: getWeekKey(startOfWeek),
                        startDate: getDateKey(startOfWeek),
                        daysActive: dayKeys.size,
                        totalMinutes,
                        sessionCount: weekSessions.length,
                        avgPrecision: { breath: avgBreathPrecision },
                        karmaCount: 0,
                        dharmaCount: 0,
                        completionRate,
                        practiceTypes,
                    });
                }

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

                const avgDaysActive = weeks.reduce((sum, w) => sum + w.daysActive, 0) / (weeks.length || 1);
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

                const peakWeek = weeks.reduce((max, w) => w.daysActive > max.daysActive ? w : max, weeks[0]);
                const mostMinutes = weeks.reduce((max, w) => w.totalMinutes > max.totalMinutes ? w : max, weeks[0]);

                const firstWeekPrecision = weeks.find(w => w.avgPrecision.breath !== null)?.avgPrecision.breath;
                const lastWeekPrecision = [...weeks].reverse().find(w => w.avgPrecision.breath !== null)?.avgPrecision.breath;
                const precisionDelta = (firstWeekPrecision && lastWeekPrecision)
                    ? ((lastWeekPrecision - firstWeekPrecision) / firstWeekPrecision) * 100
                    : null;

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

            /**
             * Recompute all annual rollups and lifetime milestones
             * Called after session recording or on first load (migration)
             */
            updateLifetimeTracking: () => {
                const state = get();
                const sessions = getCanonicalSessions(state);
                
                // Recompute annual rollups
                const annualRollups = updateAnnualRollups(sessions);
                
                // Recompute lifetime milestones
                const lifetimeMilestones = updateLifetimeMilestones(annualRollups, sessions);
                
                set({ annualRollups, lifetimeMilestones });
            }
        };
        },
        {
            name: 'immanenceOS.progress',
            version: 1,
            migrate: (persistedState) => {
                // Handle migrations between versions
                // For version 1, just return the state as-is
                return persistedState;
            }
        }
    )
);

// ========================================
// HELPER FUNCTIONS (internal)
// ========================================

/**
 * Calculate streak update when a practice is logged
 */
function calculateStreakUpdate(state, dateKey) {
    const { lastPracticeDate, longest } = state.streak;

    // Already practiced today - no change
    if (lastPracticeDate === dateKey) {
        return state.streak;
    }

    // Calculate current streak before this practice
    const currentStreak = deriveCurrentStreak(state);

    // New streak value
    let newStreak;

    if (!lastPracticeDate) {
        // First ever practice
        newStreak = 1;
    } else if (isToday(lastPracticeDate)) {
        // Already practiced today
        newStreak = currentStreak;
    } else if (isYesterday(lastPracticeDate)) {
        // Consecutive day - increment
        newStreak = currentStreak + 1;
    } else {
        // Streak broken, start fresh
        newStreak = 1;
    }

    return {
        lastPracticeDate: dateKey,
        longest: Math.max(longest, newStreak)
    };
}

/**
 * Derive current streak from the last practice date
 * (We don't store current, we derive it)
 */
function deriveCurrentStreak(state) {
    const lastPracticeDate =
        state?.streak?.lastPracticeDate || deriveLastPracticeDateFromEvents(state);

    if (!lastPracticeDate) return 0;

    const todayKey = getDateKey();
    const yesterdayKey = addDaysToDateKey(todayKey, -1);

    // If practiced today, streak is at least 1
    if (lastPracticeDate === todayKey) {
        // Count consecutive days backwards from today
        return countConsecutiveDays(state);
    }

    // If practiced yesterday, streak still valid but at risk
    if (lastPracticeDate === yesterdayKey) {
        return countConsecutiveDays(state);
    }

    // Otherwise streak is broken
    return 0;
}

/**
 * Count consecutive practice days ending today or yesterday
 */
function countConsecutiveDays(state) {
    // Get all unique practice dates
    const practiceSessions = getCanonicalSessions(state);
    const allDates = new Set([
        ...practiceSessions.map(s => s.dateKey),
        ...state.honorLogs.map(h => h.dateKey)
    ]);

    if (allDates.size === 0) return 0;

    // Start from today (UTC key) and count backwards using date-key arithmetic
    let count = 0;
    const todayKey = getDateKey();
    let currentKey = todayKey;

    // If practiced today, start counting from today
    // If not, check if practiced yesterday to continue counting
    if (!allDates.has(currentKey)) {
        currentKey = addDaysToDateKey(todayKey, -1);
        if (!currentKey || !allDates.has(currentKey)) {
            return 0; // Neither today nor yesterday
        }
    }

    // Count consecutive days backwards
    while (currentKey && allDates.has(currentKey)) {
        count++;
        currentKey = addDaysToDateKey(currentKey, -1);
    }

    return count;
}

function getWeekKey(date = new Date()) {
    const mondayOfWeek = getWeekStart(date);
    const year = mondayOfWeek.getFullYear();

    const d = new Date(Date.UTC(mondayOfWeek.getFullYear(), mondayOfWeek.getMonth(), mondayOfWeek.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    return `${year}-W${weekNo.toString().padStart(2, '0')}`;
}

// ========================================
// MIGRATION: Import from legacy practiceStore
// ========================================

export function migrateFromLegacyStore() {
    const LEGACY_KEY = 'immanence_sessions_v1';

    try {
        const raw = localStorage.getItem(LEGACY_KEY);
        if (!raw) return { migrated: 0 };

        const legacySessions = JSON.parse(raw);
        if (!Array.isArray(legacySessions) || legacySessions.length === 0) {
            return { migrated: 0 };
        }

        const state = useProgressStore.getState();

        // Check if already migrated
        if (state.sessions.length > 0) {
            return { migrated: 0, skipped: true };
        }

        // Convert legacy sessions to new format
        const converted = legacySessions.map(s => ({
            id: s.id || crypto?.randomUUID?.() || String(Date.now()),
            date: s.date,
            dateKey: getDateKey(new Date(s.date)),
            domain: mapLegacyType(s.type),
            duration: s.durationMinutes || 0,
            metadata: {
                pattern: s.pattern,
                tapStats: s.tapStats,
                subType: s.subType,
                legacyImport: true
            }
        }));

        // Calculate streak from migrated sessions
        const sortedDates = [...new Set(converted.map(s => s.dateKey))].sort();
        const lastPracticeDate = sortedDates[sortedDates.length - 1] || null;

        useProgressStore.setState({
            sessions: converted,
            streak: {
                lastPracticeDate,
                longest: 0 // Will be calculated on first practice
            }
        });

        return { migrated: converted.length };
    } catch (e) {
        console.error('Migration failed:', e);
        return { migrated: 0, error: e.message };
    }
}

function mapLegacyType(type) {
    if (!type) return 'breathwork';
    const t = type.toLowerCase();
    if (t.includes('breath') || t.includes('stillness')) return 'breathwork';
    if (t.includes('visual') || t.includes('cymatics')) return 'visualization';
    if (t.includes('wisdom') || t.includes('reading')) return 'wisdom';
    return 'breathwork'; // Default
}
