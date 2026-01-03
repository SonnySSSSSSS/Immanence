import React from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function DailyPracticeTracker({ onSelectSection }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const {
        onboardingComplete,
        getCurrentDayNumber,
        getDayLegsWithStatus,
        getStreak,
        setActivePracticeSession,
    } = useCurriculumStore();

    if (!onboardingComplete) return null;

    const dayNumber = getCurrentDayNumber();
    const legs = getDayLegsWithStatus(dayNumber);
    const streak = getStreak();

    if (legs.length === 0) return null;

    const handleStartLeg = (leg) => {
        setActivePracticeSession(dayNumber);
        if (onSelectSection) {
            onSelectSection('practice');
        }
    };

    const completedCount = legs.filter(l => l.completed).length;

    return (
        <div
            className="w-full rounded-[24px] overflow-hidden transition-all duration-700"
            style={{
                background: isLight ? '#faf6ee' : 'rgba(25, 20, 30, 0.98)',
                border: isLight ? '1px solid rgba(160, 120, 60, 0.15)' : '1px solid var(--accent-20)',
                boxShadow: isLight
                    ? '0 10px 30px rgba(80, 50, 20, 0.15)'
                    : '0 30px 80px rgba(0, 0, 0, 0.6)',
            }}
        >
            {/* Header */}
            <div className="px-5 py-4 border-b" style={{
                borderColor: isLight ? 'rgba(160, 120, 60, 0.1)' : 'var(--accent-10)',
                background: isLight ? 'rgba(60, 50, 35, 0.02)' : 'rgba(0, 0, 0, 0.2)',
            }}>
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <div style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            opacity: 0.6,
                            color: isLight ? '#3c3020' : '#fdfbf5',
                        }}>
                            Today's Practice
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            color: isLight ? '#3c3020' : '#fdfbf5',
                            marginTop: '2px',
                        }}>
                            Day {dayNumber} of 14
                        </div>
                    </div>

                    {streak > 1 && (
                        <div style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: 'rgba(255, 200, 0, 0.1)',
                            border: '1px solid rgba(255, 200, 0, 0.3)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            color: 'var(--accent-color)',
                        }}>
                            ðŸ”¥ {streak} Day Streak
                        </div>
                    )}
                </div>
            </div>

            {/* Legs List */}
            <div className="divide-y" style={{
                borderColor: isLight ? 'rgba(160, 120, 60, 0.1)' : 'var(--accent-10)',
            }}>
                {legs.map((leg) => (
                    <div
                        key={`${dayNumber}-${leg.legNumber}`}
                        className="px-5 py-4 transition-all duration-200"
                        style={{
                            background: leg.completed ? (isLight ? 'rgba(100, 150, 100, 0.05)' : 'rgba(100, 150, 100, 0.08)') : 'transparent',
                        }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            {/* Left: Time + Status */}
                            <div className="flex items-center gap-3 flex-1">
                                {/* Status Icon */}
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: leg.completed ? 'var(--accent-color)' : (isLight ? 'rgba(60, 50, 35, 0.1)' : 'rgba(255, 255, 255, 0.1)'),
                                    color: leg.completed ? '#fff' : (isLight ? '#3c3020' : '#fdfbf5'),
                                }}>
                                    {leg.completed ? 'âœ“' : leg.legNumber}
                                </div>

                                {/* Time + Description */}
                                <div className="flex-1">
                                    <div style={{
                                        fontSize: '12px',
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 600,
                                        color: isLight ? '#3c3020' : '#fdfbf5',
                                    }}>
                                        {leg.time ? leg.time.substring(0, 5) : 'Anytime'}
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        opacity: 0.6,
                                        color: isLight ? '#3c3020' : '#fdfbf5',
                                        marginTop: '2px',
                                    }}>
                                        {leg.description || leg.practiceType}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Action Button */}
                            {!leg.completed ? (
                                <button
                                    onClick={() => handleStartLeg(leg)}
                                    className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
                                    style={{
                                        background: 'var(--accent-color)',
                                        color: '#fff',
                                        boxShadow: '0 4px 12px var(--accent-30)',
                                    }}
                                >
                                    Start
                                </button>
                            ) : (
                                <div style={{
                                    fontSize: '10px',
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 600,
                                    color: 'var(--accent-color)',
                                    opacity: 0.8,
                                }}>
                                    Complete
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer: Summary */}
            <div className="px-5 py-3" style={{
                background: isLight ? 'rgba(60, 50, 35, 0.02)' : 'rgba(0, 0, 0, 0.2)',
                borderTop: isLight ? '1px solid rgba(160, 120, 60, 0.1)' : '1px solid var(--accent-10)',
            }}>
                <div style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: isLight ? 'rgba(60, 50, 35, 0.5)' : 'rgba(253, 251, 245, 0.4)',
                }}>
                    {completedCount} of {legs.length} legs complete
                </div>
            </div>
        </div>
    );
}

export default DailyPracticeTracker;
