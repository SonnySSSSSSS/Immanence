// src/components/ActivePathState.jsx
import React, { useState } from 'react';
import { getPathById } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function ActivePathState() {
    const { activePath, completeWeek, abandonPath, isWeekCompleted } = useNavigationStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

    if (!activePath) return null;

    const path = getPathById(activePath.pathId);
    if (!path) return null;

    const currentWeekData = path.weeks.find(w => w.number === activePath.currentWeek);
    const isPathComplete = activePath.currentWeek > path.duration;

    const handleCompleteWeek = () => {
        if (activePath.currentWeek <= path.duration) {
            completeWeek(activePath.currentWeek);
        }
    };

    const handleAbandon = () => {
        abandonPath();
        setShowAbandonConfirm(false);
    };

    return (
        <div
            className="w-full p-6 space-y-6 relative"
            style={{
                background: isLight
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)'
                    : 'linear-gradient(180deg, rgba(22, 22, 37, 0.95) 0%, rgba(16, 14, 28, 0.98) 100%)',
                border: isLight ? '2px solid rgba(180, 140, 90, 0.3)' : '2px solid rgba(250, 208, 120, 0.55)',
                borderRadius: '24px',
                boxShadow: isLight
                    ? '0 10px 40px rgba(180, 140, 90, 0.12)'
                    : '0 0 40px rgba(250, 208, 120, 0.15), inset 0 0 60px rgba(0, 0, 0, 0.5)',
            }}
        >
            {/* Corner ornaments */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.4)' : 'rgba(250, 208, 120, 0.7)' }} />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.4)' : 'rgba(250, 208, 120, 0.7)' }} />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.4)' : 'rgba(250, 208, 120, 0.7)' }} />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.4)' : 'rgba(250, 208, 120, 0.7)' }} />

            {/* Center top ornament */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div
                    className="w-3 h-3 rotate-45"
                    style={{
                        background: isLight ? 'rgba(180, 140, 90, 0.8)' : 'linear-gradient(to bottom right, #F5D18A, #D4A84A)',
                        boxShadow: isLight ? '0 2px 8px rgba(180, 140, 90, 0.2)' : '0 0 12px rgba(250, 208, 120, 0.6)'
                    }}
                />
            </div>

            {/* Header */}
            <div className="border-b" style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.15)' : 'var(--accent-15)' }}>
                <h2
                    className="text-2xl font-bold mb-2"
                    style={{
                        fontFamily: 'var(--font-display)',
                        letterSpacing: 'var(--tracking-mythic)',
                        color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)'
                    }}
                >
                    {path.title}
                </h2>
                <p
                    className="text-sm"
                    style={{ color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253,251,245,0.65)' }}
                >
                    {isPathComplete
                        ? 'Path Complete! 🎉'
                        : `Week ${activePath.currentWeek} of ${path.duration}`
                    }
                </p>
            </div>

            {/* Progress Timeline */}
            <div>
                <h3
                    className="text-base font-bold mb-3"
                    style={{
                        fontFamily: 'var(--font-display)',
                        letterSpacing: 'var(--tracking-wide)',
                        color: isLight ? 'rgba(180, 140, 90, 0.8)' : 'var(--accent-color)'
                    }}
                >
                    Progress
                </h3>
                <div className="flex items-center gap-2 mb-4">
                    {path.weeks.map((week, idx) => {
                        const isCompleted = isWeekCompleted(week.number);
                        const isCurrent = activePath.currentWeek === week.number;
                        const isFuture = week.number > activePath.currentWeek;

                        return (
                            <React.Fragment key={week.number}>
                                <div
                                    className="flex flex-col items-center gap-1"
                                    title={week.title}
                                >
                                    <div
                                        className={`
                                            w-4 h-4 rounded-full transition-all
                                        `}
                                        style={{
                                            background: isCompleted || isCurrent
                                                ? (isLight ? 'rgba(180, 140, 90, 0.8)' : 'var(--accent-color)')
                                                : 'transparent',
                                            border: isCompleted || isCurrent
                                                ? 'none'
                                                : isLight ? '1px solid rgba(180, 140, 90, 0.2)' : '1px solid var(--accent-30)',
                                            opacity: isCompleted || isCurrent ? 1 : 0.3,
                                            boxShadow: isCurrent
                                                ? (isLight ? '0 0 12px rgba(180, 140, 90, 0.4)' : '0 0 12px var(--accent-60)')
                                                : 'none'
                                        }}
                                    />
                                    <div className={`
                                        text-[9px] transition-opacity
                                    `} style={{ color: isCompleted || isCurrent ? (isLight ? 'rgba(90, 77, 60, 0.9)' : 'var(--accent-80)') : (isLight ? 'rgba(90, 77, 60, 0.4)' : 'var(--accent-40)') }}>
                                        {week.number}
                                    </div>
                                </div>
                                {idx < path.weeks.length - 1 && (
                                    <div className="flex-1 h-[2px] transition-all" style={{
                                        background: isCompleted ? (isLight ? 'rgba(180, 140, 90, 0.4)' : 'var(--accent-color)') : (isLight ? 'rgba(180, 140, 90, 0.1)' : 'var(--accent-15)'),
                                        opacity: isCompleted ? 0.6 : 0.3
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Current Week Panel */}
            {currentWeekData && !isPathComplete && (
                <div
                    className="border rounded-2xl p-4 transition-colors"
                    style={{
                        background: isLight ? 'rgba(180, 140, 90, 0.08)' : 'var(--accent-10)',
                        borderColor: isLight ? 'rgba(180, 140, 90, 0.2)' : 'var(--accent-20)'
                    }}
                >
                    <h3
                        className="text-lg font-bold mb-3"
                        style={{
                            fontFamily: 'var(--font-display)',
                            letterSpacing: 'var(--tracking-wide)',
                            color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)'
                        }}
                    >
                        Week {currentWeekData.number}: {currentWeekData.title}
                    </h3>

                    <div className="space-y-3">
                        {/* Focus */}
                        <div>
                            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-60)' }}>Focus</div>
                            <p
                                className="text-sm italic leading-relaxed"
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    letterSpacing: '0.01em',
                                    color: isLight ? 'rgba(60, 52, 37, 0.9)' : 'rgba(253,251,245,0.85)'
                                }}
                            >
                                {currentWeekData.focus}
                            </p>
                        </div>

                        {/* Practices */}
                        {currentWeekData.practices.length > 0 && (
                            <div>
                                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-60)' }}>Practices</div>
                                <ul className="space-y-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.01em' }}>
                                    {currentWeekData.practices.map((practice, idx) => (
                                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                                            <span style={{ color: isLight ? 'rgba(180, 140, 90, 0.7)' : 'var(--accent-50)' }} className="mt-0.5">•</span>
                                            <span>{practice}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Reading */}
                        {currentWeekData.reading.length > 0 && (
                            <div>
                                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-60)' }}>Reading</div>
                                <ul className="space-y-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.01em' }}>
                                    {currentWeekData.reading.map((chapterId, idx) => (
                                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                                            <span style={{ color: isLight ? 'rgba(180, 140, 90, 0.7)' : 'var(--accent-50)' }} className="mt-0.5">•</span>
                                            <span>{chapterId}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tracking */}
                        {currentWeekData.tracking && (
                            <div>
                                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-60)' }}>Tracking Focus</div>
                                <p
                                    className="text-sm"
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        letterSpacing: '0.01em',
                                        color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(253,251,245,0.8)'
                                    }}
                                >
                                    {currentWeekData.tracking}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Path Complete Message */}
            {isPathComplete && (
                <div className="text-center py-8">
                    <p
                        className="text-lg mb-2 font-bold"
                        style={{
                            fontFamily: 'var(--font-display)',
                            letterSpacing: 'var(--tracking-wide)',
                            color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)'
                        }}
                    >
                        You've completed this path!
                    </p>
                    <p
                        className="text-sm mb-4"
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontStyle: 'italic',
                            letterSpacing: '0.01em',
                            color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253,251,245,0.7)'
                        }}
                    >
                        {path.duration} weeks of practice integrated.
                    </p>
                </div>
            )}

            {/* Quick Actions */}
            {!isPathComplete && (
                <div>
                    <h3
                        className="text-base font-bold mb-3"
                        style={{
                            fontFamily: 'var(--font-display)',
                            letterSpacing: 'var(--tracking-wide)',
                            color: isLight ? 'rgba(180, 140, 90, 0.8)' : 'var(--accent-color)'
                        }}
                    >
                        Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Practice', action: 'go-to-practice' },
                            { label: 'Wisdom', action: 'go-to-wisdom' },
                            { label: 'Application', action: 'track-application' }
                        ].map((btn, i) => (
                            <button
                                key={i}
                                className="px-4 py-2 rounded-full border transition-all text-sm"
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    borderColor: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-30)',
                                    color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253,251,245,0.8)',
                                    background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = isLight ? 'rgba(180, 140, 90, 0.1)' : 'var(--accent-10)';
                                    e.target.style.borderColor = isLight ? 'rgba(180, 140, 90, 0.5)' : 'var(--accent-50)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = isLight ? 'rgba(255, 255, 255, 0.4)' : 'transparent';
                                    e.target.style.borderColor = isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-30)';
                                }}
                            >
                                → {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Ornamental Divider */}
            <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-4" style={{ color: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-30)' }}>
                    <div className={`w-24 h-[1px] bg-gradient-to-r from-transparent ${isLight ? 'to-[rgba(180,140,90,0.4)]' : 'to-[var(--accent-30)]'}`} />
                    <div style={{ fontSize: '10px' }}>◆</div>
                    <div className={`w-24 h-[1px] bg-gradient-to-l from-transparent ${isLight ? 'to-[rgba(180,140,90,0.4)]' : 'to-[var(--accent-30)]'}`} />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
                {!isPathComplete ? (
                    <>
                        <button
                            onClick={handleCompleteWeek}
                            className="flex-1 px-6 py-3 rounded-full text-[#050508] font-bold text-base shadow-[0_0_20px_var(--accent-30)] hover:shadow-[0_0_30px_var(--accent-40)] transition-all"
                            style={{ fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-mythic)', background: 'linear-gradient(to bottom right, var(--accent-color), var(--accent-secondary))' }}
                        >
                            COMPLETE WEEK {activePath.currentWeek}
                        </button>

                        {!showAbandonConfirm ? (
                            <button
                                onClick={() => setShowAbandonConfirm(true)}
                                className="px-4 py-3 text-sm transition-colors"
                                style={{ color: isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253,251,245,0.4)' }}
                                onMouseEnter={(e) => e.target.style.color = isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253,251,245,0.7)'}
                                onMouseLeave={(e) => e.target.style.color = isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253,251,245,0.4)'}
                            >
                                Abandon path
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAbandon}
                                    className="px-4 py-2 text-sm text-red-400 border border-red-400/30 rounded-full hover:bg-red-400/10 transition-colors"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setShowAbandonConfirm(false)}
                                    className="px-4 py-2 text-sm border rounded-full transition-colors"
                                    style={{
                                        color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253,251,245,0.6)',
                                        borderColor: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-20)',
                                        background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = isLight ? 'rgba(180, 140, 90, 0.1)' : 'var(--accent-10)'}
                                    onMouseLeave={(e) => e.target.style.background = isLight ? 'rgba(255, 255, 255, 0.4)' : 'transparent'}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <button
                        onClick={handleAbandon}
                        className="flex-1 px-6 py-3 rounded-full border transition-all"
                        style={{
                            fontFamily: 'var(--font-display)',
                            letterSpacing: 'var(--tracking-mythic)',
                            borderColor: isLight ? 'rgba(180, 140, 90, 0.5)' : 'var(--accent-30)',
                            color: isLight ? 'rgba(140, 100, 40, 0.9)' : 'rgba(253,251,245,0.8)',
                            background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'transparent',
                            fontWeight: 700
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = isLight ? 'rgba(180, 140, 90, 0.1)' : 'var(--accent-10)';
                            e.target.style.borderColor = isLight ? 'rgba(180, 140, 90, 0.7)' : 'var(--accent-50)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = isLight ? 'rgba(255, 255, 255, 0.4)' : 'transparent';
                            e.target.style.borderColor = isLight ? 'rgba(180, 140, 90, 0.5)' : 'var(--accent-30)';
                        }}
                    >
                        SELECT NEW PATH
                    </button>
                )}
            </div>
        </div>
    );
}
