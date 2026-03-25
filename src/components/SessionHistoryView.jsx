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
import { useCurriculumStore } from '../state/curriculumStore.js';
import { CircuitEntryCard } from './CircuitEntryCard.jsx';
import { CircuitInsightsView } from './CircuitInsightsView.jsx';
import { SessionEntryEditModal } from './SessionEntryEditModal.jsx';
import { DeleteConfirmationModal } from './DeleteConfirmationModal.jsx';
import { ExportArchiveButton } from './ExportArchiveButton.jsx';
import { ReportsPanel } from './tracking/reports/index.js';
import {
    SESSION_HISTORY_EMPTY_STATE_COPY,
    SESSION_HISTORY_TABS,
    buildApplicationSummary,
    buildCircuitSummary,
    buildCombinedEntries,
    buildFooterText,
    buildNavigationSummary,
    buildPracticeSummary,
    buildTabCounts,
    buildWisdomSummary,
    filterEntries,
    formatHistoryDate,
    formatHistoryMinutes,
    formatHistoryTimestamp,
    getOutsideScheduleSessionIds,
    resolveScheduleSlots
} from './sessionHistoryViewLogic.js';
import {
    PracticeDashboardHeader,
    NavigationDashboardHeader,
    ApplicationDashboardHeader
} from './tracking/infographics/index.js';

