import { ARCHIVE_TABS } from './tracking/archiveLinkConstants.js';
import { getDateKey, getLocalDateKey } from '../utils/dateUtils.js';
import { computeContractObligationSummary, createPathRunSessionFilter } from '../services/infographics/contractObligations.js';

const TAB_TYPE_MAP = {
    all: ['practice', 'circuit', 'wisdom-reading', 'wisdom-quiz', 'application-log'],
    practice: ['practice'],
    circuits: ['circuit'],
    wisdom: ['wisdom-reading', 'wisdom-quiz'],
    application: ['application-log']
};

export const SESSION_HISTORY_TABS = [
    { key: ARCHIVE_TABS.ALL, label: 'All' },
    { key: ARCHIVE_TABS.PRACTICE, label: 'Practice' },
    { key: ARCHIVE_TABS.CIRCUITS, label: 'Circuits' },
    { key: ARCHIVE_TABS.WISDOM, label: 'Wisdom' },
    { key: ARCHIVE_TABS.NAVIGATION, label: 'Navigation' },
    { key: ARCHIVE_TABS.APPLICATION, label: 'Application' },
    { key: ARCHIVE_TABS.REPORTS, label: 'Reports' },
    { key: ARCHIVE_TABS.INSIGHTS, label: 'Insights' }
];

export const SESSION_HISTORY_EMPTY_STATE_COPY = {
    all: {
        title: 'No tracking records found',
        hint: 'Complete a session, circuit, or awareness log to see it here.'
    },
    practice: {
        title: 'No practice records found',
        hint: 'Complete a session to see it in your archive.'
    },
    circuits: {
        title: 'No circuit records found',
        hint: 'Complete a circuit to see it in your archive.'
    },
    wisdom: {
        title: 'No wisdom records found',
        hint: 'Read a section or take a quiz to see it in your archive.'
    },
    navigation: {
        title: 'No navigation records found',
        hint: 'Begin a path to start tracking navigation history.'
    },
    application: {
        title: 'No application records found',
        hint: 'Log an awareness moment to see it in your archive.'
    }
};

export function getOutsideScheduleSessionIds({
    navigationActivePath,
    sessionsV2,
    vacation,
    curriculumStoreState
}) {
    if (!navigationActivePath?.startedAt) return new Set();

    const selectedDays = navigationActivePath?.schedule?.selectedDaysOfWeek || [];
    const selectedTimes = navigationActivePath?.schedule?.selectedTimes || [];
    if (!Array.isArray(selectedDays) || selectedDays.length === 0) return new Set();
    if (!Array.isArray(selectedTimes) || selectedTimes.length === 0) return new Set();

    const runSessions = Array.isArray(sessionsV2) ? sessionsV2 : [];
    if (runSessions.length === 0) return new Set();

    const windowStartLocalDateKey = getLocalDateKey(new Date(navigationActivePath.startedAt));
    const windowEndLocalDateKey = getLocalDateKey();
    if (windowStartLocalDateKey > windowEndLocalDateKey) return new Set();

    const isSessionInActiveRun = createPathRunSessionFilter({
        runId: navigationActivePath.runId || null,
        activePathId: navigationActivePath.activePathId || null,
        startedAt: navigationActivePath.startedAt || null,
    });

    const summary = computeContractObligationSummary({
        windowStartLocalDateKey,
        windowEndLocalDateKey,
        selectedDaysOfWeek: selectedDays,
        selectedTimes,
        curriculumStoreState,
        progressStoreState: { vacation, sessionsV2: runSessions },
        sessions: runSessions,
        isSessionEligible: isSessionInActiveRun,
    });

    const matchedSessionIds = new Set(
        summary.railDays
            .flatMap((day) => day?.satisfiedSlots || [])
            .map((slot) => slot?.matchedSessionId)
            .filter(Boolean)
    );

    const outside = new Set();
    runSessions.forEach((session) => {
        if (!isSessionInActiveRun(session)) return;
        if (session?.completion !== 'completed') return;
        if (!session?.id) return;
        if (!matchedSessionIds.has(session.id)) {
            outside.add(session.id);
        }
    });

    return outside;
}

