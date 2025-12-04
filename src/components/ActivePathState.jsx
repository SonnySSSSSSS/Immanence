// src/components/ActivePathState.jsx
import React, { useState } from 'react';
import { getPathById } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';

export function ActivePathState() {
    const { activePath, completeWeek, abandonPath, isWeekCompleted } = useNavigationStore();
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
        <div className="w-full bg-[#161625] border border-[var(--accent-15)] rounded-3xl p-6 space-y-6">
            {/* Header */}
            <div className="border-b border-[var(--accent-15)] pb-4">
                <h2
                    className="text-2xl font-semibold text-[#fcd34d] mb-2"
                    style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.02em' }}
                >
                    {path.title}
                </h2>
                <p className="text-sm text-[rgba(253,251,245,0.65)]">
                    {isPathComplete
                        ? 'Path Complete! 🎉'
                        : `Week ${activePath.currentWeek} of ${path.duration}`
                    }
                </p>
            </div>

            {/* Progress Timeline */}
            <div>
                <h3
                    className="text-base font-semibold text-[#fcd34d] mb-3"
                    style={{ fontFamily: 'Cinzel, serif' }}
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
                      ${isCompleted
                                                ? 'bg-[#fcd34d] opacity-100 shadow-[0_0_8px_var(--accent-40)]'
                                                : isCurrent
                                                    ? 'bg-[#fcd34d] opacity-100 shadow-[0_0_12px_var(--accent-60)] animate-pulse'
                                                    : 'border border-[var(--accent-30)] bg-transparent opacity-30'
                                            }
                    `}
                                    />
                                    <div className={`
                    text-[9px] transition-opacity
                    ${isCompleted || isCurrent ? 'text-[var(--accent-80)] opacity-100' : 'text-[var(--accent-40)] opacity-40'}
                  `}>
                                        {week.number}
                                    </div>
                                </div>
                                {idx < path.weeks.length - 1 && (
                                    <div className={`
                    flex-1 h-[2px] transition-all
                    ${isCompleted ? 'bg-[#fcd34d] opacity-60' : 'bg-[var(--accent-15)] opacity-30'}
                  `} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Current Week Panel */}
            {currentWeekData && !isPathComplete && (
                <div className="border border-[var(--accent-20)] rounded-2xl p-4 bg-[var(--accent-10)]">
                    <h3
                        className="text-lg font-semibold text-[#fcd34d] mb-3"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Week {currentWeekData.number}: {currentWeekData.title}
                    </h3>

                    <div className="space-y-3">
                        {/* Focus */}
                        <div>
                            <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1">Focus</div>
                            <p
                                className="text-sm text-[rgba(253,251,245,0.85)] italic leading-relaxed"
                                style={{ fontFamily: 'Crimson Pro, serif' }}
                            >
                                {currentWeekData.focus}
                            </p>
                        </div>

                        {/* Practices */}
                        {currentWeekData.practices.length > 0 && (
                            <div>
                                <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1">Practices</div>
                                <ul className="space-y-1" style={{ fontFamily: 'Crimson Pro, serif' }}>
                                    {currentWeekData.practices.map((practice, idx) => (
                                        <li key={idx} className="text-sm text-[rgba(253,251,245,0.8)] flex items-start gap-2">
                                            <span className="text-[var(--accent-50)] mt-0.5">•</span>
                                            <span>{practice}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Reading */}
                        {currentWeekData.reading.length > 0 && (
                            <div>
                                <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1">Reading</div>
                                <ul className="space-y-1" style={{ fontFamily: 'Crimson Pro, serif' }}>
                                    {currentWeekData.reading.map((chapterId, idx) => (
                                        <li key={idx} className="text-sm text-[rgba(253,251,245,0.8)] flex items-start gap-2">
                                            <span className="text-[var(--accent-50)] mt-0.5">•</span>
                                            <span>{chapterId}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tracking */}
                        {currentWeekData.tracking && (
                            <div>
                                <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1">Tracking Focus</div>
                                <p
                                    className="text-sm text-[rgba(253,251,245,0.8)]"
                                    style={{ fontFamily: 'Crimson Pro, serif' }}
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
                        className="text-lg text-[#fcd34d] mb-2"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        You've completed this path!
                    </p>
                    <p
                        className="text-sm text-[rgba(253,251,245,0.7)] mb-4"
                        style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}
                    >
                        {path.duration} weeks of practice integrated.
                    </p>
                </div>
            )}

            {/* Quick Actions */}
            {!isPathComplete && (
                <div>
                    <h3
                        className="text-base font-semibold text-[#fcd34d] mb-3"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 rounded-full border border-[var(--accent-30)] text-sm text-[rgba(253,251,245,0.8)] hover:border-[var(--accent-50)] hover:bg-[var(--accent-10)] transition-all">
                            → Go to Practice
                        </button>
                        <button className="px-4 py-2 rounded-full border border-[var(--accent-30)] text-sm text-[rgba(253,251,245,0.8)] hover:border-[var(--accent-50)] hover:bg-[var(--accent-10)] transition-all">
                            → Go to Wisdom
                        </button>
                        <button className="px-4 py-2 rounded-full border border-[var(--accent-30)] text-sm text-[rgba(253,251,245,0.8)] hover:border-[var(--accent-50)] hover:bg-[var(--accent-10)] transition-all">
                            → Track Application
                        </button>
                    </div>
                </div>
            )}

            {/* Ornamental Divider */}
            <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-4 text-[var(--accent-30)]">
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[var(--accent-30)]" />
                    <div style={{ fontSize: '10px' }}>◆</div>
                    <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[var(--accent-30)]" />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
                {!isPathComplete ? (
                    <>
                        <button
                            onClick={handleCompleteWeek}
                            className="flex-1 px-6 py-3 rounded-full bg-[var(--ui-button-gradient)] text-[#050508] font-semibold text-base shadow-[0_0_20px_var(--accent-30)] hover:shadow-[0_0_30px_var(--accent-40)] transition-all"
                            style={{ fontFamily: 'Cinzel, serif' }}
                        >
                            COMPLETE WEEK {activePath.currentWeek}
                        </button>

                        {!showAbandonConfirm ? (
                            <button
                                onClick={() => setShowAbandonConfirm(true)}
                                className="px-4 py-3 text-sm text-[rgba(253,251,245,0.4)] hover:text-[rgba(253,251,245,0.7)] transition-colors"
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
                                    className="px-4 py-2 text-sm text-[rgba(253,251,245,0.6)] border border-[var(--accent-20)] rounded-full hover:bg-[var(--accent-10)] transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <button
                        onClick={handleAbandon}
                        className="flex-1 px-6 py-3 rounded-full border border-[var(--accent-30)] text-[rgba(253,251,245,0.8)] hover:border-[var(--accent-50)] hover:bg-[var(--accent-10)] transition-all"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        SELECT NEW PATH
                    </button>
                )}
            </div>
        </div>
    );
}
