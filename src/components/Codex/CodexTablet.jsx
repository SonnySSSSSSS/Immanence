// src/components/Codex/CodexTablet.jsx
// Individual card component for the Codex system - Grid card style
import React from 'react';
import { CODEX_MODES } from './codexCards.js';

// Mode geometry SVG icons
const ModeIcon = ({ mode }) => {
    const modeData = CODEX_MODES[mode] || CODEX_MODES.mirror;

    // Diamond frame with mode-specific inner geometry
    return (
        <svg width="48" height="48" viewBox="0 0 48 48" className="mode-icon">
            {/* Outer diamond frame */}
            <path
                d="M24 4 L44 24 L24 44 L4 24 Z"
                fill="none"
                stroke={modeData.color}
                strokeWidth="1"
                opacity="0.6"
            />
            {/* Inner diamond */}
            <path
                d="M24 12 L36 24 L24 36 L12 24 Z"
                fill="none"
                stroke={modeData.color}
                strokeWidth="0.5"
                opacity="0.4"
            />
            {/* Mode-specific center symbol */}
            {mode === 'mirror' && (
                <>
                    {/* Vertical reflection line */}
                    <line x1="24" y1="16" x2="24" y2="32" stroke={modeData.color} strokeWidth="1" opacity="0.8" />
                    <circle cx="24" cy="24" r="3" fill="none" stroke={modeData.color} strokeWidth="0.5" opacity="0.6" />
                </>
            )}
            {mode === 'resonator' && (
                <>
                    {/* Concentric circles */}
                    <circle cx="24" cy="24" r="4" fill="none" stroke={modeData.color} strokeWidth="0.5" opacity="0.8" />
                    <circle cx="24" cy="24" r="7" fill="none" stroke={modeData.color} strokeWidth="0.5" opacity="0.5" />
                </>
            )}
            {mode === 'prism' && (
                <>
                    {/* Triangle */}
                    <path d="M24 17 L31 31 L17 31 Z" fill="none" stroke={modeData.color} strokeWidth="0.75" opacity="0.8" />
                </>
            )}
            {mode === 'sword' && (
                <>
                    {/* Cross / sword shape */}
                    <line x1="24" y1="16" x2="24" y2="32" stroke={modeData.color} strokeWidth="1" opacity="0.8" />
                    <line x1="18" y1="20" x2="30" y2="20" stroke={modeData.color} strokeWidth="0.75" opacity="0.6" />
                </>
            )}
        </svg>
    );
};

export function CodexTablet({ card, isExpanded = false, isFocused = false, isDimmed = false, isHighlighted = false, onToggle }) {
    const mode = CODEX_MODES[card.mode] || CODEX_MODES.mirror;

    return (
        <div
            className="codex-tablet cursor-pointer flex flex-col"
            onClick={onToggle}
            style={{
                background: 'linear-gradient(180deg, rgba(18, 14, 28, 0.7) 0%, rgba(12, 8, 18, 0.85) 100%)',
                border: `1px solid ${isHighlighted ? 'rgba(250, 208, 120, 0.6)' : isFocused ? 'rgba(250, 208, 120, 0.4)' : 'rgba(250, 208, 120, 0.25)'}`,
                borderRadius: '8px',
                padding: '16px 12px',
                minHeight: '220px',
                opacity: isDimmed ? 0.35 : 1,
                filter: isDimmed ? 'blur(0.5px)' : 'none',
                transform: isFocused || isHighlighted ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.4s ease-out',
                position: 'relative',
                zIndex: isFocused || isHighlighted ? 10 : 1,
                boxShadow: isHighlighted
                    ? '0 0 20px rgba(250, 208, 120, 0.3), 0 0 40px rgba(250, 208, 120, 0.15)'
                    : 'none',
            }}
        >
            {/* Mode Icon */}
            <div className="flex justify-center mb-3">
                <ModeIcon mode={card.mode} />
            </div>

            {/* Punchline (Title) */}
            <p
                className="punchline text-center mb-2"
                style={{
                    fontFamily: "'Crimson Pro', 'Cormorant Garamond', serif",
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#F5D18A',
                    lineHeight: 1.35,
                }}
            >
                {card.punchline}
            </p>

            {/* Body text - always visible but truncated */}
            <p
                className="body text-center flex-1"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: '11px',
                    color: 'rgba(253, 251, 245, 0.5)',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                    display: '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'unset' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: isExpanded ? 'visible' : 'hidden',
                }}
            >
                {card.body}
            </p>

            {/* CTA */}
            <div className="mt-auto pt-3">
                <p
                    className="cta text-center"
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '10px',
                        color: mode.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        opacity: 0.8,
                    }}
                >
                    Begin practice
                </p>
            </div>
        </div>
    );
}
