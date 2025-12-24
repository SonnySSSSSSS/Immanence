// src/components/HubStagePanel.jsx
// Status & Control Instrument — INSCRIPTION AESTHETIC
// Typographic hierarchy, no layering, all content within spine

import React from 'react';
import { VacationToggle } from './VacationToggle.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function HubStagePanel({
    stage,
    path,
    showCore,
    attention,
    lastPracticed,
    streakInfo,
    onOpenHardwareGuide,
    onOpenHonorLog,
}) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // Color tokens
    const textPrimary = isLight ? 'rgba(45, 40, 35, 0.95)' : 'rgba(253, 251, 245, 0.92)';
    const textSecondary = isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253, 251, 245, 0.5)';
    const textMuted = isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253, 251, 245, 0.3)';
    const dividerColor = isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(253, 251, 245, 0.1)';
    const accentColor = isLight ? 'var(--light-accent)' : 'var(--accent-color)';

    return (
        <div className="w-full flex flex-col items-center px-4">

            {/* ══════════════════════════════════════════════════════════════════
                STAGE NAME — Large, spaced, calm (The Inscription)
               ══════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col items-center gap-1 mb-3">
                {/* Stage Title Image */}
                <img
                    src={`${import.meta.env.BASE_URL}titles/stage-${stage?.toLowerCase()}.png`}
                    alt={stage}
                    className="h-10 w-auto object-contain"
                    style={{ filter: isLight ? 'none' : 'brightness(1.1)' }}
                />

                {/* Path (if set) - ghosted subordinate */}
                {path && !showCore && (
                    <div
                        className="text-[11px] uppercase tracking-[0.3em]"
                        style={{ color: textSecondary, fontFamily: 'var(--font-display)' }}
                    >
                        {path} Path
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                SUBTLE DIVIDER — Rune-like ornament
               ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-px" style={{ background: dividerColor }} />
                <div
                    className="w-1.5 h-1.5 rotate-45 border"
                    style={{ borderColor: accentColor, opacity: 0.4 }}
                />
                <div className="w-8 h-px" style={{ background: dividerColor }} />
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                METADATA ROW — Quieter, smaller, rhythmic
               ══════════════════════════════════════════════════════════════════ */}
            <div
                className="text-[11px] mb-4"
                style={{
                    color: textMuted,
                    fontFamily: 'serif',
                    fontStyle: 'italic',
                    letterSpacing: '0.02em',
                }}
            >
                Last practiced {lastPracticed}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ACTIONS ROW — Compact, horizontal, pill-style
               ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
                {/* Streak Pill */}
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                        background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${dividerColor}`,
                    }}
                >
                    <span className="text-[11px]" style={{ opacity: 0.6 }}>📅</span>
                    <span
                        className="text-[13px] font-semibold"
                        style={{ color: textPrimary, fontFamily: 'var(--font-display)' }}
                    >
                        {streakInfo.current}
                    </span>
                    <span
                        className="text-[9px] uppercase tracking-wider"
                        style={{ color: textSecondary }}
                    >
                        days
                    </span>
                </div>

                {/* Honor Button */}
                <button
                    onClick={onOpenHonorLog}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                    style={{
                        background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${dividerColor}`,
                        color: textSecondary,
                        fontFamily: 'var(--font-display)',
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                    }}
                >
                    <span style={{ opacity: 0.7 }}>⭐</span>
                    <span>HONOR</span>
                </button>

                {/* Vacation Toggle */}
                <VacationToggle compact />
            </div>

            {/* Attention Vector (if active) */}
            {attention && attention !== 'none' && (
                <div
                    className="mt-4 text-[10px] uppercase tracking-[0.5em] font-medium"
                    style={{
                        color: '#4ade80',
                        fontFamily: 'var(--font-display)',
                    }}
                >
                    {attention}
                </div>
            )}
        </div>
    );
}
