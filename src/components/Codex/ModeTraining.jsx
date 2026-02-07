// src/components/Codex/ModeTraining.jsx
// Modal container for mode-based training practices
import { useState, useEffect, useCallback } from 'react';
import { useTrainingStore, PRACTICE_STATES } from '../../state/trainingStore.js';
import { CODEX_MODES } from './codexCards.js';
import { PRACTICE_DEFINITIONS } from '../../state/practiceConfig.js';
import { ResonatorChambering } from './practices/ResonatorChambering.jsx';
import { PrismReframing } from './practices/PrismReframing.jsx';
import { SwordCompression } from './practices/SwordCompression.jsx';

// ==========================================
// Mirror: Timed Stillness Practice
// ==========================================
function MirrorStillness({ onComplete }) {
    const { practiceState, setPracticeState, updateCompletion } = useTrainingStore();
    const [timeRemaining, setTimeRemaining] = useState(90); // 90 seconds
    const [totalTime] = useState(90);
    const [introComplete, setIntroComplete] = useState(false);

    // Intro phase
    useEffect(() => {
        if (practiceState === PRACTICE_STATES.INTRO) {
            const timer = setTimeout(() => {
                setIntroComplete(true);
                setPracticeState(PRACTICE_STATES.ACTIVE);
            }, 3000); // 3s intro
            return () => clearTimeout(timer);
        }
    }, [practiceState, setPracticeState]);

    // Active countdown
    useEffect(() => {
        if (practiceState === PRACTICE_STATES.ACTIVE && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(t => {
                    const newTime = t - 1;
                    updateCompletion((totalTime - newTime) / totalTime);
                    return newTime;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeRemaining === 0 && practiceState === PRACTICE_STATES.ACTIVE) {
            setPracticeState(PRACTICE_STATES.REFLECTION);
        }
    }, [practiceState, timeRemaining, totalTime, updateCompletion, setPracticeState]);

    const handleEndEarly = () => {
        const completion = (totalTime - timeRemaining) / totalTime;
        updateCompletion(completion);
        setPracticeState(PRACTICE_STATES.REFLECTION);
    };

    // Calculate ring progress
    const progress = (totalTime - timeRemaining) / totalTime;
    const circumference = 2 * Math.PI * 70;
    const strokeDashoffset = circumference * (1 - progress);

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
                    Let what is be enough.
                </p>
            </div>
        );
    }

    // Reflection screen
    if (practiceState === PRACTICE_STATES.REFLECTION) {
        const completion = useTrainingStore.getState().currentSession?.completionRatio || 0;
        const prompt = completion < 0.5
            ? "What made you stop?"
            : "What tried to change?";

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

    // Active countdown ring
    return (
        <div className="flex flex-col items-center justify-center h-full">
            {/* Countdown Ring */}
            <div className="relative" style={{ width: '160px', height: '160px' }}>
                <svg width="160" height="160" className="transform -rotate-90">
                    {/* Background ring */}
                    <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="2"
                    />
                    {/* Progress ring */}
                    <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="rgba(147, 197, 253, 0.6)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.4)',
                            letterSpacing: '0.2em',
                        }}
                    >
                        HOLD
                    </span>
                </div>
            </div>

            {/* Subtle instruction */}
            <p
                className="mt-8 text-center"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: '14px',
                    fontStyle: 'italic',
                    color: 'rgba(255, 255, 255, 0.4)',
                }}
            >
                Sit. Watch. Do nothing with it.
            </p>

            {/* End early button */}
            <button
                onClick={handleEndEarly}
                className="mt-8 text-white/30 hover:text-white/60 transition-colors"
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', letterSpacing: '0.1em' }}
            >
                END EARLY
            </button>
        </div>
    );
}

