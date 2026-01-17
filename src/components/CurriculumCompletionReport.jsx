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
            <span className="text-3xl">{icon}</span>
            <p
                className="text-3xl font-bold mt-2"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: highlight ? 'var(--accent-color)' : isLight ? 'rgba(60, 50, 40, 0.95)' : 'rgba(253,251,245,0.98)',
                }}
            >
                {value}
            </p>
            <p
                className="text-base font-medium mt-1"
                style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}
            >
                {label}
            </p>
            {sublabel && (
                <p
                    className="text-sm mt-0.5"
                    style={{ color: isLight ? 'rgba(60, 50, 40, 0.55)' : 'rgba(253,251,245,0.55)' }}
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

function FocusTrend({ dayCompletions, isLight, totalDays }) {
    const focusData = [];
    for (let day = 1; day <= totalDays; day++) {
        const completion = dayCompletions[day];
        focusData.push({
            day,
            rating: completion?.focusRating || null,
            completed: !!completion?.completed,
            percentage: ((day - 1) / (totalDays - 1)) * 100, // 0% to 100%
        });
    }

    return (
        <div className="relative h-24 w-full">
            {/* Percentage markers */}
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.4)' : 'rgba(253,251,245,0.4)' }}>
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
            </div>

            {/* Bar chart with absolute positioning */}
            <div className="absolute inset-0 bottom-5">
                {focusData.map(data => (
                    <div
                        key={data.day}
                        className="absolute bottom-0 flex flex-col items-center"
                        style={{
                            left: `${data.percentage}%`,
                            transform: 'translateX(-50%)',
                            width: totalDays <= 14 ? '8px' : totalDays <= 30 ? '4px' : '2px',
                        }}
                    >
                        <div
                            className="rounded-t transition-all"
                            style={{
                                width: '100%',
                                height: data.rating ? `${(data.rating / 5) * 100}%` : '4px',
                                background: data.completed
                                    ? data.rating
                                        ? `var(--accent-${20 + data.rating * 15})`
                                        : 'var(--accent-30)'
                                    : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                                minHeight: '4px',
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CurriculumCompletionReport({ onDismiss, onRestart }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.mode);
    const isLight = colorScheme === 'light';
    const isSanctuary = displayMode === 'sanctuary';

    const {
        getProgress,
        getStreak,
        getAverageFocus,
        getTotalPracticeMinutes,
        getChallengeStats,
        dayCompletions,
        curriculumStartDate,
        getActiveCurriculum,
    } = useCurriculumStore();

    const progress = getProgress();
    const streak = getStreak();
    const avgFocus = getAverageFocus();
    const totalMinutes = getTotalPracticeMinutes();
    const challengeStats = getChallengeStats();

    // Get curriculum data for dynamic totals
    const curriculum = getActiveCurriculum();
    const totalDays = curriculum?.duration || 14;

    // Calculate consistency rate (% of expected days actually practiced)
    const consistencyRate = Math.round((progress.completed / progress.total) * 100);

    // Calculate date range
    const startDate = curriculumStartDate ? new Date(curriculumStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (totalDays - 1));

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
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto py-8 px-4 no-scrollbar\"
            style={{
                background: isLight ? 'rgba(245, 240, 235, 0.98)' : 'rgba(5, 5, 8, 0.98)',
            }}
        >
            <div
                className="w-full mx-auto"
                style={{
                    maxWidth: isSanctuary ? '700px' : '500px',
                }}
            >
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
                        className="text-base font-semibold mb-4"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.85)' : 'rgba(253,251,245,0.85)' }}
                    >
                        Focus Quality Over Time
                    </h3>
                    <div className="text-xs mb-3" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                        {totalDays} days of practice
                    </div>
                    <FocusTrend dayCompletions={dayCompletions} isLight={isLight} totalDays={totalDays} />
                </div>

                {/* Challenge Summary */}
                <div
                    className="p-4 rounded-xl mb-6"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <h3
                        className="text-base font-semibold mb-4"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.85)' : 'rgba(253,251,245,0.85)' }}
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
