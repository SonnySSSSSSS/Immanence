// src/components/PathFinderCard.jsx
import React from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

const PATH_PROMPTS = [
    {
        id: 'scattered',
        label: 'My attention is scattered',
        recommendedPath: 'attention-training' // placeholder path
    },
    {
        id: 'avoiding',
        label: "I'm avoiding something I know I must face",
        recommendedPath: 'shadow-work'
    },
    {
        id: 'consistency',
        label: 'I want to build unshakeable consistency',
        recommendedPath: 'consistency'
    },
    {
        id: 'reality',
        label: "I'm seeking deeper understanding of reality",
        recommendedPath: 'non-duality'
    },
    {
        id: 'disconnected',
        label: 'I feel disconnected from my body',
        recommendedPath: 'grounding' // placeholder path
    }
];

export function PathFinderCard({ onPathRecommended, selectedPathId }) {
    const {
        pathAssessment,
        setPathAssessment
    } = useNavigationStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Collapse when a path is selected
    React.useEffect(() => {
        if (selectedPathId) {
            setIsExpanded(false);
        }
    }, [selectedPathId]);

    const handleSelect = (promptId) => {
        setPathAssessment(promptId);
        const prompt = PATH_PROMPTS.find(p => p.id === promptId);
        if (prompt && onPathRecommended) {
            // Scroll only; user must click the card to open the overlay
            onPathRecommended(prompt.recommendedPath);
        }
    };

    const handleSkip = () => {
        setPathAssessment(null);
        if (onPathRecommended) {
            onPathRecommended(null);
        }
    };

    const selectedPrompt = PATH_PROMPTS.find(p => p.id === pathAssessment);

    // Collapsed state
    if (!isExpanded) {
        return (
            <div className="w-full">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full text-center py-3 rounded-xl transition-all border"
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        color: isLight ? 'rgba(60, 52, 37, 0.95)' : 'rgba(253,251,245,0.95)',
                        background: isLight
                            ? 'rgba(180, 140, 90, 0.15)'
                            : 'rgba(253, 251, 245, 0.08)',
                        borderColor: isLight
                            ? 'rgba(180, 140, 90, 0.3)'
                            : 'rgba(253, 251, 245, 0.15)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                    }}
                >
                    ✨ For path guidance, click here...
                </button>
            </div>
        );
    }

    // Expanded state
    return (
        <div className="w-full">
            <div
                className="relative rounded-3xl p-8 overflow-hidden"
                style={{
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)'
                        : 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                    border: isLight ? '1px solid rgba(180, 140, 90, 0.25)' : '1px solid transparent',
                    backgroundImage: isLight ? 'none' : `
                        linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                        linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.2) 50%, var(--accent-30) 100%)
                    `,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: isLight
                        ? '0 10px 30px rgba(180, 140, 90, 0.15)'
                        : `
                        0 8px 32px rgba(0, 0, 0, 0.6),
                        0 2px 8px var(--accent-15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08),
                        inset 0 -3px 12px rgba(0, 0, 0, 0.4)
                    `
                }}
            >
                {/* Volcanic glass texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-3xl"
                    style={{
                        background: `
                            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
                            repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0, 0, 0, 0.015) 3px, rgba(0, 0, 0, 0.015) 6px)
                        `,
                        opacity: 0.7
                    }}
                />

                {/* Inner ember glow */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-3xl"
                    style={{
                        background: `radial-gradient(circle at 50% 0%, var(--accent-glow)12 0%, transparent 60%)`
                    }}
                />

                {/* Content */}
                <div className="relative z-10">
                    {/* Header */}
                    <h2
                        className="text-lg uppercase tracking-[0.25em] mb-4 text-center font-bold"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-80)'
                        }}
                    >
                        FIND YOUR PATH
                    </h2>

                    {/* Prompt */}
                    <p
                        className="text-base mb-6 text-center font-medium"
                        style={{
                            fontFamily: 'var(--font-body)',
                            letterSpacing: '0.01em',
                            color: isLight ? 'rgba(90, 77, 60, 0.75)' : 'rgba(253,251,245,0.75)'
                        }}
                    >
                        What brings you here today?
                    </p>

                    {/* Options */}
                    <div className="space-y-3 mb-6">
                        {PATH_PROMPTS.map((prompt) => {
                            const isSelected = pathAssessment === prompt.id;

                            return (
                                <button
                                    key={prompt.id}
                                    onClick={() => handleSelect(prompt.id)}
                                    className={`
                                        w-full px-4 py-3 rounded-xl text-left
                                        border transition-all duration-200
                                        flex items-center gap-3
                                    `}
                                    style={{
                                        borderColor: isSelected
                                            ? (isLight ? 'rgba(180, 140, 90, 0.5)' : 'var(--accent-50)')
                                            : (isLight ? 'rgba(180, 140, 90, 0.1)' : 'var(--accent-15)'),
                                        background: isSelected
                                            ? (isLight ? 'rgba(180, 140, 90, 0.1)' : 'var(--accent-10)')
                                            : (isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(253, 251, 245, 0.02)'),
                                        boxShadow: isSelected && !isLight ? '0 0 15px var(--accent-10)' : 'none'
                                    }}
                                >
                                    {/* Radio Circle */}
                                    <div
                                        className={`
                                            w-5 h-5 rounded-full border-2 flex-shrink-0
                                            transition-all duration-200
                                            flex items-center justify-center
                                        `}
                                        style={{
                                            borderColor: isSelected
                                                ? (isLight ? 'rgba(180, 140, 90, 0.8)' : 'var(--accent-color)')
                                                : (isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-30)'),
                                            background: isSelected && !isLight ? 'var(--accent-20)' : 'transparent'
                                        }}
                                    >
                                        {isSelected && (
                                            <div
                                                className="w-2.5 h-2.5 rounded-full transition-all"
                                                style={{ background: isLight ? 'rgba(180, 140, 90, 0.9)' : 'var(--accent-color)' }}
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span
                                        className="text-sm transition-colors"
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            fontWeight: 500,
                                            letterSpacing: '0.01em',
                                            color: isSelected
                                                ? (isLight ? 'rgba(60, 52, 37, 0.95)' : 'rgba(253,251,245,0.95)')
                                                : (isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253,251,245,0.7)')
                                        }}
                                    >
                                        {prompt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Recommendation */}
                    {selectedPrompt && (
                        <div
                            className="text-center py-3 px-4 rounded-xl border"
                            style={{
                                animation: 'fadeIn 300ms ease-out',
                                background: isLight ? 'rgba(180, 140, 90, 0.1)' : 'var(--accent-10)',
                                borderColor: isLight ? 'rgba(180, 140, 90, 0.2)' : 'var(--accent-15)'
                            }}
                        >
                            <p
                                className="text-sm"
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    color: isLight ? 'rgba(140, 100, 40, 0.9)' : 'var(--accent-80)'
                                }}
                            >
                                → Suggested:{' '}
                                <span
                                    className="font-bold tracking-wide"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        color: isLight ? 'rgba(180, 120, 40, 1)' : 'var(--accent-color)'
                                    }}
                                >
                                    {selectedPrompt.recommendedPath === 'shadow-work' && 'Integrate Shadow Work'}
                                    {selectedPrompt.recommendedPath === 'consistency' && 'Build Consistency'}
                                    {selectedPrompt.recommendedPath === 'non-duality' && 'Explore Non-Duality'}
                                    {selectedPrompt.recommendedPath === 'attention-training' && 'Attention Training'}
                                    {selectedPrompt.recommendedPath === 'grounding' && 'Ground & Earth'}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Skip/Close Link */}
                    <div className="text-center mt-4">
                        <button
                            onClick={() => {
                                handleSkip();
                                setIsExpanded(false);
                            }}
                            className="text-xs transition-colors"
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontWeight: 500,
                                letterSpacing: '0.01em',
                                color: isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253,251,245,0.4)'
                            }}
                            onMouseEnter={(e) => e.target.style.color = isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253,251,245,0.7)'}
                            onMouseLeave={(e) => e.target.style.color = isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253,251,245,0.4)'}
                        >
                            Skip assessment
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div >
    );
}
