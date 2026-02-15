// src/components/CurriculumOnboarding.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM ONBOARDING — Multi-step introduction to daily practice
// ═══════════════════════════════════════════════════════════════════════════
//
// Skippable onboarding flow that introduces:
// 1. Welcome & Philosophy
// 2. Practice explanation
// 3. 14-day curriculum overview
// 4. Practice day contract selection (5-7 days)
// 5. Time selection for daily practice (exactly 2)
// 6. Confirmation & start
//
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { PillButton } from './ui/PillButton';
import { PracticeTimesPicker } from './schedule/PracticeTimesPicker.jsx';
import { DayOfWeekPicker } from './schedule/DayOfWeekPicker.jsx';
import { RITUAL_FOUNDATION_14 } from '../data/ritualFoundation14.js';
import { getLocalDateKey } from '../utils/dateUtils.js';
import { computeScheduleAnchorStartAt } from '../utils/scheduleUtils.js';

// ═══════════════════════════════════════════════════════════════════════════
// TIME SLOT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

const TIME_OPTIONS = [
    { value: '05:00', label: '5:00 AM', period: 'early' },
    { value: '06:00', label: '6:00 AM', period: 'morning' },
    { value: '07:00', label: '7:00 AM', period: 'morning' },
    { value: '08:00', label: '8:00 AM', period: 'morning' },
    { value: '09:00', label: '9:00 AM', period: 'morning' },
    { value: '12:00', label: '12:00 PM', period: 'midday' },
    { value: '17:00', label: '5:00 PM', period: 'evening' },
    { value: '18:00', label: '6:00 PM', period: 'evening' },
    { value: '19:00', label: '7:00 PM', period: 'evening' },
    { value: '20:00', label: '8:00 PM', period: 'evening' },
    { value: '21:00', label: '9:00 PM', period: 'night' },
    { value: '22:00', label: '10:00 PM', period: 'night' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ═══════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StepWelcome({ onNext, isLight }) {
    return (
        <div className="space-y-8 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <div className="space-y-6">
                <h1
                    className="text-2xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                        textShadow: '0 0 20px var(--accent-20)',
                    }}
                >
                    Welcome to Your Practice
                </h1>

                <p className="text-[16px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    You're about to begin a 14-day journey into structured daily practice.
                </p>

                <div className="w-32 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    This isn't about relaxation or stress relief.
                </p>

                <p className="text-[16px] leading-relaxed font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.95)' }}>
                    It's about building the capacity to <em>be present</em> — to expand your container for awareness itself.
                </p>

                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                    Each day builds on the last. Consistency matters more than perfection.
                </p>
            </div>

            <PillButton onClick={onNext} variant="primary" size="lg">
                Continue
            </PillButton>
        </div>
    );
}

