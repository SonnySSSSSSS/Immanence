// src/components/Codex/practices/SwordCompression.jsx
// Rapid decision clarity practice with optional timer
import React, { useState, useEffect } from 'react';
import { useTrainingStore, PRACTICE_STATES } from '../../../state/trainingStore.js';
import { PRACTICE_DEFINITIONS } from '../../../state/practiceConfig.js';

export function SwordCompression({ onComplete }) {
    const { practiceState, setPracticeState, addEntry, setTimerUsed, currentSession, calculateModeCompletion } = useTrainingStore();
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
            }, 3000); // 3s intro
            return () => clearTimeout(timer);
        }
    }, [practiceState, setPracticeState, timerEnabled, setTimerUsed]);

    // Timer countdown
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
                setPracticeState(PRACTICE_STATES.PAUSED);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [practiceState, setPracticeState]);

    // Check for external blame language
    const checkForRighteousness = (text) => {
        const blameWords = ['they', 'you people', 'everyone', 'nobody', 'always', 'never'];
        return blameWords.some(word => text.toLowerCase().includes(word));
    };

    // Handle next step
    const handleNext = () => {
        if (currentInput.trim()) {
            addEntry(`sword-step-${currentStep}`, 'text', currentInput);

            // Check for righteousness
            if (checkForRighteousness(currentInput)) {
                setShowRighteousnessWarning(true);
            }
        }
        setCurrentInput('');

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // All steps complete
            setPracticeState(PRACTICE_STATES.REFLECTION);
        }
    };

    // Intro screen
    if (!introComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <p
                    className="text-2xl opacity-0 animate-fade-in"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: 'italic',
                        color: 'rgba(255, 255, 255, 0.8)',
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
            ? "What made you hesitate?"
            : "What became clear?";

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
                {showRighteousnessWarning && (
                    <p
                        className="text-xs mb-8 max-w-sm"
                        style={{
                            fontFamily: "'Crimson Pro', serif",
                            fontStyle: 'italic',
                            color: 'rgba(248, 113, 113, 0.6)',
                        }}
                    >
                        If you feel righteous instead of clear, return to Mirror.
                    </p>
                )}
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

    // Active practice - 3 steps with optional timer
    return (
        <div className="flex flex-col items-center justify-center h-full px-8">
            {/* Timer toggle */}
            {!timerEnabled && currentStep === 0 && (
                <div className="mb-4">
                    <button
                        onClick={() => setTimerEnabled(!timerEnabled)}
                        className="text-xs text-white/40 hover:text-white/60 transition-colors"
                        style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em' }}
                    >
                        {timerEnabled ? 'UNTIMED' : 'TIMED (60s)'}
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

            {/* Current prompt */}
            <p
                className="text-lg mb-4 text-center"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontStyle: 'italic',
                    color: 'rgba(255, 255, 255, 0.9)',
                }}
            >
                {steps[currentStep]}
            </p>

            {/* Single-line input */}
            <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && currentInput.trim() && handleNext()}
                placeholder="Type here..."
                className="w-full max-w-sm px-4 py-2 mb-6 rounded bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-red-400/50"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: '14px',
                }}
            />

            {/* Commit button */}
            <button
                onClick={handleNext}
                disabled={!currentInput.trim()}
                className="px-6 py-2 rounded border border-red-400/30 text-red-300/70 hover:text-red-200 hover:border-red-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', letterSpacing: '0.1em' }}
            >
                {currentStep < steps.length - 1 ? 'NEXT' : 'COMMIT'}
            </button>
        </div>
    );
}
