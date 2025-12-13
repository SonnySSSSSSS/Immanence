// src/components/Application/practices/ResonatorChambering.jsx
// 5-step somatic regulation practice with bookend (return to sensation)
import React, { useState, useEffect } from 'react';
import { useModeTrainingStore, PRACTICE_STATES } from '../../../state/modeTrainingStore.js';
import { PRACTICE_DEFINITIONS } from '../../../state/practiceConfig.js';

export function ResonatorChambering({ onComplete }) {
    const { practiceState, setPracticeState, addEntry, addSkip, currentSession } = useModeTrainingStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [currentInput, setCurrentInput] = useState('');
    const [introComplete, setIntroComplete] = useState(false);

    const config = PRACTICE_DEFINITIONS.resonator;
    const steps = config.steps;

    // Intro phase
    useEffect(() => {
        if (practiceState === PRACTICE_STATES.INTRO) {
            const timer = setTimeout(() => {
                setIntroComplete(true);
                setPracticeState(PRACTICE_STATES.ACTIVE);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [practiceState, setPracticeState]);

    // Handle next step
    const handleNext = () => {
        if (currentInput.trim()) {
            addEntry(`resonator-step-${currentStep}`, 'text', currentInput);
        }
        setCurrentInput('');

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setPracticeState(PRACTICE_STATES.REFLECTION);
        }
    };

    // Handle skip (valid completion - no punishment)
    const handleSkip = () => {
        addSkip(`resonator-step-${currentStep}`);
        setCurrentInput('');

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setPracticeState(PRACTICE_STATES.REFLECTION);
        }
    };

    // Intro screen
    if (!introComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <p
                    className="text-2xl"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: 'italic',
                        color: 'rgba(255, 255, 255, 0.8)',
                        opacity: 0,
                        animation: 'fadeIn 2s ease-out forwards',
                    }}
                >
                    {config.whisper}
                </p>
            </div>
        );
    }

    // Reflection screen
    if (practiceState === PRACTICE_STATES.REFLECTION) {
        const session = currentSession;
        const skippedCount = session?.skippedCount || 0;
        const totalSteps = steps.length;

        // Different prompt based on skip behavior
        const prompt = skippedCount >= totalSteps / 2
            ? config.reflectionPrompts.manySkips
            : config.reflectionPrompts.fewSkips;

        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <p
                    className="text-xl mb-8"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: 'italic',
                        color: 'rgba(255, 255, 255, 0.9)',
                    }}
                >
                    {prompt}
                </p>
                <p
                    className="text-sm mb-8 max-w-xs"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255, 255, 255, 0.5)',
                    }}
                >
                    No answer required. Just notice.
                </p>
                {/* Anti-inflation line */}
                <p
                    className="text-xs mb-8 max-w-sm"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: 'italic',
                        color: 'rgba(167, 139, 250, 0.6)',
                    }}
                >
                    {config.antiInflation}
                </p>
                <button
                    onClick={onComplete}
                    className="px-6 py-2 rounded border border-white/30 text-white/70 hover:text-white hover:border-white/50 transition-all"
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', letterSpacing: '0.1em' }}
                >
                    END PRACTICE
                </button>
            </div>
        );
    }

    // Active practice - 5 steps
    return (
        <div className="flex flex-col items-center justify-center h-full px-8">
            {/* Progress dots */}
            <div className="flex gap-2 mb-8">
                {steps.map((_, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: idx === currentStep
                                ? config.accent
                                : idx < currentStep
                                    ? 'rgba(167, 139, 250, 0.3)'
                                    : 'rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>

            {/* Current prompt */}
            <p
                className="text-lg mb-6 text-center"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontStyle: 'italic',
                    color: 'rgba(255, 255, 255, 0.9)',
                }}
            >
                {steps[currentStep]}
            </p>

            {/* Text input */}
            <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type here or skip..."
                className="w-full max-w-sm h-24 px-4 py-3 mb-6 rounded bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-purple-400/50"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: '14px',
                }}
            />

            {/* Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={handleSkip}
                    className="px-6 py-2 rounded border border-white/20 text-white/50 hover:text-white/70 hover:border-white/40 transition-all"
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', letterSpacing: '0.05em' }}
                >
                    SKIP
                </button>
                <button
                    onClick={handleNext}
                    className="px-6 py-2 rounded border border-purple-400/30 text-purple-300/70 hover:text-purple-200 hover:border-purple-400/50 transition-all"
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', letterSpacing: '0.1em' }}
                >
                    {currentStep < steps.length - 1 ? 'NEXT' : 'COMPLETE'}
                </button>
            </div>
        </div>
    );
}
