// src/components/RitualPortal.jsx
// "The Stage" - Oculus-style ritual interface with Focus Mode
// Displays ritual steps with SVG HUD frame, sigil progress, and gemstone buttons
// Now with scrying mirror image masking and glow bleed

import React, { useState, useEffect, useRef } from 'react';
import { OculusRing } from './OculusRing.jsx';
import { SigilSlider } from './SigilSlider.jsx';

export function RitualPortal({
    ritual,
    currentStepIndex,
    onNextStep,
    onComplete,
    onStop,
    onSwitch,
    onPause,
    onAliveSignal,
}) {
    const [stepTimeRemaining, setStepTimeRemaining] = useState(0);
    const [cueIndex, setCueIndex] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const timerRef = useRef(null);
    const cueTimerRef = useRef(null);

    const currentStep = ritual?.steps?.[currentStepIndex];
    const totalSteps = ritual?.steps?.length || 0;
    const isLastStep = currentStepIndex >= totalSteps - 1;

    // Initialize step timer
    useEffect(() => {
        if (!currentStep) return;

        setStepTimeRemaining(currentStep.duration || 60);
        setCueIndex(0);
        setImageLoaded(false);

        // Clear existing timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (cueTimerRef.current) clearInterval(cueTimerRef.current);

        // Countdown timer
        timerRef.current = setInterval(() => {
            setStepTimeRemaining(prev => {
                if (prev <= 1) {
                    // Auto-advance or complete
                    if (isLastStep) {
                        onComplete?.();
                    } else {
                        onNextStep?.();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Rotate sensory cues every 8 seconds
        if (currentStep.sensoryCues?.length > 1) {
            cueTimerRef.current = setInterval(() => {
                setCueIndex(prev => (prev + 1) % currentStep.sensoryCues.length);
            }, 8000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (cueTimerRef.current) clearInterval(cueTimerRef.current);
        };
    }, [currentStepIndex, currentStep, isLastStep, onNextStep, onComplete]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!ritual || !currentStep) {
        return (
            <div className="flex items-center justify-center h-64 text-white/50">
                No ritual loaded
            </div>
        );
    }

    const currentCue = currentStep.sensoryCues?.[cueIndex];
    const stepNames = ritual.steps?.map(s => s.name) || [];

    return (
        <div className="flex flex-col items-center w-full max-w-md px-4 ritual-portal-enter">

            {/* ═══════════════════════════════════════════════════════════════
          THE OCULUS - Central HUD Frame (Scrying Mirror)
          ═══════════════════════════════════════════════════════════════ */}
            <OculusRing
                size={320}
                totalSteps={totalSteps}
                currentStep={currentStepIndex}
            >
                {/* Scrying Mirror Content - Image with glow bleed */}
                <div className="relative w-full h-full flex items-center justify-center overflow-visible">

                    {/* Background glow layer - bleeds outside the mask */}
                    <div
                        className="absolute inset-[-20%] rounded-full pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle at center, var(--accent-20) 0%, transparent 50%)',
                            filter: 'blur(20px)',
                        }}
                    />

                    {/* Image container with soft edge mask */}
                    <div
                        className="relative w-full h-full rounded-full overflow-hidden"
                        style={{
                            maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)',
                            WebkitMaskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)',
                        }}
                    >
                        {currentStep.image && (
                            <img
                                src={`${import.meta.env.BASE_URL}${currentStep.image}`}
                                alt={currentStep.name}
                                className="w-full h-full object-cover transition-opacity duration-500"
                                style={{
                                    opacity: imageLoaded ? 0.95 : 0,
                                    filter: 'saturate(1.1) contrast(1.05)',
                                }}
                                onLoad={() => setImageLoaded(true)}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    setImageLoaded(false);
                                }}
                            />
                        )}
                    </div>

                    {/* Fallback glyph when no image or loading */}
                    {(!currentStep.image || !imageLoaded) && (
                        <div
                            className="absolute text-7xl animate-pulse-slow"
                            style={{
                                color: 'var(--accent-60)',
                                textShadow: '0 0 40px var(--accent-40), 0 0 80px var(--accent-30)',
                                filter: 'drop-shadow(0 0 30px var(--accent-color))',
                            }}
                        >
                            {ritual.icon || '☉'}
                        </div>
                    )}

                    {/* Timer overlay (bottom of frame) */}
                    <div
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full"
                        style={{
                            background: 'rgba(0,0,0,0.8)',
                            border: '1px solid var(--accent-40)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: 'Georgia, serif',
                                fontSize: '20px',
                                fontWeight: 500,
                                letterSpacing: '0.12em',
                                color: stepTimeRemaining < 30 ? '#fcd34d' : '#fefce8',
                                textShadow: '0 0 10px var(--accent-60)',
                            }}
                        >
                            {formatTime(stepTimeRemaining)}
                        </span>
                    </div>
                </div>
            </OculusRing>

            {/* ═══════════════════════════════════════════════════════════════
          SIGIL SLIDER - Rune Progress Track (Icons Only)
          ═══════════════════════════════════════════════════════════════ */}
            <div className="mt-8 w-full">
                <SigilSlider
                    totalSteps={totalSteps}
                    currentStep={currentStepIndex}
                    variant="planetary"
                    stepNames={stepNames}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
          INSTRUCTION TEXT
          ═══════════════════════════════════════════════════════════════ */}
            <div className="mt-6 text-center">
                <div
                    className="max-w-sm mx-auto mb-4"
                    style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '14px',
                        lineHeight: 1.8,
                        color: 'rgba(253,251,245,0.9)',
                    }}
                >
                    {currentStep.instruction}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
          SENSORY CUE - Rotating guidance text
          ═══════════════════════════════════════════════════════════════ */}
            {currentCue && (
                <div
                    key={cueIndex}
                    className="text-center mb-5 px-6 max-w-sm animate-fade-in"
                    style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        color: 'var(--accent-70)',
                        minHeight: '44px',
                        borderLeft: '2px solid var(--accent-40)',
                        paddingLeft: '14px',
                        textAlign: 'left',
                    }}
                >
                    "{currentCue}"
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
          ACTION BUTTONS - Gemstone Style
          ═══════════════════════════════════════════════════════════════ */}
            <div className="flex gap-4 mt-4">
                {/* Abandon button - Subdued */}
                <button
                    onClick={() => {
                        onAliveSignal?.();
                        onStop?.();
                    }}
                    className="px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '10px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(180deg, rgba(60,60,60,0.8) 0%, rgba(30,30,30,0.9) 100%)',
                        color: 'rgba(253,251,245,0.5)',
                        border: '1px solid rgba(253,251,245,0.12)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                >
                    Dissolve
                </button>

                {/* NEXT STEP / TRANSMUTE button - Gemstone PBR style */}
                <button
                    onClick={() => {
                        // Track switch for attention path instrumentation
                        onSwitch?.();
                        onAliveSignal?.();
                        if (isLastStep) {
                            onComplete?.();
                        } else {
                            onNextStep?.();
                        }
                    }}
                    className="px-7 py-2.5 rounded-full transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95"
                    style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '11px',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        background: 'linear-gradient(180deg, #fcd34d 0%, #b45309 100%)',
                        color: '#1a0a04',
                        border: '1px solid #fef3c7',
                        boxShadow: `
              0 0 20px rgba(252, 211, 77, 0.5),
              0 0 40px rgba(252, 211, 77, 0.25),
              inset 0 2px 6px rgba(255, 255, 255, 0.6),
              inset 0 -2px 4px rgba(0, 0, 0, 0.2)
            `,
                    }}
                >
                    {isLastStep ? '✦ TRANSMUTE' : 'NEXT STEP'}
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
          RITUAL INFO - Bottom metadata
          ═══════════════════════════════════════════════════════════════ */}
            <div
                className="mt-6 text-center"
                style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '9px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-30)',
                }}
            >
                {ritual.tradition}
            </div>

            <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .ritual-portal-enter {
          animation: portal-enter 0.5s ease-out forwards;
        }
        @keyframes portal-enter {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    );
}
