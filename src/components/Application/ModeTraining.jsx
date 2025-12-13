// src/components/Application/ModeTraining.jsx
// Modal container for mode-based training practices
import React, { useEffect, useCallback } from 'react';
import { useModeTrainingStore, PRACTICE_STATES } from '../../state/modeTrainingStore.js';
import { PRACTICE_DEFINITIONS, MODE_CHECK_OPTIONS } from '../../state/practiceConfig.js';

// Import practices
import { MirrorStillness } from './practices/MirrorStillness.jsx';
import { ResonatorChambering } from './practices/ResonatorChambering.jsx';
import { PrismReframing } from './practices/PrismReframing.jsx';
import { SwordCompression } from './practices/SwordCompression.jsx';

// Mode Check (Harmony) component
function ModeCheck({ onComplete }) {
    const { setModeCheckResponse } = useModeTrainingStore();

    const handleResponse = (response) => {
        setModeCheckResponse(response);
        onComplete();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <p
                className="text-xs uppercase tracking-[0.2em] mb-4"
                style={{
                    fontFamily: "'Outfit', sans-serif",
                    color: 'rgba(255, 255, 255, 0.4)',
                }}
            >
                Harmony
            </p>
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
                {MODE_CHECK_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleResponse(option.id)}
                        className="w-full px-6 py-3 rounded border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '12px',
                            letterSpacing: '0.05em',
                        }}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Main ModeTraining modal
export function ModeTraining({ mode, isOpen, onClose }) {
    const {
        practiceState,
        setPracticeState,
        startSession,
        endSession,
        shouldTriggerHarmony,
    } = useModeTrainingStore();

    const config = PRACTICE_DEFINITIONS[mode];

    // Start session when modal opens
    useEffect(() => {
        if (isOpen && practiceState === PRACTICE_STATES.IDLE) {
            startSession(mode);
        }
    }, [isOpen, practiceState, mode, startSession]);

    // Handle practice complete → check for Harmony trigger
    const handlePracticeComplete = useCallback(() => {
        if (shouldTriggerHarmony()) {
            setPracticeState(PRACTICE_STATES.HANDOFF);
        } else {
            endSession();
            onClose();
        }
    }, [shouldTriggerHarmony, setPracticeState, endSession, onClose]);

    // Handle mode check complete
    const handleModeCheckComplete = useCallback(() => {
        endSession();
        onClose();
    }, [endSession, onClose]);

    // Handle close (escape or background click)
    const handleClose = useCallback(() => {
        if (practiceState !== PRACTICE_STATES.IDLE) {
            endSession();
        }
        onClose();
    }, [practiceState, endSession, onClose]);

    // Escape key handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleClose]);

    // Render the appropriate practice component
    const renderPractice = () => {
        // Handoff state = Mode Check
        if (practiceState === PRACTICE_STATES.HANDOFF) {
            return <ModeCheck onComplete={handleModeCheckComplete} />;
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
                            Practice not found for {mode}
                        </p>
                        <button
                            onClick={handleClose}
                            className="mt-4 px-4 py-2 text-white/50 hover:text-white/80 transition-colors"
                            style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px' }}
                        >
                            CLOSE
                        </button>
                    </div>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(5, 5, 8, 0.95)' }}
        >
            {/* Background click to close */}
            <div
                className="absolute inset-0"
                onClick={handleClose}
            />

            {/* Modal content */}
            <div
                className="relative w-full max-w-lg h-[80vh] max-h-[600px] mx-4 rounded-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, rgba(15, 15, 26, 0.98) 0%, rgba(10, 10, 18, 0.99) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors z-10"
                    style={{ fontSize: '20px' }}
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
                            color: config?.accent || 'rgba(255,255,255,0.5)',
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
                        color: config?.accent || 'rgba(255,255,255,0.3)',
                        opacity: 0.3,
                    }}
                >
                    {config?.whisper || ''}
                </div>

                {/* Practice content */}
                <div className="w-full h-full pt-16 pb-8">
                    {renderPractice()}
                </div>
            </div>

            {/* CSS for fadeIn animation */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
