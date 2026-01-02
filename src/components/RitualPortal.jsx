import React, { useState, useEffect } from 'react';
import { useRitualStore } from '../state/ritualStore';
import { RitualStepContainer } from './ritual/RitualStepContainer';
import { RitualProgressBar } from './ritual/RitualProgressBar';
import { RitualAudioPrompt } from './ritual/RitualAudioPrompt';
import { InstructionalOverlay } from './ritual/InstructionalOverlay';
import { VisualMapDisplay } from './ritual/VisualMapDisplay';
import { MemorySelector } from './ritual/MemorySelector';
import { CameraCapture } from './ritual/CameraCapture';
import { ThoughtObservation } from './ritual/ThoughtObservation';
import { SummaryView } from './ritual/SummaryView';
import { BreathingRing } from './BreathingRing';
import { logRitualResult } from '../services/ritualService';
import { useDisplayModeStore } from '../state/displayModeStore';
import { loadPreferences } from '../state/practiceStore';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL || '/';

const RITUAL_STEPS = [
    {
        id: 1,
        title: "Incense + Setup",
        background: `${BASE}assets/ritual/incense_bg_v1.jpg`,
        audio: `${BASE}assets/audio/ritual_step_1.mp3`,
        guide: {
            image: `${BASE}assets/ritual/guide_lighting_incense.png`,
            caption: "Light your incense. Focus on the rising smoke as a symbolic offering of your attention."
        }
    },
    {
        id: 2,
        title: "Visual Map Review",
        background: `${BASE}assets/ritual/visual_map_v1.png`,
        audio: `${BASE}assets/audio/ritual_step_2.mp3`,
        guide: {
            image: `${BASE}assets/ritual/guide_reviewing_map.png`,
            caption: "Gaze upon the emotional map. See your feelings as distinct nodes within this container."
        }
    },
    {
        id: 3,
        title: "Container Holding",
        background: `${BASE}assets/ritual/visual_map_v1.png`,
        audio: `${BASE}assets/audio/ritual_step_3.mp3`,
        guide: {
            image: `${BASE}assets/ritual/guide_holding_container.png`,
            caption: "Imagine your hands gently cradling this container. Feel the weight and warmth of your awareness."
        }
    },
    {
        id: 4,
        title: "Random Select + Feel",
        background: `${BASE}assets/ritual/visual_map_v1.png`,
        audio: `${BASE}assets/audio/ritual_step_4.mp3`,
        guide: {
            image: `${BASE}assets/ritual/guide_selecting_memory.png`,
            caption: "Allow a random memory to emerge. Witness it without judgment or entanglement."
        }
    },
    {
        id: 5,
        title: "3rd Person Photo",
        background: `${BASE}assets/ritual/incense_bg_v1.jpg`,
        audio: `${BASE}assets/audio/ritual_step_5.mp3`,
        guide: {
            image: `${BASE}assets/ritual/guide_taking_photo.png`,
            caption: "Take a photo of yourself from a 3rd-person perspective. Observe the witness witnessing."
        }
    },
    {
        id: 6,
        title: "Transition to Journal",
        background: `${BASE}assets/ritual/journaling_bg_v1.jpg`,
        audio: `${BASE}assets/audio/ritual_step_6.mp3`,
        guide: null
    },
    {
        id: 7,
        title: "Seal the Experience",
        background: `${BASE}assets/ritual/journaling_bg_v1.jpg`,
        audio: null,
        guide: null
    }
];

