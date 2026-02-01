// src/reporting/dashboardProjection.js
// Composed dashboard queries built from selectSessions + aggregators
// High-level reporting interface for UI-agnostic dashboard metrics

import { selectSessions } from './selectSessions.js';
import {
    aggMinutes,
    aggCounts,
    aggActiveDays,
    aggScheduleAdherence,
    aggQualitySignals,
    aggCompletionBreakdown,
} from './aggregators.js';
import { familyKeyOfSession, labelForFamilyKey } from './familyKeyMap.js';

/**
 * Get quick dashboard tiles for overview display
 * Returns 5 key metrics with stable IDs: total minutes, session count, active days, completion rate, on-time rate
 * @param {Object} options
 * @param {string} options.scope - 'lifetime' | 'runId' | 'today'
 * @param {string} options.range - '7d' | '14d' | '30d' | '90d' | '365d' | 'all'
 * @returns {Object} - { minutes_total, sessions_total, days_active, completion_rate (0-100), on_time_rate (0-100 or null) }
 */
export function getQuickDashboardTiles(options = {}) {
    const {
        scope = 'lifetime',
        range = '365d',
        activeRunId = null,
    } = options;

    const sessions = selectSessions({
        scope,
        range,
        includeHonor: true,
        activeRunId,
    });

    if (sessions.length === 0) {
        return {
            minutes_total: 0,
            sessions_total: 0,
            days_active: 0,
            completion_rate: 0,
            on_time_rate: null,
        };
    }

    // Tile 1: Total minutes
    const minutesObj = aggMinutes(sessions, { familyKeyOf: () => 'total' });
    const minutes_total = Math.round(minutesObj.total || 0);

    // Tile 2: Total sessions
    const counts = aggCounts(sessions, { familyKeyOf: () => 'total' });
    const sessions_total = counts.total || 0;

    // Tile 3: Active days
    const days_active = aggActiveDays(sessions);

    // Tile 4: Completion rate (0-100)
    const completion = aggCompletionBreakdown(sessions);
    const completedCount = completion.completed || 0;
    const abandonedCount = completion.abandoned || 0;
    const partialCount = completion.partial || 0;

    const totalCompletion = completedCount + abandonedCount + partialCount;

    const completion_rate = totalCompletion > 0
        ? Math.round((completedCount / totalCompletion) * 100)
        : 0;

    // Tile 5: On-time rate (0-100 or null)
    const adherence = aggScheduleAdherence(sessions);
    const onTimeCount = adherence.greenCount;
    const totalOnTime = adherence.greenCount + adherence.redCount;
    const on_time_rate = totalOnTime > 0
        ? Math.round((onTimeCount / totalOnTime) * 100)
        : null;

    return {
        minutes_total,
        sessions_total,
        days_active,
        completion_rate,
        on_time_rate,
    };
}

/**
 * Get curriculum practice breakdown by family key
 * Returns aggregated metrics for each practice family
 * @param {Object} options
 * @param {string} options.scope - 'lifetime' | 'runId' | 'today'
 * @param {string} options.range - '7d' | '14d' | '30d' | '90d' | '365d' | 'all'
 * @param {string} options.activeRunId - Optional override for runId scope
 * @returns {Array} - Array of { familyKey, label, minutes, count, percent }
 */
export function getCurriculumPracticeBreakdown(options = {}) {
    const {
        scope = 'lifetime',
        range = '365d',
        activeRunId = null,
    } = options;

    const sessions = selectSessions({
        scope,
        range,
        includeHonor: true,
        activeRunId,
    });

    if (sessions.length === 0) {
        return [];
    }

    // Aggregate by family key
    const minutesByFamily = aggMinutes(sessions, { familyKeyOf: familyKeyOfSession });
    const countsByFamily = aggCounts(sessions, { familyKeyOf: familyKeyOfSession });

    const totalMinutes = Object.values(minutesByFamily).reduce((sum, m) => sum + m, 0);

    // Build breakdown array
    const breakdown = Object.entries(minutesByFamily).map(([familyKey, minutes]) => ({
        familyKey,
        label: labelForFamilyKey(familyKey),
        minutes: Math.round(minutes),
        count: countsByFamily[familyKey] || 0,
        percent: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
    }));

    // Sort by minutes descending
    breakdown.sort((a, b) => b.minutes - a.minutes);

    return breakdown;
}

