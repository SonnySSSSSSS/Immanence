// src/state/attentionStore.js
// ═══════════════════════════════════════════════════════════════════════════
// ATTENTION PATH SYSTEM — WEEKLY AGGREGATION & FEATURE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════
//
// This store computes weekly attention features from raw session data.
// Features are used to calculate path probabilities (Ekagrata, Sahaja, Vigilance).
//
// INVARIANTS:
// - weekly_attention_features table is SACRED — never rewrite history, only append
// - Features are computed per week, not per session
// - Only "valid" weeks count (session_count >= 2 AND total_minutes >= 5)
//
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProgressStore } from './progressStore';
import { PRACTICE_FAMILIES } from '../data/practiceFamily';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// Validity thresholds
const MIN_SESSIONS_FOR_VALID_WEEK = 2;
const MIN_MINUTES_FOR_VALID_WEEK = 5;

// EMA alphas for rolling windows
const EMA_ALPHA_SHORT = 0.6;   // 2 valid weeks (recent emphasis)
const EMA_ALPHA_MID = 0.3;     // 6 valid weeks
const EMA_ALPHA_LONG = 0.15;   // 12 valid weeks

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the Monday of the week containing a given date
 */
function getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get week key in format "YYYY-WXX" (ISO week)
 */
function getWeekKey(date = new Date()) {
    const mondayOfWeek = getWeekStart(date);
    const year = mondayOfWeek.getFullYear();

    // Calculate ISO week number
    const d = new Date(Date.UTC(mondayOfWeek.getFullYear(), mondayOfWeek.getMonth(), mondayOfWeek.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    return `${year}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Calculate median of an array
 */
function median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Apply exponential moving average to a series of values
 */
function calculateEMA(values, alpha) {
    if (values.length === 0) return null;
    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
        ema = alpha * values[i] + (1 - alpha) * ema;
    }
    return ema;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useAttentionStore = create(
    persist(
        (set, get) => ({
            // === Weekly Feature Table (append-only) ===
            weeklyFeatures: {},
            // Format: { [weekKey]: { ...features, computed_at: timestamp } }

            // === Computed Windows (derived on demand) ===
            windows: {
                short: null,  // EMA of last 2 valid weeks
                mid: null,    // EMA of last 6 valid weeks
                long: null,   // EMA of last 12 valid weeks
            },

            // === Last Computation Time ===
            lastComputedAt: null,

            // ════════════════════════════════════════════════════════════════
            // ACTIONS
            // ════════════════════════════════════════════════════════════════

            /**
             * Trigger aggregation for the current week
             * Call this after each session ends
             */
            aggregateCurrentWeek: () => {
                const weekKey = getWeekKey();
                get().aggregateWeek(weekKey);
            },

            /**
             * Aggregate features for a specific week
             */
            aggregateWeek: (weekKey) => {
                const progressState = useProgressStore.getState();
                const sessions = progressState.sessions || [];

                // Filter sessions for this week
                const weekStart = getWeekStartFromKey(weekKey);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);

                const weekSessions = sessions.filter(s => {
                    const sessionDate = new Date(s.date);
                    return sessionDate >= weekStart && sessionDate < weekEnd;
                });

                // Compute features
                const features = computeWeeklyFeatures(weekSessions);
                features.week_key = weekKey;
                features.computed_at = Date.now();

                // Append to weekly features (never overwrite historical weeks)
                set(state => ({
                    weeklyFeatures: {
                        ...state.weeklyFeatures,
                        [weekKey]: features,
                    },
                    lastComputedAt: Date.now(),
                }));

                // Recompute windows
                get().computeWindows();
            },

            /**
             * Compute EMA windows from valid weeks
             */
            computeWindows: () => {
                const { weeklyFeatures } = get();

                // Get all valid weeks, sorted by date (oldest first)
                const validWeeks = Object.entries(weeklyFeatures)
                    .filter(([, f]) => f.valid_week)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([, f]) => f);

                if (validWeeks.length === 0) {
                    set({ windows: { short: null, mid: null, long: null } });
                    return;
                }

                // Build feature arrays for EMA
                const featureKeys = [
                    'session_count', 'total_minutes', 'duration_p50', 'rhythm_score',
                    'completion_rate', 'interrupt_rate', 'early_exit_rate', 'alive_rate',
                    'short_session_rate', 'within_family_switch_rate',
                    'settle_share', 'scan_share', 'relate_share', 'inquire_share',
                    'settle_completion_rate', 'scan_completion_rate',
                ];

                const computeWindowEMA = (weeks, alpha) => {
                    if (weeks.length === 0) return null;
                    const result = {};
                    for (const key of featureKeys) {
                        const values = weeks.map(w => w[key] ?? 0);
                        result[key] = calculateEMA(values, alpha);
                    }
                    return result;
                };

                // Short window: last 2 valid weeks
                const shortWeeks = validWeeks.slice(-2);
                // Mid window: last 6 valid weeks
                const midWeeks = validWeeks.slice(-6);
                // Long window: last 12 valid weeks
                const longWeeks = validWeeks.slice(-12);

                set({
                    windows: {
                        short: computeWindowEMA(shortWeeks, EMA_ALPHA_SHORT),
                        mid: computeWindowEMA(midWeeks, EMA_ALPHA_MID),
                        long: computeWindowEMA(longWeeks, EMA_ALPHA_LONG),
                    },
                });
            },

            /**
             * Get current attention feature vector (for path scoring)
             * Uses mid window for stability
             */
            getFeatureVector: () => {
                const { windows } = get();
                return windows.mid || windows.short || null;
            },

            /**
             * Get valid week count in last N weeks
             */
            getValidWeekCount: (lastNWeeks = 12) => {
                const { weeklyFeatures } = get();
                let count = 0;
                const weeks = Object.entries(weeklyFeatures)
                    .sort((a, b) => b[0].localeCompare(a[0])) // Newest first
                    .slice(0, lastNWeeks);

                for (const [, features] of weeks) {
                    if (features.valid_week) count++;
                }
                return count;
            },

            /**
             * Get raw weekly features for DevPanel
             */
            getWeeklyFeaturesTable: () => {
                const { weeklyFeatures } = get();
                return Object.entries(weeklyFeatures)
                    .sort((a, b) => b[0].localeCompare(a[0])) // Newest first
                    .map(([weekKey, features]) => ({ weekKey, ...features }));
            },

            // Dev helpers
            _devReset: () => set({ weeklyFeatures: {}, windows: { short: null, mid: null, long: null }, lastComputedAt: null }),
            _devAggregateAll: () => {
                // Aggregate all weeks from session history
                const progressState = useProgressStore.getState();
                const sessions = progressState.sessions || [];

                const weekKeys = new Set();
                sessions.forEach(s => {
                    weekKeys.add(getWeekKey(new Date(s.date)));
                });

                weekKeys.forEach(weekKey => {
                    get().aggregateWeek(weekKey);
                });
            },
        }),
        {
            name: 'immanenceOS.attention',
            version: 1,
        }
    )
);

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE COMPUTATION (PURE FUNCTIONS)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse week key back to Date
 */
function getWeekStartFromKey(weekKey) {
    // Format: "YYYY-WXX"
    const [year, weekPart] = weekKey.split('-W');
    const weekNum = parseInt(weekPart, 10);

    // Find first Thursday of year, then back to Monday of that week
    const jan1 = new Date(parseInt(year, 10), 0, 1);
    const firstThursday = new Date(jan1);
    firstThursday.setDate(jan1.getDate() + ((4 - jan1.getDay() + 7) % 7));

    // Week 1 is the week containing the first Thursday
    const weekStart = new Date(firstThursday);
    weekStart.setDate(firstThursday.getDate() - 3 + (weekNum - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);

    return weekStart;
}

/**
 * Compute all weekly features from sessions
 */
function computeWeeklyFeatures(sessions) {
    const n = sessions.length;

    // === Volume & Rhythm ===
    const session_count = n;
    const total_minutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const durations = sessions.map(s => s.duration || 0);
    const duration_p50 = median(durations);

    // Rhythm score: how evenly distributed are sessions across the week?
    // 1.0 = perfectly distributed, 0.0 = all on one day
    const dayBuckets = [0, 0, 0, 0, 0, 0, 0];
    sessions.forEach(s => {
        const day = new Date(s.date).getDay();
        const mondayFirst = day === 0 ? 6 : day - 1;
        dayBuckets[mondayFirst]++;
    });
    const daysWithPractice = dayBuckets.filter(d => d > 0).length;
    const rhythm_score = n > 0 ? daysWithPractice / 7 : 0;

    // Validity check
    const valid_week = session_count >= MIN_SESSIONS_FOR_VALID_WEEK &&
        total_minutes >= MIN_MINUTES_FOR_VALID_WEEK;

    // === Engagement Quality ===
    const completed = sessions.filter(s => s.exit_type === 'completed').length;
    const completion_rate = n > 0 ? completed / n : 0;

    // Interrupt rate: sessions with pause_count > 0
    const interrupted = sessions.filter(s => (s.pause_count || 0) > 0).length;
    const interrupt_rate = n > 0 ? interrupted / n : 0;

    // Early exit rate: abandoned AND duration_ms < 60% of expected
    const early_exits = sessions.filter(s => {
        if (s.exit_type !== 'abandoned') return false;
        const expectedMs = (s.duration || 10) * 60 * 1000;
        return (s.duration_ms || expectedMs) < expectedMs * 0.6;
    }).length;
    const early_exit_rate = n > 0 ? early_exits / n : 0;

    // Alive rate: average alive signals per minute
    const totalAliveSignals = sessions.reduce((sum, s) => sum + (s.alive_signal_count || 0), 0);
    const alive_rate = total_minutes > 0 ? totalAliveSignals / total_minutes : 0;

    // Short session rate: sessions < 3 minutes
    const short_sessions = sessions.filter(s => (s.duration || 0) < 3).length;
    const short_session_rate = n > 0 ? short_sessions / n : 0;

    // === Switching ===
    // Within-family switch rate: switches / session count
    const totalSwitches = sessions.reduce((sum, s) => sum + (s.switch_count || 0), 0);
    const within_family_switch_rate = n > 0 ? totalSwitches / n : 0;

    // === Practice Family Metrics ===
    const familyCounts = {
        SETTLE: 0,
        SCAN: 0,
        RELATE: 0,
        INQUIRE: 0,
    };
    const familyCompleted = {
        SETTLE: 0,
        SCAN: 0,
        RELATE: 0,
        INQUIRE: 0,
    };
    const familyTotals = {
        SETTLE: 0,
        SCAN: 0,
        RELATE: 0,
        INQUIRE: 0,
    };

    sessions.forEach(s => {
        const family = s.practice_family || 'SETTLE';
        if (familyCounts[family] !== undefined) {
            familyCounts[family]++;
            familyTotals[family]++;
            if (s.exit_type === 'completed') {
                familyCompleted[family]++;
            }
        }
    });

    const settle_share = n > 0 ? familyCounts.SETTLE / n : 0;
    const scan_share = n > 0 ? familyCounts.SCAN / n : 0;
    const relate_share = n > 0 ? familyCounts.RELATE / n : 0;
    const inquire_share = n > 0 ? familyCounts.INQUIRE / n : 0;

    const settle_completion_rate = familyTotals.SETTLE > 0
        ? familyCompleted.SETTLE / familyTotals.SETTLE
        : 0;
    const scan_completion_rate = familyTotals.SCAN > 0
        ? familyCompleted.SCAN / familyTotals.SCAN
        : 0;

    return {
        // Volume & Rhythm
        session_count,
        total_minutes,
        duration_p50,
        rhythm_score,
        valid_week,

        // Engagement Quality
        completion_rate,
        interrupt_rate,
        early_exit_rate,
        alive_rate,
        short_session_rate,

        // Switching
        within_family_switch_rate,

        // Practice Family
        settle_share,
        scan_share,
        relate_share,
        inquire_share,
        settle_completion_rate,
        scan_completion_rate,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION HOOK: Call after session recording
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to trigger aggregation after session ends
 * Call this from progressStore.recordSession
 */
export function triggerWeeklyAggregation() {
    try {
        useAttentionStore.getState().aggregateCurrentWeek();
    } catch (e) {
        console.warn('Attention aggregation failed:', e);
    }
}
