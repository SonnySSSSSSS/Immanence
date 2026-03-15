// src/components/CurriculumOnboarding.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM ONBOARDING — Multi-step introduction to daily practice
// ═══════════════════════════════════════════════════════════════════════════
//
// Skippable onboarding flow that introduces:
// 1. Initiation contract framing
// 2. 14-day arc overview
// 3. Posture guidance for breathwork and stillness
// 4. Stillness focus-intensity intervals
// 5. Practice day contract selection (5-7 days)
// 6. Time selection for daily practice (exactly 2)
// 7. Benchmark explanation
// 8. Confirmation & start
//
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { PillButton } from './ui/PillButton';
import { PracticeTimesPicker } from './schedule/PracticeTimesPicker.jsx';
import { DayOfWeekPicker } from './schedule/DayOfWeekPicker.jsx';
import { RITUAL_INITIATION_14_V2 } from '../data/ritualInitiation14v2.js';
import { getLocalDateKey } from '../utils/dateUtils.js';
import { computeScheduleAnchorStartAt, normalizeAndSortTimeSlots } from '../utils/scheduleUtils.js';
import { useBreathBenchmarkStore } from '../state/breathBenchmarkStore.js';
import { BreathBenchmark } from './BreathBenchmark.jsx';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TOTAL_STEPS = 8;
const POSTURE_IMAGES = Object.freeze([
    {
        src: '/tutorial/breath and stillness/straight spine 1.png',
        alt: 'Standing breath posture with a long spine and relaxed shoulders',
        caption: 'Standing breath: feet grounded, spine long.',
    },
    {
        src: '/tutorial/breath and stillness/straight spine 2.png',
        alt: 'Seated stillness posture with an upright but relaxed spine',
        caption: 'Seated stillness: sit tall without hardening.',
    },
    {
        src: '/tutorial/breath and stillness/straight spine 3.png',
        alt: 'Balanced standing posture with neutral head and easy neck',
        caption: 'Balanced stance: neck easy, chin neutral.',
    },
    {
        src: '/tutorial/breath and stillness/straight spine 4.png',
        alt: 'Aligned posture example showing relaxed shoulders and upright alignment',
        caption: 'Aligned line: shoulders soft, body steady.',
    },
]);
const FOCUS_INTENSITY_IMAGES = Object.freeze([
    {
        src: '/tutorial/breath and stillness/intensity 1.webp',
        alt: 'Two people speaking in a quiet room to represent light focus intensity',
        title: 'Light Focus',
        analogy: 'Like a 1-on-1 conversation in a quiet room.',
        detail: 'Low distraction load. Hold attention gently, then release fully during rest.',
    },
    {
        src: '/tutorial/breath and stillness/intensity 2.webp',
        alt: 'Two people speaking in a crowded bar to represent medium focus intensity',
        title: 'Medium Focus',
        analogy: 'Like a 1-on-1 conversation in a crowded bar.',
        detail: 'More filtering is required. Keep the target clear without hardening the body.',
    },
    {
        src: '/tutorial/breath and stillness/intensity 3.webp',
        alt: 'Two workers speaking beside a construction site to represent high focus intensity',
        title: 'High Focus',
        analogy: 'Like a 1-on-1 conversation beside a construction site.',
        detail: 'Narrow attention more selectively, but do not add facial tension, clenching, or strain.',
    },
]);

