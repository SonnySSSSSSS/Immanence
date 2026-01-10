// src/components/CurriculumHub.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM HUB — Full 14-day schedule view
// ═══════════════════════════════════════════════════════════════════════════
//
// Shows:
// - Complete 14-day timeline
// - Day status (pending/complete/today/missed)
// - Quick stats (streak, progress, avg focus)
// - Today's practice quick-start
//
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { RITUAL_FOUNDATION_14 } from '../data/ritualFoundation14.js';

// ═══════════════════════════════════════════════════════════════════════════
// DAY CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function DayCard({ day, status, completion, isLight, onSelect }) {
    const statusConfig = {
        complete: {
            bg: isLight ? 'rgba(100, 180, 100, 0.15)' : 'rgba(100, 200, 100, 0.15)',
            border: isLight ? 'rgba(100, 180, 100, 0.3)' : 'rgba(100, 200, 100, 0.25)',
            badge: '#4CAF50',
            icon: '✓',
        },
        today: {
            bg: isLight ? 'var(--accent-10)' : 'var(--accent-15)',
            border: 'var(--accent-40)',
            badge: 'var(--accent-color)',
            icon: day.dayNumber,
        },
        missed: {
            bg: isLight ? 'rgba(200, 100, 100, 0.08)' : 'rgba(200, 100, 100, 0.1)',
            border: isLight ? 'rgba(200, 100, 100, 0.2)' : 'rgba(200, 100, 100, 0.15)',
            badge: isLight ? 'rgba(180, 100, 100, 0.6)' : 'rgba(200, 100, 100, 0.5)',
            icon: '○',
        },
        future: {
            bg: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
            border: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
            badge: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.15)',
            icon: day.dayNumber,
        },
        pending: {
            bg: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
            border: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
            badge: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.15)',
            icon: day.dayNumber,
        },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const isClickable = status === 'today' && !completion?.completed;

    const duration = day.circuit 
        ? day.circuit.totalDuration 
        : day.practiceConfig?.duration || 10;

    return (
        <div
            className={`relative rounded-xl p-4 transition-all duration-200 ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
            style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
            }}
            onClick={() => isClickable && onSelect?.(day)}
        >
            {/* Today indicator */}
            {status === 'today' && (
                <div 
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                    style={{ background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-color)' }}
                />
            )}

            <div className="flex items-start gap-3">
                {/* Day badge */}
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                        background: config.badge,
                        color: status === 'complete' || status === 'today' ? (isLight ? 'white' : '#050508') : 'inherit',
                    }}
                >
                    {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4
                        className="font-medium text-sm truncate"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.9)',
                            opacity: status === 'future' ? 0.5 : 1,
                        }}
                    >
                        {day.title}
                    </h4>
                    <p
                        className="text-xs mt-0.5"
                        style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.5)',
                            opacity: status === 'future' ? 0.5 : 1,
                        }}
                    >
                        {day.circuit ? 'Circuit' : day.practiceType} • {duration}m
                    </p>
                </div>

                {/* Focus rating (if complete) */}
                {completion?.focusRating && (
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                            <div
                                key={n}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                    background: n <= completion.focusRating 
                                        ? 'var(--accent-color)' 
                                        : isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

function StatsSummary({ isLight }) {
    const { getProgress, getStreak, getAverageFocus, getTotalPracticeMinutes } = useCurriculumStore();
    
    const progress = getProgress();
    const streak = getStreak();
    const avgFocus = getAverageFocus();
    const totalMinutes = getTotalPracticeMinutes();

    const stats = [
        { label: 'Progress', value: `${progress.completed}/${progress.total}`, icon: '📊' },
        { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: '🔥' },
        { label: 'Avg Focus', value: avgFocus ? `${avgFocus}/5` : '—', icon: '🎯' },
        { label: 'Total Time', value: `${totalMinutes}m`, icon: '⏱️' },
    ];

    return (
        <div className="grid grid-cols-4 gap-3">
            {stats.map(stat => (
                <div
                    key={stat.label}
                    className="text-center p-3 rounded-xl"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <span className="text-lg">{stat.icon}</span>
                    <p
                        className="font-semibold text-sm mt-1"
                        style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.95)',
                        }}
                    >
                        {stat.value}
                    </p>
                    <p
                        className="text-xs"
                        style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.5)',
                        }}
                    >
                        {stat.label}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CurriculumHub({ onSelectDay, onClose, isInModal = false }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    const { 
        getCurrentDayNumber, 
        getDayStatus, 
        dayCompletions,
        curriculumStartDate,
        isCurriculumComplete,
    } = useCurriculumStore();

    const currentDay = getCurrentDayNumber();
    const curriculum = RITUAL_FOUNDATION_14;
    const isComplete = isCurriculumComplete();

    // Format start date
    const startDateStr = curriculumStartDate 
        ? new Date(curriculumStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Not started';

    console.log('[CurriculumHub] Rendering, isLight:', isLight, 'currentDay:', currentDay, 'isInModal:', isInModal);

    return (
        <div 
            className="px-6 py-6 space-y-6 rounded-xl"
            style={{
                border: isLight ? 'none' : '2px solid var(--accent-color)'
            }}
        >
            {/* Subtitle */}
            <p
                className="text-sm"
                style={{
                    color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)',
                }}
            >
                Started {startDateStr} • Day {currentDay} of 14
            </p>

            {/* Progress bar */}
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}>
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                        width: `${(Object.keys(dayCompletions).length / 14) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent-color), var(--accent-secondary))',
                    }}
                />
                {/* Current day marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white dark:bg-gray-900"
                    style={{
                        left: `${((currentDay - 1) / 14) * 100}%`,
                        borderColor: 'var(--accent-color)',
                    }}
                />
            </div>

            {/* Stats summary */}
            <StatsSummary isLight={isLight} />

            {/* Week labels and day grid */}
            <div className="space-y-4">
                {/* Week 1 */}
                <div>
                    <h3
                        className="text-xs uppercase tracking-wider mb-2 font-medium"
                        style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.4)',
                        }}
                    >
                        Week 1 — Settling
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {curriculum.days.slice(0, 7).map(day => (
                            <DayCard
                                key={day.dayNumber}
                                day={day}
                                status={getDayStatus(day.dayNumber)}
                                completion={dayCompletions[day.dayNumber]}
                                isLight={isLight}
                                onSelect={onSelectDay}
                            />
                        ))}
                    </div>
                </div>

                {/* Week 2 */}
                <div>
                    <h3
                        className="text-xs uppercase tracking-wider mb-2 font-medium"
                        style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.4)',
                        }}
                    >
                        Week 2 — Deepening
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {curriculum.days.slice(7, 14).map(day => (
                            <DayCard
                                key={day.dayNumber}
                                day={day}
                                status={getDayStatus(day.dayNumber)}
                                completion={dayCompletions[day.dayNumber]}
                                isLight={isLight}
                                onSelect={onSelectDay}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Completion banner */}
            {isComplete && (
                <div
                    className="p-4 rounded-xl text-center"
                    style={{
                        background: 'linear-gradient(135deg, var(--accent-15), var(--accent-10))',
                        border: '1px solid var(--accent-30)',
                    }}
                >
                    <span className="text-2xl">🎉</span>
                    <p
                        className="font-semibold mt-2"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--accent-color)',
                        }}
                    >
                        Curriculum Complete!
                    </p>
                    <p className="text-sm mt-1" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                        Review your completion report for insights.
                    </p>
                </div>
            )}
        </div>
    );
}

export default CurriculumHub;
