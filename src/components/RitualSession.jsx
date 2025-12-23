import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RitualStepDisplay from './RitualStepDisplay';
import RitualProgress from './RitualProgress';
import { getRitualById } from '../data/rituals';
import { useVideoStore } from '../state/videoStore'; // For pausing background video if needed
import { Icon } from '../icons/Icon.jsx';

const RitualSession = ({ ritual, onComplete, onExit, isLight = false }) => {
    // State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepTimeRemaining, setStepTimeRemaining] = useState(0); // in seconds
    const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionState, setSessionState] = useState('intro'); // intro, active, completion

    // Refs for timer
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Context / Helpers
    const currentStep = ritual.steps[currentStepIndex];
    const totalSteps = ritual.steps.length;

    // Initialize Step
    useEffect(() => {
        if (sessionState === 'active' && currentStep) {
            setStepTimeRemaining(currentStep.duration);
            setIsPaused(false);
        }
    }, [currentStepIndex, sessionState, ritual]);

    // Timer Logic
    useEffect(() => {
        if (sessionState !== 'active' || isPaused) {
            cancelAnimationFrame(timerRef.current);
            return;
        }

        let lastTime = performance.now();

        const tick = (time) => {
            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            if (sessionState === 'active' && !isPaused) {
                setStepTimeRemaining(prev => {
                    const newValue = prev - deltaTime;
                    if (newValue <= 0) {
                        // Step finished
                        handleStepComplete();
                        return 0;
                    }
                    return newValue;
                });
                setTotalTimeElapsed(prev => prev + deltaTime);
            }

            timerRef.current = requestAnimationFrame(tick);
        };

        timerRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(timerRef.current);
    }, [sessionState, isPaused, currentStepIndex]); // Re-bind when step changes to reset logic if needed

    const handleStepComplete = () => {
        if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            setSessionState('completion');
        }
    };

    // Controls
    const togglePause = () => setIsPaused(prev => !prev);

    const nextStep = () => {
        if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            setSessionState('completion');
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    // Render Intro
    if (sessionState === 'intro') {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${isLight ? 'bg-white/90' : 'bg-black/80'} backdrop-blur-xl relative z-50`}>
                <div className="max-w-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center justify-center text-6xl mb-4" style={{ color: 'var(--accent-color)' }}>
                        {ritual.iconName ? <Icon name={ritual.iconName} size={64} /> : ritual.icon}
                    </div>
                    <h1 className="text-4xl font-light text-[var(--accent-primary)] font-h1">{ritual.name}</h1>
                    <div className="text-[var(--accent-muted)] font-mono text-sm uppercase tracking-widest">
                        {ritual.tradition} • {ritual.duration.min}-{ritual.duration.max} Minutes
                    </div>
                    <p className="text-lg text-white/80 leading-relaxed font-body italic border-l-2 border-[var(--accent-secondary)] pl-6 text-left my-4">
                        {ritual.history}
                    </p>
                    <p className="text-white/60 text-sm">{ritual.description}</p>

                    <button
                        onClick={() => setSessionState('active')}
                        className={`mt-8 px-12 py-4 ${isLight ? 'bg-[#5A4D3C] text-[#FDFBF5]' : 'bg-[var(--accent-primary)] text-black'} font-bold tracking-widest hover:opacity-90 transition-all rounded-full`}
                    >
                        BEGIN RITUAL
                    </button>

                    <button onClick={onExit} className="text-white/40 hover:text-white text-sm mt-4">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // Render Completion
    if (sessionState === 'completion') {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${isLight ? 'bg-white/90' : 'bg-black/80'} backdrop-blur-xl relative z-50`}>
                <div className="max-w-lg flex flex-col gap-6 animate-in fade-in duration-700">
                    <h2 className="text-3xl text-[var(--accent-primary)] font-h1">Ritual Complete</h2>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left">
                        <h3 className="text-[var(--accent-secondary)] text-sm uppercase tracking-widest mb-4">Observation</h3>
                        <ul className="space-y-3">
                            {ritual.completion.expectedOutput.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-white/80 text-sm">
                                    <span className="text-[var(--accent-primary)]">✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-white/60 italic">
                        "{ritual.completion.closingInstruction}"
                    </p>

                    <button
                        onClick={onComplete}
                        className="mt-8 px-12 py-3 border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black transition-all rounded-full tracking-widest"
                    >
                        COMPLETE
                    </button>
                </div>
            </div>
        );
    }

    // Render Active Session
    return (
        <div className={`w-full h-full flex flex-col relative ${isLight ? 'bg-white/60' : 'bg-black/80'} backdrop-blur-sm max-w-4xl mx-auto overflow-hidden`}>
            {/* Top Bar Controls */}
            <div className="absolute top-2 right-2 z-50 flex gap-4">
                <button
                    onClick={onExit}
                    className="px-3 py-1.5 text-xs uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/10 transition-all rounded-lg border border-white/10"
                >
                    Exit
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-visible relative" onClick={togglePause}>
                <RitualStepDisplay
                    step={currentStep}
                    stepIndex={currentStepIndex}
                    totalSteps={totalSteps}
                    isPaused={isPaused}
                    isLight={isLight}
                />
            </div>

            {/* Bottom Controls & Progress */}
            <div className="w-full bg-gradient-to-t from-black to-transparent z-40 pb-4">
                {/* Navigation Controls (Visible on hover or pause? Or always?) - Let's keep them handy */}
                <div className="flex justify-center items-center gap-8 mb-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <button onClick={prevStep} className="p-2 text-white/50 hover:text-white">
                        ← Prev
                    </button>
                    <button onClick={togglePause} className="w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-white/80 hover:bg-white/10">
                        {isPaused ? '▶' : '⏸'}
                    </button>
                    <button onClick={nextStep} className="p-2 text-white/50 hover:text-white">
                        Next →
                    </button>
                </div>

                <RitualProgress
                    currentStepIndex={currentStepIndex}
                    totalSteps={totalSteps}
                    stepTimeRemaining={stepTimeRemaining}
                    stepDuration={currentStep.duration}
                    totalTimeElapsed={totalTimeElapsed}
                    totalDurationEstimated={(ritual.duration.min + ritual.duration.max) * 30} // rough est
                />
            </div>
        </div>
    );
};

export default RitualSession;
