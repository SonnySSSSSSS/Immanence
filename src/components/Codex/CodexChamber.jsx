// src/components/Codex/CodexChamber.jsx
// Compass - Orientation chamber with questions as center of gravity
// Option 3: Card backs present but dormant until question selected
import React, { useState, useMemo } from 'react';
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
function DormantCard({ isAwakened = false, isHighlighted = false, onClick, card, expandedCard, setExpandedCard }) {
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

export function CodexChamber({ onClose }) {
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
        <div className="compass-chamber w-full flex flex-col">

            {/* ═══════════════════════════════════════════════════════════════════
                COMPASS HEADER — Minimal, faded
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="text-center pt-4 pb-2">
                <h1
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '14px',
                        fontWeight: 300,
                        letterSpacing: '0.3em',
                        color: 'rgba(245, 209, 138, 0.3)',
                        textTransform: 'uppercase',
                    }}
                >
                    Compass
                </h1>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                CENTER OF GRAVITY — The Four Questions
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="px-6 py-4">

                {/* Permission language — above questions */}
                <p
                    className="mb-4 text-center"
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        color: 'rgba(253, 251, 245, 0.3)',
                    }}
                >
                    You don't have to be sure. Notice what pulls at you.
                </p>

                {/* The Questions — Large, interactive anchors */}
                <div className="w-full max-w-md mx-auto space-y-4">
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
                                        fontFamily: "'Crimson Pro', serif",
                                        fontSize: isActive ? '18px' : '16px',
                                        fontWeight: 400,
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

                {/* Mode totem (appears when selected) */}
                {activeQuestion && (
                    <div className="flex justify-center mt-4 opacity-40 transition-opacity duration-500">
                        <img
                            src={`${import.meta.env.BASE_URL}codex/${activeQuestion}.png`}
                            alt=""
                            style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'contain',
                                filter: `drop-shadow(0 0 15px ${CODEX_MODES[activeQuestion]?.color || 'rgba(250, 208, 120, 0.5)'})`,
                            }}
                        />
                    </div>
                )}

                {/* Instruction after selection */}
                {activeQuestion && (
                    <p
                        className="mt-3 text-center"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '9px',
                            letterSpacing: '0.08em',
                            color: CODEX_MODES[activeQuestion]?.color || 'rgba(253, 251, 245, 0.4)',
                            opacity: 0.5,
                        }}
                    >
                        Let this guide what you notice.
                    </p>
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
                            fontFamily: "'Outfit', sans-serif",
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
