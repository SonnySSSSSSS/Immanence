// src/components/SessionHistoryView.jsx
// Phase 2/3/4 Updated: Archive modal with Insights, Export, and Full CRUD
// Maintains React Portal to escape stacking context

import React, { useState, useMemo, useEffect } from 'react';
import { ARCHIVE_TABS, REPORT_DOMAINS } from './tracking/archiveLinkConstants.js';
import ReactDOM from 'react-dom';
import { useProgressStore } from '../state/progressStore.js';
import { useCircuitJournalStore } from '../state/circuitJournalStore.js';
import { useWisdomStore } from '../state/wisdomStore.js';
import { useVideoStore } from '../state/videoStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useApplicationStore } from '../state/applicationStore.js';
import { useModeTrainingStore } from '../state/modeTrainingStore.js';
import { useChainStore } from '../state/chainStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { CircuitEntryCard } from './CircuitEntryCard.jsx';
import { CircuitInsightsView } from './CircuitInsightsView.jsx';
import { SessionEntryEditModal } from './SessionEntryEditModal.jsx';
import { DeleteConfirmationModal } from './DeleteConfirmationModal.jsx';
import { ExportArchiveButton } from './ExportArchiveButton.jsx';
import { getDateKey } from '../utils/dateUtils';
import { ReportsPanel } from './tracking/reports/index.js';
import {
    PracticeDashboardHeader,
    NavigationDashboardHeader,
    ApplicationDashboardHeader
} from './tracking/infographics/index.js';

