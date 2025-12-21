// src/components/Application/practices/MirrorStillness.jsx
// 90-second timed stillness practice with countdown ring
import React, { useState, useEffect, useCallback } from 'react';
import { useModeTrainingStore, PRACTICE_STATES } from '../../../state/modeTrainingStore.js';
import { PRACTICE_DEFINITIONS } from '../../../state/practiceConfig.js';

export function MirrorStillness({ onComplete }) {
    const { practiceState, setPracticeState, updateCompletion, addEntry } = useModeTrainingStore();
    const [timeRemaining, setTimeRemaining] = useState(90);
    const [totalTime] = useState(90);
    const [introComplete, setIntroComplete] = useState(false);

    const config = PRACTICE_DEFINITIONS.mirror;

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

    // Pause on visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && practiceState === PRACTICE_STATES.ACTIVE) {
                useModeTrainingStore.getState().pauseSession();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [practiceState]);

    const handleEndEarly = () => {
        const completion = (totalTime - timeRemaining) / totalTime;
        updateCompletion(completion);
        setPracticeState(PRACTICE_STATES.REFLECTION);
    };

    // Progress ring calculation
    const progress = (totalTime - timeRemaining) / totalTime;
    const circumference = 2 * Math.PI * 80;
    const offset = circumference * (1 - progress);

    // Format time display
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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
                    {config.introText}
                </p>
            </div>
        );
    }

    // Reflection screen
    if (practiceState === PRACTICE_STATES.REFLECTION) {
        const wasEarly = timeRemaining > 0;
        const prompt = wasEarly
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

    // Active practice with countdown ring
    return (
        <div className="flex flex-col items-center justify-center h-full">
            {/* Countdown ring */}
            <div className="relative w-48 h-48 mb-8">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
                    {/* Background ring */}
                    <circle
                        cx="90"
                        cy="90"
                        r="80"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="2"
                    />
                    {/* Progress ring */}
                    <circle
                        cx="90"
                        cy="90"
                        r="80"
                        fill="none"
                        stroke={config.accent}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>

                {/* Time display */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-4xl font-light"
                        style={{
                            fontFamily: "var(--font-ui)",
                            fontWeight: 700,
                            color: 'rgba(255, 255, 255, 0.9)',
                            letterSpacing: 'var(--tracking-wide)',
                        }}
                    >
                        {timeDisplay}
                    </span>
                </div>
            </div>

            {/* End early button */}
            <button
                onClick={handleEndEarly}
                className="px-4 py-2 text-white/40 hover:text-white/60 transition-colors"
                style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: '10px', letterSpacing: 'var(--tracking-wide)' }}
            >
                END EARLY
            </button>
        </div>
    );
}
