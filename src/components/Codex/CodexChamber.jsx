// src/components/Codex/CodexChamber.jsx
// Compass - Orientation chamber with questions as center of gravity
// Option 3: Card backs present but dormant until question selected
import { useState, useMemo } from 'react';
import { codexCards, CODEX_MODES } from './codexCards.js';
import { CodexTablet } from './CodexTablet.jsx';

const CARDS_PER_PAGE = 6;

// Recognition statements — confessions, not quotes
const ORIENTATION_QUESTIONS = {
    mirror: {
        line1: "I can't tell what's actually happening",
        line2: "anymore.",
        cardIds: ['001', '003'],
    },
    resonator: {
        line1: "Something in me is reacting faster",
        line2: "than I can stay with.",
        cardIds: ['002', '007', '009'],
    },
    prism: {
        line1: "The story feels stuck",
        line2: "— but unfinished.",
        cardIds: ['005', '008'],
    },
    sword: {
        line1: "I know what matters.",
        line2: "I keep delaying.",
        cardIds: ['004', '006', '010'],
    },
};

// Face-down card component
function DormantCard({ isAwakened = false, isHighlighted = false, card, expandedCard, setExpandedCard, onNavigate }) {
    if (isAwakened) {
        // Show the real card when awakened
        return (
            <CodexTablet
                card={card}
                isExpanded={expandedCard === card.id}
                isFocused={false}
                isDimmed={!isHighlighted}
                isHighlighted={isHighlighted}
                onToggle={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                onNavigate={onNavigate}
            />
        );
    }

    // Dormant state - face-down card back
    return (
        <div
            className="cursor-default flex items-center justify-center"
            style={{
                background: 'linear-gradient(180deg, rgba(18, 14, 28, 0.4) 0%, rgba(12, 8, 18, 0.5) 100%)',
                border: '1px solid rgba(250, 208, 120, 0.08)',
                borderRadius: '8px',
                minHeight: '180px',
                opacity: 0.4,
                transition: 'all 0.5s ease-out',
            }}
        >
            {/* Card back pattern - subtle geometry */}
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.15 }}>
                <path
                    d="M20 5 L35 20 L20 35 L5 20 Z"
                    fill="none"
                    stroke="rgba(250, 208, 120, 0.5)"
                    strokeWidth="0.5"
                />
                <circle cx="20" cy="20" r="6" fill="none" stroke="rgba(250, 208, 120, 0.3)" strokeWidth="0.5" />
            </svg>
        </div>
    );
}

