// src/components/PathOverviewPanel.jsx
import React, { useState } from 'react';
import { getPathById } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';

export function PathOverviewPanel({ pathId }) {
    const path = getPathById(pathId);
    const { beginPath } = useNavigationStore();
    const [expandedWeeks, setExpandedWeeks] = useState([]);

    if (!path || path.placeholder) return null;

    const toggleWeek = (weekNumber) => {
        setExpandedWeeks(prev =>
            prev.includes(weekNumber)
                ? prev.filter(w => w !== weekNumber)
                : [...prev, weekNumber]
        );
    };

    const handleBegin = () => {
        beginPath(pathId);
    };

    return (
        <div className="w-full bg-[#161625] border border-[rgba(253,224,71,0.15)] rounded-3xl p-6 space-y-6">
            {/* Header */}
            <div className="border-b border-[rgba(253,224,71,0.15)] pb-4">
                <h2
                    className="text-2xl font-semibold text-[#fcd34d] mb-2"
                    style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.02em' }}
                >
                    {path.title}
                </h2>
                <p
                    className="text-base text-[rgba(253,251,245,0.75)] italic mb-2"
                    style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                    {path.subtitle}
                </p>
                <div className="text-sm text-[rgba(253,224,71,0.6)]">
                    {path.duration} weeks
                </div>
            </div>

            {/* Practice Section */}
            {path.practices.length > 0 && (
                <div>
                    <h3
                        className="text-base font-semibold text-[#fcd34d] mb-2"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Practice
                    </h3>
                    <ul className="space-y-1.5" style={{ fontFamily: 'Crimson Pro, serif' }}>
                        {path.practices.map((practice, idx) => (
                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.8)] flex items-center gap-2">
                                <span className="text-[rgba(253,224,71,0.5)]">•</span>
                                {practice.type}
                                {practice.pattern && ` (${practice.pattern})`}
                                {practice.duration && ` - ${practice.duration}min`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Wisdom Section */}
            {path.chapters.length > 0 && (
                <div>
                    <h3
                        className="text-base font-semibold text-[#fcd34d] mb-2"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Wisdom
                    </h3>
                    <ul className="space-y-1.5" style={{ fontFamily: 'Crimson Pro, serif' }}>
                        {path.chapters.map((chapterId, idx) => (
                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.8)] flex items-center gap-2">
                                <span className="text-[rgba(253,224,71,0.5)]">•</span>
                                {chapterId}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Application Section */}
            {path.applicationItems.length > 0 && (
                <div>
                    <h3
                        className="text-base font-semibold text-[#fcd34d] mb-2"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Application
                    </h3>
                    <ul className="space-y-1.5" style={{ fontFamily: 'Crimson Pro, serif' }}>
                        {path.applicationItems.map((item, idx) => (
                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.8)] flex items-center gap-2">
                                <span className="text-[rgba(253,224,71,0.5)]">□</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Weekly Timeline */}
            {path.weeks.length > 0 && (
                <div>
                    <h3
                        className="text-base font-semibold text-[#fcd34d] mb-3"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Weekly Timeline
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                        {path.weeks.map((week, idx) => (
                            <React.Fragment key={week.number}>
                                <div
                                    className="flex flex-col items-center gap-1"
                                    title={week.title}
                                >
                                    <div className="w-3 h-3 rounded-full border border-[rgba(253,224,71,0.3)] bg-[rgba(253,224,71,0.05)]" />
                                    <div className="text-[9px] text-[rgba(253,224,71,0.4)]">{week.number}</div>
                                </div>
                                {idx < path.weeks.length - 1 && (
                                    <div className="flex-1 h-[1px] bg-[rgba(253,224,71,0.15)]" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* Weekly Breakdown */}
            {path.weeks.length > 0 && (
                <div>
                    <h3
                        className="text-base font-semibold text-[#fcd34d] mb-3"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Weekly Breakdown
                    </h3>
                    <div className="space-y-2">
                        {path.weeks.map((week) => {
                            const isExpanded = expandedWeeks.includes(week.number);

                            return (
                                <div
                                    key={week.number}
                                    className="border border-[rgba(253,224,71,0.1)] rounded-xl overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleWeek(week.number)}
                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[rgba(253,224,71,0.05)] transition-colors text-left"
                                    >
                                        <span className="text-[rgba(253,224,71,0.5)]">
                                            {isExpanded ? '▾' : '▸'}
                                        </span>
                                        <span
                                            className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider"
                                            style={{ fontFamily: 'Cinzel, serif' }}
                                        >
                                            Week {week.number}
                                        </span>
                                        <span
                                            className="flex-1 text-sm text-[rgba(253,251,245,0.85)]"
                                            style={{ fontFamily: 'Crimson Pro, serif' }}
                                        >
                                            {week.title}
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-3 border-t border-[rgba(253,224,71,0.08)] pt-3">
                                            {/* Focus */}
                                            <div>
                                                <div className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider mb-1">Focus</div>
                                                <p
                                                    className="text-sm text-[rgba(253,251,245,0.8)] italic leading-relaxed"
                                                    style={{ fontFamily: 'Crimson Pro, serif' }}
                                                >
                                                    {week.focus}
                                                </p>
                                            </div>

                                            {/* Practices */}
                                            {week.practices.length > 0 && (
                                                <div>
                                                    <div className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider mb-1">Practices</div>
                                                    <ul className="space-y-1" style={{ fontFamily: 'Crimson Pro, serif' }}>
                                                        {week.practices.map((practice, idx) => (
                                                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.75)] flex items-start gap-2">
                                                                <span className="text-[rgba(253,224,71,0.4)] mt-0.5">•</span>
                                                                <span>{practice}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Reading */}
                                            {week.reading.length > 0 && (
                                                <div>
                                                    <div className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider mb-1">Reading</div>
                                                    <ul className="space-y-1" style={{ fontFamily: 'Crimson Pro, serif' }}>
                                                        {week.reading.map((chapterId, idx) => (
                                                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.75)] flex items-start gap-2">
                                                                <span className="text-[rgba(253,224,71,0.4)] mt-0.5">•</span>
                                                                <span>{chapterId}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Tracking */}
                                            {week.tracking && (
                                                <div>
                                                    <div className="text-xs text-[rgba(253,224,71,0.6)] uppercase tracking-wider mb-1">Tracking Focus</div>
                                                    <p
                                                        className="text-sm text-[rgba(253,251,245,0.75)]"
                                                        style={{ fontFamily: 'Crimson Pro, serif' }}
                                                    >
                                                        {week.tracking}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ornamental Divider */}
            <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-4 text-[rgba(253,224,71,0.3)]">
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[rgba(253,224,71,0.3)]" />
                    <div style={{ fontSize: '10px' }}>◆</div>
                    <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[rgba(253,224,71,0.3)]" />
                </div>
            </div>

            {/* BEGIN Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleBegin}
                    className="px-8 py-3 rounded-full bg-gradient-to-br from-[#fcd34d] to-[#f59e0b] text-[#050508] font-semibold text-base shadow-[0_0_20px_rgba(253,224,71,0.3)] hover:shadow-[0_0_30px_rgba(253,224,71,0.4)] transition-all"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    BEGIN PATH
                </button>
            </div>
        </div>
    );
}
