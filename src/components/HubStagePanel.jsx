// src/components/HubStagePanel.jsx
// Status & Control Instrument — 3D LAYERED COMPOSITION
// Matches reference: Single backboard slab + prominently overlapping identity plate

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

    // ──────────────────────────────────────────────────────────────────────────
    // MATERIAL DEFINITIONS (Instrument Logic)
    // ──────────────────────────────────────────────────────────────────────────

    // 1. Backboard Slab Styles (Subordinate base)
    const slabStyle = {
        background: isLight
            ? 'linear-gradient(180deg, rgba(255, 252, 245, 0.7) 0%, rgba(255, 250, 240, 0.75) 100%)'
            : 'linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.15) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: isLight ? '1px solid rgba(180, 155, 110, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: isLight
            ? '0 4px 12px rgba(100, 80, 50, 0.04)'
            : '0 8px 24px rgba(0, 0, 0, 0.2)',
    };

    // 2. Identity Plate Styles (Dominant overlap)
    const plateStyle = {
        background: isLight
            ? 'linear-gradient(180deg, rgba(255, 252, 245, 0.98) 0%, rgba(255, 250, 240, 1) 100%)'
            : 'linear-gradient(180deg, rgba(20, 20, 20, 0.8) 0%, rgba(10, 10, 10, 0.85) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isLight ? '1.5px solid rgba(180, 155, 110, 0.3)' : '1.5px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isLight
            ? '0 12px 32px rgba(100, 80, 50, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            : '0 16px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    };

    // Texture for slab wings
    const slabTexture = {
        background: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0, 0, 0, 0.01) 3px, rgba(0, 0, 0, 0.01) 6px)`,
        opacity: 0.4,
    };

    return (
        <div className="relative w-full mx-auto">

            {/* ══════════════════════════════════════════════════════════════════
                LAYER 1: BACKBOARD SLAB (The Chassis)
               ══════════════════════════════════════════════════════════════════ */}
            <div
                className="relative w-full rounded-2xl flex items-stretch min-h-[110px] overflow-hidden"
                style={slabStyle}
            >
                {/* Visual texture for the slab wings */}
                <div className="absolute inset-0 pointer-events-none" style={slabTexture} />

                {/* LEFT WING: Progress Label + Actions (Integrated/Etched) - Hidden on mobile */}
                <div className="relative z-10 hidden sm:flex flex-1 min-w-0 flex-col justify-center px-4 sm:px-6 gap-2 opacity-80">
                    <div
                        className="text-[9px] uppercase tracking-[0.2em]"
                        style={{
                            color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253, 251, 245, 0.5)',
                            fontFamily: 'var(--font-display)',
                        }}
                    >
                        Your Progress
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenHonorLog}
                            className="px-3 py-1.5 rounded-full text-[9px] bg-white/40 border border-black/5 hover:bg-white/70 transition-all font-medium"
                            style={{ color: 'rgba(90, 77, 60, 0.8)' }}
                        >
                            + HONOR
                        </button>
                        <div className="w-7 h-7 rounded-full bg-white/40 border border-black/5 flex items-center justify-center text-[10px]">
                            ⭐
                        </div>
                        <VacationToggle compact />
                    </div>
                </div>

                {/* CENTER VOID (Reserved for overlapping plate) */}
                <div className="flex-1 pointer-events-none" />

                {/* RIGHT WING: Streak (Integrated/Etched) - Hidden on mobile */}
                <div className="relative z-10 hidden sm:flex flex-1 min-w-0 items-center justify-end px-4 sm:px-6 gap-4 opacity-80">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] opacity-60">📅</span>
                            <span className="text-xl font-bold tracking-tighter" style={{ color: isLight ? 'rgba(0,0,0,0.7)' : 'white' }}>
                                {streakInfo.current}
                            </span>
                            <span className="text-[10px] font-bold opacity-40">DAYS</span>
                            <span className="text-[10px] opacity-40">›</span>
                        </div>
                        <div className="mt-1 h-[26px] px-3 rounded-full border border-black/5 bg-white/30 flex items-center justify-center">
                            <span className="text-[11px] font-bold opacity-60">{streakInfo.current} DAYS</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                LAYER 2: IDENTITY PLATE (The Floating Instrument)
               ══════════════════════════════════════════════════════════════════ */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[90%] max-w-[300px] h-[150px] rounded-2xl flex flex-col items-center justify-center pointer-events-auto"
                style={plateStyle}
            >
                {/* Stage Title - Larger/Dominant */}
                <img
                    src={`${import.meta.env.BASE_URL}titles/stage-${stage?.toLowerCase()}.png`}
                    alt={stage}
                    className="h-11 w-auto object-contain filter drop-shadow-sm mb-1"
                />

                {/* Path Script - Ghosted Subordinate */}
                {path && (
                    <img
                        src={`${import.meta.env.BASE_URL}titles/path-${path?.toLowerCase()}.png`}
                        alt={path}
                        className="h-8 w-auto object-contain filter brightness-110 opacity-60 mb-1"
                    />
                )}

                {/* Central Hardware Markers */}
                <div className="flex items-center gap-3 opacity-30 my-1">
                    <div className="w-1.5 h-1.5 border border-[#4ade80] rotate-45" />
                    <div className="w-1.5 h-1.5 border border-[#4ade80] rotate-45" />
                </div>

                {/* Attention Vector */}
                {attention && attention !== 'none' && (
                    <div
                        className="text-[10px] uppercase tracking-[0.8em] font-bold"
                        style={{ color: '#4ade80', opacity: 1, textShadow: '0 0 10px rgba(74, 222, 128, 0.3)' }}
                    >
                        {attention}
                    </div>
                )}

                {/* Last practiced (Small Footer) */}
                <div
                    className="absolute bottom-3 text-[11px]"
                    style={{
                        color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(253, 251, 245, 0.35)',
                        fontFamily: 'serif',
                        fontStyle: 'italic'
                    }}
                >
                    Last practiced {lastPracticed}
                </div>

                {/* Corner Decorative Nodes (Subtle bolted feel) */}
                <div className="absolute top-2 left-2 w-1 h-1 rounded-full bg-amber-500/20 shadow-[0_0_4px_rgba(245,158,11,0.2)]" />
                <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-amber-500/20 shadow-[0_0_4px_rgba(245,158,11,0.2)]" />
                <div className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-amber-500/20 shadow-[0_0_4px_rgba(245,158,11,0.2)]" />
                <div className="absolute bottom-2 right-2 w-1 h-1 rounded-full bg-amber-500/20 shadow-[0_0_4px_rgba(245,158,11,0.2)]" />
            </div>
        </div>
    );
}
