// src/components/PathFinderCard.jsx
import React from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

const PATH_FINDER_CHAMFER = '18px';
const PATH_FINDER_CLIP = `polygon(${PATH_FINDER_CHAMFER} 0, calc(100% - ${PATH_FINDER_CHAMFER}) 0, 100% ${PATH_FINDER_CHAMFER}, 100% calc(100% - ${PATH_FINDER_CHAMFER}), calc(100% - ${PATH_FINDER_CHAMFER}) 100%, ${PATH_FINDER_CHAMFER} 100%, 0 calc(100% - ${PATH_FINDER_CHAMFER}), 0 ${PATH_FINDER_CHAMFER})`;

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
            <div
                className="im-card w-full"
                data-tutorial="navigation-path-finder"
                data-card="true"
                data-card-id="pathFinder"
                style={{
                    position: 'relative',
                    clipPath: PATH_FINDER_CLIP,
                    borderRadius: '28px',
                    background: 'linear-gradient(180deg, rgba(7, 16, 24, 0.94) 0%, rgba(4, 10, 18, 0.90) 100%)',
                    border: '1px solid rgba(112, 233, 242, 0.18)',
                    boxShadow: '0 16px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(168, 241, 248, 0.06)',
                }}
            >
                <div
                    aria-hidden="true"
                    className="absolute inset-[8px] pointer-events-none"
                    style={{
                        clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
                        border: '1px solid rgba(101, 211, 224, 0.10)',
                        background: 'linear-gradient(180deg, rgba(8, 16, 24, 0.34) 0%, rgba(9, 18, 27, 0.24) 100%)',
                    }}
                />
                <div
                    aria-hidden="true"
                    className="absolute left-0 right-0 top-0 h-px pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, rgba(117, 231, 240, 0.64) 0%, rgba(117, 231, 240, 0.22) 18%, rgba(117, 231, 240, 0.1) 82%, rgba(117, 231, 240, 0.44) 100%)',
                    }}
                />
                <div aria-hidden="true" className="absolute top-[10px] left-[10px] h-[14px] w-[14px] pointer-events-none" style={{ borderTop: '1px solid rgba(117, 231, 240, 0.48)', borderLeft: '1px solid rgba(117, 231, 240, 0.48)' }} />
                <div aria-hidden="true" className="absolute top-[10px] right-[10px] h-[14px] w-[14px] pointer-events-none" style={{ borderTop: '1px solid rgba(117, 231, 240, 0.48)', borderRight: '1px solid rgba(117, 231, 240, 0.48)' }} />
                <button
                    onClick={() => setIsExpanded(true)}
                    className="relative z-10 w-full text-center py-3 px-4 rounded-xl transition-all border"
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        color: isLight ? 'rgba(60, 52, 37, 0.95)' : 'rgba(253,251,245,0.95)',
                        background: isLight
                            ? 'rgba(180, 140, 90, 0.15)'
                            : 'rgba(8, 18, 27, 0.28)',
                        borderColor: isLight
                            ? 'rgba(180, 140, 90, 0.3)'
                            : 'rgba(101, 211, 224, 0.12)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        margin: '10px',
                    }}
                >
                    ✨ For path guidance, click here...
                </button>
            </div>
        );
    }

    // Expanded state
    return (
        <div
            className="im-card w-full"
            data-tutorial="navigation-path-finder"
            data-card="true"
            data-card-id="pathFinder"
            style={{
                position: 'relative',
                clipPath: PATH_FINDER_CLIP,
                borderRadius: '28px',
                background: 'linear-gradient(180deg, rgba(7, 16, 24, 0.94) 0%, rgba(4, 10, 18, 0.90) 100%)',
                border: '1px solid rgba(112, 233, 242, 0.18)',
                boxShadow: '0 16px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(168, 241, 248, 0.06)',
            }}
        >
            <div
                aria-hidden="true"
                className="absolute inset-[8px] pointer-events-none"
                style={{
                    clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
                    border: '1px solid rgba(101, 211, 224, 0.10)',
                    background: 'linear-gradient(180deg, rgba(8, 16, 24, 0.34) 0%, rgba(9, 18, 27, 0.24) 100%)',
                }}
            />
            <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-0 h-px pointer-events-none"
                style={{
                    background: 'linear-gradient(90deg, rgba(117, 231, 240, 0.64) 0%, rgba(117, 231, 240, 0.22) 18%, rgba(117, 231, 240, 0.1) 82%, rgba(117, 231, 240, 0.44) 100%)',
                }}
            />
            <div aria-hidden="true" className="absolute top-[10px] left-[10px] h-[14px] w-[14px] pointer-events-none" style={{ borderTop: '1px solid rgba(117, 231, 240, 0.48)', borderLeft: '1px solid rgba(117, 231, 240, 0.48)' }} />
            <div aria-hidden="true" className="absolute top-[10px] right-[10px] h-[14px] w-[14px] pointer-events-none" style={{ borderTop: '1px solid rgba(117, 231, 240, 0.48)', borderRight: '1px solid rgba(117, 231, 240, 0.48)' }} />
            <div
                className="relative rounded-3xl p-8 overflow-hidden z-10"
                style={{
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)'
                        : 'linear-gradient(180deg, rgba(8, 18, 27, 0.56) 0%, rgba(5, 11, 18, 0.34) 100%)',
                    border: isLight ? '1px solid rgba(180, 140, 90, 0.25)' : '1px solid rgba(101, 211, 224, 0.10)',
                    boxShadow: isLight
                        ? '0 10px 30px rgba(180, 140, 90, 0.15)'
                        : `
                        inset 0 1px 0 rgba(168, 241, 248, 0.04),
                        inset 0 -6px 18px rgba(0, 0, 0, 0.28)
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
                            color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'rgba(170, 230, 236, 0.88)'
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
                                            : (isLight ? 'rgba(180, 140, 90, 0.1)' : 'rgba(101, 211, 224, 0.10)'),
                                        background: isSelected
                                            ? (isLight ? 'rgba(180, 140, 90, 0.1)' : 'rgba(78, 214, 226, 0.08)')
                                            : (isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(8, 18, 27, 0.48)'),
                                        boxShadow: isSelected && !isLight ? '0 0 15px rgba(78, 214, 226, 0.08)' : 'none'
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
                                    background: isLight ? 'rgba(180, 140, 90, 0.1)' : 'rgba(78, 214, 226, 0.08)',
                                    borderColor: isLight ? 'rgba(180, 140, 90, 0.2)' : 'rgba(101, 211, 224, 0.12)'
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
