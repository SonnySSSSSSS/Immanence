// src/state/progressStore.js
// Single source of truth for all practice tracking
// Other stores (mandalaStore, pathStore, lunarStore) should derive from this

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDateKey, getWeekStart } from '../utils/dateUtils';
import { usePathStore } from './pathStore';
import { useLunarStore } from './lunarStore';
import { triggerWeeklyAggregation } from './attentionStore';

// Helper: get days between two date keys
function daysBetween(dateKey1, dateKey2) {
    if (!dateKey1 || !dateKey2) return Infinity;
    const d1 = new Date(dateKey1);
    const d2 = new Date(dateKey2);
    const diffMs = Math.abs(d2 - d1);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Helper: check if date is today
function isToday(dateKey) {
    return dateKey === getDateKey();
}

// Helper: check if date is yesterday
function isYesterday(dateKey) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateKey === getDateKey(yesterday);
}

export const useProgressStore = create(
    persist(
        (set, get) => ({
            // === Raw Events (source of truth) ===
            sessions: [],
            // Each session: { id, date, domain, duration, metadata }
            // domain: 'breathwork' | 'visualization' | 'wisdom'
            // metadata varies by domain

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

            // === Export Version ===
            exportVersion: 1,

            // === Cycle & Consistency System ===
            // Benchmark tracking (self-reported metrics)
            benchmarks: {
                breath: {
                    holdDuration: [], // [{ date, value, cycleDay, cycleType }]
                    cycleConsistency: [],
                    lastMeasured: null,
                },
                focus: {
                    flameDuration: [],
                    distractionCount: [],
                    lastMeasured: null,
                },
                body: {
                    scanCompletionTime: [],
                    awarenessResolution: [],
                    lastMeasured: null,
                },
            },

            // Detailed practice history (for circuits & consistency)
            practiceHistory: [],
            /* Structure:
            [{
                date: timestamp,
                type: 'breath' | 'flame' | 'body' | 'circuit',
                duration: number, // minutes
                timeOfDay: 'HH:MM',
                exercises: [], // for circuits
                contributions: { // for multi-path tracking
                    breath: 5, // minutes
                    flame: 5,
                    body: 5
                }
            }]
            */

            // Consistency metrics
            consistencyMetrics: {
                averageTimeOfDay: null,
                timeConsistencyScore: 0,
                durationConsistency: 0,
                frequencyPattern: 'irregular', // 'daily' | 'flexible' | 'irregular'
            },

            // ========================================
            // ACTIONS
            // ========================================

            /**
             * Record a practice session
             * @param {Object} params
             * @param {string} params.domain - 'breathwork' | 'visualization' | 'wisdom'
             * @param {number} params.duration - minutes
             * @param {Object} [params.metadata] - domain-specific data
             * @param {Object} [params.instrumentation] - attention path instrumentation data
             */
            recordSession: ({ domain, duration, metadata = {}, instrumentation = null }) => {
                const state = get();
                const now = new Date();
                const dateKey = getDateKey(now);

                const newSession = {
                    id: crypto?.randomUUID?.() || String(Date.now()),
                    date: now.toISOString(),
                    dateKey,
                    domain,
                    duration,
                    metadata,
                    // === Attention Path Instrumentation ===
                    // These fields enable attention path calculation
                    start_time: instrumentation?.start_time ?? null,
                    end_time: instrumentation?.end_time ?? null,
                    duration_ms: instrumentation?.duration_ms ?? (duration * 60 * 1000),
                    exit_type: instrumentation?.exit_type ?? 'completed',
                    practice_family: instrumentation?.practice_family ?? null,
                    alive_signal_count: instrumentation?.alive_signal_count ?? 0,
                    pause_count: instrumentation?.pause_count ?? 0,
                    pause_total_ms: instrumentation?.pause_total_ms ?? 0,
                    switch_count: instrumentation?.switch_count ?? 0,
                    
                    // Layer 1: Post-Session Micro-Note (Journal)
                    journal: null,
                };

                // Update streak
                const streakUpdate = calculateStreakUpdate(state, dateKey);

                set({
                    sessions: [...state.sessions, newSession],
                    streak: streakUpdate,
                    lastPracticeType: domain
                });

                // Also record for path calculation
                try {
                    usePathStore.getState().recordPractice({
                        domain,
                        duration,
                        timestamp: now.getTime(),
                        metadata
                    });
                } catch (e) {
                    console.warn('pathStore not available:', e);
                }

                // Also record for lunar tracking (stage progression)
                try {
                    useLunarStore.getState().recordPracticeDay(dateKey);
                } catch (e) {
                    console.warn('lunarStore not available:', e);
                }

                // Trigger weekly attention aggregation
                triggerWeeklyAggregation();
                
                // Return the session so caller can use its ID
                return newSession;
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
                const { lastPracticeDate } = state.streak;

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
                const domainSessions = state.sessions.filter(s => s.domain === domain);
                const domainHonor = state.honorLogs.filter(h => h.domain === domain);

                // Map domain to consistency history types
                const historyType = domain === 'breathwork' ? 'breath' : 
                                  domain === 'visualization' ? 'focus' : 'body';
                
                // Get circuit contributions from history
                const circuitHistory = (state.practiceHistory || []).filter(h => h.type === 'circuit');
                const circuitMinutes = circuitHistory.reduce((sum, h) => sum + (h.contributions?.[historyType] || 0), 0);

                const totalSessions = domainSessions.length;
                const totalHonor = domainHonor.length;
                const totalMinutes = domainSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
                    + domainHonor.reduce((sum, h) => sum + (h.duration || 0), 0)
                    + circuitMinutes;

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
                    domainSessions.forEach(s => {
                        // Use subType (pattern name) not pattern (the object)
                        const p = s.metadata?.subType || 'custom';
                        patterns[p] = (patterns[p] || 0) + 1;
                    });

                    // Calculate avg accuracy
                    const accuracies = domainSessions
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
                    totalSessions,
                    totalHonor,
                    totalMinutes,
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

                // Collect all practice dates this week
                const allDates = new Set([
                    ...state.sessions.map(s => s.dateKey),
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
                const totalPractices = state.sessions.length + state.honorLogs.length;
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
                // We'll return the filtered array. Note: In Zustand, if we want actual memoization
                // against the sessions array specifically, we'd usually use a creation function 
                // or a selector outside the store, but adding it here as a helper is common.
                // However, the infinite loop in components usually happens because of:
                // const filtered = useStore(s => s.sessions.filter(...))
                // This creates a new array every time ANY part of the state changes.
                return state.sessions.filter(s => s.journal);
            }
        }),
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
    const { lastPracticeDate } = state.streak;

    if (!lastPracticeDate) return 0;

    const today = getDateKey();

    // If practiced today, streak is at least 1
    if (lastPracticeDate === today) {
        // Count consecutive days backwards from today
        return countConsecutiveDays(state);
    }

    // If practiced yesterday, streak still valid but at risk
    if (isYesterday(lastPracticeDate)) {
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
    const allDates = new Set([
        ...state.sessions.map(s => s.dateKey),
        ...state.honorLogs.map(h => h.dateKey)
    ]);

    if (allDates.size === 0) return 0;

    // Start from today and count backwards
    let count = 0;
    let current = new Date();

    // If practiced today, start counting from today
    // If not, check if practiced yesterday to continue counting
    if (!allDates.has(getDateKey(current))) {
        current.setDate(current.getDate() - 1);
        if (!allDates.has(getDateKey(current))) {
            return 0; // Neither today nor yesterday
        }
    }

    // Count consecutive days backwards
    while (allDates.has(getDateKey(current))) {
        count++;
        current.setDate(current.getDate() - 1);
    }

    return count;
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
