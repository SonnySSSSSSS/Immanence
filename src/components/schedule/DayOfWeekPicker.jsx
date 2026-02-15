import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

const DAY_OPTIONS = [
    { value: 0, short: 'Sun' },
    { value: 1, short: 'Mon' },
    { value: 2, short: 'Tue' },
    { value: 3, short: 'Wed' },
    { value: 4, short: 'Thu' },
    { value: 5, short: 'Fri' },
    { value: 6, short: 'Sat' },
];

function normalizeDays(days = []) {
    const normalized = Array.isArray(days)
        ? days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        : [];
    return [...new Set(normalized)].sort((a, b) => a - b);
}

export function DayOfWeekPicker({
    value = [],
    onChange,
    minSelected = 5,
    maxSelected = 7,
    title = null,
    subtitle = null,
}) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const selectedDays = normalizeDays(value);

    const toggleDay = (dayValue) => {
        if (selectedDays.includes(dayValue)) {
            onChange?.(selectedDays.filter((d) => d !== dayValue));
            return;
        }
        if (selectedDays.length >= maxSelected) return;
        onChange?.([...selectedDays, dayValue].sort((a, b) => a - b));
    };

    const isValid = selectedDays.length >= minSelected && selectedDays.length <= maxSelected;

    return (
        <div className="space-y-4 text-center">
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

            {subtitle ? (
                <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.75)' : 'rgba(253,251,245,0.75)' }}>
                    {subtitle}
                </p>
            ) : null}

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {DAY_OPTIONS.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    return (
                        <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className="px-3 py-2 rounded-lg text-sm font-semibold transition-all min-w-0"
                            style={{
                                background: isSelected
                                    ? 'var(--accent-color)'
                                    : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                color: isSelected
                                    ? (isLight ? '#fff' : '#050508')
                                    : isLight ? 'rgba(60, 50, 40, 0.85)' : 'rgba(253,251,245,0.85)',
                                border: `1px solid ${isSelected ? 'var(--accent-color)' : 'transparent'}`,
                            }}
                        >
                            {day.short}
                        </button>
                    );
                })}
            </div>

            <div className="text-[13px]" style={{ color: isValid ? 'var(--accent-color)' : (isLight ? 'rgba(140, 80, 40, 0.7)' : 'rgba(255, 170, 140, 0.8)') }}>
                {selectedDays.length}/7 selected
            </div>
            {!isValid && (
                <p className="text-[12px]" style={{ color: isLight ? 'rgba(140, 80, 40, 0.7)' : 'rgba(255, 170, 140, 0.8)' }}>
                    Choose {minSelected}-{maxSelected} days.
                </p>
            )}
        </div>
    );
}

export default DayOfWeekPicker;
