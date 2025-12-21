// src/components/Application/practices/SwordCompression.jsx
// Rapid decision clarity practice with optional timer and righteousness detection
import React, { useState, useEffect, useCallback } from 'react';
import { useModeTrainingStore, PRACTICE_STATES } from '../../../state/modeTrainingStore.js';
import { PRACTICE_DEFINITIONS } from '../../../state/practiceConfig.js';

export function SwordCompression({ onComplete }) {
    const { practiceState, setPracticeState, addEntry, setTimerUsed, currentSession, updateCompletion } = useModeTrainingStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [currentInput, setCurrentInput] = useState('');
    const [introComplete, setIntroComplete] = useState(false);
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(60);
    const [showRighteousnessWarning, setShowRighteousnessWarning] = useState(false);

    const config = PRACTICE_DEFINITIONS.sword;
    const steps = config.steps;

    // Intro phase
    useEffect(() => {
        if (practiceState === PRACTICE_STATES.INTRO) {
            const timer = setTimeout(() => {
                setIntroComplete(true);
                setPracticeState(PRACTICE_STATES.ACTIVE);
                setTimerUsed(timerEnabled);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [practiceState, setPracticeState, timerEnabled, setTimerUsed]);

    // Timer countdown (250ms interval for smoothness)
    useEffect(() => {
        if (practiceState === PRACTICE_STATES.ACTIVE && timerEnabled && timeRemaining > 0) {
            const interval = setInterval(() => {
                setTimeRemaining(t => Math.max(0, t - 0.25));
            }, 250);
            return () => clearInterval(interval);
        }
    }, [practiceState, timerEnabled, timeRemaining]);

    // Pause on visibility change (mobile)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && practiceState === PRACTICE_STATES.ACTIVE) {
                useModeTrainingStore.getState().pauseSession();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [practiceState]);

    // Check for external blame language (righteousness detection)
    const checkForRighteousness = useCallback((text) => {
        const blameIndicators = config.blameIndicators;
        return blameIndicators.some(word => text.toLowerCase().includes(word.toLowerCase()));
    }, [config.blameIndicators]);

    // Handle next step
    const handleNext = () => {
        if (currentInput.trim()) {
            addEntry(`sword-step-${currentStep}`, 'text', currentInput);
            updateCompletion((currentStep + 1) / steps.length);

            // Check for righteousness (external blame)
            if (checkForRighteousness(currentInput)) {
                setShowRighteousnessWarning(true);
            }
        }
        setCurrentInput('');

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setPracticeState(PRACTICE_STATES.REFLECTION);
        }
    };

    // Toggle timer
    const toggleTimer = () => {
        setTimerEnabled(!timerEnabled);
        setTimeRemaining(60);
    };

    // Intro screen
    if (!introComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <p
                    className="text-2xl"
                    style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        color: 'rgba(255, 255, 255, 0.8)',
                        opacity: 0,
                        animation: 'fadeIn 2s ease-out forwards',
                    }}
                >
                    Clarity exists. Find it.
                </p>
            </div>
        );
    }

    // Reflection screen
    if (practiceState === PRACTICE_STATES.REFLECTION) {
        const session = currentSession;
        const completionRatio = session?.completionRatio || 0;

        const prompt = completionRatio < 0.5
            ? config.reflectionPrompts.early
            : config.reflectionPrompts.complete;

        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <p
                    className="text-xl mb-8"
                    style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        color: 'rgba(255, 255, 255, 0.9)',
                    }}
                >
                    {prompt}
                </p>
                <p
                    className="text-sm mb-8 max-w-xs"
                    style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        color: 'rgba(255, 255, 255, 0.5)',
                    }}
                >
                    No answer required. Just notice.
                </p>
                {/* De-escalation warning (if righteousness detected) */}
                {showRighteousnessWarning && (
                    <p
                        className="text-xs mb-8 max-w-sm"
                        style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                            fontStyle: 'italic',
                            color: 'rgba(248, 113, 113, 0.6)',
                        }}
                    >
                        {config.deEscalation}
                    </p>
                )}
                <button
                    onClick={onComplete}
                    className="px-6 py-2 rounded border border-white/30 text-white/70 hover:text-white hover:border-white/50 transition-all"
                    style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: '11px', letterSpacing: 'var(--tracking-wide)' }}
                >
                    END PRACTICE
                </button>
            </div>
        );
    }

    // Active practice - 3 steps with optional timer
    return (
        <div className="flex flex-col items-center justify-center h-full px-8">
            {/* Timer toggle (only on first step) */}
            {currentStep === 0 && (
                <div className="mb-4">
                    <button
                        onClick={toggleTimer}
                        className="text-xs text-white/40 hover:text-white/60 transition-colors"
                        style={{ fontFamily: "var(--font-ui)", fontWeight: 600, letterSpacing: '0.05em' }}
                    >
                        {timerEnabled ? '⏱ TIMED (60s)' : '⏱ UNTIMED'}
                    </button>
                </div>
            )}

            {/* Linear timer bar */}
            {timerEnabled && (
                <div className="w-full max-w-sm mb-6">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            style={{
                                width: `${(timeRemaining / 60) * 100}%`,
                                height: '100%',
                                backgroundColor: config.accent,
                                transition: 'width 0.25s linear',
                            }}
                        />
                    </div>
                </div>
            )}

            {!timerEnabled && <div className="mb-6" />}

            {/* Current prompt */}
            <p
                className="text-lg mb-4 text-center"
                style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontStyle: 'italic',
                    color: 'rgba(255, 255, 255, 0.9)',
                }}
            >
                {steps[currentStep]}
            </p>

            {/* Single-line input (terse) */}
            <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && currentInput.trim() && handleNext()}
                placeholder="Type here..."
                className="w-full max-w-sm px-4 py-2 mb-6 rounded bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-red-400/50"
                style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontSize: '14px',
                }}
            />

            {/* Commit button */}
            <button
                onClick={handleNext}
                disabled={!currentInput.trim()}
                className="px-6 py-2 rounded border border-red-400/30 text-red-300/70 hover:text-red-200 hover:border-red-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: '12px', letterSpacing: '0.1em' }}
            >
                {currentStep < steps.length - 1 ? 'NEXT' : 'COMMIT'}
            </button>
        </div>
    );
}