export function SessionHistoryView({ onClose, initialTab = ARCHIVE_TABS.ALL, initialReportDomain = REPORT_DOMAINS.PRACTICE }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const archiveMaxWidth = 'var(--ui-rail-max, min(430px, 94vw))';
    
    // Get the store methods as references (not calling them to avoid new array on every render)
    const getAllCircuitEntries = useCircuitJournalStore(s => s.getAllEntries);
    const getSessions = useProgressStore(s => s.getSessions);
    const getAllStats = useProgressStore(s => s.getAllStats);
    const getTrajectory = useProgressStore(s => s.getTrajectory);
    const { deleteSession } = useProgressStore();
    const sessionsV2 = useProgressStore(s => s.sessionsV2);
    const vacation = useProgressStore(s => s.vacation);

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
    const allStats = useMemo(() => getAllStats?.() || {}, [getAllStats]);
    const readingStats = useMemo(() => getReadingStats?.() || ({
        totalSessions: 0,
        totalMinutes: 0,
        sectionsVisited: 0,
        bySection: {},
        lastRead: null
    }), [getReadingStats]);
    const quizStats = useMemo(() => getQuizStats?.() || ({
        totalAttempts: 0,
        passed: 0,
        avgScore: 0,
        passRate: 0
    }), [getQuizStats]);
    const watchStats = useMemo(() => getWatchStats?.() || ({
        totalWatched: 0,
        completed: 0,
        inProgress: 0
    }), [getWatchStats]);
    const appStats7 = useMemo(() => getApplicationStats?.(7) || ({
        total: 0,
        byCategory: {},
        respondedDifferently: 0,
        respondedDifferentlyPercent: 0
    }), [getApplicationStats]);
    const appStats30 = useMemo(() => getApplicationStats?.(30) || ({
        total: 0,
        byCategory: {},
        respondedDifferently: 0,
        respondedDifferentlyPercent: 0
    }), [getApplicationStats]);
    const appStats90 = useMemo(() => getApplicationStats?.(90) || ({
        total: 0,
        byCategory: {},
        respondedDifferently: 0,
        respondedDifferentlyPercent: 0
    }), [getApplicationStats]);
    const patternStats = useMemo(() => getPatternStats?.() || null, [getPatternStats]);
    const trajectory8 = useMemo(() => getTrajectory?.(8) || { weeks: [], trends: {}, insights: {} }, [getTrajectory]);

    const outsideScheduleSessionIds = getOutsideScheduleSessionIds({
        navigationActivePath,
        sessionsV2,
        vacation,
        curriculumStoreState: useCurriculumStore.getState()
    });

    const [activeTab, setActiveTab] = useState(initialTab || ARCHIVE_TABS.ALL);
    const [filterDate, setFilterDate] = useState(null);
    
    // Edit/Delete state for single sessions
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [deletingSessionId, setDeletingSessionId] = useState(null);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);


    const combinedEntries = useMemo(() => buildCombinedEntries({
        allSessions,
        circuitEntries,
        readingSessions,
        quizAttempts,
        applicationLogs
    }), [allSessions, circuitEntries, readingSessions, quizAttempts, applicationLogs]);

    const filteredEntries = useMemo(() => filterEntries({
        entries: combinedEntries,
        activeTab,
        filterDate
    }), [combinedEntries, activeTab, filterDate]);

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';

    const practiceSummary = useMemo(() => buildPracticeSummary({
        allSessions,
        allStats
    }), [allSessions, allStats]);

    const circuitSummary = useMemo(() => buildCircuitSummary(circuitEntries), [circuitEntries]);

    const wisdomSummary = useMemo(() => buildWisdomSummary({
        readingStats,
        quizStats,
        watchStats,
        lastWatchedId,
        videoById
    }), [readingStats, quizStats, watchStats, lastWatchedId, videoById]);

    const applicationSummary = useMemo(() => buildApplicationSummary({
        applicationLogs,
        appStats7,
        appStats30,
        appStats90,
        modeStats,
        modeSessions,
        completedChains,
        patternStats
    }), [applicationLogs, appStats7, appStats30, appStats90, modeStats, modeSessions, completedChains, patternStats]);

    const navigationSummary = useMemo(() => buildNavigationSummary({
        navigationActivePath,
        navigationLastActivity,
        navigationUnlocked,
        navigationFoundation,
        navigationAssessment
    }), [navigationActivePath, navigationLastActivity, navigationUnlocked, navigationFoundation, navigationAssessment]);

    const scheduleSlots = useMemo(() => resolveScheduleSlots({
        scheduleSlotsState,
        getScheduleSlots
    }), [scheduleSlotsState, getScheduleSlots]);

    const adherenceSummary7 = useMemo(
        () => getScheduleAdherenceSummary?.(7, navigationActivePath?.activePathId) || null,
        [getScheduleAdherenceSummary, navigationActivePath]
    );
    const adherenceSummary30 = useMemo(
        () => getScheduleAdherenceSummary?.(30, navigationActivePath?.activePathId) || null,
        [getScheduleAdherenceSummary, navigationActivePath]
    );

    const tabCounts = useMemo(() => buildTabCounts({
        combinedEntries,
        allSessions,
        circuitEntries,
        readingSessions,
        quizAttempts,
        navigationActivePath,
        applicationLogs
    }), [combinedEntries, allSessions, circuitEntries, readingSessions, quizAttempts, navigationActivePath, applicationLogs]);

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
        const isOutsideSchedule = outsideScheduleSessionIds.has(session.id);
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
                            {isOutsideSchedule && (
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    padding: '2px 6px',
                                    borderRadius: '999px',
                                    border: `1px solid ${borderColor}`,
                                    background: isLight ? 'rgba(100, 100, 100, 0.08)' : 'rgba(180, 180, 180, 0.12)',
                                    opacity: 0.85
                                }}>
                                    Outside schedule
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.6 }}>
                            {formatHistoryDate(entry.dateKey)}
                            {session.journal?.editedAt && <span> (edited)</span>}
                        </div>
                        {isOutsideSchedule && (
                            <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.7 }}>
                                Logged for records. Not part of your schedule.
                            </div>
                        )}
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
                subtitle: formatHistoryTimestamp(entry.timestamp),
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
                subtitle: formatHistoryTimestamp(entry.timestamp),
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
                subtitle: formatHistoryTimestamp(entry.timestamp),
                meta: entry.data.category || 'Uncategorized',
                detail
            });
        }

        return null;
    };


    const footerText = useMemo(() => buildFooterText({
        activeTab,
        practiceSummary,
        circuitSummary,
        readingStats,
        quizStats,
        watchStats,
        applicationSummary,
        navigationSummary,
        circuitEntriesCount: circuitEntries.length,
        allSessionsCount: allSessions.length,
        tabCounts
    }), [
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
        tabCounts
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
                    maxWidth: archiveMaxWidth,
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
                        padding: '10px 8px',
                        borderBottom: `1px solid ${borderColor}`,
                        backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                    }}
                >
                    {SESSION_HISTORY_TABS.map(tab => {
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
                    <div style={{ padding: '14px 12px', borderBottom: `1px solid ${borderColor}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                                        <div><strong>{formatHistoryMinutes(circuitSummary.totalMinutes)}</strong> total time</div>
                                        <div>Avg: {formatHistoryMinutes(circuitSummary.avgMinutes)}</div>
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
                                            Last watched: {formatHistoryTimestamp(wisdomSummary.lastWatchedAt)}
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
                                        SESSION_HISTORY_EMPTY_STATE_COPY[activeTab]?.title || 'No records found',
                                        SESSION_HISTORY_EMPTY_STATE_COPY[activeTab]?.hint || 'Complete a session to see it in your archive.'
                                    )
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {filteredEntries.map(renderFeedEntry)}
                                    </div>
                                )
                            ) : activeTab === 'navigation' ? (
                                !navigationSummary.activePath && !navigationSummary.unlockedCount && !navigationSummary.lastActivity && !navigationSummary.pathAssessment && !navigationSummary.hasFoundation
                                    ? renderEmptyState(
                                        SESSION_HISTORY_EMPTY_STATE_COPY[activeTab]?.title || 'No records found',
                                        SESSION_HISTORY_EMPTY_STATE_COPY[activeTab]?.hint || 'Complete a session to see it in your archive.'
                                    )
                                    : null
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 20px', borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
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