const formatTimeLabel = (timeValue) => {
    if (!timeValue || typeof timeValue !== 'string') return null;
    const [hours, minutes] = timeValue.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return timeValue;
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StepWelcome({ onNext, isLight }) {
    return (
        <div className="space-y-8 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <div className="space-y-5">
                <h1
                    className="text-2xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                        textShadow: '0 0 20px var(--accent-20)',
                    }}
                >
                    Initiation Path
                </h1>

                <p className="text-[16px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    This onboarding takes about 3 minutes.
                </p>

                <div className="w-32 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.75)' : 'rgba(253,251,245,0.75)' }}>
                    You are setting a fixed 14-day contract built around one morning breath leg and one evening awareness leg.
                </p>

                <p className="text-[16px] leading-relaxed font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.95)' }}>
                    The rule is simple: show up for the sessions you commit to.
                </p>

                <div
                    className="space-y-4 rounded-2xl px-4 py-4 text-left"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <div className="space-y-2">
                        <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                            What the contract means
                        </p>
                        <p className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                            Completion is evaluated against the days and times you choose. Outside-schedule sessions are still logged, but they are not credited.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                            Daily structure
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[13px] font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.85)' : 'rgba(253,251,245,0.85)' }}>
                                    Morning · 10 min
                                </p>
                                <p className="text-[13px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.65)' : 'rgba(253,251,245,0.65)' }}>
                                    Resonance breathing
                                </p>
                            </div>
                            <div>
                                <p className="text-[13px] font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.85)' : 'rgba(253,251,245,0.85)' }}>
                                    Evening Circuit · 14 min
                                </p>
                                <p className="text-[13px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.65)' : 'rgba(253,251,245,0.65)' }}>
                                    7 min stillness + 7 min body scan
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                            What this trains
                        </p>
                        {[
                            'Feel your body more clearly',
                            'Keep your attention steady',
                            'Notice tension before it controls you',
                            'Track where tension gathers and how attention holds each day',
                        ].map((item) => (
                            <p key={item} className="text-[13px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                                · {item}
                            </p>
                        ))}
                    </div>
                </div>

                <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.62)' : 'rgba(253,251,245,0.62)' }}>
                    Next you will see the 14-day arc, then the posture cues used for both breathwork and stillness.
                </p>
            </div>

            <PillButton onClick={onNext} variant="primary" size="lg">
                Continue
            </PillButton>
        </div>
    );
}

