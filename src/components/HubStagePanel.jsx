// src/components/HubStagePanel.jsx
// Status & Control Instrument — INSCRIPTION AESTHETIC
// Typographic hierarchy, no layering, all content within spine

import React from 'react';
import { VacationToggle } from './VacationToggle.jsx';
import { StageTitle } from './StageTitle.jsx';
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
    hideStageTitle = false,
}) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // Color tokens
    const textPrimary = isLight ? 'rgba(45, 40, 35, 0.98)' : 'rgba(253, 251, 245, 1)';
    const textSecondary = isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253, 251, 245, 0.85)';
    const textMuted = isLight ? 'rgba(90, 77, 60, 0.45)' : 'rgba(253, 251, 245, 0.35)';
    const dividerColor = isLight ? 'rgba(180, 155, 110, 0.25)' : 'rgba(253, 251, 245, 0.15)';
    const accentColor = isLight ? 'var(--light-accent)' : 'var(--accent-color)';

    return (
        <div className="w-full flex flex-col items-center px-4">

            {/* ══════════════════════════════════════════════════════════════════
                STAGE NAME — Shared ceremonial inscription
               ══════════════════════════════════════════════════════════════════ */}
            {!hideStageTitle && (
                <div className="-mt-16 mb-2 relative overflow-visible">
                    <StageTitle
                        stage={stage}
                        path={path}
                        attention={attention}
                        showWelcome={false}
                    />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                THE STRUCTURAL DIVIDE — Transition from Identity to Interaction
               ══════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col items-center gap-2 mb-4 w-full">
                <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${dividerColor})` }} />
                    <div
                        className="text-[9px] uppercase tracking-[0.25em] whitespace-nowrap opacity-60"
                        style={{ color: textSecondary, fontFamily: 'var(--font-ui)', fontWeight: 500 }}
                    >
                        ⟨ MEASUREMENT ⟩
                    </div>
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${dividerColor})` }} />
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                METADATA ROW — Quieter, smaller, rhythmic
               ══════════════════════════════════════════════════════════════════ */}
            <div
                className="text-[10px] mb-5 uppercase tracking-[0.1em] font-mono"
                style={{
                    color: textMuted,
                    letterSpacing: '0.05em',
                    opacity: 0.8
                }}
            >
                Last practiced: {lastPracticed}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ACTIONS ROW — Compact, horizontal, pill-style with shared atmosphere
               ══════════════════════════════════════════════════════════════════ */}
            <div
                className="relative flex items-center justify-center gap-2 flex-wrap py-2 px-6"
                style={{
                    overflow: 'visible'
                }}
            >
                {/* 
                    Shared atmospheric glow - Ultra-soft and diffuse
                    We use a separate div to avoid z-index clipping and allow for a larger radius 
                */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: '240%',
                        height: '300%',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: isLight
                            ? 'radial-gradient(ellipse at center, rgba(74, 222, 128, 0.04) 0%, transparent 70%)'
                            : 'radial-gradient(ellipse at center, rgba(74, 222, 128, 0.03) 0%, transparent 75%)',
                        filter: 'blur(80px)',
                        zIndex: -1,
                    }}
                />

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
                        className="text-[14px] font-black"
                        style={{
                            color: textPrimary,
                            fontFamily: 'var(--font-ui)',
                            letterSpacing: '-0.02em'
                        }}
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
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 active:scale-95"
                    style={{
                        background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${dividerColor}`,
                        color: textPrimary,
                        fontFamily: 'var(--font-ui)',
                        fontWeight: 800,
                        fontSize: '10px',
                        letterSpacing: '0.05em',
                    }}
                >
                    <span style={{ opacity: 0.9 }}>⭐</span>
                    <span>HONOR</span>
                </button>

                {/* Vacation Toggle */}
                <VacationToggle compact />
            </div>

            {/* Attention Vector (if active) — MEASURED READOUT */}
            {attention && attention !== 'none' && (
                <div
                    className="mt-6 text-[10px] uppercase tracking-[0.4em] font-mono font-medium border-t border-b py-1 px-4"
                    style={{
                        color: isLight ? 'rgba(20, 120, 60, 0.8)' : '#4ade80',
                        borderColor: dividerColor,
                        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                    }}
                >
                    {attention}
                </div>
            )}

            {/* metadata row moved below buttons for a cleaner instrument spine */}
        </div>
    );
}
