// src/components/PathOverviewPanel.jsx
import React, { useState } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { PracticeTimesPicker } from './schedule/PracticeTimesPicker.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { treatiseChapters } from '../data/treatise.generated.js';
import { useUiStore } from '../state/uiStore.js';
import { BreathBenchmark } from './BreathBenchmark.jsx';
import { useBreathBenchmarkStore } from '../state/breathBenchmarkStore.js';
import { getScheduleConstraintForPath, validateSelectedTimes } from '../utils/scheduleSelectionConstraints.js';

export function PathOverviewPanel({ path, onBegin, onClose, onNavigate }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const setContentLaunchContext = useUiStore(s => s.setContentLaunchContext);

    const { beginPath } = useNavigationStore();
    const { practiceTimeSlots, setPracticeTimeSlots } = useCurriculumStore();
    const [expandedWeeks, setExpandedWeeks] = useState([]);
    const [scheduleError, setScheduleError] = useState(null);
    const [showBenchmark, setShowBenchmark] = useState(false);
    const hasBenchmark = useBreathBenchmarkStore(s => s.hasBenchmark());
    const needsRebenchmark = useBreathBenchmarkStore(s => s.needsRebenchmark());

    if (!path || path.placeholder) return null;

    const toggleWeek = (weekNumber) => {
        setExpandedWeeks(prev =>
            prev.includes(weekNumber)
                ? prev.filter(w => w !== weekNumber)
                : [...prev, weekNumber]
        );
    };

    const scheduleTimes = (practiceTimeSlots || []).filter(Boolean);
    const scheduleConstraint = getScheduleConstraintForPath(path.id);
    const scheduleValidation = validateSelectedTimes(scheduleTimes, scheduleConstraint);
    const canBeginPath = scheduleValidation.ok;
    const scheduleInstruction = scheduleConstraint?.requiredCount === 2 && scheduleConstraint?.maxCount === 2
        ? 'Select 2 time slots for practice that you can attend consistently for 2 weeks.'
        : 'Choose at least one time to begin this path.';

    const handleScheduleChange = (nextTimes) => {
        const normalizedTimes = Array.isArray(nextTimes) ? nextTimes.filter(Boolean) : [];
        const constrainedTimes = scheduleConstraint?.maxCount
            ? normalizedTimes.slice(0, scheduleConstraint.maxCount)
            : normalizedTimes;
        setScheduleError(null);
        setPracticeTimeSlots(constrainedTimes);
    };

    const handleConstraintViolation = (errorMessage) => {
        setScheduleError(errorMessage || scheduleValidation.error);
    };

    const handleBegin = () => {
        const validation = validateSelectedTimes(scheduleTimes, scheduleConstraint);
        if (!validation.ok) {
            setScheduleError(validation.error);
            return;
        }
        setScheduleError(null);
        if (onBegin) {
            onBegin(path.id);
        } else {
            const beginResult = beginPath(path.id);
            if (beginResult?.ok === false) {
                setScheduleError(beginResult.error || validation.error);
            }
        }
    };

    const launchChapter = (chapterId, durationMin) => {
        if (!chapterId) return;
        setContentLaunchContext?.({
            source: 'path',
            target: 'chapter',
            chapterId,
            durationMin: typeof durationMin === 'number' ? durationMin : undefined,
        });
        onClose?.();
        onNavigate?.('wisdom');
    };

    const launchVideo = (videoId, durationMin) => {
        if (!videoId) return;
        setContentLaunchContext?.({
            source: 'path',
            target: 'video',
            videoId,
            durationMin: typeof durationMin === 'number' ? durationMin : undefined,
        });
        onClose?.();
        onNavigate?.('wisdom');
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

    const normalizeChapterEntry = (entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') return { chapterId: entry, durationMin: undefined };
        if (typeof entry === 'object') {
            const chapterId = entry.chapterId || entry.id || entry.sectionId || null;
            const durationMinRaw = entry.durationMin ?? entry.minutes ?? entry.min ?? undefined;
            const durationMin = typeof durationMinRaw === 'number' ? durationMinRaw : undefined;
            return chapterId ? { chapterId, durationMin } : null;
        }
        return null;
    };

    const normalizeVideoEntry = (entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') return { videoId: entry, durationMin: undefined };
        if (typeof entry === 'object') {
            const videoId = entry.videoId || entry.id || null;
            const durationMinRaw = entry.durationMin ?? entry.minutes ?? entry.min ?? undefined;
            const durationMin = typeof durationMinRaw === 'number' ? durationMinRaw : undefined;
            return videoId ? { videoId, durationMin } : null;
        }
        return null;
    };

    return (
        <div
            data-testid="path-overview-panel"
            className="w-full max-w-2xl mx-auto p-8 relative"
            style={{
                // No background/border/shadow - handled by wrapper in NavigationSection
            }}
        >
            <BreathBenchmark isOpen={showBenchmark} onClose={() => setShowBenchmark(false)} />
            {/* Center top ornament */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 rotate-45 bg-gradient-to-br from-[#F5D18A] to-[#D4A84A]" style={{ boxShadow: '0 0 12px rgba(250, 208, 120, 0.6)' }} />
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                style={{
                    background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                    color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
                    e.target.style.color = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
                    e.target.style.color = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
                }}
            >
                ✕
            </button>

            {/* Header */}
            <div className="border-b border-[var(--accent-15)] pb-4">
                <div className="mb-8 pr-12">
                    <h2
                        className="text-3xl font-bold mb-2"
                        style={{
                            fontFamily: 'var(--font-display)',
                            letterSpacing: 'var(--tracking-mythic)',
                            color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)'
                        }}
                    >
                        {path.title}
                    </h2>
                    <p
                        className="text-sm uppercase tracking-[0.2em]"
                        style={{ color: isLight ? 'rgba(140, 100, 40, 0.6)' : 'var(--accent-60)' }}
                    >
                        {path.duration} WEEK INITIATION
                    </p>
                </div>
                <div
                    className="rounded-2xl p-6 mb-8 border"
                    style={{
                        background: isLight ? 'rgba(180, 140, 90, 0.08)' : 'rgba(250, 208, 120, 0.03)',
                        borderColor: isLight ? 'rgba(180, 140, 90, 0.15)' : 'rgba(250, 208, 120, 0.1)'
                    }}
                >
                    <p
                        className="text-lg italic leading-relaxed text-center"
                        style={{
                            fontFamily: 'var(--font-body)',
                            letterSpacing: '0.01em',
                            color: isLight ? 'rgba(60, 52, 37, 0.9)' : 'rgba(253,251,245,0.95)'
                        }}
                    >
                        "{path.description}"
                    </p>
                </div>
            </div>

            {/* Intentionally omit overview + practice summary to keep this surface short. */}

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
                        {path.chapters
                            .map(normalizeChapterEntry)
                            .filter(Boolean)
                            .map(({ chapterId, durationMin }, idx) => (
                                <li key={`${chapterId}-${idx}`} className="text-sm text-[rgba(253,251,245,0.8)] flex items-center gap-2">
                                    <span className="text-[var(--accent-50)]">•</span>
                                    <button
                                        type="button"
                                        onClick={() => launchChapter(chapterId, durationMin)}
                                        className="text-left hover:underline"
                                        style={{ color: 'inherit' }}
                                        title="Open in Wisdom"
                                    >
                                        {getChapterTitle(chapterId)}
                                        {typeof durationMin === 'number' ? ` · ${durationMin}m` : ''}
                                    </button>
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

            {/* Weekly Breakdown */}
            {path.weeks.length > 0 && (
                <div className="mb-8">
                    <h3
                        className="text-base font-bold mb-4 flex items-center gap-2"
                        style={{
                            fontFamily: 'var(--font-display)',
                            letterSpacing: 'var(--tracking-wide)',
                            color: isLight ? 'rgba(180, 140, 90, 0.8)' : 'var(--accent-60)'
                        }}
                    >
                        <span className="w-8 h-[1px]" style={{ background: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-20)' }} />
                        CURRICULUM OVERVIEW
                        <span className="w-8 h-[1px]" style={{ background: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-20)' }} />
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
                                        <div
                                            className="p-4 rounded-xl border transition-colors"
                                            style={{
                                                background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(253, 251, 245, 0.02)',
                                                borderColor: isLight ? 'rgba(180, 140, 90, 0.15)' : 'rgba(253, 251, 245, 0.05)'
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4
                                                    className="text-base font-bold"
                                                    style={{
                                                        fontFamily: 'var(--font-display)',
                                                        color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)'
                                                    }}
                                                >
                                                    Week {week.number}: {week.title}
                                                </h4>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-3 border-t border-[var(--accent-10)] pt-3 transition-all duration-[1500ms] ease-in-out" style={{ opacity: 1, transform: 'scaleY(1)', transformOrigin: 'top' }}>
                                            {/* Practices */}
                                            {week.practices.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-40)' }}>Practices</div>
                                                    <ul className="space-y-1" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                                                        {week.practices.map((practice, idx) => (
                                                            <li key={idx} className="text-sm flex items-start gap-2" style={{ color: isLight ? 'rgba(90, 77, 60, 0.75)' : 'rgba(253,251,245,0.75)' }}>
                                                                <span style={{ color: isLight ? 'rgba(180, 140, 90, 0.4)' : 'var(--accent-40)' }} className="mt-0.5">•</span>
                                                                <span>{practice}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Reading */}
                                            {week.reading && week.reading.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-40)' }}>Reading</div>
                                                    <ul className="space-y-1" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                                                        {week.reading
                                                            .map(normalizeChapterEntry)
                                                            .filter(Boolean)
                                                            .map(({ chapterId, durationMin }, idx) => (
                                                                <li key={`${chapterId}-${idx}`} className="text-sm flex items-start gap-2" style={{ color: isLight ? 'rgba(90, 77, 60, 0.75)' : 'rgba(253,251,245,0.75)' }}>
                                                                    <span style={{ color: isLight ? 'rgba(180, 140, 90, 0.4)' : 'var(--accent-40)' }} className="mt-0.5">•</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => launchChapter(chapterId, durationMin)}
                                                                        className="text-left hover:underline"
                                                                        style={{ color: 'inherit' }}
                                                                        title="Open in Wisdom"
                                                                    >
                                                                        {getChapterTitle(chapterId)}
                                                                        {typeof durationMin === 'number' ? ` · ${durationMin}m` : ''}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Videos */}
                                            {week.videos && week.videos.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-40)' }}>Videos</div>
                                                    <ul className="space-y-1" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                                                        {week.videos
                                                            .map(normalizeVideoEntry)
                                                            .filter(Boolean)
                                                            .map(({ videoId, durationMin }, idx) => (
                                                                <li key={`${videoId}-${idx}`} className="text-sm flex items-start gap-2" style={{ color: isLight ? 'rgba(90, 77, 60, 0.75)' : 'rgba(253,251,245,0.75)' }}>
                                                                    <span style={{ color: isLight ? 'rgba(180, 140, 90, 0.4)' : 'var(--accent-40)' }} className="mt-0.5">•</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => launchVideo(videoId, durationMin)}
                                                                        className="text-left hover:underline"
                                                                        style={{ color: 'inherit' }}
                                                                        title="Open in Videos"
                                                                    >
                                                                        {videoId}
                                                                        {typeof durationMin === 'number' ? ` · ${durationMin}m` : ''}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Tracking */}
                                            {week.tracking && (
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-40)' }}>Tracking Focus</div>
                                                    <p
                                                        className="text-sm font-medium"
                                                        style={{
                                                            fontFamily: 'var(--font-body)',
                                                            letterSpacing: '0.01em',
                                                            color: isLight ? 'rgba(90, 77, 60, 0.75)' : 'rgba(253,251,245,0.75)'
                                                        }}
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

            {path.showBreathBenchmark && (
                <div className="mb-8">
                    <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: isLight ? 'rgba(140, 100, 40, 0.65)' : 'var(--accent-50)' }}>
                        Step 1: Benchmark
                    </div>
                    <h3
                        className="text-base font-bold text-[var(--accent-color)] mb-2 tracking-wide"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Breath Benchmark
                    </h3>
                    <p
                        className="text-sm italic"
                        style={{ color: isLight ? 'rgba(90, 77, 60, 0.65)' : 'rgba(253,251,245,0.6)' }}
                    >
                        Establish the baseline you will expand. Click to measure your current breath capacity.
                    </p>
                    <div className="mt-3 flex justify-center">
                        <button
                            onClick={() => setShowBenchmark(true)}
                            className="rounded-full px-4 py-2"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "10px",
                                fontWeight: 600,
                                letterSpacing: "var(--tracking-mythic)",
                                textTransform: "uppercase",
                                background: "transparent",
                                border: `1px solid ${hasBenchmark ? "var(--accent-color)" : "var(--accent-10)"}`,
                                color: hasBenchmark ? "var(--accent-color)" : "var(--text-muted)",
                                boxShadow: needsRebenchmark ? '0 0 12px var(--accent-15)' : "none",
                                animation: needsRebenchmark ? 'benchmarkRadiate 2s ease-in-out infinite' : 'none',
                                transition: 'background 400ms ease, border-color 400ms ease, color 400ms ease',
                            }}
                        >
                            {hasBenchmark ? '🔄 Re-benchmark' : '📏 Benchmark'}
                        </button>
                    </div>
                </div>
            )}

            {/* Practice Times */}
            <div className="border-t pt-8" style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.15)' : 'rgba(250, 208, 120, 0.1)' }}>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: isLight ? 'rgba(140, 100, 40, 0.65)' : 'var(--accent-50)' }}>
                    Step 2: Select Time Slots
                </div>
                <div className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)', color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)' }}>
                    Select your practice times
                </div>
                <div className="mb-3" style={{ color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253,251,245,0.7)', fontSize: '12px' }}>
                    {scheduleInstruction}
                </div>
                <PracticeTimesPicker
                    value={scheduleTimes}
                    onChange={handleScheduleChange}
                    maxSlots={scheduleConstraint?.maxCount ?? 3}
                    scheduleConstraint={scheduleConstraint}
                    onConstraintViolation={handleConstraintViolation}
                    title={null}
                />
                {scheduleError && (
                    <div className="mt-3 text-[11px]" style={{ color: isLight ? 'rgba(180, 80, 40, 0.9)' : 'rgba(255, 180, 120, 0.9)' }}>
                        {scheduleError}
                    </div>
                )}
            </div>

            {/* Ornamental Divider */}
            <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-4 text-[var(--accent-30)]">
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[var(--accent-30)]" />
                    <div style={{ fontSize: '10px' }}>◆</div>
                    <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[var(--accent-30)]" />
                </div>
            </div>

            {/* BEGIN Button */}
            <div className="border-t pt-8" style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.15)' : 'rgba(250, 208, 120, 0.1)' }}>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: isLight ? 'rgba(140, 100, 40, 0.65)' : 'var(--accent-50)' }}>
                    Step 3: Click Begin this path
                </div>
                <button
                    onClick={handleBegin}
                    data-testid="begin-path-button"
                    aria-disabled={!canBeginPath}
                    className={`w-full py-4 rounded-full font-bold text-lg transition-all group relative overflow-hidden ${canBeginPath ? '' : 'opacity-60 cursor-not-allowed'}`}
                    style={{
                        fontFamily: 'var(--font-display)',
                        letterSpacing: 'var(--tracking-mythic)',
                        background: isLight
                            ? 'rgba(180, 140, 90, 0.8)'
                            : 'linear-gradient(to bottom right, var(--accent-color), var(--accent-secondary))',
                        color: isLight ? 'white' : '#050508',
                        boxShadow: isLight ? '0 10px 30px rgba(180, 140, 90, 0.3)' : '0 0 30px var(--accent-30)'
                    }}
                >
                    <span className="relative z-10">BEGIN THIS PATH</span>
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)' }}
                    />
                </button>
                <p
                    className="text-center text-xs mt-4 italic"
                    style={{ color: isLight ? 'rgba(140, 100, 40, 0.5)' : 'var(--accent-40)' }}
                >
                    This will become your active focus for the next {path.duration} weeks.
                </p>
            </div>

            <style>{`
                @keyframes benchmarkRadiate {
                    0%, 100% {
                        box-shadow: 0 0 8px var(--accent-15);
                    }
                    50% {
                        box-shadow: 0 0 20px var(--accent-30), 0 0 30px var(--accent-15);
                    }
                }
            `}</style>
        </div>
    );
}