function StepPostureGuidance({ onNext, onBack, isLight }) {
    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <div className="space-y-5">
                <h2
                    className="text-xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                    }}
                >
                    Posture of Practice
                </h2>

                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    Both breathwork and stillness depend on the same principle: an upright spine that feels stable, grounded, and not rigid.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {POSTURE_IMAGES.map((image) => (
                        <figure
                            key={image.src}
                            className="rounded-2xl p-3 text-left"
                            style={{
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                        >
                            <div
                                className="rounded-xl overflow-hidden"
                                style={{ background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.06)' }}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-28 object-contain"
                                />
                            </div>
                            <figcaption className="mt-2 text-[12px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.72)' }}>
                                {image.caption}
                            </figcaption>
                        </figure>
                    ))}
                </div>

                <div
                    className="space-y-2 rounded-2xl px-4 py-4 text-left"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                        Practical guidance
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                        Keep the spine upright and long, let the shoulders relax, and keep the neck easy with a neutral chin.
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                        Standing breath posture should feel balanced rather than stiff. Seated stillness should feel grounded rather than collapsed.
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                        Stable does not mean tense. Let the body organize around ease, then keep attention there.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <PillButton onClick={onBack} variant="secondary" size="md">
                    Back
                </PillButton>
                <PillButton onClick={onNext} variant="primary" size="md">
                    Continue
                </PillButton>
            </div>
        </div>
    );
}

function StepStillnessFocusIntensity({ onNext, onBack, isLight }) {
    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <div className="space-y-5">
                <h2
                    className="text-xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                    }}
                >
                    Stillness Focus Intensity
                </h2>

                <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    This page is for the stillness meditation leg of the evening practice. It teaches attentional intensity, not breathwork intensity.
                </p>

                <div
                    className="space-y-2 rounded-2xl px-4 py-4 text-left"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                        Interval structure
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                        The stillness leg alternates work and rest intervals, similar to HIIT. During active intervals, aim at the current focus stage. During short rest intervals, release effort briefly, then repeat until the stillness timer ends.
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                        As the session progresses, the required intensity of focus rises in three stages: light, medium, then high. Rest periods are part of the method, not failure.
                    </p>
                </div>

                <div className="space-y-3">
                    {FOCUS_INTENSITY_IMAGES.map((image) => (
                        <div
                            key={image.src}
                            className="rounded-2xl p-3 text-left"
                            style={{
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                        >
                            <div className="grid grid-cols-[96px,1fr] gap-3 items-center">
                                <div
                                    className="rounded-xl overflow-hidden"
                                    style={{ background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.06)' }}
                                >
                                    <img
                                        src={image.src}
                                        alt={image.alt}
                                        className="h-24 w-full object-cover"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[13px] font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.88)' : 'rgba(253,251,245,0.88)' }}>
                                        {image.title}
                                    </p>
                                    <p className="text-[12px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.74)' : 'rgba(253,251,245,0.74)' }}>
                                        {image.analogy}
                                    </p>
                                    <p className="text-[12px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.62)' : 'rgba(253,251,245,0.62)' }}>
                                        {image.detail}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    className="space-y-2 rounded-2xl px-4 py-4 text-left"
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                        What intensity means here
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                        In breathwork, phases refer to breathing demand or capacity. In stillness meditation, these phases refer to attentional demand.
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                        High intensity means narrower, more selective attention. It does not mean physical tension, facial clenching, or stressful effort.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <PillButton onClick={onBack} variant="secondary" size="md">
                    Back
                </PillButton>
                <PillButton onClick={onNext} variant="primary" size="md">
                    Continue
                </PillButton>
            </div>
        </div>
    );
}

function StepCurriculumOverview({ onNext, onBack, isLight }) {
    const curriculum = RITUAL_INITIATION_14_V2;
    
    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <h2
                className="text-xl font-semibold tracking-wide"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-color)',
                }}
            >
                The 14-Day Arc
            </h2>

            {/* Week Overview */}
            <div className="grid grid-cols-2 gap-4 py-2">
                <div 
                    className="p-4 rounded-xl text-left"
                    style={{ 
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-color)' }}>Week 1: Establish</h3>
                    <p className="text-xs" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                        Morning breath + evening circuit every obligation day.
                    </p>
                </div>
                <div 
                    className="p-4 rounded-xl text-left"
                    style={{ 
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-color)' }}>Week 2: Consolidate</h3>
                    <p className="text-xs" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                        Same structure, tighter execution, no drift.
                    </p>
                </div>
            </div>

            {/* Day Dots Preview */}
            <div className="flex justify-center gap-1 py-2">
                {curriculum.days.map((day, i) => (
                    <div
                        key={day.dayNumber}
                        className="w-3 h-3 rounded-full transition-all"
                        style={{
                            background: i < 7 
                                ? `var(--accent-${30 + i * 5})` 
                                : `var(--accent-${60 + (i - 7) * 5})`,
                            opacity: 0.7,
                        }}
                        title={day.title}
                    />
                ))}
            </div>

            <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                Day 1 captures your baseline breath benchmark.
            </p>

            <p className="text-[14px] leading-relaxed font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.9)' }}>
                Day 14 repeats it so you can compare your change directly.
            </p>

            <div className="flex gap-4 justify-center pt-2">
                <PillButton onClick={onBack} variant="secondary" size="md">
                    Back
                </PillButton>
                <PillButton onClick={onNext} variant="primary" size="md">
                    Continue
                </PillButton>
            </div>
        </div>
    );
}

function StepDaySelection({ onNext, onBack, selectedDays, setSelectedDays, isLight }) {
    const isValid = selectedDays.length === 6;

    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <DayOfWeekPicker
                value={selectedDays}
                onChange={setSelectedDays}
                minSelected={6}
                maxSelected={6}
                title="Select Practice Days"
                subtitle="This is a contract. Choose the days you will keep."
            />

            <div className="flex gap-4 justify-center pt-2">
                <PillButton onClick={onBack} variant="secondary" size="md">
                    Back
                </PillButton>
                <PillButton onClick={onNext} variant="primary" size="md" disabled={!isValid}>
                    Continue
                </PillButton>
            </div>

            {!isValid && (
                <p className="text-[12px]" style={{ color: isLight ? 'rgba(140, 80, 40, 0.7)' : 'rgba(255, 170, 140, 0.8)' }}>
                    Choose exactly 6 days to continue.
                </p>
            )}
        </div>
    );
}

function StepTimeSelection({ onNext, onBack, selectedTimes, setSelectedTimes, isLight }) {
    const hasRequiredTimes = selectedTimes.length === 2;

    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <h2
                className="text-xl font-semibold tracking-wide"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-color)',
                }}
            >
                Select Contract Times
            </h2>

            <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                Choose exactly 2 daily slots: one morning and one evening.
            </p>

            <PracticeTimesPicker
                value={selectedTimes}
                onChange={setSelectedTimes}
                title={null}
            />

            <div className="flex gap-4 justify-center pt-2">
                <PillButton onClick={onBack} variant="secondary" size="md">
                    Back
                </PillButton>
                <PillButton onClick={onNext} variant="primary" size="md" disabled={!hasRequiredTimes}>
                    Continue
                </PillButton>
            </div>

            {!hasRequiredTimes && (
                <p className="text-[12px]" style={{ color: isLight ? 'rgba(140, 80, 40, 0.7)' : 'rgba(255, 170, 140, 0.8)' }}>
                    Choose exactly 2 times to continue.
                </p>
            )}
        </div>
    );
}

