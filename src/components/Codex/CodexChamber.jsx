// src/components/Codex/CodexChamber.jsx
// Main container for the Codex system - Grid layout with header
import React, { useState } from 'react';
import { codexCards, CODEX_MODES } from './codexCards.js';
import { CodexTablet } from './CodexTablet.jsx';

export function CodexChamber({ onClose }) {
    const [activeMode, setActiveMode] = useState('all');
    const [expandedCard, setExpandedCard] = useState(null);
    const [focusedCard, setFocusedCard] = useState(null);

    // Filter cards by mode
    const filteredCards = activeMode === 'all'
        ? codexCards
        : codexCards.filter(c => c.mode === activeMode);

    // On mount or mode change, randomly focus one card (oracle effect)
    React.useEffect(() => {
        if (filteredCards.length > 0) {
            const randomIndex = Math.floor(Math.random() * filteredCards.length);
            setFocusedCard(filteredCards[randomIndex].id);
        }
    }, [activeMode, filteredCards.length]);

    const handleToggleCard = (cardId) => {
        setExpandedCard(expandedCard === cardId ? null : cardId);
        setFocusedCard(cardId); // Focus the card when clicked
    };

    return (
        <div className="codex-chamber w-full">

            {/* Glowing Orb Header Region */}
            <div className="codex-header-region relative flex flex-col items-center py-8 mb-4">
                {/* Ambient glow */}
                <div
                    className="absolute"
                    style={{
                        width: '200px',
                        height: '200px',
                        top: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'radial-gradient(ellipse 100% 100% at center, rgba(250, 208, 120, 0.25) 0%, transparent 70%)',
                        filter: 'blur(30px)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Central orb */}
                <div
                    className="relative z-10"
                    style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse at 30% 30%, rgba(255, 220, 140, 0.9) 0%, rgba(250, 180, 80, 0.6) 40%, rgba(200, 120, 40, 0.3) 70%, transparent 100%)',
                        boxShadow: `
              0 0 40px rgba(250, 208, 120, 0.4),
              0 0 80px rgba(250, 180, 80, 0.2),
              inset 0 0 20px rgba(255, 255, 255, 0.1)
            `,
                    }}
                />

                {/* Sacred geometry rings around orb */}
                <svg
                    className="absolute z-0"
                    width="160"
                    height="160"
                    viewBox="0 0 160 160"
                    style={{ top: '-40px' }}
                >
                    <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(250, 208, 120, 0.2)" strokeWidth="0.5" />
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(250, 208, 120, 0.15)" strokeWidth="0.5" />
                    {/* Cardinal points */}
                    <path d="M80 10 L80 20" stroke="rgba(250, 208, 120, 0.3)" strokeWidth="1" />
                    <path d="M80 140 L80 150" stroke="rgba(250, 208, 120, 0.3)" strokeWidth="1" />
                    <path d="M10 80 L20 80" stroke="rgba(250, 208, 120, 0.3)" strokeWidth="1" />
                    <path d="M140 80 L150 80" stroke="rgba(250, 208, 120, 0.3)" strokeWidth="1" />
                    {/* Diagonal diamonds */}
                    <path d="M35 35 L40 40" stroke="rgba(250, 208, 120, 0.2)" strokeWidth="0.5" />
                    <path d="M125 35 L120 40" stroke="rgba(250, 208, 120, 0.2)" strokeWidth="0.5" />
                    <path d="M35 125 L40 120" stroke="rgba(250, 208, 120, 0.2)" strokeWidth="0.5" />
                    <path d="M125 125 L120 120" stroke="rgba(250, 208, 120, 0.2)" strokeWidth="0.5" />
                </svg>
            </div>

            {/* Mode Filter Bar */}
            <div className="filter-bar flex items-center justify-center gap-6 mb-4">
                {Object.entries(CODEX_MODES).map(([key, mode]) => (
                    <button
                        key={key}
                        onClick={() => setActiveMode(activeMode === key ? 'all' : key)}
                        className="filter-btn flex items-center gap-1.5 transition-all"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '10px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: activeMode === key ? mode.color : 'rgba(253, 251, 245, 0.4)',
                            opacity: activeMode === key ? 1 : 0.7,
                        }}
                    >
                        <span style={{ fontSize: '8px' }}>◇</span>
                        {mode.label}
                    </button>
                ))}
            </div>


            {/* Title */}
            <div className="text-center mb-6">
                <h2
                    className="codex-title uppercase tracking-[0.3em]"
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '11px',
                        color: 'rgba(253, 251, 245, 0.5)',
                        marginBottom: '4px',
                    }}
                >
                    The
                </h2>
                <h1
                    className="codex-main-title uppercase tracking-[0.2em]"
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '32px',
                        fontWeight: 400,
                        color: '#F5D18A',
                        textShadow: `
              0 0 30px rgba(250, 208, 120, 0.3),
              0 2px 4px rgba(0, 0, 0, 0.5)
            `,
                    }}
                >
                    Codex
                </h1>
                {/* Instructional text - oracle framing */}
                <p
                    className="mt-3"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontSize: '12px',
                        fontStyle: 'italic',
                        color: 'rgba(253, 251, 245, 0.35)',
                        lineHeight: 1.5,
                    }}
                >
                    You don't need to read all of these.<br />Let one stop you.
                </p>
            </div>

            {/* Card Grid - 2 columns on mobile, up to 5 on desktop */}
            <div
                className="card-grid grid gap-4"
                style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                }}
            >
                {filteredCards.map(card => (
                    <CodexTablet
                        key={card.id}
                        card={card}
                        isExpanded={expandedCard === card.id}
                        isFocused={focusedCard === card.id}
                        isDimmed={focusedCard !== null && focusedCard !== card.id}
                        onToggle={() => handleToggleCard(card.id)}
                    />
                ))}
            </div>

            {/* Empty state */}
            {filteredCards.length === 0 && (
                <div
                    className="text-center py-12"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: 'italic',
                        color: 'rgba(253, 251, 245, 0.4)',
                    }}
                >
                    No cards in this mode yet.
                </div>
            )}

            {/* Close button at bottom */}
            {onClose && (
                <div className="text-center mt-8">
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white/70 transition-colors text-xs uppercase tracking-wider"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                        ← Back to Paths
                    </button>
                </div>
            )}
        </div>
    );
}
