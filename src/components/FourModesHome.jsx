// src/components/FourModesHome.jsx
// The Immanence Chain - Linear progression: Mirror → Prism → Wave → Sword

import React from 'react';
import { FOUR_MODES } from '../data/fourModes.js';
import { useChainStore } from '../state/chainStore.js';

// Image filename mapping (wave uses resonator until new image created)
const MODE_IMAGE_MAP = {
    mirror: 'mode-mirror.png',
    prism: 'mode-prism.png',
    wave: 'mode-resonator.png', // TODO: Generate mode-wave.png
    sword: 'mode-sword.png',
};

function ModeCard({ mode, onEnter, isLocked, isComplete }) {
    return (
        <button
            className="relative w-full rounded-2xl text-left transition-all overflow-hidden group"
            style={{
                aspectRatio: '16 / 10',
                border: `1px solid ${isLocked ? 'rgba(255, 220, 120, 0.05)' : 'rgba(255, 220, 120, 0.12)'}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                cursor: isLocked ? 'not-allowed' : 'pointer',
            }}
            onClick={() => !isLocked && onEnter(mode.id)}
            onMouseEnter={(e) => {
                if (isLocked) return;
                e.currentTarget.style.boxShadow = '0 12px 44px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 220, 120, 0.08)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(255, 220, 120, 0.25)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isLocked ? 'rgba(255, 220, 120, 0.05)' : 'rgba(255, 220, 120, 0.12)';
            }}
            disabled={isLocked}
        >
            {/* Field background - THE CONTENT, not an overlay */}
            <img
                src={`${import.meta.env.BASE_URL}modes/${MODE_IMAGE_MAP[mode.id]}`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{
                    opacity: isLocked ? 0.3 : 0.9,
                    filter: isLocked ? 'grayscale(0.5)' : 'none',
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
                    className="mt-2 text-[9px] uppercase tracking-[0.12em] transition-opacity"
                    style={{
                        color: isLocked ? 'rgba(255, 255, 255, 0.2)' : 'rgba(253, 251, 245, 0.6)',
                        opacity: isLocked ? 0.5 : 0.4,
                    }}
                >
                    {isLocked ? '🔒 Locked' : isComplete ? '✓ Complete' : 'Enter →'}
                </div>
            </div>
        </button>
    );
}

export function FourModesHome({ onSelectMode }) {
    const { activeChain, isModeAccessible, startNewChain } = useChainStore();

    const handleStartChain = () => {
        startNewChain();
    };

    const handleEnterMode = (modeId) => {
        // Start chain if none active and entering Mirror
        if (!activeChain && modeId === 'mirror') {
            startNewChain();
        }
        onSelectMode(modeId);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2
                    className="text-[14px] uppercase tracking-[0.2em] mb-2"
                    style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-color)' }}
                >
                    The Immanence Chain
                </h2>
                <p
                    className="text-[12px] italic"
                    style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.6)' }}
                >
                    Observation → Separation → Capacity → Commitment
                </p>
            </div>

            {/* Chain Progress Indicator */}
            {activeChain && (
                <div className="flex justify-center gap-2 items-center">
                    {FOUR_MODES.map((mode, idx) => {
                        const isComplete = activeChain[mode.id]?.locked || activeChain[mode.id]?.skipped || activeChain[mode.id]?.aborted;
                        const isCurrent = isModeAccessible(mode.id);
                        return (
                            <React.Fragment key={mode.id}>
                                <div
                                    className="w-2 h-2 rounded-full transition-all"
                                    style={{
                                        background: isComplete
                                            ? 'var(--accent-color)'
                                            : isCurrent
                                                ? 'rgba(255, 220, 120, 0.5)'
                                                : 'rgba(255, 255, 255, 0.1)',
                                    }}
                                />
                                {idx < 3 && (
                                    <div
                                        className="w-6 h-px"
                                        style={{ background: isComplete ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* Start New Chain Button (when no active chain) */}
            {!activeChain && (
                <div className="flex justify-center">
                    <button
                        onClick={handleStartChain}
                        className="px-6 py-2 rounded-full border transition-all hover:scale-105"
                        style={{
                            borderColor: 'var(--accent-color)',
                            color: 'var(--accent-color)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '11px',
                            letterSpacing: '0.1em',
                        }}
                    >
                        START NEW CHAIN
                    </button>
                </div>
            )}

            {/* Mode Cards Grid - 2 columns */}
            <div className="grid grid-cols-2 gap-4">
                {FOUR_MODES.map((mode) => {
                    const isAccessible = isModeAccessible(mode.id);
                    const isComplete = activeChain?.[mode.id]?.locked || activeChain?.[mode.id]?.skipped || activeChain?.[mode.id]?.aborted;
                    const isLocked = activeChain && !isAccessible && !isComplete;

                    return (
                        <ModeCard
                            key={mode.id}
                            mode={mode}
                            onEnter={handleEnterMode}
                            isLocked={isLocked}
                            isComplete={isComplete}
                        />
                    );
                })}
            </div>
        </div>
    );
}
