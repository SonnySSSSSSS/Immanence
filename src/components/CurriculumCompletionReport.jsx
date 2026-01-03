// src/components/CurriculumCompletionReport.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM COMPLETION REPORT — End-of-curriculum summary
// ═══════════════════════════════════════════════════════════════════════════
//
// Auto-shown when:
// - All 14 days are complete, OR
// - Day 15 is reached
//
// Displays:
// - Days completed / 14
// - Total practice time
// - Consistency rate
// - Average focus quality
// - Challenge frequency
// - Next steps
//
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { CURRICULUM_CHALLENGES, RITUAL_FOUNDATION_14 } from '../data/ritualFoundation14.js';
import { PillButton } from './ui/PillButton';

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, sublabel, isLight, highlight = false }) {
    return (
        <div
            className="p-4 rounded-xl text-center"
            style={{
                background: highlight
                    ? 'linear-gradient(135deg, var(--accent-15), var(--accent-10))'
                    : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                border: highlight ? '1px solid var(--accent-30)' : 'none',
            }}
        >
            <span className="text-2xl">{icon}</span>
            <p
                className="text-2xl font-bold mt-2"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: highlight ? 'var(--accent-color)' : isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.95)',
                }}
            >
                {value}
            </p>
            <p
                className="text-sm mt-1"
                style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}
            >
                {label}
            </p>
            {sublabel && (
                <p
                    className="text-xs mt-0.5"
                    style={{ color: isLight ? 'rgba(60, 50, 40, 0.4)' : 'rgba(253,251,245,0.4)' }}
                >
                    {sublabel}
                </p>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHALLENGE BAR CHART
// ═══════════════════════════════════════════════════════════════════════════

function ChallengeChart({ challengeStats, isLight }) {
    const maxCount = Math.max(...Object.values(challengeStats), 1);
    
    // Sort by count descending
    const sortedChallenges = CURRICULUM_CHALLENGES
        .map(c => ({ ...c, count: challengeStats[c.id] || 0 }))
        .filter(c => c.count > 0)
        .sort((a, b) => b.count - a.count);

    if (sortedChallenges.length === 0) {
        return (
            <p
                className="text-center text-sm py-4"
                style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.5)' }}
            >
                No challenges recorded ✨
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {sortedChallenges.map(challenge => (
                <div key={challenge.id} className="flex items-center gap-3">
                    <span className="w-6 text-center">{challenge.icon}</span>
                    <div className="flex-1">
                        <div
                            className="h-6 rounded-full flex items-center px-3"
                            style={{
                                width: `${Math.max((challenge.count / maxCount) * 100, 20)}%`,
                                background: 'var(--accent-20)',
                            }}
                        >
                            <span
                                className="text-xs font-medium"
                                style={{ color: 'var(--accent-color)' }}
                            >
                                {challenge.label}
                            </span>
                        </div>
                    </div>
                    <span
                        className="text-sm font-bold w-6 text-right"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}
                    >
                        {challenge.count}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOCUS QUALITY TREND
// ═══════════════════════════════════════════════════════════════════════════

function FocusTrend({ dayCompletions, isLight }) {
    const focusData = [];
    for (let day = 1; day <= 14; day++) {
        const completion = dayCompletions[day];
        focusData.push({
            day,
            rating: completion?.focusRating || null,
            completed: !!completion?.completed,
        });
    }

    return (
        <div className="flex items-end justify-between h-16 gap-1">
            {focusData.map(data => (
                <div
                    key={data.day}
                    className="flex-1 flex flex-col items-center gap-1"
                >
                    <div
                        className="w-full rounded-t transition-all"
                        style={{
                            height: data.rating ? `${(data.rating / 5) * 100}%` : '4px',
                            background: data.completed
                                ? data.rating
                                    ? `var(--accent-${20 + data.rating * 15})`
                                    : 'var(--accent-30)'
                                : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                            minHeight: '4px',
                        }}
                    />
                    <span
                        className="text-[9px]"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.4)' : 'rgba(253,251,245,0.4)' }}
                    >
                        {data.day}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CurriculumCompletionReport({ onDismiss, onRestart }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const {
        getProgress,
        getStreak,
        getAverageFocus,
        getTotalPracticeMinutes,
        getChallengeStats,
        dayCompletions,
        curriculumStartDate,
    } = useCurriculumStore();

    const progress = getProgress();
    const streak = getStreak();
    const avgFocus = getAverageFocus();
    const totalMinutes = getTotalPracticeMinutes();
    const challengeStats = getChallengeStats();

    // Calculate consistency rate (% of expected days actually practiced)
    const expectedDays = 14;
    const consistencyRate = Math.round((progress.completed / expectedDays) * 100);

    // Calculate date range
    const startDate = curriculumStartDate ? new Date(curriculumStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13);

    const dateRangeStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    // Determine completion message
    const completionMessages = [
        { min: 100, message: "Perfect completion! You showed up every single day. 🏆" },
        { min: 85, message: "Excellent consistency! A powerful foundation has been laid. 🌟" },
        { min: 70, message: "Good progress! The seeds of practice are planted. 🌱" },
        { min: 50, message: "A worthy beginning. Every practice counts. 💪" },
        { min: 0, message: "The journey continues. What matters is that you started. 🔥" },
    ];
    const completionMessage = completionMessages.find(m => consistencyRate >= m.min)?.message;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto py-8"
            style={{
                background: isLight ? 'rgba(245, 240, 235, 0.98)' : 'rgba(5, 5, 8, 0.98)',
            }}
        >
            <div className="max-w-lg w-full mx-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div
                        className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
                            boxShadow: '0 8px 32px var(--accent-30)',
                        }}
                    >
                        <span className="text-4xl">🎉</span>
                    </div>
                    <h1
                        className="text-2xl font-bold"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--accent-color)',
                        }}
                    >
                        Curriculum Complete
                    </h1>
                    <p
                        className="text-sm mt-2"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}
                    >
                        {RITUAL_FOUNDATION_14.name} • {dateRangeStr}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <StatCard
                        icon="📊"
                        label="Days Completed"
                        value={`${progress.completed}/${progress.total}`}
                        sublabel={`${consistencyRate}% consistency`}
                        isLight={isLight}
                        highlight={true}
                    />
                    <StatCard
                        icon="⏱️"
                        label="Total Practice"
                        value={`${totalMinutes}m`}
                        sublabel={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
                        isLight={isLight}
                    />
                    <StatCard
                        icon="🎯"
                        label="Avg Focus"
                        value={avgFocus ? `${avgFocus}/5` : '—'}
                        isLight={isLight}
                    />
                    <StatCard
                        icon="🔥"
                        label="Best Streak"
                        value={`${streak} days`}
                        isLight={isLight}
                    />
                </div>

                {/* Focus Trend */}
                <div
                    className="p-4 rounded-xl mb-6"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <h3
                        className="text-sm font-medium mb-3"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}
                    >
                        Focus Quality Over 14 Days
                    </h3>
                    <FocusTrend dayCompletions={dayCompletions} isLight={isLight} />
                </div>

                {/* Challenge Summary */}
                <div
                    className="p-4 rounded-xl mb-6"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <h3
                        className="text-sm font-medium mb-3"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}
                    >
                        Challenges Encountered
                    </h3>
                    <ChallengeChart challengeStats={challengeStats} isLight={isLight} />
                </div>

                {/* Completion Message */}
                <div
                    className="p-4 rounded-xl text-center mb-6"
                    style={{
                        background: 'linear-gradient(135deg, var(--accent-10), var(--accent-05))',
                        border: '1px solid var(--accent-20)',
                    }}
                >
                    <p
                        className="text-sm italic"
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)',
                        }}
                    >
                        {completionMessage}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onDismiss}
                        className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                        style={{
                            background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                            color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)',
                        }}
                    >
                        Continue to App
                    </button>
                    {/* Future: Add restart option
                    <button
                        onClick={onRestart}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: 'var(--accent-color)',
                            color: isLight ? 'white' : '#050508',
                        }}
                    >
                        Start New Curriculum
                    </button>
                    */}
                </div>
            </div>
        </div>
    );
}

export default CurriculumCompletionReport;
