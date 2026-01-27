import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RitualStepDisplay from './RitualStepDisplay';
import RitualProgress from './RitualProgress';
import { getRitualById } from '../data/rituals';
import { useVideoStore } from '../state/videoStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { Icon } from '../icons/Icon.jsx';

const RitualSession = ({ ritual, onComplete, onExit, isLight = false }) => {
    // State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepTimeRemaining, setStepTimeRemaining] = useState(0);
    const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionState, setSessionState] = useState('intro');

    // Get display mode to constrain session to Hearth mode if needed
    const mode = useDisplayModeStore(state => state.mode);
    const isHearthMode = mode === 'hearth';

    // Refs for timer
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Context / Helpers
    const currentStep = ritual.steps[currentStepIndex];
    const totalSteps = ritual.steps.length;

    // DIAGNOSTIC: Log session state and props
    useEffect(() => {
        console.group('🔍 RitualSession Diagnostic');
        console.log('sessionState:', sessionState);
        console.log('isLight:', isLight);
        console.log('mode (from store):', mode);
        console.log('isHearthMode:', isHearthMode);
        console.log('window.innerWidth:', window.innerWidth);
        console.log('window.innerHeight:', window.innerHeight);
        console.log('currentStepIndex:', currentStepIndex);
        console.log('ritual.name:', ritual?.name);
        console.groupEnd();
    }, [sessionState, isLight, mode, isHearthMode, currentStepIndex]);

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

    // Common wrapper for all ritual surfaces - respects Hearth mode constraints
    const RitualSurface = ({ children }) => (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none ${isLight ? 'bg-[#FDFBF5]/90 backdrop-blur-md' : 'bg-black/98'}`}
            style={{ maxWidth: isHearthMode ? '430px' : '100%', margin: isHearthMode ? '0 auto' : undefined }}
        >
            <div 
                className={`relative w-full flex flex-col rounded-3xl border overflow-hidden pointer-events-auto shadow-2xl transition-all duration-500 ${isLight ? 'bg-white/95 border-amber-900/10' : 'bg-[#0a0a12]/95 border-white/10'}`}
                style={{ 
                    maxWidth: isHearthMode ? 'min(400px, calc(100vw - 24px))' : 'min(640px, 94vw)',
                    maxHeight: 'min(720px, calc(100dvh - 48px))'
                }}
            >
                <div className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar p-5 sm:p-8">
                    {children}
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
            `}</style>
        </div>
    );

    // Render Intro
    if (sessionState === 'intro') {
        return (
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none bg-black/90 backdrop-blur-sm transition-opacity duration-300"
                style={{ maxWidth: isHearthMode ? '430px' : '100%', margin: isHearthMode ? '0 auto' : undefined }}
            >
                <div 
                    className={`relative w-full max-w-lg flex flex-col rounded-3xl border overflow-hidden pointer-events-auto shadow-2xl transition-all duration-500 ${isLight ? 'bg-white/95 border-amber-900/10' : 'bg-[#0a0a12]/95 border-white/10'}`}
                    style={{ 
                        maxHeight: 'min(720px, calc(100dvh - 48px))'
                    }}
                >
                    <div className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar p-5 sm:p-8 text-center items-center justify-center">
                        <div className="flex items-center justify-center text-5xl sm:text-7xl mb-2" style={{ color: 'var(--accent-color)' }}>
                            {ritual.iconName ? <Icon name={ritual.iconName} size={window.innerWidth < 480 ? 56 : 72} /> : ritual.icon}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-light text-[var(--accent-primary)] font-h1 leading-tight mb-2">{ritual.name}</h1>
                        <div className="text-[var(--accent-muted)] font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-4">
                            {ritual.tradition} • {ritual.duration.min}-{ritual.duration.max} Min
                        </div>
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed font-body italic border-l-2 border-[var(--accent-secondary)] pl-4 text-left my-4 opacity-90" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                            {ritual.history}
                        </p>
                        <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6">{ritual.description}</p>

                        <div className="flex flex-col gap-4 items-center w-full">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSessionState('active');
                                }}
                                className={`w-full sm:w-auto px-10 sm:px-16 py-4 sm:py-5 ${isLight ? 'bg-[#5A4D3C] text-[#FDFBF5]' : 'bg-[var(--accent-primary)] text-black'} font-bold tracking-[0.3em] hover:scale-105 active:scale-95 transition-all rounded-full text-xs sm:text-sm shadow-xl`}
                            >
                                BEGIN RITUAL
                            </button>

                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onExit();
                                }}
                                className={`text-xs sm:text-sm transition-colors ${isLight ? 'text-amber-900/40 hover:text-amber-900/80' : 'text-white/40 hover:text-white'}`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render Completion
    if (sessionState === 'completion') {
        return (
            <RitualSurface>
                <div className="w-full flex flex-col items-center justify-center text-center py-4 sm:py-6">
                    <div className="w-full max-w-lg flex flex-col gap-5 animate-in fade-in duration-700 items-center">
                        <div className="flex items-center justify-center text-4xl sm:text-5xl" style={{ color: 'var(--accent-color)' }}>
                            {ritual.iconName ? <Icon name={ritual.iconName} size={48} /> : ritual.icon}
                        </div>
                        <h2 className="text-3xl sm:text-4xl text-[var(--accent-primary)] font-h1 mt-2">Ritual Complete</h2>

                        <div className={`${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'} border rounded-2xl p-6 sm:p-8 text-left w-full`}>
                            <h3 className="text-[var(--accent-secondary)] text-sm uppercase tracking-widest mb-6">Observation</h3>
                            <ul className="space-y-4">
                                {ritual.completion.expectedOutput.map((item, idx) => (
                                    <li key={idx} className={`flex items-start gap-4 ${isLight ? 'text-black/85' : 'text-white/85'} text-sm sm:text-base`}>
                                        <span className="text-[var(--accent-primary)] text-lg">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className={`${isLight ? 'text-black/60' : 'text-white/60'} italic text-base py-2 px-4`}>
                            "{ritual.completion.closingInstruction}"
                        </p>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Persist ritual completion data
                                localStorage.setItem('immanenceOS.rituals.lastRitualId', ritual.id);
                                localStorage.setItem('immanenceOS.rituals.lastRitualAt', new Date().toISOString());
                                onComplete();
                            }}
                            className="mt-4 px-12 py-4 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black transition-all rounded-full tracking-widest text-xs sm:text-base font-bold"
                        >
                            COMPLETE
                        </button>
                    </div>
                </div>
            </RitualSurface>
        );
    }

    // Helper for active state rendering
    const renderStepContent = () => {
        if (!currentStep) return <div className="text-white/50 text-center py-20">Ritual content not found</div>;
        
        return (
            <RitualStepDisplay
                step={currentStep}
                stepIndex={currentStepIndex}
                totalSteps={totalSteps}
                isPaused={isPaused}
                isLight={isLight}
            />
        );
    };

    // Helper for formatting time
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Render Active Session
    return (
        <div 
            className={`fixed inset-0 z-[200] flex flex-col ${isLight ? 'bg-[#FDFBF5]' : 'bg-black/98'}`}
            style={{ 
                maxWidth: isHearthMode ? '430px' : '100%', 
                margin: isHearthMode ? '0 auto' : undefined,
                animation: 'fade-in 0.5s ease-out'
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className={`flex-1 flex flex-col relative w-full h-full overflow-hidden`}>
                {/* Top Bar Controls - Fixed to safe area */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={onExit}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className={`text-[10px] uppercase tracking-widest transition-colors font-mono ${isLight ? 'text-amber-900/30 group-hover:text-amber-900/70' : 'text-white/40 group-hover:text-white/80'}`}>
                            Exit
                        </div>
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${isLight ? 'bg-amber-900/5 border-amber-900/10 text-amber-900/30 group-hover:text-amber-900 group-hover:bg-amber-900/10' : 'bg-white/5 border-white/10 text-white/40 group-hover:text-white group-hover:bg-white/10'}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </div>
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className={`w-full h-full flex flex-col ${isHearthMode ? 'max-w-full' : 'max-w-md'}`}>
                        {renderStepContent()}
                    </div>
                </div>

                {/* Bottom Status / Controls */}
                <div className={`p-6 sm:p-8 bg-gradient-to-t ${isLight ? 'from-white/80 to-transparent' : 'from-black to-transparent'}`}>
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Progress Strip */}
                        <div className="flex gap-2">
                            {ritual.steps.map((_, idx) => (
                                <div 
                                    key={idx}
                                    className={`flex-1 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-amber-900/5' : 'bg-white/5'}`}
                                >
                                    <div 
                                        className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                                        style={{ 
                                            width: idx === currentStepIndex 
                                                ? `${((currentStep.duration - stepTimeRemaining) / currentStep.duration) * 100}%`
                                                : idx < currentStepIndex ? '100%' : '0%'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em]">
                            <span className={isLight ? 'text-amber-900/50' : 'text-[var(--accent-muted)]'}>Step {currentStepIndex + 1}</span>
                            <span className="text-[var(--accent-primary)] mx-auto">{formatTime(currentStep.duration - stepTimeRemaining)}</span>
                            <span className={isLight ? 'text-amber-900/50' : 'text-[var(--accent-muted)]'}>Total {formatTime(totalTimeElapsed)}</span>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex justify-center items-center gap-8">
                            <button onClick={prevStep} className={`p-2 transition-colors ${isLight ? 'text-amber-900/40 hover:text-amber-900/80' : 'text-white/50 hover:text-white'}`}>
                                ← Prev
                            </button>
                            <button onClick={togglePause} className={`w-12 h-12 flex items-center justify-center rounded-full border transition-colors ${isLight ? 'border-amber-900/20 text-amber-900/60 hover:bg-amber-900/10' : 'border-white/20 text-white/80 hover:bg-white/10'}`}>
                                {isPaused ? '▶' : '⏸'}
                            </button>
                            <button onClick={nextStep} className={`p-2 transition-colors ${isLight ? 'text-amber-900/40 hover:text-amber-900/80' : 'text-white/50 hover:text-white'}`}>
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RitualSession;