export function buildCombinedEntries({
    allSessions,
    circuitEntries,
    readingSessions,
    quizAttempts,
    applicationLogs
}) {
    const entries = [];

    allSessions.forEach((session, index) => {
        const timestamp = session?.date
            || session?.timestamp
            || session?.startedAt
            || session?.endedAt
            || (session?.dateKey ? `${session.dateKey}T00:00:00` : null);
        if (!timestamp) return;

        const dateKey = session?.dateKey || getDateKey(new Date(timestamp));
        entries.push({
            id: `practice-${session?.id ?? index}`,
            type: 'practice',
            dateKey,
            timestamp,
            data: session
        });
    });

    circuitEntries.forEach((entry, index) => {
        const timestamp = entry?.timestamp || (entry?.dateKey ? `${entry.dateKey}T00:00:00` : null);
        if (!timestamp) return;

        const dateKey = entry?.dateKey || getDateKey(new Date(timestamp));
        entries.push({
            id: `circuit-${entry?.id ?? index}`,
            type: 'circuit',
            dateKey,
            timestamp,
            data: entry
        });
    });

    readingSessions.forEach((entry, index) => {
        if (!entry?.date) return;

        entries.push({
            id: `reading-${entry?.id ?? index}`,
            type: 'wisdom-reading',
            dateKey: getDateKey(new Date(entry.date)),
            timestamp: entry.date,
            data: entry
        });
    });

    quizAttempts.forEach((entry, index) => {
        if (!entry?.date) return;

        entries.push({
            id: `quiz-${entry?.id ?? index}`,
            type: 'wisdom-quiz',
            dateKey: getDateKey(new Date(entry.date)),
            timestamp: entry.date,
            data: entry
        });
    });

    applicationLogs.forEach((entry) => {
        if (!entry?.timestamp) return;

        entries.push({
            id: `application-${entry.id}`,
            type: 'application-log',
            dateKey: getDateKey(new Date(entry.timestamp)),
            timestamp: entry.timestamp,
            data: entry
        });
    });

    return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function filterEntries({ entries, activeTab, filterDate }) {
    const allowedTypes = TAB_TYPE_MAP[activeTab];
    if (activeTab !== ARCHIVE_TABS.ALL && !allowedTypes) return [];

    let filteredEntries = entries;
    if (allowedTypes) {
        filteredEntries = filteredEntries.filter((entry) => allowedTypes.includes(entry.type));
    }

    if (filterDate) {
        filteredEntries = filteredEntries.filter((entry) => entry.dateKey === filterDate);
    }

    return filteredEntries;
}

export function formatHistoryDate(dateKey) {
    if (!dateKey) return 'Unknown';
    const date = new Date(`${dateKey}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatHistoryTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatHistoryMinutes(minutes) {
    return `${Math.round(minutes || 0)}m`;
}

export function buildPracticeSummary({ allSessions, allStats }) {
    const totalSessions = allSessions.length;
    const totalMinutes = allSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const accuracyValues = allSessions
        .filter((session) => session.domain === 'breathwork')
        .map((session) => session.metadata?.accuracy)
        .filter((accuracy) => typeof accuracy === 'number');
    const avgAccuracy = accuracyValues.length > 0
        ? accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length
        : null;
    const domainRows = Object.entries(allStats)
        .map(([domain, stats]) => ({
            domain,
            count: stats.count || 0,
            totalMinutes: stats.totalMinutes || 0
        }))
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

    return {
        totalSessions,
        totalMinutes,
        avgAccuracy,
        domainRows
    };
}

export function buildCircuitSummary(circuitEntries) {
    const totalCircuits = circuitEntries.length;
    const totalMinutes = circuitEntries.reduce((sum, entry) => sum + (entry.totalDuration || 0), 0);
    const avgMinutes = totalCircuits > 0 ? totalMinutes / totalCircuits : 0;

    return {
        totalCircuits,
        totalMinutes,
        avgMinutes
    };
}

export function buildWisdomSummary({
    readingStats,
    quizStats,
    watchStats,
    lastWatchedId,
    videoById
}) {
    const completionRate = watchStats.totalWatched > 0
        ? Math.round((watchStats.completed / watchStats.totalWatched) * 100)
        : 0;
    const lastWatchedAt = lastWatchedId ? videoById?.[lastWatchedId]?.lastWatchedAt : null;

    return {
        readingStats,
        quizStats,
        watchStats,
        completionRate,
        lastWatchedAt
    };
}

export function buildApplicationSummary({
    applicationLogs,
    appStats7,
    appStats30,
    appStats90,
    modeStats,
    modeSessions,
    completedChains,
    patternStats
}) {
    return {
        totalLogs: applicationLogs.length,
        recent7: appStats7,
        recent30: appStats30,
        recent90: appStats90,
        modeStats,
        modeSessionsCount: modeSessions.length,
        chainCount: completedChains.length,
        patternStats
    };
}

export function buildNavigationSummary({
    navigationActivePath,
    navigationLastActivity,
    navigationUnlocked,
    navigationFoundation,
    navigationAssessment
}) {
    return {
        activePath: navigationActivePath,
        lastActivity: navigationLastActivity,
        unlockedCount: navigationUnlocked?.length || 0,
        hasFoundation: navigationFoundation,
        pathAssessment: navigationAssessment
    };
}

export function resolveScheduleSlots({ scheduleSlotsState, getScheduleSlots }) {
    if (scheduleSlotsState && scheduleSlotsState.length > 0) return scheduleSlotsState;
    return getScheduleSlots?.() || [];
}

export function buildTabCounts({
    combinedEntries,
    allSessions,
    circuitEntries,
    readingSessions,
    quizAttempts,
    navigationActivePath,
    applicationLogs
}) {
    return {
        all: combinedEntries.length,
        practice: allSessions.length,
        circuits: circuitEntries.length,
        wisdom: readingSessions.length + quizAttempts.length,
        navigation: Object.keys(navigationActivePath?.weekCompletionDates || {}).length || 0,
        application: applicationLogs.length,
        reports: '',
        insights: ''
    };
}

export function buildFooterText({
    activeTab,
    practiceSummary,
    circuitSummary,
    readingStats,
    quizStats,
    watchStats,
    applicationSummary,
    navigationSummary,
    circuitEntriesCount,
    allSessionsCount,
    tabCounts
}) {
    switch (activeTab) {
        case ARCHIVE_TABS.ALL:
            return `${practiceSummary.totalSessions} sessions | ${circuitSummary.totalCircuits} circuits | ${tabCounts.wisdom} wisdom | ${applicationSummary.totalLogs} logs`;
        case ARCHIVE_TABS.PRACTICE:
            return `${practiceSummary.totalSessions} sessions | ${formatHistoryMinutes(practiceSummary.totalMinutes)} total`;
        case ARCHIVE_TABS.CIRCUITS:
            return `${circuitSummary.totalCircuits} circuits | ${formatHistoryMinutes(circuitSummary.totalMinutes)} total`;
        case ARCHIVE_TABS.WISDOM:
            return `${readingStats.totalSessions} readings | ${quizStats.totalAttempts} quizzes | ${watchStats.completed} videos`;
        case ARCHIVE_TABS.NAVIGATION:
            return `${Object.keys(navigationSummary.activePath?.weekCompletionDates || {}).length} weeks completed | ${navigationSummary.unlockedCount} unlocked`;
        case ARCHIVE_TABS.APPLICATION:
            return `${applicationSummary.totalLogs} logs | ${applicationSummary.modeSessionsCount} mode sessions | ${applicationSummary.chainCount} chains`;
        case ARCHIVE_TABS.INSIGHTS:
        default:
            return `${circuitEntriesCount} circuits | ${allSessionsCount} sessions`;
    }
}
