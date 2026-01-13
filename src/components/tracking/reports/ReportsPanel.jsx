import React, { useMemo, useState } from 'react';
import { useProgressStore } from '../../../state/progressStore.js';
import { useNavigationStore } from '../../../state/navigationStore.js';
import { useWisdomStore } from '../../../state/wisdomStore.js';
import { useVideoStore } from '../../../state/videoStore.js';
import { useApplicationStore } from '../../../state/applicationStore.js';
import { useModeTrainingStore } from '../../../state/modeTrainingStore.js';
import { useChainStore } from '../../../state/chainStore.js';
import { useDisplayModeStore } from '../../../state/displayModeStore.js';
import { PracticeEvolutionReport } from './PracticeEvolutionReport.jsx';
import { PracticeConsistencyReport } from './PracticeConsistencyReport.jsx';
import { NavigationAdherenceReport } from './NavigationAdherenceReport.jsx';
import { NavigationPathReport } from './NavigationPathReport.jsx';
import { WisdomReadingReport } from './WisdomReadingReport.jsx';
import { WisdomVideoReport } from './WisdomVideoReport.jsx';
import { ApplicationAwarenessReport } from './ApplicationAwarenessReport.jsx';
import { PortfolioSummaryReport } from './PortfolioSummaryReport.jsx';
import { RitualInsightsReport } from './RitualInsightsReport.jsx';
import { LifetimeInsightsReport } from './LifetimeInsightsReport.jsx';
import {
    bucketByTime,
    buildRange,
    formatRangeLabel,
    getRangeDays,
    rangeToBucketKind
} from './reportUtils.js';

const RANGE_OPTIONS = [
    { key: '30D', label: '30D' },
    { key: '90D', label: '90D' },
    { key: '12M', label: '12M' },
    { key: 'ALL', label: 'ALL' }
];

const DOMAIN_OPTIONS = [
    { key: 'practice', label: 'Practice' },
    { key: 'navigation', label: 'Navigation' },
    { key: 'wisdom', label: 'Wisdom' },
    { key: 'application', label: 'Application' },
    { key: 'ritual', label: 'Rituals' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'lifetime', label: 'Lifetime' }
];

const filterByRange = (events, start, end, getTimestamp) => {
    return events.filter((event) => {
        const raw = getTimestamp(event);
        if (!raw) return false;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return false;
        return date >= start && date <= end;
    });
};

const buildDeltaLine = (label, currentValue, previousValue, unit = '') => {
    if (previousValue === null || previousValue === undefined) return null;
    const delta = currentValue - previousValue;
    const sign = delta > 0 ? '+' : '';
    return `${label}: ${currentValue}${unit} (${sign}${delta}${unit} vs prev)`;
};