function StepBenchmark({ onNext, onBack, isLight, benchmarkResolved, onBenchmarkResolved }) {
    const lastBenchmark = useBreathBenchmarkStore(s => s.lastBenchmark);
    const canReuseLastBenchmark = useBreathBenchmarkStore(s => s.canReuseLastBenchmark);
    const [showBenchmark, setShowBenchmark] = useState(false);
    const [resolvedVia, setResolvedVia] = useState(null); // 'fresh' | 'reuse'

    const hasLastBenchmark = Boolean(lastBenchmark?.measuredAt);
    const canReuse = hasLastBenchmark && canReuseLastBenchmark(14);

    const lastBenchmarkDate = hasLastBenchmark
        ? new Date(lastBenchmark.measuredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    const handleUsePrevious = () => {
        setResolvedVia('reuse');
        onBenchmarkResolved();
    };

    const handleBenchmarkSave = () => {
        setShowBenchmark(false);
        setResolvedVia('fresh');
        onBenchmarkResolved();
    };

    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <h2
                className="text-xl font-semibold tracking-wide"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-color)',
                }}
            >
                Breath Benchmark
            </h2>

            <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.75)' : 'rgba(253,251,245,0.75)' }}>
                Establish the baseline you will expand. Day 14 repeats it so you can compare your change directly.
            </p>

            <p className="text-[13px] leading-relaxed italic" style={{ color: isLight ? 'rgba(60, 50, 40, 0.65)' : 'rgba(253,251,245,0.65)' }}>
                Contract credit depends on completing scheduled legs — not benchmark results.
            </p>

            {benchmarkResolved ? (
                <p className="text-[14px] font-medium" style={{ color: 'var(--accent-color)' }}>
                    ✓ {resolvedVia === 'reuse' ? 'Using previous benchmark' : 'Benchmark recorded'}
                </p>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    {canReuse && (
                        <button
                            onClick={handleUsePrevious}
                            className="inline-flex flex-col items-center gap-1 px-5 py-3 rounded-2xl text-[13px] transition-opacity hover:opacity-90"
                            style={{
                                background: isLight ? 'rgba(180, 120, 40, 0.08)' : 'rgba(250, 208, 120, 0.08)',
                                border: isLight ? '1px solid rgba(180, 120, 40, 0.25)' : '1px solid rgba(250, 208, 120, 0.25)',
                                color: isLight ? 'rgba(140, 90, 20, 0.9)' : 'var(--accent-color)',
                            }}
                        >
                            <span>Use Previous Benchmark</span>
                            <span style={{ fontSize: '11px', opacity: 0.7 }}>recorded {lastBenchmarkDate}</span>
                        </button>
                    )}
                    <PillButton
                        onClick={() => setShowBenchmark(true)}
                        variant="secondary"
                        size="md"
                    >
                        {hasLastBenchmark ? 'Restart Benchmark' : 'Start Benchmark'}
                    </PillButton>
                </div>
            )}

            <div className="flex gap-4 justify-center pt-2">
                <PillButton onClick={onBack} variant="secondary" size="md">
                    Back
                </PillButton>
                <PillButton onClick={onNext} variant="primary" size="md" disabled={!benchmarkResolved}>
                    Continue
                </PillButton>
            </div>

            {!benchmarkResolved && (
                <p className="text-[12px]" style={{ color: isLight ? 'rgba(140, 80, 40, 0.7)' : 'rgba(255, 170, 140, 0.8)' }}>
                    {canReuse ? 'Use your previous benchmark or run a new one.' : 'Run the benchmark to continue.'}
                </p>
            )}

            <BreathBenchmark
                isOpen={showBenchmark}
                onClose={() => setShowBenchmark(false)}
                onSave={handleBenchmarkSave}
            />
        </div>
    );
}