/**
 * Get detailed metrics for a specific practice
 * Returns comprehensive stats for a single practice family
 * @param {Object} options
 * @param {string} options.scope - 'lifetime' | 'runId' | 'today'
 * @param {string} options.range - '7d' | '14d' | '30d' | '90d' | '365d' | 'all'
 * @param {string} options.practiceFamily - Family key (e.g. 'breathwork', 'stillness')
 * @param {string} options.activeRunId - Optional override for runId scope
 * @returns {Object} - { familyKey, label, totalMinutes, sessionCount, activeDays,
 *                        completionRate, avgDurationMin, adherencePercent }
 */
export function getPracticeDetailMetrics(options = {}) {
    const {
        scope = 'lifetime',
        range = '365d',
        practiceFamily = null,
        activeRunId = null,
    } = options;

    if (!practiceFamily) {
        return null;
    }

    const sessions = selectSessions({
        scope,
        range,
        includeHonor: true,
        activeRunId,
    });

    // Filter to specific family
    const familySessions = sessions.filter(s => familyKeyOfSession(s) === practiceFamily);

    if (familySessions.length === 0) {
        return {
            familyKey: practiceFamily,
            label: labelForFamilyKey(practiceFamily),
            totalMinutes: 0,
            sessionCount: 0,
            activeDays: 0,
            completionRate: 0,
            avgDurationMin: 0,
            adherencePercent: 0,
        };
    }

    // Aggregate
    const minutesObj = aggMinutes(familySessions, { familyKeyOf: () => 'total' });
    const totalMinutes = Math.round(minutesObj.total || 0);

    const countsObj = aggCounts(familySessions, { familyKeyOf: () => 'total' });
    const sessionCount = countsObj.total || 0;

    const activeDays = aggActiveDays(familySessions);

    const quality = aggQualitySignals(familySessions);
    const { completionRate, avgDurationMin } = quality;

    const adherence = aggScheduleAdherence(familySessions);
    const adherencePercent = adherence.adherencePercent;

    return {
        familyKey: practiceFamily,
        label: labelForFamilyKey(practiceFamily),
        totalMinutes,
        sessionCount,
        activeDays,
        completionRate,
        avgDurationMin,
        adherencePercent,
    };
}

/**
 * Get weekly practice calendar heatmap
 * Returns matrix of activity per day of week
 * @param {Object} options
 * @param {string} options.scope - 'lifetime' | 'runId' | 'today'
 * @param {string} options.range - '7d' | '14d' | '30d' | '90d' | '365d' | 'all'
 * @param {string} options.activeRunId - Optional override for runId scope
 * @returns {Array} - Array of 7 objects { dayOfWeek, label, count, totalMinutes }
 */
export function getWeeklyActivityHeatmap(options = {}) {
    const {
        scope = 'lifetime',
        range = '365d',
        activeRunId = null,
    } = options;

    const sessions = selectSessions({
        scope,
        range,
        includeHonor: true,
        activeRunId,
    });

    if (sessions.length === 0) {
        return [
            { dayOfWeek: 0, label: 'Sun', count: 0, totalMinutes: 0 },
            { dayOfWeek: 1, label: 'Mon', count: 0, totalMinutes: 0 },
            { dayOfWeek: 2, label: 'Tue', count: 0, totalMinutes: 0 },
            { dayOfWeek: 3, label: 'Wed', count: 0, totalMinutes: 0 },
            { dayOfWeek: 4, label: 'Thu', count: 0, totalMinutes: 0 },
            { dayOfWeek: 5, label: 'Fri', count: 0, totalMinutes: 0 },
            { dayOfWeek: 6, label: 'Sat', count: 0, totalMinutes: 0 },
        ];
    }

    // Group by day of week
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats = [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => ({
        dayOfWeek,
        label: dayLabels[dayOfWeek],
        count: 0,
        totalMinutes: 0,
    }));

    sessions.forEach(session => {
        if (!session.startedAt) return;
        const date = new Date(session.startedAt);
        const dayOfWeek = date.getDay();
        const dayData = dayStats[dayOfWeek];

        dayData.count += 1;
        dayData.totalMinutes += (session.durationSec || 0) / 60;
    });

    // Round minutes
    dayStats.forEach(day => {
        day.totalMinutes = Math.round(day.totalMinutes);
    });

    return dayStats;
}