export function ReportsPanel({ initialReportDomain = 'practice' }) {
    const sessions = useProgressStore(s => s.sessions);
    const streakLongest = useProgressStore(s => s.streak?.longest || 0);
    const annualRollups = useProgressStore(s => s.annualRollups || []);
    const lifetimeMilestones = useProgressStore(s => s.lifetimeMilestones || {});
    const readingSessions = useWisdomStore(s => s.readingSessions || []);
    const quizAttempts = useWisdomStore(s => s.quizAttempts || []);
    const videoById = useVideoStore(s => s.byId || {});
    const videoEntries = useMemo(() => Object.entries(videoById), [videoById]);
    const awarenessLogs = useApplicationStore(s => s.awarenessLogs || []);
    const adherenceLog = useNavigationStore(s => s.scheduleAdherenceLog || []);
    const scheduleSlots = useNavigationStore(s => s.scheduleSlots || []);
    const activePath = useNavigationStore(s => s.activePath);
    const unlockedSections = useNavigationStore(s => s.unlockedSections || []);
    const modeStats = useModeTrainingStore(s => s.modeStats || {});
    const getPatternStats = useChainStore(s => s.getPatternStats);
    const chainStats = useMemo(() => getPatternStats ? getPatternStats() : null, [getPatternStats]);
    const completedChains = useChainStore(s => s.completedChains || []);
    const viewportMode = useDisplayModeStore(s => s.viewportMode);
    const isSanctuary = viewportMode === 'sanctuary';
    const chartWidth = isSanctuary ? 520 : 320;

    const [activeDomain, setActiveDomain] = useState(initialReportDomain || 'practice');
    const [rangeKey, setRangeKey] = useState('30D');
    const [compareOn, setCompareOn] = useState(false);
    const [reportOutput, setReportOutput] = useState(null);

    const earliestDate = useMemo(() => {
        const dates = [
            ...sessions.map(s => s.date || s.timestamp),
            ...readingSessions.map(s => s.date),
            ...quizAttempts.map(a => a.date),
            ...videoEntries.map(([, data]) => data?.lastWatchedAt),
            ...awarenessLogs.map(l => l.timestamp),
            ...adherenceLog.map(e => `${e.day}T00:00:00`)
        ].filter(Boolean);
        if (dates.length === 0) return null;
        return new Date(Math.min(...dates.map(d => new Date(d).getTime())));
    }, [sessions, readingSessions, quizAttempts, videoEntries, awarenessLogs, adherenceLog]);

    const range = useMemo(() => buildRange(rangeKey, earliestDate), [rangeKey, earliestDate]);
    const rangeDays = useMemo(() => getRangeDays(range.start, range.end), [range]);

    const compareRange = useMemo(() => {
        if (!compareOn) return null;
        const endPrev = new Date(range.start.getTime() - 1);
        const startPrev = new Date(endPrev);
        startPrev.setDate(startPrev.getDate() - (rangeDays - 1));
        startPrev.setHours(0, 0, 0, 0);
        return { start: startPrev, end: endPrev };
    }, [compareOn, range, rangeDays]);

    const sessionsInRange = useMemo(
        () => filterByRange(sessions, range.start, range.end, s => s.date || s.timestamp),
        [sessions, range]
    );
    const readingInRange = useMemo(
        () => filterByRange(readingSessions, range.start, range.end, s => s.date),
        [readingSessions, range]
    );
    const quizInRange = useMemo(
        () => filterByRange(quizAttempts, range.start, range.end, a => a.date),
        [quizAttempts, range]
    );
    const videoInRange = useMemo(
        () => videoEntries.filter(([, data]) => {
            if (!data?.lastWatchedAt) return false;
            const date = new Date(data.lastWatchedAt);
            return date >= range.start && date <= range.end;
        }),
        [videoEntries, range]
    );
    const awarenessInRange = useMemo(
        () => filterByRange(awarenessLogs, range.start, range.end, l => l.timestamp),
        [awarenessLogs, range]
    );
    const adherenceInRange = useMemo(
        () => filterByRange(adherenceLog, range.start, range.end, e => `${e.day}T00:00:00`),
        [adherenceLog, range]
    );

    // Filter ritual sessions from sessions (domain filter)
    const ritualSessions = useMemo(
        () => sessions.filter(s => s.domain === 'ritual'),
        [sessions]
    );
    const ritualInRange = useMemo(
        () => filterByRange(ritualSessions, range.start, range.end, s => s.date || s.timestamp),
        [ritualSessions, range]
    );

    const unifiedEventsInRange = useMemo(() => ([
        ...sessionsInRange.map(s => ({ type: 'practice', timestamp: s.date || s.timestamp })),
        ...readingInRange.map(s => ({ type: 'reading', timestamp: s.date })),
        ...quizInRange.map(s => ({ type: 'quiz', timestamp: s.date })),
        ...videoInRange.map(([, data]) => ({ type: 'video', timestamp: data?.lastWatchedAt })),
        ...awarenessInRange.map(s => ({ type: 'application', timestamp: s.timestamp })),
        ...adherenceInRange.map(s => ({ type: 'adherence', timestamp: `${s.day}T00:00:00` }))
    ]).filter(event => event.timestamp), [
        sessionsInRange,
        readingInRange,
        quizInRange,
        videoInRange,
        awarenessInRange,
        adherenceInRange
    ]);

    const bucketKind = useMemo(
        () => rangeToBucketKind(rangeDays, unifiedEventsInRange.length),
        [rangeDays, unifiedEventsInRange]
    );

    const milestones = useMemo(() => {
        if (!unifiedEventsInRange.length) {
            return [
                { label: 'First activity', value: '-' },
                { label: 'Best streak', value: `${streakLongest} days` },
                { label: 'Longest session', value: '-' },
                { label: 'Peak month', value: '-' }
            ];
        }
        const first = unifiedEventsInRange.reduce((min, event) => {
            const t = new Date(event.timestamp).getTime();
            return t < min ? t : min;
        }, Infinity);
        const longestSession = sessions.reduce((max, s) => Math.max(max, s.duration || 0), 0);
        const monthBuckets = bucketByTime(sessions, 'month', s => s.date || s.timestamp);
        const peakMonth = monthBuckets.reduce((peak, bucket) => {
            const minutes = bucket.items.reduce((sum, s) => sum + (s.duration || 0), 0);
            return minutes > peak.minutes ? { key: bucket.key, minutes } : peak;
        }, { key: '-', minutes: 0 });
        return [
            { label: 'First activity', value: Number.isFinite(first) ? new Date(first).toLocaleDateString() : '-' },
            { label: 'Best streak', value: `${streakLongest} days` },
            { label: 'Longest session', value: longestSession ? `${Math.round(longestSession)}m` : '-' },
            { label: 'Peak month', value: peakMonth.key || '-' }
        ];
    }, [unifiedEventsInRange, sessions, streakLongest]);

    const practiceData = useMemo(() => {
        const buckets = bucketByTime(sessionsInRange, bucketKind, s => s.date || s.timestamp).map((bucket) => {
            const minutes = bucket.items.reduce((sum, s) => sum + (s.duration || 0), 0);
            const accuracyValues = bucket.items
                .filter(s => s.domain === 'breathwork')
                .map(s => s.metadata?.accuracy)
                .filter(a => typeof a === 'number');
            const accuracy = accuracyValues.length > 0
                ? Math.round((accuracyValues.reduce((sum, a) => sum + a, 0) / accuracyValues.length) * 100)
                : null;
            return {
                label: bucket.key,
                minutes: Math.round(minutes),
                accuracy,
                count: bucket.items.length
            };
        });
        const totalMinutes = buckets.reduce((sum, b) => sum + b.minutes, 0);
        const totalSessions = sessionsInRange.length;
        const hasAccuracy = buckets.some(b => b.accuracy !== null);

        const weekdayCounts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => {
            const count = sessionsInRange.filter((s) => {
                const day = new Date(s.date || s.timestamp).getDay();
                const normalized = day === 0 ? 6 : day - 1;
                return normalized === index;
            }).length;
            return { label, value: count };
        });

        return {
            buckets,
            totalMinutes,
            totalSessions,
            hasAccuracy,
            weekdayCounts
        };
    }, [sessionsInRange, bucketKind]);

    const practiceCompare = useMemo(() => {
        if (!compareRange) return null;
        const prevSessions = filterByRange(sessions, compareRange.start, compareRange.end, s => s.date || s.timestamp);
        const prevMinutes = prevSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        return {
            totalSessions: prevSessions.length,
            totalMinutes: Math.round(prevMinutes)
        };
    }, [sessions, compareRange]);

    const navigationData = useMemo(() => {
        const totalEntries = adherenceInRange.length;
        const withinCount = adherenceInRange.filter(e => e.withinWindow).length;
        const avgAbsDelta = totalEntries > 0
            ? Math.round(adherenceInRange.reduce((sum, e) => sum + Math.abs(e.deltaMinutes || 0), 0) / totalEntries)
            : null;
        const slotBars = scheduleSlots.map(slot => {
            const slotEntries = adherenceInRange.filter(e => e.slotId === slot.slotId);
            const slotWithin = slotEntries.filter(e => e.withinWindow).length;
            const rate = slotEntries.length > 0 ? Math.round((slotWithin / slotEntries.length) * 100) : 0;
            return { label: `S${slot.slotId}`, value: rate };
        });
        return {
            totalEntries,
            adherenceRate: totalEntries > 0 ? Math.round((withinCount / totalEntries) * 100) : 0,
            avgAbsDelta,
            slotBars
        };
    }, [adherenceInRange, scheduleSlots]);

    const navigationCompare = useMemo(() => {
        if (!compareRange) return null;
        const prev = filterByRange(adherenceLog, compareRange.start, compareRange.end, e => `${e.day}T00:00:00`);
        const prevWithin = prev.filter(e => e.withinWindow).length;
        return {
            adherenceRate: prev.length > 0 ? Math.round((prevWithin / prev.length) * 100) : 0
        };
    }, [adherenceLog, compareRange]);

    const navigationPathData = useMemo(() => {
        const completedWeeks = activePath?.completedWeeks?.length || 0;
        const currentWeek = activePath?.currentWeek || 0;
        const progressPercent = currentWeek > 0 ? Math.min(100, Math.round((completedWeeks / currentWeek) * 100)) : 0;
        return {
            activePathId: activePath?.pathId || null,
            completedWeeks,
            currentWeek,
            unlockedSections: unlockedSections.length,
            progressPercent
        };
    }, [activePath, unlockedSections]);

    const wisdomReadingData = useMemo(() => {
        const buckets = bucketByTime(readingInRange, bucketKind, s => s.date).map((bucket) => {
            const minutes = Math.round(bucket.items.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / 60);
            return { label: bucket.key, value: minutes };
        });
        return {
            buckets,
            totalSessions: readingInRange.length,
            totalMinutes: buckets.reduce((sum, b) => sum + b.value, 0),
            quizCount: quizInRange.length
        };
    }, [readingInRange, quizInRange, bucketKind]);

    const wisdomVideoData = useMemo(() => {
        return {
            videosStarted: videoInRange.length,
            videosCompleted: videoInRange.filter(([, data]) => data.completed).length
        };
    }, [videoInRange]);

    const wisdomCompare = useMemo(() => {
        if (!compareRange) return null;
        const prevReading = filterByRange(readingSessions, compareRange.start, compareRange.end, s => s.date);
        const prevVideos = videoEntries.filter(([, data]) => {
            if (!data?.lastWatchedAt) return false;
            const date = new Date(data.lastWatchedAt);
            return date >= compareRange.start && date <= compareRange.end;
        });
        return {
            readingSessions: prevReading.length,
            videosStarted: prevVideos.length
        };
    }, [readingSessions, videoEntries, compareRange]);

    const applicationData = useMemo(() => {
        const buckets = bucketByTime(awarenessInRange, bucketKind, l => l.timestamp).map((bucket) => ({
            label: bucket.key,
            count: bucket.items.length
        }));
        const respondedDifferently = awarenessInRange.filter(l => l.respondedDifferently === true).length;
        return {
            buckets,
            totalLogs: awarenessInRange.length,
            respondedDifferentlyPercent: awarenessInRange.length > 0
                ? Math.round((respondedDifferently / awarenessInRange.length) * 100)
                : 0,
            modeStats,
            chainStats,
            completedChainsCount: completedChains.length
        };
    }, [awarenessInRange, bucketKind, modeStats, chainStats, completedChains]);

    const applicationCompare = useMemo(() => {
        if (!compareRange) return null;
        const prev = filterByRange(awarenessLogs, compareRange.start, compareRange.end, l => l.timestamp);
        return { totalLogs: prev.length };
    }, [awarenessLogs, compareRange]);

    const portfolioData = useMemo(() => {
        const practiceCount = sessionsInRange.length;
        const readingCount = readingInRange.length;
        const videoCount = videoInRange.length;
        const awarenessCount = awarenessInRange.length;
        const bars = [
            { label: 'Practice', value: practiceCount },
            { label: 'Wisdom', value: readingCount },
            { label: 'Video', value: videoCount },
            { label: 'Application', value: awarenessCount }
        ];
        const activeDomains = bars.filter(b => b.value > 0).length;
        const totalActivities = bars.reduce((sum, b) => sum + b.value, 0);
        return { bars, activeDomains, totalActivities };
    }, [sessionsInRange, readingInRange, videoInRange, awarenessInRange]);

    const portfolioCompare = useMemo(() => {
        if (!compareRange) return null;
        const practiceCount = filterByRange(sessions, compareRange.start, compareRange.end, s => s.date || s.timestamp).length;
        const readingCount = filterByRange(readingSessions, compareRange.start, compareRange.end, s => s.date).length;
        const videoCount = videoEntries.filter(([, data]) => {
            if (!data?.lastWatchedAt) return false;
            const date = new Date(data.lastWatchedAt);
            return date >= compareRange.start && date <= compareRange.end;
        }).length;
        const awarenessCount = filterByRange(awarenessLogs, compareRange.start, compareRange.end, l => l.timestamp).length;
        return {
            totalActivities: practiceCount + readingCount + videoCount + awarenessCount
        };
    }, [sessions, readingSessions, videoEntries, awarenessLogs, compareRange]);

    const yearRollups = useMemo(() => {
        if (rangeKey !== 'ALL') return [];
        const yearBuckets = bucketByTime(sessions, 'year', s => s.date || s.timestamp);
        return yearBuckets.map(bucket => ({
            label: bucket.key,
            sessions: bucket.items.length
        }));
    }, [sessions, rangeKey]);

    const reportList = useMemo(() => ([
        {
            key: 'practice-evolution',
            domain: 'practice',
            node: (
                <PracticeEvolutionReport
                    data={practiceData}
                    bucketLabel={bucketKind}
                    chartWidth={chartWidth}
                    deltaLine={compareOn ? buildDeltaLine('Sessions', practiceData.totalSessions, practiceCompare?.totalSessions) : null}
                    milestones={rangeKey === 'ALL' ? milestones : null}
                />
            )
        },
        {
            key: 'practice-consistency',
            domain: 'practice',
            node: (
                <PracticeConsistencyReport
                    data={{ totalSessions: practiceData.totalSessions, weekdayCounts: practiceData.weekdayCounts }}
                    deltaLine={compareOn ? buildDeltaLine('Minutes', practiceData.totalMinutes, practiceCompare?.totalMinutes, 'm') : null}
                    milestones={rangeKey === 'ALL' ? milestones : null}
                />
            )
        },
        {
            key: 'navigation-adherence',
            domain: 'navigation',
            node: (
                <NavigationAdherenceReport
                    data={navigationData}
                    deltaLine={compareOn ? buildDeltaLine('Adherence', navigationData.adherenceRate, navigationCompare?.adherenceRate, '%') : null}
                    milestones={rangeKey === 'ALL' ? milestones : null}
                />
            )
        },
        {
            key: 'navigation-path',
            domain: 'navigation',
            node: (
                <NavigationPathReport
                    data={navigationPathData}
                    deltaLine={null}
                    milestones={rangeKey === 'ALL' ? milestones : null}
                />
            )
        },
        {
            key: 'wisdom-reading',
            domain: 'wisdom',
            node: (
                <WisdomReadingReport
                    data={wisdomReadingData}
                    deltaLine={compareOn ? buildDeltaLine('Reading sessions', wisdomReadingData.totalSessions, wisdomCompare?.readingSessions) : null}
                    milestones={rangeKey === 'ALL' ? milestones : null}
                />
            )
        },
        {
            key: 'wisdom-video',
            domain: 'wisdom',
            node: (
                <WisdomVideoReport
                    data={wisdomVideoData}
                    deltaLine={compareOn ? buildDeltaLine('Videos started', wisdomVideoData.videosStarted, wisdomCompare?.videosStarted) : null}
                    milestones={rangeKey === 'ALL' ? milestones : null}
                />
            )
        },
        {
            key: 'application-awareness',
            domain: 'application',
            node: (
                <ApplicationAwarenessReport
                    data={applicationData}
                    chartWidth={chartWidth}
                    deltaLine={compareOn ? buildDeltaLine('Logs', applicationData.totalLogs, applicationCompare?.totalLogs) : null}
                    milestones={rangeKey === 'ALL' ? milestones : null}
                />
            )
        },
        {
            key: 'ritual-insights',
            domain: 'ritual',
            node: (
                <RitualInsightsReport
                    sessions={ritualInRange}
                    rangeStart={range.start}
                    rangeEnd={range.end}
                    deltaLine={compareOn ? buildDeltaLine('Rituals', ritualInRange.length, 0) : null}
                />
            )
        },
        {
            key: 'lifetime-insights',
            domain: 'lifetime',
            node: (
                <LifetimeInsightsReport
                    lifetimeMilestones={lifetimeMilestones}
                    annualRollups={annualRollups}
                    sessions={sessions}
                />
            )
        },
        {
            key: 'portfolio-summary',
            domain: 'portfolio',
            node: (
                <PortfolioSummaryReport
                    data={portfolioData}
                    deltaLine={compareOn ? buildDeltaLine('Total events', portfolioData.totalActivities, portfolioCompare?.totalActivities) : null}
                    milestones={rangeKey === 'ALL' ? milestones : null}
                />
            )
        }
    ]), [
        practiceData,
        practiceCompare,
        navigationData,
        navigationCompare,
        navigationPathData,
        wisdomReadingData,
        wisdomVideoData,
        wisdomCompare,
        applicationData,
        applicationCompare,
        ritualInRange,
        range,
        portfolioData,
        portfolioCompare,
        lifetimeMilestones,
        annualRollups,
        compareOn,
        rangeKey,
        bucketKind,
        milestones
    ]);

    const visibleReports = reportList.filter(report => report.domain === activeDomain);

    const reportText = useMemo(() => {
        if (!reportOutput) return '';
        return reportOutput;
    }, [reportOutput]);

    const handleGenerateReport = () => {
        const label = formatRangeLabel(rangeKey, range.start, range.end);
        let text = `${activeDomain.toUpperCase()} REPORT — ${label}\n`;
        const bullets = [];
        if (activeDomain === 'practice') {
            const sessionsDelta = compareOn ? ` (Δ ${practiceData.totalSessions - (practiceCompare?.totalSessions || 0)})` : '';
            const minutesDelta = compareOn ? ` (Δ ${practiceData.totalMinutes - (practiceCompare?.totalMinutes || 0)})` : '';
            bullets.push(`Sessions: ${practiceData.totalSessions}${sessionsDelta}`);
            bullets.push(`Minutes: ${practiceData.totalMinutes}${minutesDelta}`);
            if (practiceData.hasAccuracy) {
                const avgAccuracy = practiceData.buckets.reduce((sum, b) => sum + (b.accuracy || 0), 0) / Math.max(1, practiceData.buckets.filter(b => b.accuracy !== null).length);
                bullets.push(`Avg breath accuracy: ${Math.round(avgAccuracy)}%`);
            }
            text += bullets.slice(0, 3).map(line => `- ${line}`).join('\n');
            if (compareOn) {
                text += `\nCompare: previous period (${rangeDays} days)`;
            }
            text += `\nSuggested adjustment: Maintain a consistent cadence across ${bucketKind} buckets.`;
        } else if (activeDomain === 'navigation') {
            const adherenceDelta = compareOn ? ` (Δ ${navigationData.adherenceRate - (navigationCompare?.adherenceRate || 0)}%)` : '';
            bullets.push(`Adherence rate: ${navigationData.adherenceRate}%${adherenceDelta}`);
            bullets.push(`Avg abs delta: ${navigationData.avgAbsDelta ?? '-'} minutes`);
            text += bullets.slice(0, 3).map(line => `- ${line}`).join('\n');
            if (compareOn) {
                text += `\nCompare: previous period (${rangeDays} days)`;
            }
            text += `\nSuggested adjustment: Tighten one slot within the 15-minute window.`;
        } else if (activeDomain === 'wisdom') {
            const readingDelta = compareOn ? ` (Δ ${wisdomReadingData.totalSessions - (wisdomCompare?.readingSessions || 0)})` : '';
            const videoDelta = compareOn ? ` (Δ ${wisdomVideoData.videosStarted - (wisdomCompare?.videosStarted || 0)})` : '';
            bullets.push(`Reading sessions: ${wisdomReadingData.totalSessions}${readingDelta}`);
            bullets.push(`Quiz attempts: ${wisdomReadingData.quizCount}`);
            bullets.push(`Videos started: ${wisdomVideoData.videosStarted}${videoDelta}`);
            text += bullets.slice(0, 3).map(line => `- ${line}`).join('\n');
            if (compareOn) {
                text += `\nCompare: previous period (${rangeDays} days)`;
            }
            text += `\nSuggested adjustment: Add a fixed weekly reading slot.`;
        } else if (activeDomain === 'application') {
            const logsDelta = compareOn ? ` (Δ ${applicationData.totalLogs - (applicationCompare?.totalLogs || 0)})` : '';
            bullets.push(`Awareness logs: ${applicationData.totalLogs}${logsDelta}`);
            bullets.push(`Responded differently: ${applicationData.respondedDifferentlyPercent}%`);
            text += bullets.slice(0, 3).map(line => `- ${line}`).join('\n');
            if (compareOn) {
                text += `\nCompare: previous period (${rangeDays} days)`;
            }
            text += `\nSuggested adjustment: Add a short reflection to one log per day.`;
        } else {
            const totalDelta = compareOn ? ` (Δ ${portfolioData.totalActivities - (portfolioCompare?.totalActivities || 0)})` : '';
            bullets.push(`Total activity events: ${portfolioData.totalActivities}${totalDelta}`);
            bullets.push(`Active domains: ${portfolioData.activeDomains}`);
            text += bullets.slice(0, 3).map(line => `- ${line}`).join('\n');
            if (compareOn) {
                text += `\nCompare: previous period (${rangeDays} days)`;
            }
            text += `\nSuggested adjustment: Balance the lowest activity domain.`;
        }
        setReportOutput(text.trim());
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {DOMAIN_OPTIONS.map((domain) => (
                    <button
                        key={domain.key}
                        onClick={() => setActiveDomain(domain.key)}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '999px',
                            border: '1px solid rgba(0,0,0,0.15)',
                            background: activeDomain === domain.key ? 'rgba(0,0,0,0.08)' : 'transparent',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        {domain.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {RANGE_OPTIONS.map((rangeOption) => (
                        <button
                            key={rangeOption.key}
                            onClick={() => setRangeKey(rangeOption.key)}
                            style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1px solid rgba(0,0,0,0.15)',
                                background: rangeKey === rangeOption.key ? 'rgba(0,0,0,0.08)' : 'transparent',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {rangeOption.label}
                        </button>
                    ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <input
                        type="checkbox"
                        checked={compareOn}
                        onChange={(e) => setCompareOn(e.target.checked)}
                    />
                    Compare
                </label>
                <button
                    onClick={handleGenerateReport}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Generate text report
                </button>
            </div>

            <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '10px' }}>
                {formatRangeLabel(rangeKey, range.start, range.end)} • Buckets: {bucketKind.toUpperCase()}
            </div>
            {rangeKey === 'ALL' && yearRollups.length > 0 && (
                <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '12px' }}>
                    Year rollups (practice sessions): {yearRollups.map(y => `${y.label}: ${y.sessions}`).join(' • ')}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {visibleReports.map(report => (
                    <React.Fragment key={report.key}>{report.node}</React.Fragment>
                ))}
            </div>

            {reportText && (
                <div style={{ marginTop: '12px' }}>
                    <textarea
                        value={reportText}
                        readOnly
                        rows={isSanctuary ? 8 : 6}
                        style={{
                            width: '100%',
                            borderRadius: '10px',
                            border: '1px solid rgba(0,0,0,0.15)',
                            padding: '10px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            background: 'rgba(0,0,0,0.02)'
                        }}
                    />
                </div>
            )}
        </div>
    );
}
