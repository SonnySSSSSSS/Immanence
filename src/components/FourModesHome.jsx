// src/components/FourModesHome.jsx
// Four Modes home screen with mode selection cards

import React from 'react';
import { FOUR_MODES } from '../data/fourModes.js';

function ModeCard({ mode, onEnter }) {
    return (
        <button
            className="relative p-5 rounded-2xl border text-left transition-all overflow-hidden group"
            style={{
                background: 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                border: '1px solid var(--accent-20)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => onEnter(mode.id)}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px var(--accent-15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Background gradient */}
            <div
                className="absolute inset-0 pointer-events-none rounded-2xl opacity-60"
                style={{
                    background: 'radial-gradient(circle at top, rgba(255,220,120,0.05), transparent 60%)',
                }}
            />

            {/* Icon */}
            <div
                className="text-2xl mb-3 relative z-10"
                style={{ color: 'var(--accent-color)' }}
            >
                {mode.icon}
            </div>

            {/* Name */}
            <h3
                className="text-[14px] font-semibold uppercase tracking-[0.1em] mb-1 relative z-10"
                style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-color)' }}
            >
                {mode.name}
            </h3>

            {/* Tagline */}
            <p
                className="text-[12px] italic relative z-10"
                style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.7)' }}
            >
                "{mode.tagline}"
            </p>

            {/* Enter CTA */}
            <div
                className="mt-4 text-[10px] uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100 transition-opacity relative z-10"
                style={{ color: 'var(--accent-color)' }}
            >
                Enter →
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

            {/* Mode Cards Grid */}
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
