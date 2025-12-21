// src/components/PathOverviewPanel.jsx
import React, { useState } from 'react';
import { getPathById } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { treatiseChapters } from '../data/treatise.generated.js';

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

    // Helper to get chapter title from ID
    const getChapterTitle = (chapterId) => {
        const chapter = treatiseChapters.find(ch => ch.id === chapterId);
        if (chapter) return chapter.title;

        // Fallback: format the ID nicely
        return chapterId
            .replace(/chapter-/g, 'Chapter ')
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div
            className="w-full p-6 space-y-6 relative"
            style={{
                background: 'linear-gradient(180deg, rgba(22, 22, 37, 0.95) 0%, rgba(16, 14, 28, 0.98) 100%)',
                border: '2px solid rgba(250, 208, 120, 0.55)',
                borderRadius: '24px',
                boxShadow: '0 0 40px rgba(250, 208, 120, 0.15), inset 0 0 60px rgba(0, 0, 0, 0.5)',
            }}
        >
            {/* Center top ornament */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 rotate-45 bg-gradient-to-br from-[#F5D18A] to-[#D4A84A]" style={{ boxShadow: '0 0 12px rgba(250, 208, 120, 0.6)' }} />
            </div>

            {/* Header */}
            <div className="border-b border-[var(--accent-15)] pb-4">
                <h2
                    className="text-2xl font-bold text-[var(--accent-color)] mb-2 tracking-wide"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {path.title}
                </h2>
                <p
                    className="text-base text-[rgba(253,251,245,0.75)] italic mb-2 font-medium"
                    style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
                >
                    {path.subtitle}
                </p>
                <div className="text-sm text-[var(--accent-60)]">
                    {path.duration} weeks
                </div>
            </div>

            {/* Practice Section */}
            {path.practices.length > 0 && (
                <div>
                    <h3
                        className="text-base font-bold text-[var(--accent-color)] mb-2 tracking-wide"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Practice
                    </h3>
                    <ul className="space-y-1.5" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                        {path.practices.map((practice, idx) => (
                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.8)] flex items-center gap-2">
                                <span className="text-[var(--accent-50)]">•</span>
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
                        className="text-base font-bold text-[var(--accent-color)] mb-2 tracking-wide"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Wisdom
                    </h3>
                    <ul className="space-y-1.5" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                        {path.chapters.map((chapterId, idx) => (
                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.8)] flex items-center gap-2">
                                <span className="text-[var(--accent-50)]">•</span>
                                {getChapterTitle(chapterId)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Application Section */}
            {path.applicationItems.length > 0 && (
                <div>
                    <h3
                        className="text-base font-bold text-[var(--accent-color)] mb-2 tracking-wide"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Application
                    </h3>
                    <ul className="space-y-1.5" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                        {path.applicationItems.map((item, idx) => (
                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.8)] flex items-center gap-2">
                                <span className="text-[var(--accent-50)]">□</span>
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
                        className="text-base font-bold text-[var(--accent-color)] mb-3 tracking-wide"
                        style={{ fontFamily: 'var(--font-display)' }}
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
                                    <div className="w-3 h-3 rounded-full border border-[var(--accent-30)] bg-[var(--accent-10)]" />
                                    <div className="text-[9px] text-[var(--accent-40)]">{week.number}</div>
                                </div>
                                {idx < path.weeks.length - 1 && (
                                    <div className="flex-1 h-[1px] bg-[var(--accent-15)]" />
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
                        className="text-base font-bold text-[var(--accent-color)] mb-3 tracking-wide"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Weekly Breakdown
                    </h3>
                    <div className="space-y-2">
                        {path.weeks.map((week) => {
                            const isExpanded = expandedWeeks.includes(week.number);

                            return (
                                <div
                                    key={week.number}
                                    className="border border-[var(--accent-10)] rounded-xl overflow-hidden transition-all duration-[1500ms] ease-in-out"
                                >
                                    <button
                                        onClick={() => toggleWeek(week.number)}
                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--accent-10)] transition-colors text-left"
                                    >
                                        <span className="text-[var(--accent-50)] transition-transform duration-[1000ms] ease-in-out" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                            ▾
                                        </span>
                                        <span
                                            className="text-xs text-[var(--accent-60)] uppercase tracking-[0.15em] font-bold"
                                            style={{ fontFamily: 'var(--font-display)' }}
                                        >
                                            Week {week.number}
                                        </span>
                                        <span
                                            className="flex-1 text-sm text-[rgba(253,251,245,0.85)] font-medium"
                                            style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
                                        >
                                            {week.title}
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-3 border-t border-[var(--accent-10)] pt-3 transition-all duration-[1500ms] ease-in-out" style={{ opacity: 1, transform: 'scaleY(1)', transformOrigin: 'top' }}>
                                            {/* Focus */}
                                            <div>
                                                <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1">Focus</div>
                                                <p
                                                    className="text-sm text-[rgba(253,251,245,0.8)] italic leading-relaxed font-medium"
                                                    style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
                                                >
                                                    {week.focus}
                                                </p>
                                            </div>

                                            {/* Practices */}
                                            {week.practices.length > 0 && (
                                                <div>
                                                    <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1">Practices</div>
                                                    <ul className="space-y-1" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                                                        {week.practices.map((practice, idx) => (
                                                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.75)] flex items-start gap-2">
                                                                <span className="text-[var(--accent-40)] mt-0.5">•</span>
                                                                <span>{practice}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Reading */}
                                            {week.reading.length > 0 && (
                                                <div>
                                                    <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1">Reading</div>
                                                    <ul className="space-y-1" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                                                        {week.reading.map((chapterId, idx) => (
                                                            <li key={idx} className="text-sm text-[rgba(253,251,245,0.75)] flex items-start gap-2">
                                                                <span className="text-[var(--accent-40)] mt-0.5">•</span>
                                                                <span>{getChapterTitle(chapterId)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Tracking */}
                                            {week.tracking && (
                                                <div>
                                                    <div className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1">Tracking Focus</div>
                                                    <p
                                                        className="text-sm text-[rgba(253,251,245,0.75)] font-medium"
                                                        style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
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
                <div className="flex items-center gap-4 text-[var(--accent-30)]">
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[var(--accent-30)]" />
                    <div style={{ fontSize: '10px' }}>◆</div>
                    <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[var(--accent-30)]" />
                </div>
            </div>

            {/* BEGIN Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleBegin}
                    className="px-8 py-3 rounded-full text-[#050508] font-semibold text-base shadow-[0_0_20px_var(--accent-30)] hover:shadow-[0_0_30px_var(--accent-40)] transition-all"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 'var(--tracking-wide)', background: 'linear-gradient(to bottom right, var(--accent-color), var(--accent-secondary))' }}
                >
                    BEGIN PATH
                </button>
            </div>
        </div>
    );
}
