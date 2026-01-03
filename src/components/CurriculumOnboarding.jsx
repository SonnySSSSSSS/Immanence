// src/components/CurriculumOnboarding.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM ONBOARDING — Multi-step introduction to daily practice
// ═══════════════════════════════════════════════════════════════════════════
//
// Skippable onboarding flow that introduces:
// 1. Welcome & Philosophy
// 2. Practice explanation
// 3. 14-day curriculum overview
// 4. Time selection for daily practice
// 5. Confirmation & start
//
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { PillButton } from './ui/PillButton';
import { RITUAL_FOUNDATION_14 } from '../data/ritualFoundation14.js';

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

                <div className="grid grid-cols-3 gap-4 py-4">
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

function StepTimeSelection({ onNext, onBack, selectedTimes, setSelectedTimes, isLight }) {
    const toggleTime = (timeValue) => {
        if (selectedTimes.includes(timeValue)) {
            setSelectedTimes(selectedTimes.filter(t => t !== timeValue));
        } else if (selectedTimes.length < 2) {
            setSelectedTimes([...selectedTimes, timeValue]);
        }
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
                Set Your Practice Times
            </h2>

            <p className="text-[14px] leading-relaxed" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)' }}>
                Select up to 2 times when you'd like to be reminded to practice.
            </p>

            <p className="text-[12px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(253,251,245,0.5)' }}>
                (Optional — you can skip this)
            </p>

            {/* Time Grid */}
            <div className="grid grid-cols-4 gap-2 py-2 max-h-48 overflow-y-auto custom-scrollbar">
                {TIME_OPTIONS.map(option => {
                    const isSelected = selectedTimes.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            onClick={() => toggleTime(option.value)}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
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
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {selectedTimes.length > 0 && (
                <p className="text-[13px]" style={{ color: 'var(--accent-color)' }}>
                    Selected: {selectedTimes.map(t => TIME_OPTIONS.find(o => o.value === t)?.label).join(', ')}
                </p>
            )}

            <div className="flex gap-4 justify-center pt-2">
                <PillButton onClick={onBack} variant="secondary" size="md">
                    Back
                </PillButton>
                <PillButton onClick={onNext} variant="primary" size="md">
                    {selectedTimes.length > 0 ? 'Continue' : 'Skip'}
                </PillButton>
            </div>
        </div>
    );
}

function StepConfirm({ onComplete, onBack, selectedTimes, isLight }) {
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
                    Your 14-day curriculum starts today.
                </p>

                {selectedTimes.length > 0 && (
                    <p className="text-[14px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                        Practice times: {selectedTimes.map(t => TIME_OPTIONS.find(o => o.value === t)?.label).join(' & ')}
                    </p>
                )}

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
    const [selectedTimes, setSelectedTimes] = useState([]);
    
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    const { completeOnboarding, dismissOnboarding } = useCurriculumStore();

    const handleComplete = () => {
        // Convert selected times to time slot objects
        const timeSlots = selectedTimes.map(time => {
            const option = TIME_OPTIONS.find(o => o.value === time);
            return { time, period: option?.period || 'morning' };
        });
        
        completeOnboarding(timeSlots);
        onComplete?.();
    };

    const handleDismiss = () => {
        dismissOnboarding();
        onDismiss?.();
    };

    const totalSteps = 5;

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
                    {[1, 2, 3, 4, 5].map(s => (
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
                        <StepTimeSelection 
                            onNext={() => setStep(5)} 
                            onBack={() => setStep(3)} 
                            selectedTimes={selectedTimes}
                            setSelectedTimes={setSelectedTimes}
                            isLight={isLight} 
                        />
                    )}
                    {step === 5 && (
                        <StepConfirm 
                            onComplete={handleComplete} 
                            onBack={() => setStep(4)} 
                            selectedTimes={selectedTimes}
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
