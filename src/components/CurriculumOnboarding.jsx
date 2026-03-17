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

import React, { useEffect, useState } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { PillButton } from './ui/PillButton';
import { PracticeTimesPicker } from './schedule/PracticeTimesPicker.jsx';
import { DayOfWeekPicker } from './schedule/DayOfWeekPicker.jsx';
import { RITUAL_INITIATION_14_V2 } from '../data/ritualInitiation14v2.js';
import { ONBOARDING_CONTENT_CHANGE_EVENT, readOnboardingCurriculumContent } from '../data/onboardingCurriculumContent.js';
import { getLocalDateKey } from '../utils/dateUtils.js';
import { computeScheduleAnchorStartAt, normalizeAndSortTimeSlots } from '../utils/scheduleUtils.js';
import { useBreathBenchmarkStore } from '../state/breathBenchmarkStore.js';
import { BreathBenchmark } from './BreathBenchmark.jsx';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TOTAL_STEPS = 8;
const DEFAULT_STEP_SPACING = { compact: 'space-y-6', normal: 'space-y-8', roomy: 'space-y-10' };
const DEFAULT_SECTION_SPACING = { compact: 'space-y-4', normal: 'space-y-5', roomy: 'space-y-6' };
const DEFAULT_CARD_SPACING = { compact: 'space-y-3', normal: 'space-y-4', roomy: 'space-y-5' };
const DEFAULT_LIST_SPACING = { compact: 'space-y-2', normal: 'space-y-3', roomy: 'space-y-4' };

const getSpacingClass = (token, classMap) => classMap[token] || classMap.normal;

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

