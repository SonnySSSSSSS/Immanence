// src/reporting/pathReport.js

const STORAGE_KEY = 'immanenceOS.pathReports';

const safeParse = (raw, fallback) => {
    try {
        const parsed = JSON.parse(raw);
        return parsed || fallback;
    } catch {
        return fallback;
    }
};

export const buildPathReportKey = (runId) => {
    if (!runId) return null;
    return `run__${runId}`;
};

export const loadPathReports = () => {
    if (typeof window === 'undefined') return {};
    return safeParse(window.localStorage.getItem(STORAGE_KEY) || '{}', {});
};

export const savePathReport = (report) => {
    if (typeof window === 'undefined' || !report) return null;
    const key = buildPathReportKey(report.runId);
    if (!key) return null;

    const reports = loadPathReports();
    // Guard: do not overwrite existing reports (one report per run)
    if (reports[key]) {
        console.warn('[savePathReport] Report already exists for runId:', report.runId);
        return key;
    }
    reports[key] = report;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return key;
};

const getDayKey = (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

const getTimeBucket = (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    const hour = date.getHours();
    if (hour >= 5 && hour <= 11) return 'morning';
    if (hour >= 12 && hour <= 16) return 'afternoon';
    if (hour >= 17 && hour <= 20) return 'evening';
    return 'night';
};

const getMostCommon = (items) => {
    const counts = new Map();
    items.forEach((item) => {
        if (!item) return;
        counts.set(item, (counts.get(item) || 0) + 1);
    });

    let top = null;
    let topCount = 0;
    counts.forEach((count, item) => {
        if (count > topCount) {
            top = item;
            topCount = count;
        }
    });

    return top;
};

const computeDaysElapsed = (startedAt, endedAt) => {
    if (!startedAt || !endedAt) return null;
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return null;
    return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
};

export const generatePathReport = ({ activePath, sessions }) => {
    if (!activePath) return null;

    const runId = activePath.runId || null;
    const pathId = activePath.activePathId || null;
    const startedAt = activePath.startedAt || null;
    const endedAt = activePath.endsAt || new Date().toISOString();
    if (!runId || !pathId || !startedAt) return null;

    // Scope sessions by runId (authoritative link to this run)
    const scopedSessions = (sessions || []).filter((session) => {
        const sessionRunId = session?.pathContext?.runId || null;
        if (sessionRunId !== runId) return false;
        if (startedAt && session.startedAt && session.startedAt < startedAt) return false;
        if (endedAt && session.endedAt && session.endedAt > endedAt) return false;
        return true;
    });

    const sessionsCompleted = scopedSessions.length;
    const totalMinutes = scopedSessions.reduce((sum, s) => sum + ((s.durationSec || 0) / 60), 0);
    const avgMinutesPerSession = sessionsCompleted > 0 ? totalMinutes / sessionsCompleted : 0;

    const daysPracticedSet = new Set(scopedSessions.map((s) => getDayKey(s.startedAt)));
    daysPracticedSet.delete(null);
    const daysPracticed = daysPracticedSet.size;
    const daysElapsed = computeDaysElapsed(startedAt, endedAt);
    const consistencyPct = daysElapsed ? Math.round((daysPracticed / daysElapsed) * 100) : 0;

    const mostCommonPracticeId = getMostCommon(scopedSessions.map((s) => s.practiceId));
    const mostCommonMode = getMostCommon(scopedSessions.map((s) => s.practiceMode));
    const mostCommonTimeBucket = getMostCommon(scopedSessions.map((s) => getTimeBucket(s.startedAt)));

    const noteLines = [];
    if (mostCommonTimeBucket) {
        noteLines.push(`Most sessions landed in the ${mostCommonTimeBucket}.`);
    }
    if (mostCommonPracticeId) {
        noteLines.push(`Most sessions used ${mostCommonPracticeId}.`);
    }

    let completion = 'interrupted';
    if (activePath.status === 'completed') completion = 'completed';
    else if (activePath.status === 'abandoned') completion = 'interrupted';
    else if (activePath.endsAt && new Date(activePath.endsAt) <= new Date()) completion = 'mostly_completed';

    return {
        runId,
        pathId,
        startedAt,
        endedAt,
        completion,
        facts: {
            sessionsCompleted,
            daysElapsed: daysElapsed || 0,
            daysPracticed,
            consistencyPct,
            totalMinutes: Math.round(totalMinutes),
            avgMinutesPerSession: Math.round(avgMinutesPerSession),
        },
        patterns: {
            mostCommonPracticeId: mostCommonPracticeId || null,
            mostCommonMode: mostCommonMode || null,
            mostCommonTimeBucket: mostCommonTimeBucket || null,
            noteLines,
        },
        nextSteps: [],
    };
};
