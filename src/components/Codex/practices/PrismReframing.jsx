// src/components/Codex/practices/PrismReframing.jsx
// 3-frame plausible perspective shift practice
import { useState, useEffect } from 'react';
import { useTrainingStore, PRACTICE_STATES } from '../../../state/trainingStore.js';
import { PRACTICE_DEFINITIONS } from '../../../state/practiceConfig.js';

export function PrismReframing({ onComplete }) {
    const { practiceState, setPracticeState, addEntry, currentSession } = useTrainingStore();
    const [currentFrame, setCurrentFrame] = useState(0);
    const [currentInput, setCurrentInput] = useState('');
    const [introComplete, setIntroComplete] = useState(false);

    const config = PRACTICE_DEFINITIONS.prism;
    const frames = config.steps;
    const constraints = config.constraints;

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

    // Handle next frame
    const handleNextFrame = () => {
        if (currentInput.trim()) {
            addEntry(`prism-frame-${currentFrame}`, 'text', currentInput);
        }
        setCurrentInput('');

        if (currentFrame < frames.length - 1) {
            setCurrentFrame(currentFrame + 1);
        } else {
            // All frames complete
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
                    Loosen your grip on the story.
                </p>
            </div>
        );
    }

    // Reflection screen
    if (practiceState === PRACTICE_STATES.REFLECTION) {
        const session = currentSession;
        const completionRatio = session?.completionRatio || 0;

        const prompt = completionRatio < 0.5
            ? "Which frame felt hardest?"
            : "What loosened?";

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
                <p
                    className="text-xs mb-8 max-w-sm"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: 'italic',
                        color: 'rgba(251, 191, 36, 0.6)',
                    }}
                >
                    What does that loosened feeling allow you to do next?
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

    // Active practice - 3 frames
    return (
        <div className="flex flex-col items-center justify-center h-full px-8">
            {/* Triangle progress indicator */}
            <div className="flex gap-3 mb-8">
                {frames.map((_, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: '0',
                            height: '0',
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderBottom: idx === currentFrame
                                ? `10px solid ${config.accent}`
                                : idx < currentFrame
                                    ? '10px solid rgba(251, 191, 36, 0.3)'
                                    : '10px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>

            {/* Current frame prompt */}
            <p
                className="text-lg mb-2 text-center"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontStyle: 'italic',
                    color: 'rgba(255, 255, 255, 0.9)',
                }}
            >
                {frames[currentFrame]}
            </p>

            {/* Constraint text (for frame 2) */}
            {constraints[currentFrame] && (
                <p
                    className="text-xs mb-6 text-center max-w-sm"
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        color: 'rgba(251, 191, 36, 0.5)',
                        letterSpacing: '0.05em',
                    }}
                >
                    {constraints[currentFrame]}
                </p>
            )}

            {/* Text input */}
            <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your response..."
                className="w-full max-w-sm h-24 px-4 py-3 mb-6 rounded bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-amber-400/50"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: '14px',
                }}
            />

            {/* Next button */}
            <button
                onClick={handleNextFrame}
                disabled={!currentInput.trim()}
                className="px-6 py-2 rounded border border-amber-400/30 text-amber-300/70 hover:text-amber-200 hover:border-amber-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12px', letterSpacing: '0.1em' }}
            >
                {currentFrame < frames.length - 1 ? 'NEXT FRAME' : 'COMPLETE'}
            </button>
        </div>
    );
}