function StepPracticeExplain({ onNext, onBack, isLight }) {
    return (
        <div className="space-y-8 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <div className="space-y-6">
                <h2
                    className="text-xl font-semibold tracking-wide"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-color)',
                    }}
                >
                    How Practice Works
                </h2>

                <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-15)' }}>
                            <span className="text-2xl">🌬️</span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>Breathwork</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-15)' }}>
                            <span className="text-2xl">👁️</span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>Awareness</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-15)' }}>
                            <span className="text-2xl">🔮</span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>Rituals</span>
                    </div>
                </div>

                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    You'll practice different techniques: breathing, body awareness, thought observation, and structured rituals.
                </p>

                <div className="w-24 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    Some days are single practices. Others combine multiple techniques in a <strong>circuit</strong>.
                </p>

                <p className="text-[14px] leading-relaxed italic" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                    Sessions range from 5 to 18 minutes.
                </p>
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
    const curriculum = RITUAL_FOUNDATION_14;
    
    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <h2
                className="text-xl font-semibold tracking-wide"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-color)',
                }}
            >
                Your 14-Day Path
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
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-color)' }}>Week 1: Settling</h3>
                    <p className="text-xs" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                        Building the habit. Breath, body, and first circuits.
                    </p>
                </div>
                <div 
                    className="p-4 rounded-xl text-left"
                    style={{ 
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-color)' }}>Week 2: Deepening</h3>
                    <p className="text-xs" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                        Expanding capacity. Rituals, sound, and integration.
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
                You'll track each day's completion and reflect on your experience.
            </p>

            <p className="text-[14px] leading-relaxed font-medium" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.9)' }}>
                At the end, you'll receive a complete report of your journey.
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
    const isValid = selectedDays.length >= 5 && selectedDays.length <= 7;

    return (
        <div className="space-y-6 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <DayOfWeekPicker
                value={selectedDays}
                onChange={setSelectedDays}
                minSelected={5}
                maxSelected={7}
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
                    Choose 5-7 days to continue.
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
                Set Your Practice Times
            </h2>

            <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                Select exactly 2 times for your daily contract.
            </p>

            <PracticeTimesPicker
                value={selectedTimes}
                onChange={setSelectedTimes}
                maxSlots={2}
                timeOptions={TIME_OPTIONS.map(option => option.value)}
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

function StepConfirm({ onComplete, onBack, selectedTimes, selectedDays, isLight }) {
    const now = new Date();
    const firstSlotTime = selectedTimes?.[0] || null;
    const startAt = firstSlotTime ? computeScheduleAnchorStartAt({ now, firstSlotTime }) : null;
    const startsTomorrow = !!startAt && getLocalDateKey(startAt) !== getLocalDateKey(now);
    const selectedDayLabels = (selectedDays || []).map((d) => DAY_LABELS[d]).filter(Boolean).join(' ');
    const selectedTimeLabels = selectedTimes.map(t => TIME_OPTIONS.find(o => o.value === t)?.label || t).join(' and ');

    return (
        <div className="space-y-8 text-center" style={{ animation: 'fadeIn 400ms ease-out' }}>
            <h2
                className="text-xl font-semibold tracking-wide"
                style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-color)',
                }}
            >
                Ready to Begin
            </h2>

            <div className="space-y-4">
                <p className="text-[15px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}>
                    Your 14-day curriculum starts {startsTomorrow ? 'tomorrow' : 'today'}.
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

                <div className="w-24 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                <p className="text-[14px] leading-relaxed italic" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                    "The journey of a thousand miles begins with a single breath."
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
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                    }}
                >
                    Begin Journey
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
    const [selectedTimes, setSelectedTimes] = useState((practiceTimeSlots || []).slice(0, 2));
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
        completeOnboarding(selectedTimes, [], selectedDays);
        onComplete?.();
    };

    const handleDismiss = () => {
        dismissOnboarding();
        onDismiss?.();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-lg"
            style={{ 
                background: isLight ? 'rgba(245, 240, 235, 0.95)' : 'rgba(0, 0, 0, 0.95)',
                animation: 'fadeIn 600ms ease-out',
            }}
        >
            <div
                className="max-w-lg mx-auto px-8 py-10 relative"
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
                    Skip for now
                </button>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5, 6].map(s => (
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
                        <StepWelcome onNext={() => setStep(2)} isLight={isLight} />
                    )}
                    {step === 2 && (
                        <StepPracticeExplain 
                            onNext={() => setStep(3)} 
                            onBack={() => setStep(1)} 
                            isLight={isLight} 
                        />
                    )}
                    {step === 3 && (
                        <StepCurriculumOverview 
                            onNext={() => setStep(4)} 
                            onBack={() => setStep(2)} 
                            isLight={isLight} 
                        />
                    )}
                    {step === 4 && (
                        <StepDaySelection
                            onNext={() => setStep(5)}
                            onBack={() => setStep(3)}
                            selectedDays={selectedDays}
                            setSelectedDays={handleSelectedDaysChange}
                            isLight={isLight}
                        />
                    )}
                    {step === 5 && (
                        <StepTimeSelection 
                            onNext={() => setStep(6)} 
                            onBack={() => setStep(4)} 
                            selectedTimes={selectedTimes}
                            setSelectedTimes={handleSelectedTimesChange}
                            isLight={isLight} 
                        />
                    )}
                    {step === 6 && (
                        <StepConfirm 
                            onComplete={handleComplete} 
                            onBack={() => setStep(5)} 
                            selectedTimes={selectedTimes}
                            selectedDays={selectedDays}
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
