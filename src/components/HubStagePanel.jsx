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
    const stageKey = (stage || 'flame').toLowerCase();
    const auroraAsset = `aurora_${stageKey}.png`;

    // Color tokens
    const textPrimary = isLight ? 'rgba(45, 40, 35, 0.98)' : 'rgba(253, 251, 245, 1)';
    const textSecondary = isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253, 251, 245, 0.85)';
    const textMuted = isLight ? 'rgba(90, 77, 60, 0.45)' : 'rgba(253, 251, 245, 0.35)';
    const dividerColor = isLight ? 'rgba(180, 155, 110, 0.25)' : 'rgba(253, 251, 245, 0.15)';
    const accentColor = isLight ? 'var(--light-accent)' : 'var(--accent-color)';

    return (
        <div className="w-full flex flex-col items-center px-4 relative" style={{ maxWidth: '430px' }}>
            {/* Global Aurora "Crown" for Stage Title Backdrop (Light Mode) */}
            {isLight && !hideStageTitle && (
                <div
                    className="absolute inset-x-0 -top-24 pointer-events-none z-0"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/${auroraAsset})`,
                        backgroundSize: '150% auto',
                        backgroundPosition: 'top center',
                        height: '240px',
                        opacity: 0.5,
                        mixBlendMode: 'multiply',
                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 95%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 95%)',
                    }}
                />
            )}
            {/* ══════════════════════════════════════════════════════════════════
                STAGE NAME — Shared ceremonial inscription
               ══════════════════════════════════════════════════════════════════ */}
            {!hideStageTitle && (
                <div className="-mt-16 mb-1.5 relative overflow-visible z-10">
                    <StageTitle
                        stage={stage}
                        path={path}
                        attention={attention}
                        showWelcome={false}
                    />
                </div>
            )}


            {/* ══════════════════════════════════════════════════════════════════
                Tracking content starts immediately after stage title
               ══════════════════════════════════════════════════════════════════ */}

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
