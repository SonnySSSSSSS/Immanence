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

export function CodexTablet({ card, isExpanded = false, isFocused = false, isDimmed = false, isHighlighted = false, onToggle, onNavigate }) {
    const mode = CODEX_MODES[card.mode] || CODEX_MODES.mirror;

    const handleBeginPractice = (e) => {
        e.stopPropagation(); // Prevent card toggle
        if (onNavigate) {
            onNavigate('application');
        }
    };

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
                    ? `0 0 30px 10px ${mode.color}20, inset 0 0 20px ${mode.color}10`
                    : isFocused
                        ? `0 0 20px 5px ${mode.color}15`
                        : 'none',
            }}
        >
            {/* Mode icon top center */}
            <div className="flex justify-center mb-3">
                <ModeIcon mode={card.mode} />
            </div>

            {/* Title */}
            <h3
                style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(253, 251, 245, 0.9)',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    marginBottom: '8px',
                }}
            >
                {card.title}
            </h3>

            {/* Body text - more visible when highlighted */}
            <p
                className="flex-1"
                style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: '11px',
                    fontStyle: 'italic',
                    color: isHighlighted ? 'rgba(253, 251, 245, 0.7)' : 'rgba(253, 251, 245, 0.5)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    transition: 'color 0.3s ease',
                }}
            >
                {card.body}
            </p>

            {/* CTA - Now a clickable button */}
            <div className="mt-auto pt-3">
                <button
                    onClick={handleBeginPractice}
                    className="w-full text-center hover:opacity-100 transition-opacity"
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '10px',
                        color: mode.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        opacity: 0.8,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Begin practice →
                </button>
            </div>
        </div>
    );
}