export function CodexChamber({ onClose, onNavigate }) {
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [hoveredQuestion, setHoveredQuestion] = useState(null);
    const [expandedCard, setExpandedCard] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);

    // Always show all cards
    const filteredCards = codexCards;

    // Get highlighted card IDs based on active question
    const highlightedCardIds = useMemo(() => {
        if (!activeQuestion) return new Set();
        return new Set(ORIENTATION_QUESTIONS[activeQuestion]?.cardIds || []);
    }, [activeQuestion]);

    // Pagination
    const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
    const paginatedCards = useMemo(() => {
        const start = currentPage * CARDS_PER_PAGE;
        return filteredCards.slice(start, start + CARDS_PER_PAGE);
    }, [filteredCards, currentPage]);

    const handleQuestionClick = (questionKey) => {
        if (activeQuestion === questionKey) {
            setActiveQuestion(null);
        } else {
            setActiveQuestion(questionKey);
            setCurrentPage(0);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
            setExpandedCard(null);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
            setExpandedCard(null);
        }
    };

    const isAwakened = activeQuestion !== null;

    return (
        <div className="compass-chamber w-full flex flex-col relative overflow-visible">

            {/* ═══════════════════════════════════════════════════════════════════
                PRE-MOTION BACKGROUND — Subtle directional tension
                Each quadrant drifts in mode-aligned direction (barely perceptible)
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.25 }}>
                {/* Mirror: vertical stillness with slow breath */}
                <div
                    className="absolute top-0 left-0 w-1/2 h-1/2 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.3), transparent 70%)',
                        animation: 'compass-drift-mirror 12s ease-in-out infinite',
                        opacity: hoveredQuestion === 'mirror' ? 3 : 1,
                    }}
                />
                {/* Resonator: horizontal oscillation */}
                <div
                    className="absolute top-0 right-0 w-1/2 h-1/2 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3), transparent 70%)',
                        animation: 'compass-drift-resonator 8s ease-in-out infinite',
                        opacity: hoveredQuestion === 'resonator' ? 3 : 1,
                    }}
                />
                {/* Prism: radial breathing */}
                <div
                    className="absolute bottom-0 left-0 w-1/2 h-1/2 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(52, 211, 153, 0.3), transparent 70%)',
                        animation: 'compass-drift-prism 15s ease-in-out infinite',
                        opacity: hoveredQuestion === 'prism' ? 3 : 1,
                    }}
                />
                {/* Sword: forward pressure (subtle push up) */}
                <div
                    className="absolute bottom-0 right-0 w-1/2 h-1/2 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.3), transparent 70%)',
                        animation: 'compass-drift-sword 10s ease-in-out infinite',
                        opacity: hoveredQuestion === 'sword' ? 3 : 1,
                    }}
                />
            </div>

            {/* Pre-motion animation keyframes (EXAGGERATED FOR TESTING) */}
            <style>{`
                @keyframes compass-drift-mirror {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(15px) scale(1.08); }
                }
                @keyframes compass-drift-resonator {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(20px); }
                }
                @keyframes compass-drift-prism {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                }
                @keyframes compass-drift-sword {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>


            {/* ═══════════════════════════════════════════════════════════════════
                COMPASS HEADER — Dynamic: shows mode name when selected
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="text-center pt-4 pb-2 relative z-10">
                <h1
                    className="transition-all duration-500"
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: '14px',
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: activeQuestion
                            ? CODEX_MODES[activeQuestion]?.color || 'rgba(245, 209, 138, 0.5)'
                            : 'rgba(245, 209, 138, 0.3)',
                        textTransform: 'uppercase',
                    }}
                >
                    {activeQuestion ? CODEX_MODES[activeQuestion]?.name : 'Compass'}
                </h1>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                CENTER OF GRAVITY — The Four Questions
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="px-6 py-4 relative" style={{ overflow: 'visible' }}>

                {/* DIRECTIONAL ANCHORS — Icons orbit the question field corners */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Top-left: Mirror */}
                    <div className="absolute transition-all duration-700"
                        style={{
                            top: '-60px',
                            left: '-60px',
                            opacity: activeQuestion === 'mirror' ? 1 : 0.4,
                            filter: activeQuestion && activeQuestion !== 'mirror' ? 'blur(2px) brightness(0.7)' : 'blur(0px)',
                        }}>
                        <div className="absolute inset-0 transition-opacity duration-700"
                            style={{
                                width: '140px', height: '140px',
                                transform: 'translate(-20px, -20px)',
                                background: `radial-gradient(circle, ${CODEX_MODES.mirror.color}20, transparent 70%)`,
                                opacity: activeQuestion === 'mirror' ? 1 : 0,
                            }} />
                        <img src={`${import.meta.env.BASE_URL}codex/mirror.png`} alt=""
                            style={{
                                width: '100px', height: '100px', objectFit: 'contain',
                                mixBlendMode: 'lighten',
                                filter: 'hue-rotate(180deg) saturate(0.5)',
                                animation: activeQuestion === 'mirror' ? 'icon-breathe 7s ease-in-out infinite' : 'none',
                            }} />
                    </div>
                    {/* Top-right: Sword */}
                    <div className="absolute transition-all duration-700"
                        style={{
                            top: '-60px',
                            right: '-60px',
                            opacity: activeQuestion === 'sword' ? 1 : 0.4,
                            filter: activeQuestion && activeQuestion !== 'sword' ? 'blur(2px) brightness(0.7)' : 'blur(0px)',
                        }}>
                        <div className="absolute inset-0 transition-opacity duration-700"
                            style={{
                                width: '140px', height: '140px',
                                transform: 'translate(-20px, -20px)',
                                background: `radial-gradient(circle, ${CODEX_MODES.sword.color}20, transparent 70%)`,
                                opacity: activeQuestion === 'sword' ? 1 : 0,
                            }} />
                        <img src={`${import.meta.env.BASE_URL}codex/sword.png`} alt=""
                            style={{
                                width: '100px', height: '100px', objectFit: 'contain',
                                mixBlendMode: 'lighten',
                                filter: 'hue-rotate(180deg) saturate(0.5)',
                                animation: activeQuestion === 'sword' ? 'icon-breathe 7s ease-in-out infinite' : 'none',
                            }} />
                    </div>
                    {/* Bottom-left: Resonator */}
                    <div className="absolute transition-all duration-700"
                        style={{
                            bottom: '-60px',
                            left: '-60px',
                            opacity: activeQuestion === 'resonator' ? 1 : 0.4,
                            filter: activeQuestion && activeQuestion !== 'resonator' ? 'blur(2px) brightness(0.7)' : 'blur(0px)',
                        }}>
                        <div className="absolute inset-0 transition-opacity duration-700"
                            style={{
                                width: '140px', height: '140px',
                                transform: 'translate(-20px, -20px)',
                                background: `radial-gradient(circle, ${CODEX_MODES.resonator.color}20, transparent 70%)`,
                                opacity: activeQuestion === 'resonator' ? 1 : 0,
                            }} />
                        <img src={`${import.meta.env.BASE_URL}codex/resonator.png`} alt=""
                            style={{
                                width: '100px', height: '100px', objectFit: 'contain',
                                mixBlendMode: 'lighten',
                                filter: 'hue-rotate(180deg) saturate(0.5)',
                                animation: activeQuestion === 'resonator' ? 'icon-breathe 7s ease-in-out infinite' : 'none',
                            }} />
                    </div>
                    {/* Bottom-right: Prism */}
                    <div className="absolute transition-all duration-700"
                        style={{
                            bottom: '-60px',
                            right: '-60px',
                            opacity: activeQuestion === 'prism' ? 1 : 0.4,
                            filter: activeQuestion && activeQuestion !== 'prism' ? 'blur(2px) brightness(0.7)' : 'blur(0px)',
                        }}>
                        <div className="absolute inset-0 transition-opacity duration-700"
                            style={{
                                width: '140px', height: '140px',
                                transform: 'translate(-20px, -20px)',
                                background: `radial-gradient(circle, ${CODEX_MODES.prism.color}20, transparent 70%)`,
                                opacity: activeQuestion === 'prism' ? 1 : 0,
                            }} />
                        <img src={`${import.meta.env.BASE_URL}codex/prism.png`} alt=""
                            style={{
                                width: '100px', height: '100px', objectFit: 'contain',
                                mixBlendMode: 'lighten',
                                filter: 'hue-rotate(180deg) saturate(0.5)',
                                animation: activeQuestion === 'prism' ? 'icon-breathe 7s ease-in-out infinite' : 'none',
                            }} />
                    </div>
                </div>

                {/* Icon breathing animation */}
                <style>{`
                    @keyframes icon-breathe {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.05); opacity: 0.9; }
                    }
                `}</style>

                {/* Permission language — above questions */}
                <p
                    className="mb-4 text-center relative z-10"
                    style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        letterSpacing: "var(--tracking-mythic)",
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        color: 'rgba(253, 251, 245, 0.3)',
                    }}
                >
                    You don't have to be sure. Notice what pulls at you.
                </p>

                {/* The Questions — Large, interactive anchors */}
                {/* Container gets mode-specific deformation when hovering */}
                <div
                    className="w-full max-w-md mx-auto space-y-4 transition-all duration-500"
                    style={{
                        // Mode-specific UI deformation on hover (only when not active)
                        filter: !activeQuestion && hoveredQuestion === 'mirror'
                            ? 'blur(2px) brightness(0.7)' // Mirror: everything QUIETS significantly
                            : !activeQuestion && hoveredQuestion === 'sword'
                                ? 'contrast(1.5) brightness(1.2)' // Sword: HIGH contrast and brightness
                                : !activeQuestion && hoveredQuestion === 'prism'
                                    ? 'hue-rotate(15deg) saturate(1.5)' // Prism: STRONG chromatic shift
                                    : !activeQuestion && hoveredQuestion === 'resonator'
                                        ? 'brightness(1.15)' // Resonator: BRIGHT pulse
                                        : 'none',
                        transform: !activeQuestion && hoveredQuestion === 'resonator'
                            ? 'scale(1.03)' // Resonator: VISIBLE scale pulse
                            : 'scale(1)',
                    }}
                >
                    {Object.entries(ORIENTATION_QUESTIONS).map(([key, question]) => {
                        const isActive = activeQuestion === key;
                        const isHovered = hoveredQuestion === key;
                        const isDimmed = activeQuestion && !isActive;
                        const modeColor = CODEX_MODES[key]?.color || 'rgba(255,255,255,0.7)';

                        return (
                            <button
                                key={key}
                                onClick={() => handleQuestionClick(key)}
                                onMouseEnter={() => setHoveredQuestion(key)}
                                onMouseLeave={() => setHoveredQuestion(null)}
                                className="w-full text-center transition-all duration-400 py-2 px-4 rounded-lg"
                                style={{
                                    opacity: isDimmed ? 0.2 : 1,
                                    transform: isActive ? 'scale(1.02)' : isHovered ? 'scale(1.01)' : 'scale(1)',
                                    filter: isDimmed ? 'blur(1px)' : 'none',
                                    background: isActive
                                        ? `linear-gradient(135deg, ${modeColor}12, ${modeColor}06)`
                                        : isHovered
                                            ? 'rgba(255, 255, 255, 0.02)'
                                            : 'transparent',
                                    border: isActive
                                        ? `1px solid ${modeColor}40`
                                        : '1px solid transparent',
                                    boxShadow: isActive
                                        ? `0 0 25px ${modeColor}20`
                                        : isHovered
                                            ? `0 0 15px ${modeColor}10`
                                            : 'none',
                                }}
                            >
                                <p
                                    style={{
                                        fontFamily: "var(--font-body)",
                                        fontSize: isActive ? '18px' : '16px',
                                        fontWeight: 500,
                                        letterSpacing: '0.01em',
                                        lineHeight: 1.35,
                                        color: isActive
                                            ? modeColor
                                            : isHovered
                                                ? 'rgba(253, 251, 245, 0.8)'
                                                : 'rgba(253, 251, 245, 0.65)',
                                        textShadow: isActive
                                            ? `0 0 15px ${modeColor}30`
                                            : 'none',
                                        transition: 'all 0.3s ease-out',
                                    }}
                                >
                                    {question.line1}<br />
                                    {question.line2}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Mode totem removed - now using corner icons instead */}

                {/* Instruction after selection */}
                {activeQuestion && (
                    <>
                        <p
                            className="mt-3 text-center"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                letterSpacing: "var(--tracking-mythic)",
                                fontSize: '9px',
                                letterSpacing: '0.08em',
                                color: CODEX_MODES[activeQuestion]?.color || 'rgba(253, 251, 245, 0.4)',
                                opacity: 0.5,
                            }}
                        >
                            Let this guide what you notice.
                        </p>

                        {/* Diagnostic reminder - appears below instruction */}
                        <p
                            className="mt-2 text-center"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                letterSpacing: "var(--tracking-mythic)",
                                fontSize: '8px',
                                letterSpacing: '0.12em',
                                color: 'rgba(253, 251, 245, 0.3)',
                                fontStyle: 'italic',
                            }}
                        >
                            (This reflects what's active now — not what you are.)
                        </p>
                    </>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                CARD GRID — Always visible, but dormant until awakened
                Cards show as face-down backs until a question is selected
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="pb-6 pt-2">
                {/* Divider */}
                <div
                    className="mx-auto mb-4"
                    style={{
                        width: '40px',
                        height: '1px',
                        background: activeQuestion
                            ? `linear-gradient(90deg, transparent, ${CODEX_MODES[activeQuestion]?.color || 'rgba(250, 208, 120, 0.3)'}40, transparent)`
                            : 'linear-gradient(90deg, transparent, rgba(250, 208, 120, 0.15), transparent)',
                    }}
                />

                {/* Pagination arrows + Card Grid */}
                <div className="relative">
                    {currentPage > 0 && isAwakened && (
                        <button
                            onClick={handlePrevPage}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-all"
                            style={{ fontSize: '14px' }}
                        >
                            ←
                        </button>
                    )}

                    {currentPage < totalPages - 1 && isAwakened && (
                        <button
                            onClick={handleNextPage}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-all"
                            style={{ fontSize: '14px' }}
                        >
                            →
                        </button>
                    )}

                    <div
                        className="grid gap-3 mx-6"
                        style={{
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gridTemplateRows: 'repeat(3, auto)',
                        }}
                    >
                        {paginatedCards.map(card => {
                            const isHighlighted = highlightedCardIds.has(card.id);

                            return (
                                <DormantCard
                                    key={card.id}
                                    card={card}
                                    isAwakened={isAwakened}
                                    isHighlighted={isHighlighted}
                                    expandedCard={expandedCard}
                                    setExpandedCard={setExpandedCard}
                                    onNavigate={onNavigate}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Page indicator - only when awakened */}
                {totalPages > 1 && isAwakened && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setCurrentPage(idx); setExpandedCard(null); }}
                                className="w-1.5 h-1.5 rounded-full transition-all"
                                style={{
                                    backgroundColor: idx === currentPage
                                        ? CODEX_MODES[activeQuestion]?.color || 'rgba(250, 208, 120, 0.8)'
                                        : 'rgba(255, 255, 255, 0.15)',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>


            {/* ═══════════════════════════════════════════════════════════════════
                EXIT — Reduced contrast
                ═══════════════════════════════════════════════════════════════════ */}
            {onClose && (
                <div className="text-center pb-4">
                    <button
                        onClick={onClose}
                        className="transition-colors hover:text-white/40"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            letterSpacing: "var(--tracking-mythic)",
                            fontSize: '9px',
                            letterSpacing: '0.1em',
                            color: 'rgba(253, 251, 245, 0.2)',
                        }}
                    >
                        ← return
                    </button>
                </div>
            )}
        </div>
    );
}
