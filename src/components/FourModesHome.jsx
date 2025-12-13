// src/components/FourModesHome.jsx
// Four Modes home screen - Field-based cards matching HUB grammar

import React from 'react';
import { FOUR_MODES } from '../data/fourModes.js';

function ModeCard({ mode, onEnter }) {
    return (
        <button
            className="relative w-full rounded-2xl text-left transition-all overflow-hidden group"
            style={{
                aspectRatio: '16 / 10',
                border: '1px solid rgba(255, 220, 120, 0.12)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            }}
            onClick={() => onEnter(mode.id)}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 44px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 220, 120, 0.08)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(255, 220, 120, 0.25)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 220, 120, 0.12)';
            }}
        >
            {/* Field background - THE CONTENT, not an overlay */}
            <img
                src={`${import.meta.env.BASE_URL}modes/mode-${mode.id}.png`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{
                    opacity: 0.9,
                }}
            />

            {/* Subtle vignette for text legibility */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 120% 120% at 50% 40%, transparent 30%, rgba(0, 0, 0, 0.4) 100%)',
                }}
            />

            {/* Text container - bottom left, minimal */}
            <div
                className="absolute bottom-0 left-0 right-0 p-5"
                style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%)',
                }}
            >
                {/* Name */}
                <h3
                    className="text-[15px] font-semibold uppercase tracking-[0.08em] mb-1"
                    style={{
                        fontFamily: 'Cinzel, serif',
                        color: 'var(--accent-color)',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                    }}
                >
                    {mode.name}
                </h3>

                {/* Tagline */}
                <p
                    className="text-[11px]"
                    style={{
                        fontFamily: 'Crimson Pro, serif',
                        color: 'rgba(253, 251, 245, 0.7)',
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
                    }}
                >
                    {mode.tagline}
                </p>

                {/* Enter CTA - very subtle */}
                <div
                    className="mt-2 text-[9px] uppercase tracking-[0.12em] opacity-40 group-hover:opacity-80 transition-opacity"
                    style={{
                        color: 'rgba(253, 251, 245, 0.6)',
                    }}
                >
                    Enter →
                </div>
            </div>
        </button>
    );
}

export function FourModesHome({ onSelectMode }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2
                    className="text-[14px] uppercase tracking-[0.2em] mb-2"
                    style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-color)' }}
                >
                    Four Modes of Participation
                </h2>
                <p
                    className="text-[12px] italic"
                    style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.6)' }}
                >
                    A way to see <em>how</em> you show up.
                </p>
            </div>

            {/* Mode Cards Grid - 2 columns like HUB */}
            <div className="grid grid-cols-2 gap-4">
                {FOUR_MODES.map((mode) => (
                    <ModeCard
                        key={mode.id}
                        mode={mode}
                        onEnter={onSelectMode}
                    />
                ))}
            </div>
        </div>
    );
}