function StepWelcome({ onNext, isLight, content }) {
    return (
        <div className={`${getSpacingClass(content.spacing?.step, DEFAULT_STEP_SPACING)} text-center`} style={{ animation: 'fadeIn 400ms ease-out' }}>
            <div className={getSpacingClass(content.spacing?.content, DEFAULT_SECTION_SPACING)}>
                <h1
                    className="text-2xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                        textShadow: '0 0 20px var(--accent-20)',
                    }}
                >
                    {content.title}
                </h1>

                <p className="text-[16px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    {content.intro}
                </p>

                <div className="w-32 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.75)' : 'rgba(253,251,245,0.75)' }}>
                    {content.paragraphs?.[0]}
                </p>

                <p className="text-[16px] leading-relaxed font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.95)' }}>
                    {content.paragraphs?.[1]}
                </p>

                <div
                    className={`${getSpacingClass(content.spacing?.card, DEFAULT_CARD_SPACING)} rounded-2xl px-4 py-4 text-left`}
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <div className="space-y-2">
                        <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                            {content.contractMeaning?.title}
                        </p>
                        {(content.contractMeaning?.paragraphs || []).map((paragraph) => (
                            <p key={paragraph} className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                            {content.dailyStructure?.title}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {(content.dailyStructure?.items || []).map((item) => (
                                <div key={`${item.label}-${item.description}`}>
                                    <p className="text-[13px] font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.85)' : 'rgba(253,251,245,0.85)' }}>
                                        {item.label}
                                    </p>
                                    <p className="text-[13px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.65)' : 'rgba(253,251,245,0.65)' }}>
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                            {content.trainingFocus?.title}
                        </p>
                        {(content.trainingFocus?.bulletItems || []).map((item) => (
                            <p key={item} className="text-[13px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                                · {item}
                            </p>
                        ))}
                    </div>
                </div>

                <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.62)' : 'rgba(253,251,245,0.62)' }}>
                    {content.calloutText}
                </p>
            </div>

            <PillButton onClick={onNext} variant="primary" size="lg">
                Continue
            </PillButton>
        </div>
    );
}

function StepPostureGuidance({ onNext, onBack, isLight, content }) {
    return (
        <div className={`${getSpacingClass(content.spacing?.step, { compact: 'space-y-5', normal: 'space-y-6', roomy: 'space-y-8' })} text-center`} style={{ animation: 'fadeIn 400ms ease-out' }}>
            <div className={getSpacingClass(content.spacing?.cards, DEFAULT_SECTION_SPACING)}>
                <h2
                    className="text-xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                    }}
                >
                    {content.title}
                </h2>

                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    {content.intro}
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {(content.imageCards || []).map((image) => (
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
                            {image.label ? (
                                <p className="mt-2 text-[11px] uppercase tracking-wide" style={{ color: isLight ? 'rgba(60, 50, 40, 0.55)' : 'rgba(253,251,245,0.55)' }}>
                                    {image.label}
                                </p>
                            ) : null}
                            <figcaption className={`${image.label ? 'mt-1' : 'mt-2'} text-[12px] leading-relaxed`} style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.72)' }}>
                                {image.caption}
                            </figcaption>
                        </figure>
                    ))}
                </div>

                <div
                    className={`${getSpacingClass(content.spacing?.guidance, DEFAULT_LIST_SPACING)} rounded-2xl px-4 py-4 text-left`}
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                        {content.guidanceTitle}
                    </p>
                    {(content.guidanceParagraphs || []).map((paragraph) => (
                        <p key={paragraph} className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                            {paragraph}
                        </p>
                    ))}
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

function StepStillnessFocusIntensity({ onNext, onBack, isLight, content }) {
    return (
        <div className={`${getSpacingClass(content.spacing?.step, { compact: 'space-y-5', normal: 'space-y-6', roomy: 'space-y-8' })} text-center`} style={{ animation: 'fadeIn 400ms ease-out' }}>
            <div className={getSpacingClass(content.spacing?.callout, DEFAULT_SECTION_SPACING)}>
                <h2
                    className="text-xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                    }}
                >
                    {content.title}
                </h2>

                <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    {content.intro}
                </p>

                <div
                    className={`${getSpacingClass(content.spacing?.callout, DEFAULT_LIST_SPACING)} rounded-2xl px-4 py-4 text-left`}
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                        {content.intervalTitle}
                    </p>
                    {(content.intervalParagraphs || []).map((paragraph) => (
                        <p key={paragraph} className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                            {paragraph}
                        </p>
                    ))}
                </div>

                <div className={getSpacingClass(content.spacing?.cards, DEFAULT_LIST_SPACING)}>
                    {(content.imageCards || []).map((image) => (
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
                                        {image.label}
                                    </p>
                                    <p className="text-[12px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.74)' : 'rgba(253,251,245,0.74)' }}>
                                        {image.caption}
                                    </p>
                                    <p className="text-[12px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.62)' : 'rgba(253,251,245,0.62)' }}>
                                        {image.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    className={`${getSpacingClass(content.spacing?.callout, DEFAULT_LIST_SPACING)} rounded-2xl px-4 py-4 text-left`}
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <p className="text-[12px] uppercase tracking-widest" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.45)' }}>
                        {content.meaningTitle}
                    </p>
                    {(content.meaningParagraphs || []).map((paragraph) => (
                        <p key={paragraph} className="text-[13px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.72)' : 'rgba(253,251,245,0.72)' }}>
                            {paragraph}
                        </p>
                    ))}
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

function StepCurriculumOverview({ onNext, onBack, isLight, content }) {
    const curriculum = RITUAL_INITIATION_14_V2;
    
    return (
        <div className={`${getSpacingClass(content.spacing?.step, { compact: 'space-y-5', normal: 'space-y-6', roomy: 'space-y-8' })} text-center`} style={{ animation: 'fadeIn 400ms ease-out' }}>
            <h2
                className="text-xl font-semibold tracking-wide"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-color)',
                }}
            >
                {content.title}
            </h2>

            {/* Week Overview */}
            <div className="grid grid-cols-2 gap-4 py-2">
                {(content.weekCards || []).map((card) => (
                    <div 
                        key={card.title}
                        className="p-4 rounded-xl text-left"
                        style={{ 
                            background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                    >
                        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-color)' }}>{card.title}</h3>
                        <p className="text-xs" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                            {card.description}
                        </p>
                    </div>
                ))}
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
                {content.paragraphs?.[0]}
            </p>

            <p className="text-[14px] leading-relaxed font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.9)' }}>
                {content.paragraphs?.[1]}
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

function StepConfirm({ onComplete, onBack, selectedTimes, selectedDays, isLight, benchmarkResolved, content }) {
    const now = new Date();
    const firstSlotTime = selectedTimes?.[0] || null;
    const startAt = firstSlotTime
        ? computeScheduleAnchorStartAt({
            now,
            firstSlotTime,
            selectedDaysOfWeek: selectedDays,
        })
        : null;
    const startsTomorrow = !!startAt && getLocalDateKey(startAt) !== getLocalDateKey(now);
    const selectedDayLabels = (selectedDays || []).map((d) => DAY_LABELS[d]).filter(Boolean).join(' ');
    const selectedTimeLabels = selectedTimes.map((timeValue) => formatTimeLabel(timeValue) || timeValue).join(' and ');

    return (
        <div className={`${getSpacingClass(content.spacing?.step, DEFAULT_STEP_SPACING)} text-center`} style={{ animation: 'fadeIn 400ms ease-out' }}>
            <h2
                className="text-xl font-semibold tracking-wide"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-color)',
                }}
            >
                {content.title}
            </h2>

            <div className={getSpacingClass(content.spacing?.summary, DEFAULT_CARD_SPACING)}>
                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    {content.introPrefix}{startsTomorrow ? 'tomorrow' : 'today'}{content.introSuffix}
                </p>

                <p className="text-[14px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    {content.daysLabel}: {selectedDayLabels}
                </p>
                <p className="text-[14px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    {content.timesLabel}: {selectedTimeLabels}
                </p>
                <p className="text-[12px]" style={{ color: isLight ? 'rgba(140, 80, 40, 0.75)' : 'rgba(255, 170, 140, 0.85)' }}>
                    {content.creditNote}
                </p>
                {!benchmarkResolved && (
                    <p className="text-[12px]" style={{ color: isLight ? 'rgba(180, 80, 40, 0.85)' : 'rgba(255, 180, 120, 0.95)' }}>
                        {content.benchmarkWarning}
                    </p>
                )}

                <div className="w-24 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                <p className="text-[14px] leading-relaxed italic" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    {content.closingText}
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
    const [onboardingContent, setOnboardingContent] = useState(() => readOnboardingCurriculumContent());

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

    useEffect(() => {
        const syncContent = () => {
            setOnboardingContent(readOnboardingCurriculumContent());
        };

        window.addEventListener(ONBOARDING_CONTENT_CHANGE_EVENT, syncContent);
        window.addEventListener('storage', syncContent);

        return () => {
            window.removeEventListener(ONBOARDING_CONTENT_CHANGE_EVENT, syncContent);
            window.removeEventListener('storage', syncContent);
        };
    }, []);

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
                    Cancel
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
                            content={onboardingContent.welcome}
                        />
                    )}
                    {step === 2 && (
                        <StepCurriculumOverview
                            onNext={() => setStep(3)}
                            onBack={() => setStep(1)}
                            isLight={isLight}
                            content={onboardingContent.curriculumOverview}
                        />
                    )}
                    {step === 3 && (
                        <StepPostureGuidance
                            onNext={() => setStep(4)}
                            onBack={() => setStep(2)}
                            isLight={isLight}
                            content={onboardingContent.postureGuidance}
                        />
                    )}
                    {step === 4 && (
                        <StepStillnessFocusIntensity
                            onNext={() => setStep(5)}
                            onBack={() => setStep(3)}
                            isLight={isLight}
                            content={onboardingContent.stillnessFocusIntensity}
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
                            content={onboardingContent.confirm}
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
