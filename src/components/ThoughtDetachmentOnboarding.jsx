import React, { useState } from 'react';
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

export function ThoughtDetachmentOnboarding({ isOpen, onClose }) {
    const [step, setStep] = useState(1);
    const [thoughts, setThoughts] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [showSession, setShowSession] = useState(false);
    
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const { 
        completeOnboarding, 
        onboardingComplete, 
        thoughtCatalog, 
        logLegCompletion,
        getCurrentDayNumber,
        getWeightedRandomThought
    } = useCurriculumStore();

    const [activeThought, setActiveThought] = useState(null);

    if (!isOpen) return null;

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
        const day = getCurrentDayNumber();
        const observedThought = activeThought ? activeThought.text : 'N/A';
        const observedThoughtId = activeThought ? activeThought.id : null;
        
        // Phase 1.1 Hotfix: Explicit payload fields 
        // duration: 3 is minutes (Legacy convention)
        // durationSeconds: 180 is explicitly requested analytics
        logLegCompletion(day, 1, {
            duration: 3, 
            durationSeconds: 180, 
            thoughtObserved: observedThought,
            thoughtId: observedThoughtId,
            notes: '' 
        });
        
        setActiveThought(null);
        setShowSession(false);
        onClose();
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
                        onExit={() => setShowSession(false)}
                        isLight={false} // Force dark for session
                    />
                </div>
            );
        }

        if (onboardingComplete) {
            return (
                <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500 py-4">
                    <div className="space-y-4">
                        <div className="text-4xl mb-2">🌊</div>
                        <h2 className="uppercase text-[clamp(20px,6vw,28px)] tracking-widest font-display text-accent">
                            Ritual Ready
                        </h2>
                        <p className="text-sm opacity-70 max-w-xs mx-auto">
                            The space is prepared. Begin your observation.
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-3 items-center">
                        <PillButton onClick={handleStartRitual} variant="primary" className="w-full max-w-[200px]">
                            BEGIN RITUAL
                        </PillButton>
                        <button onClick={onClose} className="text-xs opacity-40 hover:opacity-100 transition-opacity">
                            Not now
                        </button>
                    </div>
                </div>
            );
        }

        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 text-center animate-in fade-in duration-500">
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
                            <PillButton onClick={onClose} variant="secondary">Cancel</PillButton>
                            <PillButton onClick={() => setStep(2)} variant="primary">Continue</PillButton>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
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
                            
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
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
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="uppercase text-[clamp(16px,4.8vw,22px)] tracking-[clamp(0.06em,0.8vw,0.16em)] leading-tight text-center font-display" style={{ color: 'var(--accent-color)' }}>
                                Priority Marking
                            </h2>
                            <p className="text-[clamp(11px,3.2vw,13px)] opacity-70 text-center">Mark 1-2 thoughts as "priority" to appear more frequently.</p>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
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
                    <div className="space-y-6 animate-in fade-in duration-500">
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 py-6 sm:p-8 lg:p-12">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            
            <div 
                className={`relative w-full mx-auto max-w-[min(640px,calc(100vw-48px))] p-8 sm:p-10 lg:p-12 rounded-[2rem] border transition-all duration-500 overflow-hidden ${isLight ? 'bg-white/95 border-amber-900/10' : 'bg-[#0a0a12]/95 border-white/10'}`}
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            >
                {/* Step indicator */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-8 bg-accent' : i < step ? 'w-4 bg-accent/40' : 'w-4 bg-white/10'}`} />
                    ))}
                </div>

                <div className="relative pt-4">
                    {renderContent()}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
                @font-face { font-family: 'Outfit'; src: url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700&display=swap'); }
                :root { --font-display: 'Outfit', sans-serif; --font-body: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );
}