export function RitualPortal({ onComplete, onStop }) {
    const { 
        currentStep, 
        startRitual, 
        advanceStep, 
        status, 
        resetRitual,
        selectedMemory,
        photoUrl
    } = useRitualStore();
    const [showGuide, setShowGuide] = useState(true);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    useEffect(() => {
        if (status === 'idle') {
            startRitual();
        }
    }, [status, startRitual]);

    const handleStepComplete = () => {
        if (currentStep < 6) {
            advanceStep();
            setShowGuide(true);
        } else if (currentStep === 6) {
            // Log results BEFORE moving to the final summary step
            const ritualState = useRitualStore.getState();
            logRitualResult(ritualState);
            advanceStep();
            setShowGuide(false);
        } else {
            // Final completion from step 7
            onComplete();
        }
    };

    const currentStepConfig = RITUAL_STEPS[currentStep - 1];

    if (!currentStepConfig) return null;

    const renderStepContent = () => {
        switch(currentStep) {
            case 1:
                const preferences = loadPreferences();
                const breathPattern = preferences.pattern || { inhale: 4, hold1: 4, exhale: 4, hold2: 4 };
                return (
                    <div className="flex flex-col items-center gap-2 w-full">
                        {/* Breathing Ring - Visual only, no FX */}
                        <div className="scale-75">
                            <BreathingRing 
                                breathPattern={{
                                    inhale: breathPattern.inhale,
                                    holdTop: breathPattern.hold1,
                                    exhale: breathPattern.exhale,
                                    holdBottom: breathPattern.hold2
                                }}
                                fxPreset="none"
                                pathId={null}
                                onTap={null}
                                onCycleComplete={null}
                            />
                        </div>
                        <p className="italic text-sm mt-4" style={{ color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>
                            Watch the smoke rise with each breath...
                        </p>
                    </div>
                );
            case 2:
            case 3:
                return <VisualMapDisplay isPulsing={currentStep === 3} />;
            case 4:
                return <MemorySelector onSelect={() => {}} />;
            case 5:
                if (photoUrl) return <ThoughtObservation photoUrl={photoUrl} onComplete={handleStepComplete} />;
                return <CameraCapture onCapture={() => {}} />;
            case 6:
                return (
                    <div className="flex flex-col items-center gap-6">
                        <div className="h-48 w-48 rounded-full border flex items-center justify-center"
                            style={{
                                borderColor: isLight ? 'rgba(160,120,85,0.2)' : 'rgba(212,184,122,0.2)',
                                backgroundColor: isLight ? 'rgba(160,120,85,0.05)' : 'rgba(212,184,122,0.05)',
                                boxShadow: isLight 
                                    ? '0 0 30px rgba(160,120,85,0.15)' 
                                    : '0 0 30px rgba(212,184,122,0.2)'
                            }}
                        >
                            <span className="text-5xl">✍️</span>
                        </div>
                        <p className="font-display tracking-widest text-lg"
                            style={{ color: isLight ? '#A07855' : '#D4B87A' }}
                        >
                            THE SEAL IS PREPARED
                        </p>
                    </div>
                );
            case 7:
                return (
                    <SummaryView 
                        memory={selectedMemory} 
                        photoUrl={photoUrl} 
                        onComplete={onComplete} 
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: isLight ? '#F5F5F0' : '#000000' }}
        >
            <RitualStepContainer 
                backgroundUrl={currentStepConfig.background} 
                stepNumber={currentStep}
            >
                <div className="flex flex-col items-center gap-8 text-center w-full">
                    <motion.div
                        key={`header-${currentStep}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <h2 className="text-4xl font-display tracking-widest uppercase mb-1"
                            style={{ color: isLight ? '#A07855' : '#D4B87A' }}
                        >
                            {currentStepConfig.title}
                        </h2>
                        <div className="h-0.5 w-12 rounded-full"
                            style={{ backgroundColor: isLight ? 'rgba(160,120,85,0.3)' : 'rgba(212,184,122,0.3)' }}
                        />
                    </motion.div>

                    <div className="w-full flex justify-center py-4">
                        {renderStepContent()}
                    </div>

                    {/* Step Navigation */}
                    {((currentStep < 5 && (currentStep !== 4 || selectedMemory)) || (currentStep === 6)) && (
                        <motion.button 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={handleStepComplete}
                            className="group relative px-12 py-4 rounded-full bg-transparent border transition-all active:scale-95 overflow-hidden"
                            style={{
                                borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                                color: isLight ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = isLight ? '#A07855' : '#D4B87A';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
                            }}
                        >
                            <span className="relative z-10 text-sm font-black tracking-widest uppercase group-hover:transition-colors"
                                style={{
                                    color: 'inherit'
                                }}
                            >
                                {currentStep === 6 ? "Begin Journaling" : "Proceed"}
                            </span>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: isLight ? 'rgba(160,120,85,0.05)' : 'rgba(212,184,122,0.05)' }}
                            />
                        </motion.button>
                    )}
                </div>
            </RitualStepContainer>

            <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center pb-8 p-6"
                style={{
                    background: isLight 
                        ? 'linear-gradient(to top, rgba(245,245,240,1), transparent)'
                        : 'linear-gradient(to top, rgba(0,0,0,1), transparent)'
                }}
            >
                <RitualProgressBar currentStep={currentStep} />
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowGuide(true)}
                        className="text-[10px] uppercase font-bold tracking-widest transition-colors"
                        style={{
                            color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
                        }}
                    >
                        Show Guidance
                    </button>
                    <span style={{ color: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>|</span>
                    <button 
                        onClick={() => {
                            resetRitual();
                            onStop();
                        }}
                        className="text-[10px] uppercase font-bold tracking-widest transition-colors"
                        style={{
                            color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = isLight ? 'rgba(180,50,50,0.6)' : 'rgba(255, 100, 100, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
                        }}
                    >
                        Abandon Ritual
                    </button>
                </div>
            </div>

            <RitualAudioPrompt 
                audioUrl={currentStepConfig.audio} 
                onComplete={() => console.log("Audio finished")} 
            />

            <InstructionalOverlay 
                isOpen={showGuide && currentStepConfig.guide}
                imageUrl={currentStepConfig.guide?.image}
                caption={currentStepConfig.guide?.caption}
                onDismiss={() => setShowGuide(false)}
            />
        </div>
    );
}
