// src/components/schedule/PracticeTimesPicker.jsx
import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { getLocalDateKey } from '../../utils/dateUtils.js';
import { computeScheduleAnchorStartAt } from '../../utils/scheduleUtils.js';
import { canToggleTime, validateSelectedTimes } from '../../utils/scheduleSelectionConstraints.js';

const DEFAULT_TIME_OPTIONS = [
    '05:00',
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '12:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
];

const formatTimeLabel = (timeValue) => {
    const parts = (timeValue || '').split(':');
    if (parts.length < 2) return timeValue;
    const hours24 = Number(parts[0]);
    const minutes = parts[1];
    if (Number.isNaN(hours24)) return timeValue;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12}:${minutes} ${period}`;
};

export function PracticeTimesPicker({
    value,
    onChange,
    maxSlots = 3,
    scheduleConstraint = null,
    onConstraintViolation,
    timeOptions = DEFAULT_TIME_OPTIONS,
    title = 'Select Practice Times',
}) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const selectedTimes = Array.isArray(value) ? value : [];

    const firstSlotTime = selectedTimes[0] || null;
    const startAt = firstSlotTime
        ? computeScheduleAnchorStartAt({ now: new Date(), firstSlotTime })
        : null;
    const startsTomorrow = !!startAt && getLocalDateKey(startAt) !== getLocalDateKey();
    const effectiveConstraint = scheduleConstraint || { maxCount: maxSlots };

    const toggleTime = (timeValue) => {
        if (selectedTimes.includes(timeValue)) {
            onChange?.(selectedTimes.filter((t) => t !== timeValue));
            return;
        }
        const nextSelectedTimes = [...selectedTimes, timeValue];
        if (!canToggleTime(nextSelectedTimes, effectiveConstraint)) {
            const validation = validateSelectedTimes(nextSelectedTimes, effectiveConstraint);
            onConstraintViolation?.(validation.error || 'Unable to select this time slot.');
            return;
        }
        onChange?.(nextSelectedTimes);
    };

    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            {title ? (
                <h2
                    className="text-xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                    }}
                >
                    {title}
                </h2>
            ) : null}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 max-h-48 overflow-y-auto no-scrollbar">
                {timeOptions.map((timeValue) => {
                    const isSelected = selectedTimes.includes(timeValue);
                    return (
                        <button
                            key={timeValue}
                            onClick={() => toggleTime(timeValue)}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-0"
                            style={{
                                background: isSelected
                                    ? 'var(--accent-color)'
                                    : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                color: isSelected
                                    ? (isLight ? 'white' : '#050508')
                                    : isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)',
                                border: `1px solid ${isSelected ? 'var(--accent-color)' : 'transparent'}`,
                            }}
                        >
                            {formatTimeLabel(timeValue)}
                        </button>
                    );
                })}
            </div>

            {selectedTimes.length > 0 && (
                <p className="text-[13px]" style={{ color: 'var(--accent-color)' }}>
                    Selected: {selectedTimes.map((t) => formatTimeLabel(t)).join(', ')}
                </p>
            )}

            {startsTomorrow && (
                <div
                    className="rounded-xl border px-4 py-3 text-[12px] leading-relaxed"
                    style={{
                        borderColor: isLight ? 'rgba(220, 90, 60, 0.28)' : 'rgba(255, 160, 120, 0.28)',
                        background: isLight ? 'rgba(220, 90, 60, 0.06)' : 'rgba(255, 160, 120, 0.06)',
                        color: isLight ? 'rgba(60, 50, 35, 0.85)' : 'rgba(253,251,245,0.85)',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    {firstSlotTime
                        ? `This time has already passed today. Your first practice will begin tomorrow at ${formatTimeLabel(firstSlotTime)}.`
                        : 'This time has already passed today. Your first practice will begin tomorrow.'}
                </div>
            )}
        </div>
    );
}

export default PracticeTimesPicker;
