// src/components/FourModesHome.jsx
// The Transmutation Chain - Horizontal progression: Mirror → Prism → Wave → Sword
// State of Matter metaphor: Solid → Refraction → Liquid → Fire

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FOUR_MODES } from '../data/fourModes.js';
import { useChainStore } from '../state/chainStore.js';

// Image filename mapping using existing mode images
const MODE_IMAGE_MAP = {
    mirror: 'mode-mirror.png',
    prism: 'mode-prism.png',
    wave: 'mode-resonator.png',
    sword: 'mode-sword.png',
};

// State metaphor labels
const STATE_METAPHOR = {
    mirror: { state: 'Solid', essence: 'Facts' },
    prism: { state: 'Refraction', essence: 'Story Breaking' },
    wave: { state: 'Liquid', essence: 'Feeling' },
    sword: { state: 'Fire', essence: 'Action' },
};

// Chain Node - Compact icon with hover expansion
function ChainNode({ mode, onEnter, isLocked, isComplete, isActive, onHover }) {
    const metaphor = STATE_METAPHOR[mode.id];

    return (
        <motion.button
            className="relative flex flex-col items-center group"
            onClick={() => !isLocked && onEnter(mode.id)}
            onMouseEnter={() => onHover(mode.id)}
            onMouseLeave={() => onHover(null)}
            disabled={isLocked}
            whileHover={!isLocked ? { scale: 1.08 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
        >
            {/* Icon Container */}
            <motion.div
                className="relative w-16 h-16 rounded-xl overflow-hidden"
                animate={{
                    opacity: isLocked ? 0.4 : isActive ? 1 : 0.85,
                    scale: isActive ? 1.1 : 1,
                }}
                style={{
                    border: `2px solid ${isComplete ? 'var(--accent-color)' : isLocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,220,120,0.3)'}`,
                    boxShadow: isActive
                        ? '0 0 25px rgba(255,220,120,0.4), 0 8px 24px rgba(0,0,0,0.5)'
                        : '0 4px 16px rgba(0,0,0,0.4)',
                }}
            >
                {/* Mode image */}
                <img
                    src={`${import.meta.env.BASE_URL}modes/${MODE_IMAGE_MAP[mode.id]}`}
                    alt={mode.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        filter: isLocked ? 'grayscale(0.7) brightness(0.5)' : 'none',
                    }}
                />

                {/* Complete overlay */}
                {isComplete && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-xl">✓</span>
                    </div>
                )}

                {/* Lock overlay */}
                {isLocked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-sm opacity-60">🔒</span>
                    </div>
                )}
            </motion.div>

            {/* Mode name - always visible */}
            <motion.span
                className="mt-2 text-[10px] uppercase tracking-widest"
                style={{
                    fontFamily: 'Cinzel, serif',
                    color: isActive ? 'var(--accent-color)' : isLocked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                }}
                animate={{ y: isActive ? -2 : 0 }}
            >
                {mode.name}
            </motion.span>

            {/* State metaphor - shows on hover */}
            <AnimatePresence>
                {isActive && (
                    <motion.span
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[9px] italic mt-0.5"
                        style={{
                            fontFamily: 'Crimson Pro, serif',
                            color: 'rgba(255,220,120,0.6)',
                        }}
                    >
                        {metaphor.state} · {metaphor.essence}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

// Connecting Thread between nodes
function ChainThread({ isComplete, isNext }) {
    return (
        <div className="flex-1 flex items-center justify-center px-1 h-16">
            {/* Thread line */}
            <motion.div
                className="w-full h-0.5 relative"
                style={{
                    background: isComplete
                        ? 'linear-gradient(90deg, var(--accent-color), var(--accent-70))'
                        : 'linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                    boxShadow: isComplete ? '0 0 8px var(--accent-40)' : 'none',
                }}
            >
                {/* Glow for next accessible */}
                {isNext && !isComplete && (
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                        }}
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,220,120,0.4), transparent)',
                        }}
                    />
                )}

                {/* Arrow indicator */}
                <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px]"
                    style={{ color: isComplete ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)' }}
                >
                    →
                </div>
            </motion.div>
        </div>
    );
}

