// src/reporting/aggregators.js
// Pure reducer functions for session aggregation
// All functions operate on immutable session arrays with no side effects
// @ts-check

/** @typedef {'completed' | 'abandoned' | 'partial' | 'early_exit' | 'earlyExit'} CompletionToken */

/**
 * @typedef {object} SessionLike
 * @property {string | null | undefined} practiceId
 * @property {number | null | undefined} durationSec
 * @property {string | null | undefined} startedAt
 * @property {CompletionToken | null | undefined} completion
 * @property {{ status?: string | null } | null | undefined} scheduleMatched
 */

/** @typedef {(session: SessionLike) => string | null | undefined} GroupKeySelector */
/** @typedef {{ familyKeyOf?: GroupKeySelector }} AggregatorOptions */
/** @typedef {{ greenCount: number, redCount: number, totalMatched: number, adherencePercent: number }} ScheduleAdherence */
/** @typedef {{ completionRate: number, completedCount: number, totalCount: number, avgDurationMin: number, matchedSessionsPercent: number }} QualitySignals */
/** @typedef {{ completed: number, abandoned: number, partial: number }} CompletionBreakdown */

/**
 * Aggregate session duration (minutes) grouped by family key or practice ID
 * @param {SessionLike[]} sessions - Session objects with durationSec, practiceId
 * @param {AggregatorOptions} options
 * @param {GroupKeySelector} options.familyKeyOf - Function to map session to family key
 * @param {Function} options.practiceIdOf - Function to map session to practiceId
 * @returns {Record<string, number>} - { [groupKey]: totalMinutes }
 */
export function aggMinutes(sessions, options = {}) {
    const { familyKeyOf = s => s.practiceId } = options;

    return sessions.reduce((acc, session) => {
        const key = familyKeyOf ? familyKeyOf(session) : null;
        if (!key) return acc;

        const minutes = (session.durationSec || 0) / 60;
        acc[key] = (acc[key] || 0) + minutes;
        return acc;
    }, /** @type {Record<string, number>} */ ({}));
}

/**
 * Aggregate session counts grouped by family key or practice ID
 * @param {SessionLike[]} sessions - Session objects
 * @param {AggregatorOptions} options
 * @param {GroupKeySelector} options.familyKeyOf - Function to map session to family key
 * @param {Function} options.practiceIdOf - Function to map session to practiceId
 * @returns {Record<string, number>} - { [groupKey]: count }
 */
export function aggCounts(sessions, options = {}) {
    const { familyKeyOf = s => s.practiceId } = options;

    return sessions.reduce((acc, session) => {
        const key = familyKeyOf ? familyKeyOf(session) : null;
        if (!key) return acc;

        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, /** @type {Record<string, number>} */ ({}));
}

/**
 * Count unique calendar days with at least one session
 * @param {SessionLike[]} sessions - Session objects with startedAt
 * @param {{ dateKeyOf?: (session: SessionLike) => string | null }} options
 * @param {(session: SessionLike) => string | null} options.dateKeyOf - Function to extract date key from session
 * @returns {number} - Count of unique days
 */
export function aggActiveDays(sessions, options = {}) {
    const { dateKeyOf = s => {
        if (!s.startedAt) return null;
        const date = new Date(s.startedAt);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }} = options;

    const uniqueDays = new Set();
    sessions.forEach(session => {
        const dateKey = dateKeyOf(session);
        if (dateKey) uniqueDays.add(dateKey);
    });

    return uniqueDays.size;
}

/**
 * Aggregate curriculum schedule adherence from scheduleMatched snapshots
 * Returns green/red counts and overall adherence percentage
 * @param {SessionLike[]} sessions - Session objects with scheduleMatched snapshot
 * @returns {ScheduleAdherence} - { greenCount, redCount, totalMatched, adherencePercent }
 */
export function aggScheduleAdherence(sessions) {
    let greenCount = 0;
    let redCount = 0;
    let totalMatched = 0;

    sessions.forEach(session => {
        if (!session.scheduleMatched) return;

        totalMatched++;
        const status = session.scheduleMatched.status;
        if (status === 'green') {
            greenCount++;
        } else if (status === 'red') {
            redCount++;
        }
    });

    const adherencePercent = totalMatched > 0
        ? Math.round((greenCount / totalMatched) * 100)
        : 0;

    return {
        greenCount,
        redCount,
        totalMatched,
        adherencePercent,
    };
}

/**
 * Aggregate quality signals from sessions
 * Returns completion rate, average duration, and precision metrics
 * @param {SessionLike[]} sessions - Session objects with completion, durationSec, scheduleMatched
 * @returns {QualitySignals} - { completionRate, completedCount, totalCount, avgDurationMin, matchedSessionsPercent }
 */
export function aggQualitySignals(sessions) {
    if (sessions.length === 0) {
        return {
            completionRate: 0,
            completedCount: 0,
            totalCount: 0,
            avgDurationMin: 0,
            matchedSessionsPercent: 0,
        };
    }

    const completedCount = sessions.filter(s => s.completion === 'completed').length;
    const completionRate = Math.round((completedCount / sessions.length) * 100);

    const totalDurationSec = sessions.reduce((sum, s) => sum + (s.durationSec || 0), 0);
    const avgDurationMin = Math.round((totalDurationSec / sessions.length) / 60 * 10) / 10;

    const matchedSessions = sessions.filter(s => s.scheduleMatched?.status === 'green').length;
    const matchedSessionsPercent = Math.round((matchedSessions / sessions.length) * 100);

    return {
        completionRate,
        completedCount,
        totalCount: sessions.length,
        avgDurationMin,
        matchedSessionsPercent,
    };
}

/**
 * Aggregate session count by completion status
 * Normalizes legacy completion tokens (early_exit, earlyExit) to canonical 'partial'.
 * @param {SessionLike[]} sessions - Session objects with completion
 * @returns {CompletionBreakdown} - { completed, abandoned, partial } (canonical keys only)
 */
export function aggCompletionBreakdown(sessions) {
     return sessions.reduce((acc, session) => {
        let status = session.completion || 'partial';

        // Normalize legacy tokens to canonical 'partial'
        if (status === 'early_exit' || status === 'earlyExit') {
            status = 'partial';
        }

        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, /** @type {CompletionBreakdown} */ ({ completed: 0, abandoned: 0, partial: 0 }));
}