function StepConfirm({ onComplete, onBack, selectedTimes, selectedDays, isLight, benchmarkResolved }) {
    const now = new Date();
    const firstSlotTime = selectedTimes?.[0] || null;
    const startAt = firstSlotTime ? computeScheduleAnchorStartAt({ now, firstSlotTime }) : null;
    const startsTomorrow = !!startAt && getLocalDateKey(startAt) !== getLocalDateKey(now);
    const selectedDayLabels = (selectedDays || []).map((d) => DAY_LABELS[d]).filter(Boolean).join(' ');
    const selectedTimeLabels = selectedTimes.map((timeValue) => formatTimeLabel(timeValue) || timeValue).join(' and ');

    return (
        <div className="space-y-8 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <h2
                className="text-xl font-semibold tracking-wide"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-color)',
                }}
            >
                Final Contract Summary
            </h2>

            <div className="space-y-4">
                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    Your 14-day contract starts {startsTomorrow ? 'tomorrow' : 'today'}.
                </p>

                <p className="text-[14px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    Days: {selectedDayLabels}
                </p>
                <p className="text-[14px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    Times: {selectedTimeLabels}
                </p>
                <p className="text-[12px]" style={{ color: isLight ? 'rgba(140, 80, 40, 0.75)' : 'rgba(255, 170, 140, 0.85)' }}>
                    Outside these days/times is logged but not credited.
                </p>
                {!benchmarkResolved && (
                    <p className="text-[12px]" style={{ color: isLight ? 'rgba(180, 80, 40, 0.85)' : 'rgba(255, 180, 120, 0.95)' }}>
                        Complete the breathing benchmark first.
                    </p>
                )}

                <div className="w-24 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                <p className="text-[14px] leading-relaxed italic" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    This is about keeping your word, one day at a time.
                </p>
            </div>

            <div className="flex gap-4 justify-center pt-4">
                <PillButton onClick={onBack} variant="secondary" size="md">
                    Back
                </PillButton>
                <PillButton
                    onClick={onComplete}
                    variant="primary"
                    size="lg"
                    disabled={!benchmarkResolved}
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                    }}
                >
                    Begin Contract
                </PillButton>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CurriculumOnboarding({ onDismiss, onComplete }) {
    const [step, setStep] = useState(1);
    const [benchmarkResolved, setBenchmarkResolved] = useState(false);

    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    const {
        completeOnboarding,
        dismissOnboarding,
        practiceTimeSlots,
        selectedDaysOfWeekDraft,
        setPracticeTimeSlots,
        setSelectedDaysOfWeekDraft,
        getSelectedDaysOfWeekDraft,
    } = useCurriculumStore();
    const [selectedTimes, setSelectedTimes] = useState(normalizeAndSortTimeSlots(practiceTimeSlots || [], { maxCount: 24 }));
    const [selectedDays, setSelectedDays] = useState(
        getSelectedDaysOfWeekDraft?.() || selectedDaysOfWeekDraft || [1, 2, 3, 4, 5, 6]
    );

    const handleSelectedDaysChange = (days) => {
        setSelectedDays(days);
        setSelectedDaysOfWeekDraft?.(days);
    };

    const handleSelectedTimesChange = (times) => {
        setSelectedTimes(times);
        setPracticeTimeSlots?.(times);
    };

    const handleComplete = () => {
        if (selectedTimes.length !== 2 || selectedDays.length !== 6 || !benchmarkResolved) {
            return;
        }
        completeOnboarding(selectedTimes, [], selectedDays);
        onComplete?.();
    };

    const handleDismiss = () => {
        dismissOnboarding();
        onDismiss?.();
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-lg"
            style={{ 
                background: isLight ? 'rgba(245, 240, 235, 0.95)' : 'rgba(0, 0, 0, 0.95)',
                animation: 'fadeIn 600ms ease-out',
            }}
        >
            <div
                className="custom-scrollbar max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto px-8 py-10 relative"
                style={{ animation: 'slideUp 800ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
                {/* Corner flourishes */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 opacity-30" style={{ borderColor: 'var(--accent-color)' }} />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 opacity-30" style={{ borderColor: 'var(--accent-color)' }} />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 opacity-30" style={{ borderColor: 'var(--accent-color)' }} />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 opacity-30" style={{ borderColor: 'var(--accent-color)' }} />

                {/* Skip button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 px-3 py-1 rounded text-xs transition-opacity hover:opacity-100"
                    style={{ 
                        color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.4)',
                        opacity: 0.7,
                    }}
                >
                    I already understand
                </button>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map(s => (
                        <div
                            key={s}
                            className="w-2 h-2 rounded-full transition-all"
                            style={{
                                background: s === step 
                                    ? 'var(--accent-color)' 
                                    : s < step 
                                        ? 'var(--accent-40)' 
                                        : isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                            }}
                        />
                    ))}
                </div>

                {/* Step content */}
                <div className="relative z-10">
                    {step === 1 && (
                        <StepWelcome
                            onNext={() => setStep(2)}
                            isLight={isLight}
                        />
                    )}
                    {step === 2 && (
                        <StepCurriculumOverview
                            onNext={() => setStep(3)}
                            onBack={() => setStep(1)}
                            isLight={isLight}
                        />
                    )}
                    {step === 3 && (
                        <StepPostureGuidance
                            onNext={() => setStep(4)}
                            onBack={() => setStep(2)}
                            isLight={isLight}
                        />
                    )}
                    {step === 4 && (
                        <StepStillnessFocusIntensity
                            onNext={() => setStep(5)}
                            onBack={() => setStep(3)}
                            isLight={isLight}
                        />
                    )}
                    {step === 5 && (
                        <StepDaySelection
                            onNext={() => setStep(6)}
                            onBack={() => setStep(4)}
                            selectedDays={selectedDays}
                            setSelectedDays={handleSelectedDaysChange}
                            isLight={isLight}
                        />
                    )}
                    {step === 6 && (
                        <StepTimeSelection
                            onNext={() => setStep(7)}
                            onBack={() => setStep(5)}
                            selectedTimes={selectedTimes}
                            setSelectedTimes={handleSelectedTimesChange}
                            isLight={isLight}
                        />
                    )}
                    {step === 7 && (
                        <StepBenchmark
                            onNext={() => setStep(8)}
                            onBack={() => setStep(6)}
                            isLight={isLight}
                            benchmarkResolved={benchmarkResolved}
                            onBenchmarkResolved={() => setBenchmarkResolved(true)}
                        />
                    )}
                    {step === 8 && (
                        <StepConfirm
                            onComplete={handleComplete}
                            onBack={() => setStep(7)}
                            selectedTimes={selectedTimes}
                            selectedDays={selectedDays}
                            benchmarkResolved={benchmarkResolved}
                            isLight={isLight}
                        />
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--accent-30);
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
}

export default CurriculumOnboarding;
