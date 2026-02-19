// src/components/schedule/PracticeTimesPicker.jsx
import React, { useState, useEffect } from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { getLocalDateKey } from '../../utils/dateUtils.js';
import {
    computeScheduleAnchorStartAt,
    normalizeAndSortTimeSlots,
    timeStringToMinutes,
} from '../../utils/scheduleUtils.js';

const RECOMMENDED_SLOT_GAP_MINUTES = 360; // 6 hours

export function PracticeTimesPicker({
    value,
    onChange,
    title = 'Select Practice Times',
}) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // Initialize local state from sorted value prop
    const normalized = normalizeAndSortTimeSlots(Array.isArray(value) ? value : [], { maxCount: 2 });
    const [slot1, setSlot1] = useState(normalized[0] ?? '');
    const [slot2, setSlot2] = useState(normalized[1] ?? '');

    // Sync from parent if value changes externally (e.g. reset)
    const valueKey = (value ?? []).join(',');
    useEffect(() => {
        const ext = normalizeAndSortTimeSlots(Array.isArray(value) ? value : [], { maxCount: 2 });
        setSlot1(ext[0] ?? '');
        setSlot2(ext[1] ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueKey]);

    const handleChange = (field, timeValue) => {
        const s1 = field === 1 ? timeValue : slot1;
        const s2 = field === 2 ? timeValue : slot2;
        if (field === 1) setSlot1(timeValue);
        if (field === 2) setSlot2(timeValue);
        const next = normalizeAndSortTimeSlots([s1, s2].filter(Boolean), { maxCount: 2 });
        onChange?.(next);
    };

    // Derive display state from current local values
    const sortedForDisplay = normalizeAndSortTimeSlots([slot1, slot2].filter(Boolean), { maxCount: 2 });
    const firstSlotTime = sortedForDisplay[0] ?? null;

    const timesAreIdentical = Boolean(slot1 && slot2 && slot1 === slot2);

    const m1 = timeStringToMinutes(slot1);
    const m2 = timeStringToMinutes(slot2);
    const showGapWarning =
        m1 !== null && m2 !== null && !timesAreIdentical &&
        Math.min(Math.abs(m2 - m1), 1440 - Math.abs(m2 - m1)) < RECOMMENDED_SLOT_GAP_MINUTES;

    const startAt = firstSlotTime
        ? computeScheduleAnchorStartAt({ now: new Date(), firstSlotTime })
        : null;
    const startsTomorrow = !!startAt && getLocalDateKey(startAt) !== getLocalDateKey();

    const inputStyle = {
        background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
        color: isLight ? 'rgba(60,50,40,0.9)' : 'rgba(253,251,245,0.9)',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        fontSize: '1rem',
        width: '100%',
        outline: 'none',
        fontFamily: 'var(--font-body)',
        colorScheme: isLight ? 'light' : 'dark',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.75rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: isLight ? 'rgba(60,50,40,0.55)' : 'rgba(253,251,245,0.5)',
        marginBottom: '0.375rem',
        fontFamily: 'var(--font-body)',
    };

    const calloutStyle = (color) => ({
        borderRadius: '0.75rem',
        border: `1px solid ${isLight ? `rgba(${color},0.28)` : `rgba(${color},0.28)`}`,
        background: isLight ? `rgba(${color},0.06)` : `rgba(${color},0.06)`,
        color: isLight ? 'rgba(60,50,35,0.85)' : 'rgba(253,251,245,0.85)',
        padding: '0.75rem 1rem',
        fontSize: '0.75rem',
        lineHeight: '1.5',
        fontFamily: 'var(--font-body)',
    });

    return (
        <div className="space-y-5 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            {title ? (
                <h2
                    className="text-xl font-semibold tracking-wide"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-color)' }}
                >
                    {title}
                </h2>
            ) : null}

            <div className="space-y-4 text-left">
                <div>
                    <label style={labelStyle}>Session 1</label>
                    <input
                        type="time"
                        value={slot1}
                        onChange={e => handleChange(1, e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Session 2</label>
                    <input
                        type="time"
                        value={slot2}
                        onChange={e => handleChange(2, e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <p
                    className="text-[11px] text-center"
                    style={{ color: isLight ? 'rgba(60,50,40,0.4)' : 'rgba(253,251,245,0.35)', fontFamily: 'var(--font-body)' }}
                >
                    Times are stored in chronological order.
                </p>
            </div>

            {timesAreIdentical && (
                <div style={calloutStyle('220, 90, 60')}>
                    Session times must be different.
                </div>
            )}

            {showGapWarning && (
                <div style={calloutStyle('255, 160, 120')}>
                    Recommendation: The second session is designed for downregulation and works best in the evening, closer to sleep. You can choose any times — tighter spacing may reduce effectiveness.
                </div>
            )}

            {startsTomorrow && (
                <div style={calloutStyle('255, 160, 120')}>
                    {firstSlotTime
                        ? `This time has already passed today. Your first practice will begin tomorrow at ${firstSlotTime}.`
                        : 'This time has already passed today. Your first practice will begin tomorrow.'}
                </div>
            )}
        </div>
    );
}

export default PracticeTimesPicker;
