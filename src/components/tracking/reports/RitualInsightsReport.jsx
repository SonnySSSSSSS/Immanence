// src/components/tracking/reports/RitualInsightsReport.jsx
// Ritual domain insights: frequency, type breakdown, recent carousel

import React, { useMemo } from 'react';
import { MetricCalloutCard } from './MetricCalloutCard.jsx';
import { WeekAtGlanceGrid } from './WeekAtGlanceGrid.jsx';
import { useDisplayModeStore } from '../../../state/displayModeStore.js';

export function RitualInsightsReport({ sessions = [], rangeStart, rangeEnd, deltaLine = null }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // Calculate ritual metrics
    const ritualCount = sessions.length;
    const ritualMinutes = useMemo(
        () => sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        [sessions]
    );

    // Average rituals per week
    const weeksDiff = rangeStart && rangeEnd
        ? Math.max(1, Math.ceil((rangeEnd - rangeStart) / (7 * 24 * 60 * 60 * 1000)))
        : 1;
    const ritualsPerWeek = (ritualCount / weeksDiff).toFixed(1);

    // Daily data for week-at-glance grid
    const dailyData = useMemo(() => {
        if (!rangeStart || !rangeEnd) return Array(7).fill({ day: '', count: 0, intensity: 0 });

        const dayMap = {};
        const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Initialize 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date(rangeStart);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];
            dayMap[key] = { day: dayLabels[i], count: 0, date: key };
        }

        // Count sessions per day
        sessions.forEach(s => {
            const dateKey = s.dateKey || (s.date ? s.date.split('T')[0] : '');
            if (dayMap[dateKey]) {
                dayMap[dateKey].count += 1;
            }
        });

        const maxCount = Math.max(...Object.values(dayMap).map(d => d.count), 1);

        return Object.values(dayMap).map(d => ({
            ...d,
            intensity: d.count > 0 ? d.count / maxCount : 0
        }));
    }, [sessions, rangeStart, rangeEnd]);

    // Most common ritual (mock for now)
    const mostCommon = ritualCount > 0 ? 'Thought Detachment' : 'None';

    // Insight text
    const getInsight = () => {
        if (ritualCount === 0) return 'No rituals logged in this period.';
        if (ritualsPerWeek < 1) return `Starting to build ritual practice (${ritualCount} total).`;
        if (ritualsPerWeek < 2) return `Steady ritual practice. Trending: Keep momentum.`;
        return `Strong ritual engagement at ${ritualsPerWeek}x/week! Consider adding variety.`;
    };

    return (
        <div className="space-y-4">
            {/* Top metrics card */}
            <MetricCalloutCard
                metric={ritualCount}
                label="Rituals Completed"
                unit={`${ritualMinutes} min total`}
                deltaValue={null}
                deltaLabel={deltaLine ? 'vs prev' : ''}
                insight={getInsight()}
                domainColor="#ec4899"
                isLight={isLight}
            />

            {/* Rituals per week badge */}
            <div
                className="rounded-lg p-3"
                style={{
                    background: isLight
                        ? 'rgba(180, 155, 110, 0.08)'
                        : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isLight
                        ? 'rgba(180, 155, 110, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }`
                }}
            >
                <div
                    className="text-sm font-bold"
                    style={{
                        color: isLight
                            ? 'rgba(45, 40, 35, 0.9)'
                            : 'rgba(255, 255, 255, 0.9)'
                    }}
                >
                    {ritualsPerWeek}× per week
                </div>
                <div
                    className="text-xs mt-1"
                    style={{
                        color: isLight
                            ? 'rgba(60, 50, 40, 0.6)'
                            : 'rgba(255, 255, 255, 0.5)'
                    }}
                >
                    Most frequent: {mostCommon}
                </div>
            </div>

            {/* Week-at-glance grid */}
            <div>
                <div
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{
                        color: isLight
                            ? 'rgba(60, 50, 40, 0.7)'
                            : 'rgba(255, 255, 255, 0.6)'
                    }}
                >
                    Last 7 Days Activity
                </div>
                <WeekAtGlanceGrid
                    dailyData={dailyData}
                    domainColor="#ec4899"
                    isLight={isLight}
                />
            </div>

            {/* Placeholder for future ritual category breakdown */}
            <div
                className="rounded-lg p-3 text-center text-xs opacity-50"
                style={{
                    background: isLight
                        ? 'rgba(180, 155, 110, 0.05)'
                        : 'rgba(255, 255, 255, 0.02)',
                    border: `1px dashed ${isLight
                        ? 'rgba(180, 155, 110, 0.15)'
                        : 'rgba(255, 255, 255, 0.08)'
                    }`
                }}
            >
                📊 Ritual Frequency Heatmap (coming soon)
            </div>
        </div>
    );
}
