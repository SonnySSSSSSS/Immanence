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

    const renderTrendBar = (value, maxValue, index) => {
        const height = Math.max(10, (value / maxValue) * 100);
        return (
            <div key={index} className="flex-1 flex items-end justify-center" style={{ height: '60px' }}>
                <div
                    className="w-full bg-gradient-to-t from-[var(--accent-color)] to-[var(--accent-60)] rounded-t-sm"
                    style={{ height: `${height}%` }}
                />
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="bg-[#0f0f1a] border border-[var(--accent-15)] rounded-3xl p-8 space-y-8 relative overflow-hidden">
                {/* Application background - axe & stump */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-3xl"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}application-axe-stump.png)`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.17,
                        zIndex: 0,
                    }}
                />

                {/* Header */}
                <h3
                    className="application-card-label text-[var(--accent-70)] text-center relative z-10 font-bold tracking-[0.25em]"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    THIS WEEK
                </h3>

                {/* PRIMARY: Practice Consistency - Big & Clear */}
                <div className="relative" style={{ zIndex: 10 }}>
                    <div className="text-center mb-6">
                        <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 'var(--tracking-wide)', color: 'var(--accent-color)' }}>
                            {practiceDays}/{totalDays}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-[var(--accent-60)] mb-3">
                            Days Practiced
                        </div>
                        {practiceDays >= 6 && (
                            <div
                                className="inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-wider"
                                style={{ background: 'var(--gold-30)', color: 'var(--gold-100)' }}
                            >
                                Strong Week
                            </div>
                        )}
                        {practiceDays >= 4 && practiceDays < 6 && (
                            <div
                                className="inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-wider"
                                style={{ background: 'var(--accent-20)', color: 'var(--accent-color)' }}
                            >
                                On Path
                            </div>
                        )}
                    </div>

                    <div className="flex gap-1 max-w-xs mx-auto">
                        {Array.from({ length: totalDays }).map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-2 rounded-full ${i < practiceDays
                                    ? 'bg-[var(--ui-button-gradient)]'
                                    : 'bg-[var(--accent-10)]'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* SECONDARY: Awareness & Agency - Side by Side */}
                <div className="grid grid-cols-2 gap-6 relative" style={{ zIndex: 10 }}>
                    {/* Awareness Moments */}
                    <div>
                        <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-2">
                            Awareness
                        </div>
                        <div className="text-3xl text-[var(--accent-color)] mb-1 font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                            {weekStats.total}
                        </div>
                        <div className="text-[10px] text-[rgba(253,251,245,0.5)]">
                            moments logged
                        </div>
                    </div>

                    {/* Responded Differently */}
                    <div>
                        <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-2">
                            Agency
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl text-[var(--accent-color)] font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                                {weekStats.respondedDifferently}
                            </span>
                            <span className="text-lg text-[var(--accent-80)]">
                                {weekStats.respondedDifferentlyPercent}%
                            </span>
                        </div>
                        <div className="text-[10px] text-[rgba(253,251,245,0.5)]">
                            different responses
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-4 text-[var(--accent-30)]">
                        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[var(--accent-30)]" />
                        <div style={{ fontSize: '10px' }}>◆</div>
                        <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[var(--accent-30)]" />
                    </div>
                </div>

                {/* Trend (past 8 weeks) */}
                <div>
                    <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-3 text-center">
                        Trend (Past 8 Weeks)
                    </div>

                    {/* Awareness Trend */}
                    <div className="mb-4">
                        <div className="text-xs text-[rgba(253,251,245,0.6)] mb-2">Awareness</div>
                        <div className="flex gap-1">
                            {awarenessTrend.map((value, i) => renderTrendBar(value, Math.max(...awarenessTrend), i))}
                        </div>
                    </div>

                    {/* Agency Trend */}
                    <div className="mb-4">
                        <div className="text-xs text-[rgba(253,251,245,0.6)] mb-2">Agency</div>
                        <div className="flex gap-1">
                            {agencyTrend.map((value, i) => renderTrendBar(value, Math.max(...agencyTrend), i))}
                        </div>
                    </div>

                    {/* Practice Trend */}
                    <div className="mb-4">
                        <div className="text-xs text-[rgba(253,251,245,0.6)] mb-2">Practice</div>
                        <div className="flex gap-1">
                            {practiceTrend.map((value, i) => renderTrendBar(value, 7, i))}
                        </div>
                    </div>
                </div>

                {/* Insight */}
                <div className="border-t border-[var(--accent-10)] pt-4">
                    <p
                        className="text-sm text-[rgba(253,251,245,0.7)] italic text-center leading-relaxed font-medium"
                        style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
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
