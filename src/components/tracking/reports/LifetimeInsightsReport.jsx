// src/components/tracking/reports/LifetimeInsightsReport.jsx
// Lifetime (all-time) insights: badges, annual consistency, multi-year view

import React, { useMemo } from 'react';
import { MetricCalloutCard } from './MetricCalloutCard.jsx';
import { useDisplayModeStore } from '../../../state/displayModeStore.js';

export function LifetimeInsightsReport({ lifetimeMilestones = {}, annualRollups = [], sessions = [] }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const config = {
        light: {
            bg: 'rgba(252, 248, 240, 0.95)',
            text: 'rgba(45, 40, 35, 0.95)',
            textSub: 'rgba(60, 50, 40, 0.7)',
            textMuted: 'rgba(60, 50, 40, 0.5)',
            border: 'rgba(180, 155, 110, 0.25)',
            cardBg: 'rgba(255, 255, 255, 0.5)',
            accentGold: '#d4af37',
            accentBlue: '#2563eb'
        },
        dark: {
            bg: 'rgba(15, 20, 30, 0.95)',
            text: 'rgba(255, 255, 255, 0.95)',
            textSub: 'rgba(255, 255, 255, 0.7)',
            textMuted: 'rgba(255, 255, 255, 0.5)',
            border: 'rgba(255, 255, 255, 0.1)',
            cardBg: 'rgba(20, 25, 35, 0.8)',
            accentGold: '#fbbf24',
            accentBlue: '#3b82f6'
        }
    };

    const theme = config[isLight ? 'light' : 'dark'];

    // Extract lifetime metrics
    const {
        totalSessions = 0,
        totalMinutes = 0,
        practiceDays = 0,
        longestStreak = 0,
        memberSince = null,
        yearsActive = 0,
        favoriteDomain = null,
        totalRituals = 0
    } = lifetimeMilestones;

    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    // Format member since date
    const memberSinceFormatted = useMemo(() => {
        if (!memberSince) return 'Not started';
        const d = new Date(memberSince);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }, [memberSince]);

    // Achievement badges (top 4 lifetime stats)
    const badges = [
        { label: 'Member Days', value: practiceDays, icon: '📅' },
        { label: 'Total Sessions', value: totalSessions, icon: '🔥' },
        { label: 'Longest Streak', value: `${longestStreak}d`, icon: '⚡' },
        { label: 'Total Rituals', value: totalRituals, icon: '🎯' }
    ];

    // Annual consistency data (for horizontal bar chart)
    const annualBars = useMemo(() => {
        if (!annualRollups || annualRollups.length === 0) return [];
        
        const maxDays = Math.max(...annualRollups.map(r => r.practiceDays), 1);
        
        return annualRollups.map(r => ({
            year: r.year,
            days: r.practiceDays,
            percentage: (r.practiceDays / maxDays) * 100
        }));
    }, [annualRollups]);

    return (
        <div
            className="w-full rounded-2xl p-6 space-y-6"
            style={{
                background: theme.bg,
                border: `1px solid ${theme.border}`
            }}
        >
            {/* Header */}
            <div className="border-b pb-4" style={{ borderColor: theme.border }}>
                <h2 className="text-2xl font-black" style={{ color: theme.text }}>
                    Lifetime Insights
                </h2>
                <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                    Member since {memberSinceFormatted} • {yearsActive} year{yearsActive !== 1 ? 's' : ''} active
                </p>
            </div>

            {/* Achievement Badges Section */}
            <div>
                <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
                    Milestones
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {badges.map(badge => (
                        <div
                            key={badge.label}
                            className="rounded-xl p-4 text-center"
                            style={{
                                background: theme.cardBg,
                                border: `1px solid ${theme.border}`
                            }}
                        >
                            <div className="text-3xl mb-2">{badge.icon}</div>
                            <div className="text-2xl font-bold" style={{ color: theme.text }}>
                                {badge.value}
                            </div>
                            <div className="text-xs uppercase tracking-wider mt-1" style={{ color: theme.textMuted }}>
                                {badge.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Headline Metric Callout */}
            <MetricCalloutCard
                metric={practiceDays}
                unit=""
                label="Days Practiced All-Time"
                deltaValue={null}
                insight={`You've shown up ${practiceDays} times. ${totalSessions > 0 ? `Average session: ${avgSessionMinutes} min.` : ''}`}
                domainColor={theme.accentGold}
                isLight={isLight}
            />

            {/* Annual Consistency Chart */}
            {annualBars.length > 0 && (
                <div>
                    <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
                        Practice Days by Year
                    </h3>
                    <div className="space-y-2">
                        {annualBars.map(bar => (
                            <div key={bar.year} className="flex items-center gap-3">
                                <span className="text-sm font-medium w-12" style={{ color: theme.textSub }}>
                                    {bar.year}
                                </span>
                                <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: theme.border }}>
                                    <div
                                        className="h-full flex items-center justify-end px-2 transition-all duration-300"
                                        style={{
                                            width: `${bar.percentage}%`,
                                            background: `linear-gradient(90deg, ${theme.accentBlue}, ${theme.accentGold})`
                                        }}
                                    >
                                        {bar.percentage > 20 && (
                                            <span className="text-xs font-bold text-white">
                                                {bar.days}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {bar.percentage <= 20 && (
                                    <span className="text-xs font-bold w-8" style={{ color: theme.textSub }}>
                                        {bar.days}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Multi-Year Heatmap */}
            {annualRollups.length > 0 && (
                <div>
                    <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
                        Activity Heatmap
                    </h3>
                    <div className="rounded-xl p-4" style={{
                        background: theme.cardBg,
                        border: `1px solid ${theme.border}`
                    }}>
                        <div className="space-y-2">
                            {annualRollups.map(rollup => {
                                const year = rollup.year;
                                const monthsWithData = rollup.monthlyBreakdown || [];
                                
                                return (
                                    <div key={year}>
                                        <div className="text-xs font-medium mb-1" style={{ color: theme.textSub }}>
                                            {year}
                                        </div>
                                        <div className="grid grid-cols-12 gap-1">
                                            {Array.from({ length: 12 }, (_, i) => {
                                                const monthData = monthsWithData.find(m => m.month === i + 1);
                                                const sessions = monthData?.sessions || 0;
                                                const maxSessions = Math.max(...monthsWithData.map(m => m.sessions), 1);
                                                const intensity = sessions > 0 ? (sessions / maxSessions) : 0;
                                                
                                                return (
                                                    <div
                                                        key={i}
                                                        className="h-6 rounded transition-all"
                                                        style={{
                                                            background: sessions > 0
                                                                ? `rgba(${isLight ? '37, 99, 235' : '59, 130, 246'}, ${0.2 + (intensity * 0.8)})`
                                                                : theme.border,
                                                            cursor: 'default'
                                                        }}
                                                        title={`${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]} ${year}: ${sessions} sessions`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
                            <span className="text-xs" style={{ color: theme.textMuted }}>Less</span>
                            <div className="flex gap-1">
                                {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
                                    <div
                                        key={i}
                                        className="w-4 h-4 rounded"
                                        style={{
                                            background: `rgba(${isLight ? '37, 99, 235' : '59, 130, 246'}, ${opacity})`
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs" style={{ color: theme.textMuted }}>More</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Ritual Evolution Timeline */}
            {useMemo(() => {
                const ritualSessions = sessions.filter(s => s.domain === 'ritual');
                if (ritualSessions.length === 0) return null;
                
                // Group rituals by type/name if available in metadata
                const ritualsByType = ritualSessions.reduce((acc, s) => {
                    const ritualName = s.metadata?.ritualName || s.metadata?.type || 'General Ritual';
                    if (!acc[ritualName]) {
                        acc[ritualName] = {
                            name: ritualName,
                            firstSession: s.date,
                            lastSession: s.date,
                            count: 0
                        };
                    }
                    acc[ritualName].count++;
                    if (new Date(s.date) < new Date(acc[ritualName].firstSession)) {
                        acc[ritualName].firstSession = s.date;
                    }
                    if (new Date(s.date) > new Date(acc[ritualName].lastSession)) {
                        acc[ritualName].lastSession = s.date;
                    }
                    return acc;
                }, {});
                
                const ritualList = Object.values(ritualsByType).sort(
                    (a, b) => new Date(a.firstSession) - new Date(b.firstSession)
                );
                
                return (
                    <div>
                        <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
                            Ritual Timeline
                        </h3>
                        <div className="rounded-xl p-4" style={{
                            background: theme.cardBg,
                            border: `1px solid ${theme.border}`
                        }}>
                            {ritualList.length === 0 ? (
                                <div className="text-center text-sm py-4" style={{ color: theme.textMuted }}>
                                    No rituals recorded yet
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {ritualList.slice(0, 5).map((ritual, i) => {
                                        const firstDate = new Date(ritual.firstSession);
                                        const lastDate = new Date(ritual.lastSession);
                                        const daysDiff = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24));
                                        
                                        return (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{
                                                    background: theme.accentGold
                                                }} />
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium" style={{ color: theme.text }}>
                                                        {ritual.name}
                                                    </div>
                                                    <div className="text-xs mt-1" style={{ color: theme.textMuted }}>
                                                        {firstDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                        {daysDiff > 7 && ` → ${lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                                                        {' • '}
                                                        {ritual.count} session{ritual.count !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {ritualList.length > 5 && (
                                        <div className="text-xs text-center pt-2" style={{ color: theme.textMuted }}>
                                            +{ritualList.length - 5} more ritual{ritualList.length - 5 !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }, [sessions, theme])}

            {/* Domain Distribution (if favorite domain available) */}
            {favoriteDomain && (
                <div className="pt-4 border-t" style={{ borderColor: theme.border }}>
                    <p className="text-sm" style={{ color: theme.textSub }}>
                        Your most practiced domain: <span className="font-bold" style={{ color: theme.text }}>{favoriteDomain}</span>
                    </p>
                </div>
            )}
        </div>
    );
}