// ==========================================
// Mode Check (Harmony)
// ==========================================
function ModeCheck({ onComplete }) {
    const { setModeCheckResponse } = useTrainingStore();

    const handleResponse = (response) => {
        setModeCheckResponse(response);
        onComplete();
    };

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
                Was this still the right mode?
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                    onClick={() => handleResponse('yes')}
                    className="px-6 py-3 rounded border border-white/30 text-white/70 hover:text-white hover:border-white/50 transition-all"
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', letterSpacing: '0.05em' }}
                >
                    Yes
                </button>
                <button
                    onClick={() => handleResponse('stayed_too_long')}
                    className="px-6 py-3 rounded border border-white/20 text-white/50 hover:text-white/70 hover:border-white/40 transition-all"
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px' }}
                >
                    No — I stayed too long
                </button>
                <button
                    onClick={() => handleResponse('switched_too_early')}
                    className="px-6 py-3 rounded border border-white/20 text-white/50 hover:text-white/70 hover:border-white/40 transition-all"
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px' }}
                >
                    No — I switched too early
                </button>
            </div>
        </div>
    );
}

// ==========================================
// Main Training Modal
// ==========================================
export function ModeTraining({ mode, practiceType = 'stillness', onClose }) {
    const {
        startSession,
        endSession,
        shouldTriggerHarmony,
        setPracticeState,
    } = useTrainingStore();

    const [showHarmony, setShowHarmony] = useState(false);
    const modeData = CODEX_MODES[mode];

    // Start session on mount
    useEffect(() => {
        startSession(mode, practiceType);
    }, [mode, practiceType, startSession]);

    // Handle practice completion
    const handlePracticeComplete = useCallback(() => {
        if (shouldTriggerHarmony()) {
            setShowHarmony(true);
            setPracticeState(PRACTICE_STATES.HANDOFF);
        } else {
            endSession();
            onClose();
        }
    }, [shouldTriggerHarmony, setPracticeState, endSession, onClose]);

    // Handle harmony complete
    const handleHarmonyComplete = useCallback(() => {
        endSession();
        onClose();
    }, [endSession, onClose]);

    // Render practice based on mode
    const renderPractice = () => {
        if (showHarmony) {
            return <ModeCheck onComplete={handleHarmonyComplete} />;
        }

        switch (mode) {
            case 'mirror':
                return <MirrorStillness onComplete={handlePracticeComplete} />;
            case 'resonator':
                return <ResonatorChambering onComplete={handlePracticeComplete} />;
            case 'prism':
                return <PrismReframing onComplete={handlePracticeComplete} />;
            case 'sword':
                return <SwordCompression onComplete={handlePracticeComplete} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p style={{ fontFamily: "'Crimson Pro', serif", color: 'rgba(255,255,255,0.6)' }}>
                            Practice coming soon for {mode}
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 text-white/50 hover:text-white/80 transition-colors"
                            style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px' }}
                        >
                            CLOSE
                        </button>
                    </div>
                );
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(8, 6, 12, 0.95)' }}
        >
            {/* Close button */}
            <button
                onClick={() => {
                    endSession();
                    onClose();
                }}
                className="absolute top-6 right-6 text-white/30 hover:text-white/60 transition-colors"
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px' }}
            >
                ×
            </button>

            {/* Mode indicator */}
            <div className="absolute top-6 left-6">
                <span
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '10px',
                        letterSpacing: '0.15em',
                        color: modeData?.color || 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                    }}
                >
                    {mode} Training
                </span>
            </div>

            {/* Persistent Whisper Bar */}
            <div
                className="absolute top-6 left-1/2 transform -translate-x-1/2"
                style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: PRACTICE_DEFINITIONS[mode]?.accent || 'rgba(255,255,255,0.3)',
                    opacity: 0.3,
                }}
            >
                {PRACTICE_DEFINITIONS[mode]?.whisper || ''}
            </div>

            {/* Practice content */}
            <div className="w-full max-w-md h-96">
                {renderPractice()}
            </div>
        </div>
    );
}
