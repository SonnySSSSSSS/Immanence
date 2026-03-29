// src/reporting/aggregators.ts
// Pure reducer functions for session aggregation
// All functions operate on immutable session arrays with no side effects

export type CompletionToken = 'completed' | 'abandoned' | 'partial' | 'early_exit' | 'earlyExit';

export interface SessionLike {
  practiceId?: string | null;
  durationSec?: number | null;
  startedAt?: string | null;
  completion?: CompletionToken | null;
  scheduleMatched?: { status?: string | null } | null;
}

export type GroupKeySelector = (session: SessionLike) => string | null | undefined;

export interface AggregatorOptions {
  familyKeyOf?: GroupKeySelector;
  dateKeyOf?: (session: SessionLike) => string | null;
}

export interface ScheduleAdherence {
  greenCount: number;
  redCount: number;
  totalMatched: number;
  adherencePercent: number;
}

export interface QualitySignals {
  completionRate: number;
  completedCount: number;
  totalCount: number;
  avgDurationMin: number;
  matchedSessionsPercent: number;
}

export interface CompletionBreakdown {
  completed: number;
  abandoned: number;
  partial: number;
}

/**
 * Aggregate session duration (minutes) grouped by family key or practice ID
 * @param sessions - Session objects with durationSec, practiceId
 * @param options - Configuration with familyKeyOf selector
 * @returns Record mapping group keys to total minutes
 */
export function aggMinutes(sessions: SessionLike[], options: AggregatorOptions = {}): Record<string, number> {
    const { familyKeyOf = (s: SessionLike) => s.practiceId } = options;

    return sessions.reduce((acc, session) => {
        const key = familyKeyOf ? familyKeyOf(session) : null;
        if (!key) return acc;

        const minutes = (session.durationSec || 0) / 60;
        acc[key] = (acc[key] || 0) + minutes;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Aggregate session counts grouped by family key or practice ID
 * @param sessions - Session objects
 * @param options - Configuration with familyKeyOf selector
 * @returns Record mapping group keys to counts
 */
export function aggCounts(sessions: SessionLike[], options: AggregatorOptions = {}): Record<string, number> {
    const { familyKeyOf = (s: SessionLike) => s.practiceId } = options;

    return sessions.reduce((acc, session) => {
        const key = familyKeyOf ? familyKeyOf(session) : null;
        if (!key) return acc;

        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Count unique calendar days with at least one session
 * @param sessions - Session objects with startedAt
 * @param options - Configuration with dateKeyOf selector
 * @returns Count of unique days
 */
export function aggActiveDays(sessions: SessionLike[], options: AggregatorOptions = {}): number {
    const { dateKeyOf = (s: SessionLike) => {
        if (!s.startedAt) return null;
        const date = new Date(s.startedAt);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }} = options;

    const uniqueDays = new Set<string>();
    sessions.forEach(session => {
        const dateKey = dateKeyOf(session);
        if (dateKey) uniqueDays.add(dateKey);
    });

    return uniqueDays.size;
}

/**
 * Aggregate curriculum schedule adherence from scheduleMatched snapshots
 * Returns green/red counts and overall adherence percentage
 * @param sessions - Session objects with scheduleMatched snapshot
 * @returns Adherence summary with counts and percentage
 */
export function aggScheduleAdherence(sessions: SessionLike[]): ScheduleAdherence {
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
 * @param sessions - Session objects with completion, durationSec, scheduleMatched
 * @returns Quality signals summary
 */
export function aggQualitySignals(sessions: SessionLike[]): QualitySignals {
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
 * @param sessions - Session objects with completion
 * @returns Breakdown by canonical status keys only
 */
export function aggCompletionBreakdown(sessions: SessionLike[]): CompletionBreakdown {
     return sessions.reduce((acc, session) => {
        let status: 'completed' | 'abandoned' | 'partial' = session.completion === 'completed' 
            ? 'completed'
            : session.completion === 'abandoned'
            ? 'abandoned'
            : 'partial';

        // Normalize legacy tokens to canonical 'partial'
        if (session.completion === 'early_exit' || session.completion === 'earlyExit') {
            status = 'partial';
        }

        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { completed: 0, abandoned: 0, partial: 0 } as CompletionBreakdown);
}
