// src/components/ThoughtDetachmentOnboarding.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { PillButton } from './ui/PillButton';
import RitualSession from './RitualSession.jsx';

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

export function ThoughtDetachmentOnboarding({ isOpen, onClose, onComplete, onExit, dayNumber = null, legNumber = null }) {
    const [step, setStep] = useState(1);
    const [thoughts, setThoughts] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [showSession, setShowSession] = useState(false);
    
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.mode);
    const isLight = colorScheme === 'light';
    const { 
        completeOnboarding, 
        onboardingComplete, 
        logLegCompletion,
        getCurrentDayNumber,
        getWeightedRandomThought
    } = useCurriculumStore();

    const [activeThought, setActiveThought] = useState(null);

    if (!isOpen) return null;

    const resolvedDayNumber = dayNumber || getCurrentDayNumber();
    const resolvedLegNumber = legNumber || 1;

    const handleClose = () => {
        setActiveThought(null);
        setShowSession(false);
        setStep(1);
        onExit?.();
        onClose?.();
    };

    const handleAddThought = () => {
        if (currentInput.trim() && thoughts.length < 8) {
            setThoughts([...thoughts, { text: currentInput.trim(), weight: 0 }]);
            setCurrentInput('');
        }
    };

    const handleTogglePriority = (index) => {
        const priorityCount = thoughts.filter(t => t.weight === 1).length;
        const newThoughts = [...thoughts];
        if (newThoughts[index].weight === 1) {
            newThoughts[index].weight = 0;
        } else if (priorityCount < 2) {
            newThoughts[index].weight = 1;
        }
        setThoughts(newThoughts);
    };

    const handleToggleTime = (time) => {
        if (selectedTimes.includes(time)) {
            setSelectedTimes(selectedTimes.filter(t => t !== time));
        } else if (selectedTimes.length < 2) {
            setSelectedTimes([...selectedTimes, time]);
        }
    };

    const handleComplete = () => {
        // Pass array of strings (e.g., ['19:00', '21:00']) as expected by curiculumStore and used in DailyPracticeCard
        completeOnboarding(selectedTimes, thoughts);
        setStep(1); // Reset step for next open
    };

    const handleRitualComplete = () => {
        const observedThought = activeThought ? activeThought.text : 'N/A';
        const observedThoughtId = activeThought ? activeThought.id : null;
        
        // Phase 1.1 Hotfix: Explicit payload fields 
        // duration: 3 is minutes (Legacy convention)
        // durationSeconds: 180 is explicitly requested analytics
        logLegCompletion(resolvedDayNumber, resolvedLegNumber, {
            duration: 3, 
            durationSeconds: 180, 
            thoughtObserved: observedThought,
            thoughtId: observedThoughtId,
            notes: '' 
        });
        
        setActiveThought(null);
        setShowSession(false);
        onComplete?.({ dayNumber: resolvedDayNumber, legNumber: resolvedLegNumber });
        handleClose();
    };

    const handleStartRitual = () => {
        const thought = getWeightedRandomThought();
        setActiveThought(thought);
        setShowSession(true);
    };

    // Phase 1: Define ritual locally
    const getRitualData = () => {
        const observedThought = activeThought ? activeThought.text : 'No thoughts found';
        
        return {
            id: 'thought-detachment-ritual',
            name: 'Thought Detachment',
            tradition: 'Cognitive Vipassana',
            duration: { min: 3, max: 3 },
            history: 'Observing the movement of the mind without participation.',
            description: 'A 3-step ritual to create distance from recurring patterns.',
            steps: [
                {
                    id: 'step-1',
                    name: 'Arrival',
                    duration: 30,
                    instruction: 'Sit comfortably. Close your eyes. Notice space between thoughts.',
                },
                {
                    id: 'step-2',
                    name: 'Observation',
                    duration: 120,
                    instruction: 'Observe this recurring thought as it arises. Watch it without judgment.',
                    content: observedThought,
                },
                {
                    id: 'step-3',
                    name: 'Detachment',
                    duration: 30,
                    instruction: 'Release the thought. Return to breath. Recognize the stillness.',
                }
            ],
            completion: {
                expectedOutput: [
                    'Increased mental distance',
                    'Recognition of thought patterns',
                    'Calm awareness'
                ],
                closingInstruction: 'Carry this detachment into your day.'
            }
        };
    };

    const renderContent = () => {
        if (showSession) {
            return (
                <div className="absolute inset-0 z-[110] bg-black">
                    <RitualSession 
                        ritual={getRitualData()}
                        onComplete={handleRitualComplete}
                        onExit={handleClose}
                        isLight={false} // Force dark for session
                    />
                </div>
            );
        }

        if (onboardingComplete) {
            const ritual = getRitualData();
            return (
                <div className="w-full h-full flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 text-center animate-in fade-in zoom-in duration-500 overflow-y-auto no-scrollbar">
                    <div className="w-full max-w-lg flex flex-col gap-4 sm:gap-5 py-8 sm:py-12">
                        {/* Icon */}
                        <div className="flex items-center justify-center text-4xl sm:text-5xl mb-1" style={{ color: 'var(--accent-color)' }}>
                            🌊
                        </div>
                        
                        {/* Title */}
                        <h2 className="uppercase text-[clamp(20px,6vw,28px)] tracking-widest font-display text-accent leading-tight">
                            Ritual Ready
                        </h2>
                        
                        {/* Ritual Name */}
                        <h3 className="text-xl sm:text-2xl font-light text-[var(--accent-primary)] font-h1">
                            {ritual.name}
                        </h3>
                        
                        {/* Tradition & Duration */}
                        <div className="text-[var(--accent-muted)] font-mono text-[10px] sm:text-xs uppercase tracking-widest">
                            {ritual.tradition} • {ritual.duration.min}-{ritual.duration.max} Minutes
                        </div>
                        
                        {/* History Quote */}
                        <p 
                            className="text-sm sm:text-base text-white/80 leading-relaxed font-body italic border-l-2 border-[var(--accent-secondary)] pl-4 sm:pl-5 text-left my-2 mx-auto max-w-md" 
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
                        >
                            {ritual.history}
                        </p>
                        
                        {/* Description */}
                        <p className="text-xs sm:text-sm opacity-70 max-w-xs mx-auto">
                            {ritual.description}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-3 items-center mt-2 sm:mt-4">
                            <PillButton onClick={handleStartRitual} variant="primary" className="w-full max-w-[240px]">
                                BEGIN RITUAL
                            </PillButton>
                            <button onClick={handleClose} className="text-xs opacity-40 hover:opacity-100 transition-opacity">
                                Not now
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 text-center animate-in fade-in duration-500 px-6">
                        <div className="space-y-4">
                            <h2 className="uppercase text-[clamp(18px,5.2vw,26px)] tracking-[clamp(0.08em,0.9vw,0.18em)] leading-tight text-center font-display mb-1" style={{ color: 'var(--accent-color)' }}>
                                Thought Detachment Ritual
                            </h2>
                            <p className="text-[clamp(12px,3.6vw,14px)] opacity-80 leading-relaxed text-center">
                                A 14-day practice observing recurring thoughts without engagement. 
                                Not about changing thoughts, but changing your relationship to them.
                            </p>
                        </div>
                        <div className="flex gap-4 justify-center pt-4">
                            <PillButton onClick={handleClose} variant="secondary">Cancel</PillButton>
                            <PillButton onClick={() => setStep(2)} variant="primary">Continue</PillButton>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in duration-500 px-6">
                        <div className="text-center space-y-2">
                            <h2 className="uppercase text-[clamp(18px,5.2vw,26px)] tracking-[clamp(0.08em,0.9vw,0.18em)] leading-tight text-center font-display" style={{ color: 'var(--accent-color)' }}>
                                Thought Collection
                            </h2>
                            <p className="text-[clamp(11px,3.2vw,12px)] opacity-70 text-center">Enter 5-8 recurring thoughts that occupy your mind.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    placeholder="I'm not good enough..."
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddThought()}
                                />
                                <PillButton onClick={handleAddThought} disabled={!currentInput.trim() || thoughts.length >= 8}>Add</PillButton>
                            </div>
                            
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                                {thoughts.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <span className="text-sm italic">"{t.text}"</span>
                                        <button onClick={() => setThoughts(thoughts.filter((_, idx) => idx !== i))} className="opacity-40 hover:opacity-100 italic text-[10px]">Remove</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center pt-4 border-t border-white/5">
                            <PillButton onClick={() => setStep(1)} variant="secondary">Back</PillButton>
                            <PillButton onClick={() => setStep(3)} variant="primary" disabled={thoughts.length < 5}>Continue ({thoughts.length}/8)</PillButton>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in duration-500 px-6">
                        <div className="text-center space-y-2">
                            <h2 className="uppercase text-[clamp(16px,4.8vw,22px)] tracking-[clamp(0.06em,0.8vw,0.16em)] leading-tight text-center font-display" style={{ color: 'var(--accent-color)' }}>
                                Priority Marking
                            </h2>
                            <p className="text-[clamp(11px,3.2vw,13px)] opacity-70 text-center">Mark 1-2 thoughts as "priority" to appear more frequently.</p>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                            {thoughts.map((t, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleTogglePriority(i)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${t.weight === 1 ? 'bg-accent/20 border-accent' : 'bg-white/5 border-white/5 opacity-60'}`}
                                >
                                    <span className="text-sm italic truncate flex-1 min-w-0">"{t.text}"</span>
                                    {t.weight === 1 && <span className="text-[10px] uppercase font-bold tracking-widest text-accent">Priority</span>}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 justify-center pt-4 border-t border-white/5">
                            <PillButton onClick={() => setStep(2)} variant="secondary">Back</PillButton>
                            <PillButton onClick={() => setStep(4)} variant="primary" disabled={thoughts.filter(t => t.weight === 1).length === 0}>Continue</PillButton>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in duration-500 px-6">
                        <div className="text-center space-y-2">
                            <h2 className="uppercase text-[clamp(16px,4.8vw,22px)] tracking-[clamp(0.06em,0.8vw,0.16em)] leading-tight text-center font-display" style={{ color: 'var(--accent-color)' }}>
                                Time Selection
                            </h2>
                            <p className="text-[clamp(11px,3.2vw,12px)] opacity-70 text-center">Select 2 practice times for your daily rituals.</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-4">
                            {TIME_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleToggleTime(opt.value)}
                                    className={`p-2 rounded-lg text-[10px] border transition-all ${selectedTimes.includes(opt.value) ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 opacity-60'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 justify-center pt-4 border-t border-white/5">
                            <PillButton onClick={() => setStep(3)} variant="secondary">Back</PillButton>
                            <PillButton onClick={handleComplete} variant="primary" disabled={selectedTimes.length < 2}>Start Program</PillButton>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    // Calculate max-width based on display mode
    const panelMaxWidth = displayMode === 'hearth' 
        ? 'min(400px, calc(100vw - 24px))' 
        : 'min(640px, calc(100vw - 48px))';
    
    const containerMaxWidth = displayMode === 'hearth' ? '430px' : '100%';
    
    const ritual = getRitualData();

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* 1. Ritual Session: Fullscreen Takeover (when active) */}
            {showSession && (
                <div 
                    className="absolute inset-0 z-[110] bg-black pointer-events-auto"
                    style={{ maxWidth: displayMode === 'hearth' ? '430px' : '100%', margin: displayMode === 'hearth' ? '0 auto' : undefined }}
                >
                    <RitualSession 
                        ritual={ritual}
                        onComplete={handleRitualComplete}
                        onExit={handleClose}
                        isLight={false}
                    />
                </div>
            )}

            {/* 2. Launcher / Onboarding: Modal Surface (when session not active) */}
            {!showSession && (
                <>
                    {/* Translucent Backdrop */}
                    <div 
                        className={`absolute inset-0 transition-opacity duration-500 pointer-events-auto ${isLight ? 'bg-black/20 backdrop-blur-md' : 'bg-black/40 backdrop-blur-xl'}`}
                        onClick={handleClose} 
                    />
                    
                    {/* Centered Panel Container */}
                    <div 
                        className="relative flex items-center justify-center p-3 py-6 sm:p-8 lg:p-12 w-full h-full pointer-events-none"
                        style={{ maxWidth: containerMaxWidth, margin: '0 auto' }}
                    >
                        <div 
                            className={`relative w-full flex flex-col rounded-[2.5rem] border transition-all duration-500 overflow-hidden pointer-events-auto ${isLight ? 'bg-white/95 border-amber-900/10' : 'bg-[#0a0a12]/95 border-white/10'}`}
                            style={{ 
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
                                maxWidth: panelMaxWidth,
                                minHeight: displayMode === 'hearth' ? '480px' : '520px',
                                maxHeight: 'min(800px, calc(100dvh - 24px))'
                            }}
                        >
                            {/* Modal Close Button: Absolute inside the panel */}
                            <button 
                                onClick={handleClose}
                                className={`absolute top-4 right-4 z-[150] p-2.5 rounded-full transition-all ${isLight ? 'hover:bg-black/5 text-black/40 hover:text-black' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
                                aria-label="Close"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Step indicator (launcher only) */}
                            {!onboardingComplete && (
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-8 bg-accent' : i < step ? 'w-4 bg-accent/40' : 'w-4 bg-white/10'}`} />
                                    ))}
                                </div>
                            )}

                            <div className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar pt-14 min-h-0 rounded-[2.5rem]">
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
            `}</style>
        </div>,
        document.body
    );
}