/**
 * Get completion rate breakdown by completion status
 * @param {Object} options
 * @param {string} options.scope - 'lifetime' | 'runId' | 'today'
 * @param {string} options.range - '7d' | '14d' | '30d' | '90d' | '365d' | 'all'
 * @param {string} options.activeRunId - Optional override for runId scope
 * @returns {Object} - { completed, abandoned, partial, completionRate }
 */
export function getCompletionRateBreakdown(options = {}) {
    const {
        scope = 'lifetime',
        range = '365d',
        activeRunId = null,
    } = options;

    const sessions = selectSessions({
        scope,
        range,
        includeHonor: true,
        activeRunId,
    });

    if (sessions.length === 0) {
        return { completed: 0, abandoned: 0, partial: 0, completionRate: 0 };
    }

    const breakdown = aggCompletionBreakdown(sessions);
    const quality = aggQualitySignals(sessions);

    return {
        completed: breakdown.completed,
        abandoned: breakdown.abandoned,
        partial: breakdown.partial,
        completionRate: quality.completionRate,
    };
}

/**
 * Get dashboard detail payload for modal display
 * Composes existing aggregators to provide breakdown charts and adherence data
 * @param {Object} options
 * @param {string} options.scope - 'lifetime' | 'runId' | 'today'
 * @param {string} options.range - '7d' | '14d' | '30d' | '90d' | '365d' | 'all'
 * @param {string} options.activeRunId - Optional override for runId scope
 * @returns {Object} - { completionBreakdown, scheduleAdherence, weeklyActivity }
 */
export function getDashboardDetail(options = {}) {
    const {
        scope = 'lifetime',
        range = '365d',
        activeRunId = null,
    } = options;

    const sessions = selectSessions({
        scope,
        range,
        includeHonor: true,
        activeRunId,
    });

    if (sessions.length === 0) {
        return {
            completionBreakdown: { completed: 0, abandoned: 0, partial: 0, completionRate: 0 },
            scheduleAdherence: { greenCount: 0, redCount: 0, totalMatched: 0, adherencePercent: 0 },
            weeklyActivity: [
                { dayOfWeek: 0, label: 'Sun', count: 0, totalMinutes: 0 },
                { dayOfWeek: 1, label: 'Mon', count: 0, totalMinutes: 0 },
                { dayOfWeek: 2, label: 'Tue', count: 0, totalMinutes: 0 },
                { dayOfWeek: 3, label: 'Wed', count: 0, totalMinutes: 0 },
                { dayOfWeek: 4, label: 'Thu', count: 0, totalMinutes: 0 },
                { dayOfWeek: 5, label: 'Fri', count: 0, totalMinutes: 0 },
                { dayOfWeek: 6, label: 'Sat', count: 0, totalMinutes: 0 },
            ],
        };
    }

    // Composition: use existing aggregators
    const completionBreakdown = aggCompletionBreakdown(sessions);
    const quality = aggQualitySignals(sessions);
    const scheduleAdherence = aggScheduleAdherence(sessions);
    const weeklyActivity = getWeeklyActivityHeatmap(options);

    return {
        completionBreakdown: {
            completed: completionBreakdown.completed,
            abandoned: completionBreakdown.abandoned,
            partial: completionBreakdown.partial,
            completionRate: quality.completionRate,
        },
        scheduleAdherence: {
            greenCount: scheduleAdherence.greenCount,
            redCount: scheduleAdherence.redCount,
            totalMatched: scheduleAdherence.totalMatched,
            adherencePercent: scheduleAdherence.adherencePercent,
        },
        weeklyActivity,
    };
}
