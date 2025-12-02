// src/components/WeeklyReview.jsx
import React from 'react';
import { useApplicationStore } from '../state/applicationStore.js';
import { useNavigationStore } from '../state/navigationStore.js';

export function WeeklyReview() {
    const { getStats, getWeekLogs } = useApplicationStore();
    const { activePath } = useNavigationStore();

    const weekStats = getStats(7);
    const weekLogs = getWeekLogs();

    // Calculate practice days this week (would integrate with PracticeSection store)
    // For now, mock with random data
    const practiceDays = 5; // TODO: Get from practice store
    const totalDays = 7;

    // Generate 8-week trend data (mock for now)
    const trendWeeks = 8;
    const generateTrend = (current, variance = 0.3) => {
        const trend = [];
        for (let i = 0; i < trendWeeks; i++) {
            const progress = i / (trendWeeks - 1);
            const value = Math.max(0, current * (0.3 + progress * 0.7) + (Math.random() - 0.5) * variance * current);
            trend.push(Math.round(value));
        }
        return trend;
    };

    const awarenessTrend = generateTrend(weekStats.total);
    const agencyTrend = generateTrend(weekStats.respondedDifferently);
    const practiceTrend = [3, 5, 4, 6, 7, 6, 7, 7]; // Mock

    const renderTrendBar = (value, maxValue) => {
        const height = Math.max(10, (value / maxValue) * 100);
        return (
            <div className="flex-1 flex items-end justify-center" style={{ height: '60px' }}>
                <div
                    className="w-full bg-gradient-to-t from-[#fcd34d] to-[rgba(253,224,71,0.6)] rounded-t-sm"
                    style={{ height: `${height}%` }}
                />
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="bg-[#0f0f1a] border border-[rgba(253,224,71,0.15)] rounded-3xl p-6 space-y-6">
                {/* Header */}
                <h3
                    className="text-sm uppercase tracking-[0.2em] text-[rgba(253,224,71,0.7)] text-center"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    THIS WEEK
                </h3>

                {/* Practice Consistency */}
                <div>
                    <div className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider mb-2">
                        Practice Consistency
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 flex gap-1">
                            {Array.from({ length: totalDays }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-6 rounded ${i < practiceDays
                                            ? 'bg-gradient-to-br from-[#fcd34d] to-[#f59e0b]'
                                            : 'bg-[rgba(253,224,71,0.1)]'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="text-sm text-[rgba(253,251,245,0.8)]">
                            {practiceDays}/{totalDays} days
                        </div>
                    </div>
                </div>

                {/* Awareness Moments */}
                <div>
                    <div className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider mb-2">
                        Awareness Moments
                    </div>
                    <div className="text-2xl text-[#fcd34d] mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
                        {weekStats.total}
                    </div>
                    <div className="space-y-1.5">
                        {Object.entries(weekStats.byCategory).map(([category, count]) => (
                            <div key={category} className="flex items-center justify-between text-sm">
                                <span
                                    className="text-[rgba(253,251,245,0.7)]"
                                    style={{ fontFamily: 'Crimson Pro, serif' }}
                                >
                                    {category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </span>
                                <span className="text-[rgba(253,224,71,0.7)] font-semibold">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Responded Differently */}
                <div>
                    <div className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider mb-2">
                        Responded Differently
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl text-[#fcd34d]" style={{ fontFamily: 'Cinzel, serif' }}>
                            {weekStats.respondedDifferently}
                        </span>
                        <span className="text-sm text-[rgba(253,251,245,0.6)]">
                            / {weekStats.total}
                        </span>
                        <span className="ml-auto text-lg text-[rgba(253,224,71,0.8)]">
                            {weekStats.respondedDifferentlyPercent}%
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-4 text-[rgba(253,224,71,0.3)]">
                        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[rgba(253,224,71,0.3)]" />
                        <div style={{ fontSize: '10px' }}>◆</div>
                        <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[rgba(253,224,71,0.3)]" />
                    </div>
                </div>

                {/* Trend (past 8 weeks) */}
                <div>
                    <div className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider mb-3 text-center">
                        Trend (Past 8 Weeks)
                    </div>

                    {/* Awareness Trend */}
                    <div className="mb-4">
                        <div className="text-xs text-[rgba(253,251,245,0.6)] mb-2">Awareness</div>
                        <div className="flex gap-1">
                            {awarenessTrend.map((value, i) => renderTrendBar(value, Math.max(...awarenessTrend)))}
                        </div>
                    </div>

                    {/* Agency Trend */}
                    <div className="mb-4">
                        <div className="text-xs text-[rgba(253,251,245,0.6)] mb-2">Agency</div>
                        <div className="flex gap-1">
                            {agencyTrend.map((value, i) => renderTrendBar(value, Math.max(...agencyTrend)))}
                        </div>
                    </div>

                    {/* Practice Trend */}
                    <div className="mb-4">
                        <div className="text-xs text-[rgba(253,251,245,0.6)] mb-2">Practice</div>
                        <div className="flex gap-1">
                            {practiceTrend.map((value, i) => renderTrendBar(value, 7))}
                        </div>
                    </div>
                </div>

                {/* Insight */}
                <div className="border-t border-[rgba(253,224,71,0.1)] pt-4">
                    <p
                        className="text-sm text-[rgba(253,251,245,0.7)] italic text-center leading-relaxed"
                        style={{ fontFamily: 'Crimson Pro, serif' }}
                    >
                        {weekStats.total > 0 ? (
                            weekStats.total > 30 ? (
                                `Your awareness is flourishing. ${weekStats.respondedDifferentlyPercent}% agency shows the practice working.`
                            ) : weekStats.total > 10 ? (
                                "Awareness is growing. Each moment logged is progress."
                            ) : (
                                "You're beginning to notice. This is exactly where practice starts."
                            )
                        ) : (
                            "Awareness moments will appear here as you log them."
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