export function FourModesHome({ onSelectMode }) {
    const { activeChain, isModeAccessible, startNewChain } = useChainStore();
    const [hoveredMode, setHoveredMode] = useState(null);

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
                    The Transmutation Chain
                </h2>
                <p
                    className="text-[11px] italic"
                    style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.5)' }}
                >
                    Observation → Separation → Capacity → Commitment
                </p>
            </div>

            {/* Start New Chain Button (when no active chain) */}
            {!activeChain && (
                <div className="flex justify-center">
                    <motion.button
                        onClick={handleStartChain}
                        className="px-6 py-2.5 rounded-full border transition-all"
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,220,120,0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            borderColor: 'var(--accent-color)',
                            color: 'var(--accent-color)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '12px',
                            letterSpacing: '0.1em',
                            background: 'rgba(255,220,120,0.05)',
                        }}
                    >
                        BEGIN THE CHAIN
                    </motion.button>
                </div>
            )}

            {/* The Chain - Horizontal Layout */}
            <div className="flex items-start justify-center gap-0 px-2 py-4">
                {FOUR_MODES.map((mode, idx) => {
                    const isAccessible = isModeAccessible(mode.id);
                    const isComplete = activeChain?.[mode.id]?.locked || activeChain?.[mode.id]?.skipped || activeChain?.[mode.id]?.aborted;
                    const isLocked = activeChain && !isAccessible && !isComplete;
                    const isActive = hoveredMode === mode.id;

                    // Check if next mode is accessible (for thread glow)
                    const nextMode = FOUR_MODES[idx + 1];
                    const isNextAccessible = nextMode ? isModeAccessible(nextMode.id) : false;

                    return (
                        <React.Fragment key={mode.id}>
                            <ChainNode
                                mode={mode}
                                onEnter={handleEnterMode}
                                isLocked={isLocked}
                                isComplete={isComplete}
                                isActive={isActive}
                                onHover={setHoveredMode}
                            />

                            {/* Thread between nodes */}
                            {idx < 3 && (
                                <ChainThread
                                    isComplete={isComplete}
                                    isNext={isNextAccessible && !isComplete}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Expanded Mode Detail - shows tagline on hover */}
            <AnimatePresence mode="wait">
                {hoveredMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-center px-4"
                    >
                        <p
                            className="text-[12px] italic max-w-sm mx-auto"
                            style={{
                                fontFamily: 'Crimson Pro, serif',
                                color: 'rgba(253,251,245,0.7)',
                            }}
                        >
                            {FOUR_MODES.find(m => m.id === hoveredMode)?.tagline}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chain Status Indicator */}
            {activeChain && (
                <div className="flex justify-center gap-1.5 items-center pt-2">
                    {FOUR_MODES.map((mode, idx) => {
                        const isComplete = activeChain[mode.id]?.locked || activeChain[mode.id]?.skipped || activeChain[mode.id]?.aborted;
                        const isCurrent = isModeAccessible(mode.id) && !isComplete;
                        return (
                            <React.Fragment key={mode.id}>
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full"
                                    animate={{
                                        scale: isCurrent ? [1, 1.3, 1] : 1,
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: isCurrent ? Infinity : 0,
                                    }}
                                    style={{
                                        background: isComplete
                                            ? 'var(--accent-color)'
                                            : isCurrent
                                                ? 'rgba(255, 220, 120, 0.7)'
                                                : 'rgba(255, 255, 255, 0.15)',
                                    }}
                                />
                                {idx < 3 && (
                                    <div
                                        className="w-4 h-px"
                                        style={{ background: isComplete ? 'var(--accent-50)' : 'rgba(255,255,255,0.1)' }}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
