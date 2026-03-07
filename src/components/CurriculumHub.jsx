import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { getProgramDefinition } from '../data/programRegistry.js';
import { RITUAL_FOUNDATION_14 } from '../data/ritualFoundation14.js';

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
    const totalDuration = Array.isArray(day?.legs)
        ? day.legs.reduce((sum, leg) => sum + (Number(leg?.practiceConfig?.duration) || 0), 0)
        : (day?.practiceConfig?.duration || 10);
    const dayType = Array.isArray(day?.legs) && day.legs.length > 1
        ? `${day.legs.length} legs`
        : (day?.practiceType || 'Practice');

    return (
        <div
            className={`relative rounded-xl p-4 transition-all duration-200 ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
            style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
            }}
            onClick={() => isClickable && onSelect?.(day)}
        >
            {status === 'today' && (
                <div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                    style={{ background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-color)' }}
                />
            )}

            <div className="flex items-start gap-3">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                        background: config.badge,
                        color: status === 'complete' || status === 'today' ? (isLight ? 'white' : '#050508') : 'inherit',
                    }}
                >
                    {config.icon}
                </div>

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
                        {dayType} • {totalDuration}m
                    </p>
                </div>

                {completion?.focusRating && (
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
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

function StatsSummary({ isLight }) {
    const { getProgress, getStreak, getAverageFocus, getTotalPracticeMinutes } = useCurriculumStore();

    const progress = getProgress();
    const streak = getStreak();
    const avgFocus = getAverageFocus();
    const totalMinutes = getTotalPracticeMinutes();

    const stats = [
        { label: 'Progress', value: `${progress.completed}/${progress.total}`, icon: 'P' },
        { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: 'S' },
        { label: 'Avg Focus', value: avgFocus ? `${avgFocus}/5` : '-', icon: 'F' },
        { label: 'Total Time', value: `${totalMinutes}m`, icon: 'T' },
    ];

    return (
        <div className="grid grid-cols-4 gap-3">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="text-center p-3 rounded-xl"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>{stat.icon}</span>
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

function ProgramIntroCard({ program, isLight, hasActivePath, onBeginSetup, selectedDays, selectedTimes }) {
    if (!program?.curriculum) return null;

    const contractDays = Array.isArray(selectedDays) ? selectedDays : [];
    const contractTimes = Array.isArray(selectedTimes) ? selectedTimes : [];
    const daysSummary = contractDays.length > 0 ? `${contractDays.length} active days selected` : 'No practice days selected yet';
    const timesSummary = contractTimes.length > 0 ? contractTimes.join(' + ') : 'No contract times selected yet';

    return (
        <div
            className="rounded-2xl p-5 space-y-4"
            style={{
                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            }}
        >
            <div className="space-y-2">
                <div
                    className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: isLight ? 'rgba(60, 50, 40, 0.55)' : 'rgba(253,251,245,0.5)' }}
                >
                    Active Program
                </div>
                <h3
                    className="text-xl font-semibold"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                    }}
                >
                    {program.name}
                </h3>
                <p
                    className="text-sm leading-relaxed"
                    style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}
                >
                    {program.curriculum.description || 'Program schedule and contract overview.'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl p-3" style={{ background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.18)' }}>
                    <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: isLight ? 'rgba(60,50,40,0.48)' : 'rgba(253,251,245,0.46)' }}>
                        Length
                    </div>
                    <div className="text-sm font-semibold" style={{ color: isLight ? 'rgba(60,50,40,0.9)' : 'rgba(253,251,245,0.92)' }}>
                        {program.curriculum.durationDays || program.curriculum.duration || 14} days
                    </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.18)' }}>
                    <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: isLight ? 'rgba(60,50,40,0.48)' : 'rgba(253,251,245,0.46)' }}>
                        Days
                    </div>
                    <div className="text-sm font-semibold" style={{ color: isLight ? 'rgba(60,50,40,0.9)' : 'rgba(253,251,245,0.92)' }}>
                        {daysSummary}
                    </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.18)' }}>
                    <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: isLight ? 'rgba(60,50,40,0.48)' : 'rgba(253,251,245,0.46)' }}>
                        Times
                    </div>
                    <div className="text-sm font-semibold" style={{ color: isLight ? 'rgba(60,50,40,0.9)' : 'rgba(253,251,245,0.92)' }}>
                        {timesSummary}
                    </div>
                </div>
            </div>

            {!hasActivePath && typeof onBeginSetup === 'function' && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onBeginSetup}
                        className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-[1.02]"
                        style={{
                            color: '#fff',
                            background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
                            boxShadow: '0 8px 20px var(--accent-20)',
                        }}
                    >
                        Begin Contract Setup
                    </button>
                </div>
            )}
        </div>
    );
}

export function CurriculumHub({ onSelectDay, isInModal = false, onBeginSetup = null }) {
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const isLight = colorScheme === 'light';
    const activePath = useNavigationStore((s) => s.activePath);

    const {
        activeCurriculumId,
        getActiveCurriculum,
        getCurrentDayNumber,
        getDayStatus,
        getProgress,
        getSelectedDaysOfWeekDraft,
        getPracticeTimeSlots,
        dayCompletions,
        curriculumStartDate,
        isCurriculumComplete,
    } = useCurriculumStore();

    const currentDay = getCurrentDayNumber();
    const activeProgram = getProgramDefinition(activeCurriculumId) || null;
    const curriculum = getActiveCurriculum() || activeProgram?.curriculum || RITUAL_FOUNDATION_14;
    const isComplete = isCurriculumComplete();
    const totalDays = curriculum?.days?.length || curriculum?.durationDays || curriculum?.duration || 14;
    const progress = getProgress();
    const progressCount = Math.max(
        Object.keys(dayCompletions || {}).length,
        Number(progress?.completed || 0)
    );
    const startDateStr = curriculumStartDate
        ? new Date(curriculumStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Not started';
    const selectedDays = getSelectedDaysOfWeekDraft?.() || [];
    const selectedTimes = getPracticeTimeSlots?.({ maxCount: 2 }) || [];

    return (
        <div className="px-6 py-6 space-y-6">
            <ProgramIntroCard
                program={activeProgram}
                isLight={isLight}
                hasActivePath={Boolean(activePath)}
                onBeginSetup={onBeginSetup}
                selectedDays={selectedDays}
                selectedTimes={selectedTimes}
            />

            <p
                className="text-sm"
                style={{
                    color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)',
                }}
            >
                Started {startDateStr} • Day {currentDay} of {totalDays}
                {isInModal ? ' • modal view' : ''}
            </p>

            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}>
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                        width: `${Math.min((progressCount / totalDays) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, var(--accent-color), var(--accent-secondary))',
                    }}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white dark:bg-gray-900"
                    style={{
                        left: `${Math.min(((currentDay - 1) / totalDays) * 100, 100)}%`,
                        borderColor: 'var(--accent-color)',
                    }}
                />
            </div>

            <StatsSummary isLight={isLight} />

            <div className="space-y-4">
                <div>
                    <h3
                        className="text-xs uppercase tracking-wider mb-2 font-medium"
                        style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.4)',
                        }}
                    >
                        Week 1
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(curriculum.days || []).slice(0, 7).map((day) => (
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

                <div>
                    <h3
                        className="text-xs uppercase tracking-wider mb-2 font-medium"
                        style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.4)',
                        }}
                    >
                        Week 2
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(curriculum.days || []).slice(7, 14).map((day) => (
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

            {isComplete && (
                <div
                    className="p-4 rounded-xl text-center"
                    style={{
                        background: 'linear-gradient(135deg, var(--accent-15), var(--accent-10))',
                        border: '1px solid var(--accent-30)',
                    }}
                >
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
