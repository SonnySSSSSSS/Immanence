// src/components/PathFinderCard.jsx
import React from 'react';
import { useNavigationStore } from '../state/navigationStore.js';

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

export function PathFinderCard({ onPathRecommended }) {
    const {
        pathAssessment,
        setPathAssessment,
        setSelectedPath
    } = useNavigationStore();

    const handleSelect = (promptId) => {
        setPathAssessment(promptId);
        const prompt = PATH_PROMPTS.find(p => p.id === promptId);
        if (prompt && onPathRecommended) {
            // Trigger scroll/highlight for recommended path
            onPathRecommended(prompt.recommendedPath);
            // Also set it as selected
            setSelectedPath(prompt.recommendedPath);
        }
    };

    const handleSkip = () => {
        setPathAssessment(null);
        if (onPathRecommended) {
            onPathRecommended(null);
        }
    };

    const selectedPrompt = PATH_PROMPTS.find(p => p.id === pathAssessment);

    return (
        <div className="w-full">
            <div className="bg-[#0f0f1a] border border-[var(--accent-20)] rounded-3xl p-8">
                {/* Header */}
                <h2
                    className="text-lg uppercase tracking-[0.2em] text-[var(--accent-80)] mb-4 text-center"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    FIND YOUR PATH
                </h2>

                {/* Prompt */}
                <p
                    className="text-base text-[rgba(253,251,245,0.75)] mb-6 text-center"
                    style={{ fontFamily: 'Crimson Pro, serif' }}
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
                  ${isSelected
                                        ? 'border-[var(--accent-50)] bg-[rgba(253,224,71,0.08)] shadow-[0_0_15px_var(--accent-10)]'
                                        : 'border-[var(--accent-15)] bg-[rgba(253,251,245,0.02)] hover:border-[var(--accent-30)] hover:bg-[rgba(253,251,245,0.04)]'
                                    }
                `}
                            >
                                {/* Radio Circle */}
                                <div
                                    className={`
                    w-5 h-5 rounded-full border-2 flex-shrink-0
                    transition-all duration-200
                    ${isSelected
                                            ? 'border-[var(--accent-color)] bg-[var(--accent-20)]'
                                            : 'border-[var(--accent-30)]'
                                        }
                  `}
                                >
                                    {isSelected && (
                                        <div className="w-full h-full rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-[var(--accent-color)]" />
                                        </div>
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={`
                    text-sm transition-colors
                    ${isSelected
                                            ? 'text-[rgba(253,251,245,0.95)]'
                                            : 'text-[rgba(253,251,245,0.7)]'
                                        }
                  `}
                                    style={{ fontFamily: 'Crimson Pro, serif' }}
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
                        className="text-center py-3 px-4 rounded-xl bg-[var(--accent-10)] border border-[var(--accent-15)]"
                        style={{ animation: 'fadeIn 300ms ease-out' }}
                    >
                        <p
                            className="text-sm text-[var(--accent-80)]"
                            style={{ fontFamily: 'Crimson Pro, serif' }}
                        >
                            → Suggested:{' '}
                            <span
                                className="font-semibold text-[var(--accent-color)]"
                                style={{ fontFamily: 'Cinzel, serif' }}
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

                {/* Skip Link */}
                <div className="text-center mt-4">
                    <button
                        onClick={handleSkip}
                        className="text-xs text-[rgba(253,251,245,0.4)] hover:text-[rgba(253,251,245,0.7)] transition-colors"
                        style={{ fontFamily: 'Crimson Pro, serif' }}
                    >
                        Skip assessment
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
