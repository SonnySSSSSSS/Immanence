// src/components/ActivePathState.jsx
import React, { useMemo, useState } from 'react';
import { getPathById } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useProgressStore } from '../state/progressStore.js';
import { getPathContract } from '../utils/pathContract.js';
import { normalizeScheduleActiveDays } from './dailyPracticeCardLogic.js';
import { getLocalDateKey } from '../utils/dateUtils.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTimeLabel = (timeValue) => {
    if (!timeValue || typeof timeValue !== 'string') return null;
    const [h, m] = timeValue.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return timeValue;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

const formatActiveDaysSummary = (activeDays = []) => {
    const d = normalizeScheduleActiveDays(activeDays);
    if (d.length === 0) return 'Every day active';
    if (d.length === 7) return 'Every day active';
    if (d.length === 6) {
        const rest = [0, 1, 2, 3, 4, 5, 6].find((day) => !d.includes(day));
        if (rest !== undefined) {
            const ordered = [1, 2, 3, 4, 5, 6, 0].filter((day) => d.includes(day)).map((day) => DAY_LABELS[day]).join('–');
            return `${ordered} active · ${DAY_LABELS[rest]} rest`;
        }
    }
    return d.map((day) => DAY_LABELS[day]).join(' ');
};

export function ActivePathState() {
    const { activePath, abandonPath, restartPath, computeProgressMetrics } = useNavigationStore();
    const sessionsV2 = useProgressStore((s) => s.sessionsV2 || []);
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);

    if (!activePath) return null;

    const path = getPathById(activePath.activePathId);
    if (!path) return null;

    const contract = getPathContract(path);
    const totalDays = contract.totalDays || 14;
    const metrics = computeProgressMetrics();
    const dayIndex = Math.max(1, Math.min(totalDays, metrics?.dayIndex ?? 1));
    const selectedTimes = Array.isArray(activePath?.schedule?.selectedTimes) ? activePath.schedule.selectedTimes : [];
    const activeDays = normalizeScheduleActiveDays(
        activePath?.schedule?.activeDays || activePath?.schedule?.selectedDaysOfWeek || []
    );
    const todayDow = new Date().getDay();
    const isRestDay = activeDays.length > 0 && !activeDays.includes(todayDow);

    const nextSessionLabel = useMemo(() => {
        if (isRestDay || selectedTimes.length === 0) return null;
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const todayKey = getLocalDateKey(now);
        const completedTimes = new Set(
            sessionsV2
                .filter((s) => s?.completion === 'completed')
                .filter((s) => {
                    const sessionPathId = s?.pathContext?.activePathId || null;
                    if (sessionPathId !== activePath.activePathId) return false;
                    const runId = activePath?.runId || null;
                    const sessionRunId = s?.pathContext?.runId || null;
                    if (runId && sessionRunId) return runId === sessionRunId;
                    const sessionDate = s?.startedAt ? getLocalDateKey(new Date(s.startedAt)) : null;
                    return sessionDate === todayKey;
                })
                .map((s) => (typeof s?.pathContext?.slotTime === 'string' ? s.pathContext.slotTime.slice(0, 5) : null))
                .filter(Boolean)
        );

        const upcoming = selectedTimes.find((t) => {
            if (completedTimes.has(t)) return false;
            const [h, m] = t.split(':').map(Number);
            if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
            return (h * 60 + m) >= nowMin;
        });
        return upcoming ? formatTimeLabel(upcoming) : null;
    }, [isRestDay, selectedTimes, sessionsV2, activePath.activePathId, activePath.runId]);

    return (
        <div
            data-testid="active-path-root"
            className="w-full p-6 space-y-5 relative"
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
            <div className="border-b pb-3" style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.15)' : 'var(--accent-15)' }}>
                <h2
                    className="text-2xl font-bold mb-2"
                    style={{
                        fontFamily: 'var(--font-display)',
                        letterSpacing: 'var(--tracking-mythic)',
                        color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)',
                    }}
                >
                    {path.title}
                </h2>
                <p className="text-sm" style={{ color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253,251,245,0.75)' }}>
                    Day {dayIndex} of {totalDays}
                </p>
            </div>

            <div
                className="border rounded-2xl p-4 space-y-2"
                style={{
                    background: isLight ? 'rgba(180, 140, 90, 0.08)' : 'var(--accent-10)',
                    borderColor: isLight ? 'rgba(180, 140, 90, 0.2)' : 'var(--accent-20)',
                }}
            >
                <div className="text-sm" style={{ color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(253,251,245,0.85)' }}>
                    <strong>Days:</strong> {formatActiveDaysSummary(activeDays)}
                </div>
                <div className="text-sm" style={{ color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(253,251,245,0.85)' }}>
                    <strong>Times:</strong> {selectedTimes.length > 0 ? selectedTimes.map(formatTimeLabel).join(' + ') : 'Not set'}
                </div>
                <div className="text-sm" style={{ color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(253,251,245,0.85)' }}>
                    <strong>Legs per day:</strong> {contract.requiredLegsPerDay || selectedTimes.length || 0} sessions/day
                </div>
                <div className="text-sm" style={{ color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(253,251,245,0.85)' }}>
                    <strong>Status:</strong> {isRestDay ? 'Rest day' : (nextSessionLabel ? `Next session ${nextSessionLabel}` : 'No remaining sessions today')}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <button
                    onClick={() => setShowRestartConfirm(true)}
                    className="px-4 py-3 text-sm transition-colors"
                    style={{ color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253,251,245,0.6)' }}
                >
                    Restart path
                </button>
                {!showAbandonConfirm ? (
                    <button
                        onClick={() => setShowAbandonConfirm(true)}
                        className="px-4 py-3 text-sm transition-colors"
                        style={{ color: isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253,251,245,0.4)' }}
                    >
                        Abandon path
                    </button>
                ) : (
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => {
                                abandonPath();
                                setShowAbandonConfirm(false);
                            }}
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
                                background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'transparent',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {showRestartConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.65)' }}
                    onClick={() => setShowRestartConfirm(false)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
                        style={{
                            background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(20,15,25,0.95)',
                            border: isLight ? '1px solid rgba(180, 140, 90, 0.3)' : '1px solid var(--accent-20)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            className="text-lg font-bold mb-2"
                            style={{
                                fontFamily: 'var(--font-display)',
                                letterSpacing: 'var(--tracking-wide)',
                                color: isLight ? 'rgba(140, 100, 40, 0.9)' : 'var(--accent-color)',
                            }}
                        >
                            Restart Path?
                        </h3>
                        <p className="text-sm mb-4" style={{ color: isLight ? 'rgba(90, 77, 60, 0.75)' : 'rgba(253,251,245,0.75)' }}>
                            This resets the current run to Day 1.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRestartConfirm(false)}
                                className="px-4 py-2 rounded-full border transition-colors"
                                style={{
                                    color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253,251,245,0.8)',
                                    borderColor: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-20)',
                                    background: isLight ? 'rgba(255,255,255,0.6)' : 'transparent',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    restartPath();
                                    setShowRestartConfirm(false);
                                }}
                                className="px-4 py-2 rounded-full text-[#050508] font-semibold transition-all"
                                style={{
                                    background: 'linear-gradient(to bottom right, var(--accent-color), var(--accent-secondary))',
                                    boxShadow: '0 0 18px var(--accent-30)',
                                }}
                            >
                                Restart Path
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