export function SessionHistoryView({ onClose, initialTab = ARCHIVE_TABS.ALL, initialReportDomain = REPORT_DOMAINS.PRACTICE }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    // Get the store methods as references (not calling them to avoid new array on every render)
    const getAllCircuitEntries = useCircuitJournalStore(s => s.getAllEntries);
    const getSessions = useProgressStore(s => s.getSessions);
    const getAllStats = useProgressStore(s => s.getAllStats);
    const getTrajectory = useProgressStore(s => s.getTrajectory);
    const { deleteSession } = useProgressStore();

    const readingSessions = useWisdomStore(s => s.readingSessions);
    const quizAttempts = useWisdomStore(s => s.quizAttempts);
    const getReadingStats = useWisdomStore(s => s.getReadingStats);
    const getQuizStats = useWisdomStore(s => s.getQuizStats);

    const videoById = useVideoStore(s => s.byId);
    const lastWatchedId = useVideoStore(s => s.lastWatchedId);
    const getWatchStats = useVideoStore(s => s.getWatchStats);

    const navigationActivePath = useNavigationStore(s => s.activePath);
    const navigationLastActivity = useNavigationStore(s => s.lastActivityDate);
    const navigationAssessment = useNavigationStore(s => s.pathAssessment);
    const navigationUnlocked = useNavigationStore(s => s.unlockedSections);
    const navigationFoundation = useNavigationStore(s => s.hasWatchedFoundation);
    const scheduleAdherenceLog = useNavigationStore(s => s.scheduleAdherenceLog);
    const scheduleSlotsState = useNavigationStore(s => s.scheduleSlots);
    const getScheduleAdherenceSummary = useNavigationStore(s => s.getScheduleAdherenceSummary);
    const getScheduleSlots = useNavigationStore(s => s.getScheduleSlots);

    const applicationLogs = useApplicationStore(s => s.awarenessLogs);
    const getApplicationStats = useApplicationStore(s => s.getStats);

    const modeStats = useModeTrainingStore(s => s.modeStats);
    const modeSessions = useModeTrainingStore(s => s.sessions);

    const completedChains = useChainStore(s => s.completedChains);
    const getPatternStats = useChainStore(s => s.getPatternStats);

    // Memoize the entries to prevent infinite re-renders
    const circuitEntries = useMemo(() => getAllCircuitEntries?.() || [], [getAllCircuitEntries]);
    const allSessions = useMemo(() => getSessions?.() || [], [getSessions]);
    const allStats = useMemo(() => getAllStats?.() || {}, [getAllStats, allSessions]);
    const readingStats = useMemo(() => getReadingStats?.() || ({
        totalSessions: 0,
        totalMinutes: 0,
        sectionsVisited: 0,
        bySection: {},
        lastRead: null
    }), [getReadingStats, readingSessions]);
    const quizStats = useMemo(() => getQuizStats?.() || ({
        totalAttempts: 0,
        passed: 0,
        avgScore: 0,
        passRate: 0
    }), [getQuizStats, quizAttempts]);
    const watchStats = useMemo(() => getWatchStats?.() || ({
        totalWatched: 0,
        completed: 0,
        inProgress: 0
    }), [getWatchStats, videoById]);
    const appStats7 = useMemo(() => getApplicationStats?.(7) || ({
        total: 0,
        byCategory: {},
        respondedDifferently: 0,
        respondedDifferentlyPercent: 0
    }), [getApplicationStats, applicationLogs]);
    const appStats30 = useMemo(() => getApplicationStats?.(30) || ({
        total: 0,
        byCategory: {},
        respondedDifferently: 0,
        respondedDifferentlyPercent: 0
    }), [getApplicationStats, applicationLogs]);
    const appStats90 = useMemo(() => getApplicationStats?.(90) || ({
        total: 0,
        byCategory: {},
        respondedDifferently: 0,
        respondedDifferentlyPercent: 0
    }), [getApplicationStats, applicationLogs]);
    const patternStats = useMemo(() => getPatternStats?.() || null, [getPatternStats, completedChains]);
    const trajectory8 = useMemo(() => getTrajectory?.(8) || { weeks: [], trends: {}, insights: {} }, [getTrajectory, allSessions]);

    const [activeTab, setActiveTab] = useState(initialTab || ARCHIVE_TABS.ALL);
    const [filterDate, setFilterDate] = useState(null);
    const [reportDomain, setReportDomain] = useState(initialReportDomain || REPORT_DOMAINS.PRACTICE);
    const [reportOutput, setReportOutput] = useState(null);
    
    // Edit/Delete state for single sessions
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [deletingSessionId, setDeletingSessionId] = useState(null);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        if (initialReportDomain) {
            setReportDomain(initialReportDomain);
        }
    }, [initialReportDomain]);

    const combinedEntries = useMemo(() => {
        const entries = [];

        allSessions.forEach(entry => {
            const timestamp = entry.date || entry.timestamp;
            const dateKey = entry.dateKey || (timestamp ? getDateKey(new Date(timestamp)) : null);
            entries.push({
                id: `session-${entry.id}`,
                type: 'practice',
                dateKey,
                timestamp,
                data: entry
            });
        });

        circuitEntries.forEach(entry => {
            const timestamp = entry.timestamp || entry.completionTime;
            const dateKey = entry.dateKey || (timestamp ? getDateKey(new Date(timestamp)) : null);
            entries.push({
                id: `circuit-${entry.id}`,
                type: 'circuit',
                dateKey,
                timestamp,
                data: entry
            });
        });

        readingSessions.forEach(entry => {
            if (!entry?.date) return;
            entries.push({
                id: `wisdom-reading-${entry.id}`,
                type: 'wisdom-reading',
                dateKey: getDateKey(new Date(entry.date)),
                timestamp: entry.date,
                data: entry
            });
        });

        quizAttempts.forEach(entry => {
            if (!entry?.date) return;
            entries.push({
                id: `wisdom-quiz-${entry.id}`,
                type: 'wisdom-quiz',
                dateKey: getDateKey(new Date(entry.date)),
                timestamp: entry.date,
                data: entry
            });
        });

        applicationLogs.forEach(entry => {
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
    }, [allSessions, circuitEntries, readingSessions, quizAttempts, applicationLogs]);

    const tabTypeMap = {
        all: ['practice', 'circuit', 'wisdom-reading', 'wisdom-quiz', 'application-log'],
        practice: ['practice'],
        circuits: ['circuit'],
        wisdom: ['wisdom-reading', 'wisdom-quiz'],
        application: ['application-log']
    };

    const filteredEntries = useMemo(() => {
        const allowedTypes = tabTypeMap[activeTab];
        if (activeTab !== 'all' && !allowedTypes) return [];

        let entries = combinedEntries;
        if (allowedTypes) {
            entries = entries.filter(entry => allowedTypes.includes(entry.type));
        }

        if (filterDate) {
            entries = entries.filter(entry => entry.dateKey === filterDate);
        }

        return entries;
    }, [combinedEntries, activeTab, filterDate]);

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';

    const formatDate = (dateKey) => {
        if (!dateKey) return 'Unknown';
        const d = new Date(dateKey + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const d = new Date(timestamp);
        return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const formatMinutes = (minutes) => `${Math.round(minutes || 0)}m`;
    const formatAdherenceMinutes = (value) => (value === null || value === undefined ? '-' : `${value}m`);

    const getWindowCutoff = (days) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (days - 1));
        cutoff.setHours(0, 0, 0, 0);
        return cutoff;
    };

    const getPracticeWindowStats = (days) => {
        const cutoff = getWindowCutoff(days);
        const sessions = allSessions.filter(s => new Date(s.date) >= cutoff);
        const minutesTotal = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const accuracyValues = sessions
            .filter(s => s.domain === 'breathwork')
            .map(s => s.metadata?.accuracy)
            .filter(a => typeof a === 'number');
        const avgAccuracy = accuracyValues.length > 0
            ? accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length
            : null;
        return {
            sessionsCount: sessions.length,
            minutesTotal,
            avgAccuracy
        };
    };

    const getWisdomWindowStats = (days) => {
        const cutoff = getWindowCutoff(days);
        const reading = readingSessions.filter(s => new Date(s.date) >= cutoff);
        const quizzes = quizAttempts.filter(q => new Date(q.date) >= cutoff);
        const videoEntries = Object.entries(videoById || {});
        const videosInWindow = videoEntries.filter(([, data]) => {
            if (!data?.lastWatchedAt) return false;
            return new Date(data.lastWatchedAt) >= cutoff;
        });
        const videosCompleted = videosInWindow.filter(([, data]) => data.completed).length;
        return {
            readingCount: reading.length,
            readingMinutes: Math.round(reading.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / 60),
            quizCount: quizzes.length,
            quizPassRate: quizzes.length > 0
                ? Math.round((quizzes.filter(q => q.passed).length / quizzes.length) * 100)
                : 0,
            videosStarted: videosInWindow.length,
            videosCompleted,
            videoCompletionRate: videosInWindow.length > 0
                ? Math.round((videosCompleted / videosInWindow.length) * 100)
                : 0
        };
    };

    const buildReportText = (domain, days) => {
        if (domain === 'practice') {
            const stats = getPracticeWindowStats(days);
            const accuracyText = stats.avgAccuracy === null ? '' : ` Average breath accuracy was ${Math.round(stats.avgAccuracy * 100)}%.`;
            return `In the last ${days} days, you completed ${stats.sessionsCount} practice sessions totaling ${Math.round(stats.minutesTotal)} minutes.${accuracyText}`.trim();
        }

        if (domain === 'navigation') {
            const summary = getScheduleAdherenceSummary?.(days, navigationActivePath?.activePathId);
            if (!summary || summary.avgAbsDeltaMinutes === null) {
                return `No schedule adherence records in the last ${days} days.`;
            }
            return `In the last ${days} days, your schedule adherence rate was ${summary.adherenceRate}%, with an average absolute offset of ${summary.avgAbsDeltaMinutes} minutes.`;
        }

        if (domain === 'wisdom') {
            const stats = getWisdomWindowStats(days);
            const quizText = stats.quizCount > 0 ? ` Quiz pass rate was ${stats.quizPassRate}%.` : '';
            return `In the last ${days} days, you logged ${stats.readingCount} reading sessions (${stats.readingMinutes} minutes) and started ${stats.videosStarted} videos (${stats.videosCompleted} completed).${quizText}`.trim();
        }

        if (domain === 'application') {
            const stats = days >= 90 ? appStats90 : appStats30;
            const rate = stats.respondedDifferentlyPercent || 0;
            return `In the last ${days} days, you logged ${stats.total} awareness events. Responded-differently rate was ${rate}%.`;
        }

        return '';
    };

    const practiceSummary = useMemo(() => {
        const totalSessions = allSessions.length;
        const totalMinutes = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const accuracyValues = allSessions
            .filter(s => s.domain === 'breathwork')
            .map(s => s.metadata?.accuracy)
            .filter(a => typeof a === 'number');
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
    }, [allSessions, allStats]);

    const circuitSummary = useMemo(() => {
        const totalCircuits = circuitEntries.length;
        const totalMinutes = circuitEntries.reduce((sum, entry) => sum + (entry.totalDuration || 0), 0);
        const avgMinutes = totalCircuits > 0 ? totalMinutes / totalCircuits : 0;

        return {
            totalCircuits,
            totalMinutes,
            avgMinutes
        };
    }, [circuitEntries]);

    const wisdomSummary = useMemo(() => {
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
    }, [readingStats, quizStats, watchStats, lastWatchedId, videoById]);

    const applicationSummary = useMemo(() => {
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
    }, [applicationLogs, appStats7, appStats30, appStats90, modeStats, modeSessions, completedChains, patternStats]);

    const navigationSummary = useMemo(() => ({
        activePath: navigationActivePath,
        lastActivity: navigationLastActivity,
        unlockedCount: navigationUnlocked?.length || 0,
        hasFoundation: navigationFoundation,
        pathAssessment: navigationAssessment
    }), [navigationActivePath, navigationLastActivity, navigationUnlocked, navigationFoundation, navigationAssessment]);

    const scheduleSlots = useMemo(() => {
        if (scheduleSlotsState && scheduleSlotsState.length > 0) return scheduleSlotsState;
        return getScheduleSlots?.() || [];
    }, [scheduleSlotsState, getScheduleSlots]);

    const adherenceSummary7 = useMemo(
        () => getScheduleAdherenceSummary?.(7, navigationActivePath?.activePathId) || null,
        [getScheduleAdherenceSummary, navigationActivePath, scheduleAdherenceLog]
    );
    const adherenceSummary30 = useMemo(
        () => getScheduleAdherenceSummary?.(30, navigationActivePath?.activePathId) || null,
        [getScheduleAdherenceSummary, navigationActivePath, scheduleAdherenceLog]
    );
    const adherenceSummary90 = useMemo(
        () => getScheduleAdherenceSummary?.(90, navigationActivePath?.activePathId) || null,
        [getScheduleAdherenceSummary, navigationActivePath, scheduleAdherenceLog]
    );

    const tabCounts = {
        all: combinedEntries.length,
        practice: allSessions.length,
        circuits: circuitEntries.length,
        wisdom: readingSessions.length + quizAttempts.length,
        navigation: Object.keys(navigationActivePath?.weekCompletionDates || {}).length || 0,
        application: applicationLogs.length,
        reports: '',
        insights: ''
    };

    const tabs = [
        { key: ARCHIVE_TABS.ALL, label: 'All' },
        { key: ARCHIVE_TABS.PRACTICE, label: 'Practice' },
        { key: ARCHIVE_TABS.CIRCUITS, label: 'Circuits' },
        { key: ARCHIVE_TABS.WISDOM, label: 'Wisdom' },
        { key: ARCHIVE_TABS.NAVIGATION, label: 'Navigation' },
        { key: ARCHIVE_TABS.APPLICATION, label: 'Application' },
        { key: ARCHIVE_TABS.REPORTS, label: 'Reports' },
        { key: ARCHIVE_TABS.INSIGHTS, label: 'Insights' }
    ];

    const emptyStateCopy = {
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

    const isFeedTab = [
        ARCHIVE_TABS.ALL,
        ARCHIVE_TABS.PRACTICE,
        ARCHIVE_TABS.CIRCUITS,
        ARCHIVE_TABS.WISDOM,
        ARCHIVE_TABS.APPLICATION
    ].includes(activeTab);
    const isFilterDisabled = !isFeedTab;

    const handleDeleteSession = () => {
        if (deletingSessionId) {
            deleteSession(deletingSessionId);
            setDeletingSessionId(null);
        }
    };

    const summaryCardStyle = {
        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '12px'
    };

    const summaryRowStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '12px',
        opacity: 0.8
    };

    const renderEmptyState = (title, hint) => (
        <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.4 }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>dY"T</div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{title}</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>{hint}</p>
        </div>
    );

    const renderPracticeEntry = (entry) => {
        const session = entry.data;
        const hasJournal = !!session.journal;
        return (
            <div key={entry.id} style={{ 
                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', 
                border: `1px solid ${borderColor}`, 
                borderRadius: '12px', 
                padding: '16px',
                transition: 'transform 0.2s ease'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {session.domain} Session
                            </h3>
                            {hasJournal && (
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    padding: '2px 6px',
                                    borderRadius: '999px',
                                    border: `1px solid ${borderColor}`,
                                    opacity: 0.7
                                }}>
                                    Journaled
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.6 }}>
                            {formatDate(entry.dateKey)}
                            {session.journal?.editedAt && <span> (edited)</span>}
                        </div>
                    </div>
                    <div style={{
                        padding: '6px 12px',
                        backgroundColor: `${accentColor}15`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: accentColor
                    }}>
                        {Math.round(session.duration || 0)}m
                    </div>
                </div>
                
                {session.journal && (
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ 
                            display: 'inline-block',
                            padding: '4px 10px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            backgroundColor: session.journal.attentionQuality === 'absorbed' ? 'rgba(16, 185, 129, 0.2)' :
                                            session.journal.attentionQuality === 'stable' ? 'rgba(59, 130, 246, 0.2)' :
                                            session.journal.attentionQuality === 'settling' ? 'rgba(249, 115, 22, 0.2)' :
                                            'rgba(239, 68, 68, 0.2)',
                            color: session.journal.attentionQuality === 'absorbed' ? '#10b981' :
                                   session.journal.attentionQuality === 'stable' ? '#3b82f6' :
                                   session.journal.attentionQuality === 'settling' ? '#f97316' :
                                   '#ef4444',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            textTransform: 'capitalize',
                            border: '1px solid currentColor'
                        }}>
                            {session.journal.attentionQuality}
                        </div>
                        {session.journal.technicalNote && (
                            <p style={{ 
                                margin: 0, 
                                fontSize: '13px', 
                                opacity: 0.8, 
                                lineHeight: '1.5',
                                padding: '10px',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                borderRadius: '6px'
                            }}>
                                {session.journal.technicalNote}
                            </p>
                        )}
                    </div>
                )}

                {hasJournal && (
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
                        {(() => {
                            const entryTime = new Date(entry.timestamp);
                            const now = new Date();
                            const hoursDiff = (now - entryTime) / (1000 * 60 * 60);
                            const isEditable = hoursDiff < 24;

                            return isEditable ? (
                                <button
                                    onClick={() => setEditingSessionId(session.id)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        backgroundColor: `${accentColor}10`,
                                        border: `1px solid ${accentColor}`,
                                        borderRadius: '6px',
                                        color: accentColor,
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Edit
                                </button>
                            ) : (
                                <button
                                    disabled
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        backgroundColor: borderColor,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: '6px',
                                        color: textColor,
                                        cursor: 'not-allowed',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        opacity: 0.4
                                    }}
                                >
                                    Edit (expired)
                                </button>
                            );
                        })()}
                        <button
                            onClick={() => setDeletingSessionId(session.id)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderActivityCard = ({ id, title, subtitle, meta, detail }) => (
        <div key={id} style={{
            background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '16px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: detail ? '10px' : 0, alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{title}</h3>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>{subtitle}</div>
                </div>
                {meta && (
                    <div style={{
                        padding: '6px 12px',
                        backgroundColor: `${accentColor}15`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: accentColor
                    }}>
                        {meta}
                    </div>
                )}
            </div>
            {detail && (
                <div style={{
                    fontSize: '13px',
                    opacity: 0.85,
                    lineHeight: '1.5',
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.2)'
                }}>
                    {detail}
                </div>
            )}
        </div>
    );

    const renderFeedEntry = (entry) => {
        if (entry.type === 'circuit') {
            return <CircuitEntryCard key={entry.id} entry={entry.data} />;
        }

        if (entry.type === 'practice') {
            return renderPracticeEntry(entry);
        }

        if (entry.type === 'wisdom-reading') {
            const minutes = Math.round((entry.data.timeSpent || 0) / 60);
            const detail = `Section: ${entry.data.sectionId || 'Unknown'} - Scroll depth: ${Math.round((entry.data.scrollDepth || 0) * 100)}%`;
            return renderActivityCard({
                id: entry.id,
                title: 'Wisdom Reading',
                subtitle: formatTimestamp(entry.timestamp),
                meta: `${minutes}m`,
                detail
            });
        }

        if (entry.type === 'wisdom-quiz') {
            const score = typeof entry.data.score === 'number'
                ? `${Math.round(entry.data.score * 100)}%`
                : '-';
            const detail = `Quiz: ${entry.data.quizId || 'Unknown'} - ${entry.data.passed ? 'Passed' : 'Not passed'}`;
            return renderActivityCard({
                id: entry.id,
                title: 'Wisdom Quiz',
                subtitle: formatTimestamp(entry.timestamp),
                meta: score,
                detail
            });
        }

        if (entry.type === 'application-log') {
            const detail = entry.data.note
                ? entry.data.note
                : entry.data.respondedDifferently === true
                    ? 'Responded differently.'
                    : entry.data.respondedDifferently === false
                        ? 'Logged without a response change.'
                        : 'No reflection added.';
            return renderActivityCard({
                id: entry.id,
                title: 'Awareness Log',
                subtitle: formatTimestamp(entry.timestamp),
                meta: entry.data.category || 'Uncategorized',
                detail
            });
        }

        return null;
    };

    const reportDomains = [
        { key: REPORT_DOMAINS.PRACTICE, label: 'Practice' },
        { key: REPORT_DOMAINS.NAVIGATION, label: 'Navigation' },
        { key: REPORT_DOMAINS.WISDOM, label: 'Wisdom' },
        { key: REPORT_DOMAINS.APPLICATION, label: 'Application' }
    ];

    const handleGenerateReport = (days) => {
        const text = buildReportText(reportDomain, days);
        setReportOutput({ domain: reportDomain, days, text });
    };

    const renderReports = () => {
        const practiceTotals = trajectory8.weeks.reduce((sum, w) => sum + (w.totalMinutes || 0), 0);
        const practiceDays = trajectory8.weeks.reduce((sum, w) => sum + (w.daysActive || 0), 0);
        const wisdom30 = getWisdomWindowStats(30);
        const wisdom90 = getWisdomWindowStats(90);

        return (
            <div>
                <div style={{ ...summaryRowStyle, marginBottom: '10px' }}>
                    {reportDomains.map(domain => (
                        <button
                            key={domain.key}
                            onClick={() => setReportDomain(domain.key)}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '999px',
                                border: `1px solid ${borderColor}`,
                                backgroundColor: reportDomain === domain.key ? `${accentColor}20` : 'transparent',
                                color: reportDomain === domain.key ? accentColor : textColor,
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {domain.label}
                        </button>
                    ))}
                </div>

                <div style={summaryCardStyle}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: '6px' }}>
                        Practice Report (8 weeks)
                    </div>
                    {trajectory8.weeks.length === 0 ? (
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>No practice data available yet.</div>
                    ) : (
                        <div style={summaryRowStyle}>
                            <div><strong>{trajectory8.weeks.length}</strong> weeks tracked</div>
                            <div><strong>{practiceDays}</strong> active days</div>
                            <div><strong>{Math.round(practiceTotals)}</strong> minutes total</div>
                            <div>Trend: {trajectory8.trends?.directionLabel || 'stable'}</div>
                        </div>
                    )}
                </div>

                <div style={summaryCardStyle}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: '6px' }}>
                        Navigation Precision Report (7/30/90)
                    </div>
                    <div style={summaryRowStyle}>
                        <div><strong>7d:</strong> {adherenceSummary7 ? `${adherenceSummary7.adherenceRate}%` : '-'} | Avg abs: {formatAdherenceMinutes(adherenceSummary7?.avgAbsDeltaMinutes)}</div>
                        <div><strong>30d:</strong> {adherenceSummary30 ? `${adherenceSummary30.adherenceRate}%` : '-'} | Avg abs: {formatAdherenceMinutes(adherenceSummary30?.avgAbsDeltaMinutes)}</div>
                        <div><strong>90d:</strong> {adherenceSummary90 ? `${adherenceSummary90.adherenceRate}%` : '-'} | Avg abs: {formatAdherenceMinutes(adherenceSummary90?.avgAbsDeltaMinutes)}</div>
                    </div>
                </div>

                <div style={summaryCardStyle}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: '6px' }}>
                        Wisdom Report (30/90)
                    </div>
                    <div style={{ ...summaryRowStyle, marginBottom: '6px' }}>
                        <div><strong>30d:</strong> {wisdom30.readingCount} readings | {wisdom30.readingMinutes}m | {wisdom30.videosStarted} videos ({wisdom30.videosCompleted} completed)</div>
                    </div>
                    <div style={summaryRowStyle}>
                        <div><strong>90d:</strong> {wisdom90.readingCount} readings | {wisdom90.readingMinutes}m | {wisdom90.videosStarted} videos ({wisdom90.videosCompleted} completed)</div>
                    </div>
                </div>

                <div style={summaryCardStyle}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: '6px' }}>
                        Application Report (30/90)
                    </div>
                    <div style={{ ...summaryRowStyle, marginBottom: '6px' }}>
                        <div><strong>30d:</strong> {appStats30.total} logs | Responded differently: {appStats30.respondedDifferentlyPercent}%</div>
                    </div>
                    <div style={summaryRowStyle}>
                        <div><strong>90d:</strong> {appStats90.total} logs | Responded differently: {appStats90.respondedDifferentlyPercent}%</div>
                    </div>
                </div>

                <div style={summaryCardStyle}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: '8px' }}>
                        Generate Report Paragraph
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <button
                            onClick={() => handleGenerateReport(30)}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${borderColor}`,
                                backgroundColor: `${accentColor}10`,
                                color: accentColor,
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Generate 30-day text report
                        </button>
                        <button
                            onClick={() => handleGenerateReport(90)}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${borderColor}`,
                                backgroundColor: `${accentColor}10`,
                                color: accentColor,
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Generate 90-day text report
                        </button>
                    </div>
                    {reportOutput && reportOutput.domain === reportDomain && (
                        <textarea
                            readOnly
                            value={reportOutput.text}
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '10px',
                                borderRadius: '6px',
                                border: `1px solid ${borderColor}`,
                                backgroundColor: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                                color: textColor,
                                fontSize: '12px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    )}
                </div>
            </div>
        );
    };

    const footerText = useMemo(() => {
        switch (activeTab) {
            case 'all':
                return `${practiceSummary.totalSessions} sessions | ${circuitSummary.totalCircuits} circuits | ${tabCounts.wisdom} wisdom | ${applicationSummary.totalLogs} logs`;
            case 'practice':
                return `${practiceSummary.totalSessions} sessions | ${formatMinutes(practiceSummary.totalMinutes)} total`;
            case 'circuits':
                return `${circuitSummary.totalCircuits} circuits | ${formatMinutes(circuitSummary.totalMinutes)} total`;
            case 'wisdom':
                return `${readingStats.totalSessions} readings | ${quizStats.totalAttempts} quizzes | ${watchStats.completed} videos`;
            case 'navigation':
                return `${Object.keys(navigationSummary.activePath?.weekCompletionDates || {}).length} weeks completed | ${navigationSummary.unlockedCount} unlocked`;
            case 'application':
                return `${applicationSummary.totalLogs} logs | ${applicationSummary.modeSessionsCount} mode sessions | ${applicationSummary.chainCount} chains`;
            case 'insights':
                return `${circuitEntries.length} circuits | ${allSessions.length} sessions`;
            default:
                return `${circuitEntries.length} circuits | ${allSessions.length} sessions`;
        }
    }, [
        activeTab,
        practiceSummary,
        circuitSummary,
        readingStats,
        quizStats,
        watchStats,
        applicationSummary,
        navigationSummary,
        circuitEntries.length,
        allSessions.length,
        tabCounts.wisdom
    ]);

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    borderRadius: '16px',
                    maxWidth: '700px',
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                    border: `1px solid ${borderColor}`,
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '20px',
                        borderBottom: `1px solid ${borderColor}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Tracking Archive</h1>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.5 }}>Insights and history of your tracking</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <ExportArchiveButton />
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                        gap: '0',
                        padding: '8px',
                        borderBottom: `1px solid ${borderColor}`,
                        backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                    }}
                >
                    {tabs.map(tab => {
                        const count = tabCounts[tab.key];
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '10px 4px',
                                    backgroundColor: activeTab === tab.key ? accentColor : 'transparent',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: activeTab === tab.key ? (isLight ? '#000' : '#fff') : textColor,
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {tab.label} {typeof count === 'number' ? `(${count})` : ''}
                            </button>
                        );
                    })}
                </div>

                {/* Filter Row */}
                {activeTab !== 'insights' && (
                    <div style={{ padding: '12px', borderBottom: `1px solid ${borderColor}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', fontWeight: 'bold' }}>Filter:</span>
                        <input
                            type="date"
                            value={filterDate || ''}
                            onChange={(e) => setFilterDate(e.target.value || null)}
                            disabled={isFilterDisabled}
                            title={isFilterDisabled ? 'Filter applies to event feeds.' : ''}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                border: `1px solid ${borderColor}`,
                                backgroundColor: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                                color: textColor,
                                fontSize: '12px',
                                fontFamily: 'inherit',
                                cursor: isFilterDisabled ? 'not-allowed' : 'pointer',
                                opacity: isFilterDisabled ? 0.5 : 1
                            }}
                        />
                        {filterDate && !isFilterDisabled && (
                            <button 
                                onClick={() => setFilterDate(null)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {activeTab === 'insights' ? (
                        <CircuitInsightsView />
                    ) : (
                        <div>
                            {activeTab === 'all' && (
                                <div style={summaryCardStyle}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: '6px' }}>
                                        Totals
                                    </div>
                                    <div style={summaryRowStyle}>
                                        <div><strong>{practiceSummary.totalSessions}</strong> sessions</div>
                                        <div><strong>{circuitSummary.totalCircuits}</strong> circuits</div>
                                        <div><strong>{readingStats.totalSessions}</strong> readings</div>
                                        <div><strong>{quizStats.totalAttempts}</strong> quizzes</div>
                                        <div><strong>{applicationSummary.totalLogs}</strong> logs</div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'practice' && (
                                <PracticeDashboardHeader
                                    practiceSummary={practiceSummary}
                                    trajectory={trajectory8}
                                    isLight={isLight}
                                />
                            )}

                            {activeTab === 'circuits' && (
                                <div style={summaryCardStyle}>
                                    <div style={summaryRowStyle}>
                                        <div><strong>{circuitSummary.totalCircuits}</strong> circuits</div>
                                        <div><strong>{formatMinutes(circuitSummary.totalMinutes)}</strong> total time</div>
                                        <div>Avg: {formatMinutes(circuitSummary.avgMinutes)}</div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'wisdom' && (
                                <div style={summaryCardStyle}>
                                    <div style={summaryRowStyle}>
                                        <div><strong>{readingStats.totalSessions}</strong> reading sessions</div>
                                        <div><strong>{readingStats.totalMinutes}m</strong> reading time</div>
                                        <div><strong>{readingStats.sectionsVisited}</strong> sections visited</div>
                                    </div>
                                    <div style={{ marginTop: '8px', ...summaryRowStyle }}>
                                        <div><strong>{quizStats.totalAttempts}</strong> quiz attempts</div>
                                        <div>Pass rate: {Math.round((quizStats.passRate || 0) * 100)}%</div>
                                        <div><strong>{watchStats.totalWatched}</strong> videos started</div>
                                        <div><strong>{watchStats.completed}</strong> videos completed</div>
                                        <div>Completion rate: {wisdomSummary.completionRate}%</div>
                                    </div>
                                    {wisdomSummary.lastWatchedAt && (
                                        <div style={{ marginTop: '6px', fontSize: '11px', opacity: 0.6 }}>
                                            Last watched: {formatTimestamp(wisdomSummary.lastWatchedAt)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'navigation' && (
                                <NavigationDashboardHeader
                                    navigationSummary={navigationSummary}
                                    adherenceSummary7={adherenceSummary7}
                                    adherenceSummary30={adherenceSummary30}
                                    scheduleSlots={scheduleSlots}
                                    isLight={isLight}
                                />
                            )}

                            {activeTab === 'application' && (
                                <ApplicationDashboardHeader
                                    applicationSummary={applicationSummary}
                                    isLight={isLight}
                                />
                            )}

                            {activeTab === 'reports' ? (
                                <ReportsPanel initialReportDomain={initialReportDomain} />
                            ) : isFeedTab ? (
                                filteredEntries.length === 0 ? (
                                    renderEmptyState(
                                        emptyStateCopy[activeTab]?.title || 'No records found',
                                        emptyStateCopy[activeTab]?.hint || 'Complete a session to see it in your archive.'
                                    )
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {filteredEntries.map(renderFeedEntry)}
                                    </div>
                                )
                            ) : activeTab === 'navigation' ? (
                                !navigationSummary.activePath && !navigationSummary.unlockedCount && !navigationSummary.lastActivity && !navigationSummary.pathAssessment && !navigationSummary.hasFoundation
                                    ? renderEmptyState(
                                        emptyStateCopy[activeTab]?.title || 'No records found',
                                        emptyStateCopy[activeTab]?.hint || 'Complete a session to see it in your archive.'
                                    )
                                    : null
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 20px', borderTop: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: '11px', opacity: 0.5 }}>
                        {footerText}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.5 }}>
                        Immanence OS Tracking Archive v1.4
                    </div>
                </div>
            </div>

            {/* Modals */}
            {editingSessionId && (
                <SessionEntryEditModal 
                    sessionId={editingSessionId} 
                    onClose={() => setEditingSessionId(null)} 
                />
            )}
            
            {deletingSessionId && (
                <DeleteConfirmationModal 
                    title="Delete Session"
                    message="Are you sure you want to delete this session? This will also affect your streak if it was your only practice."
                    onConfirm={handleDeleteSession}
                    onCancel={() => setDeletingSessionId(null)}
                />
            )}
        </div>,
        document.body
    );
}

export default SessionHistoryView;
