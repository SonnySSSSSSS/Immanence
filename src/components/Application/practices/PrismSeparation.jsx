// src/components/Application/practices/PrismSeparation.jsx
// Prism Mode: Separation - Distinguish fact from narrative
// IE v1 Spec: Display locked Mirror, log interpretations, categorize as Supported/Unsupported

import React, { useState } from 'react';
import { useChainStore } from '../../../state/chainStore.js';

// Interpretation categories
const INTERPRETATION_CATEGORIES = [
    { id: 'future_prediction', label: 'Future Prediction', example: '"This will..." or "They will..."' },
    { id: 'causality', label: 'Assumed Causality', example: '"Because of..." or "This caused..."' },
    { id: 'narrative_self', label: 'Narrative About Self', example: '"I always..." or "I\'m the kind of..."' },
    { id: 'narrative_other', label: 'Narrative About Other', example: '"They\'re..." or "He/She is..."' },
    { id: 'judgment', label: 'Value Judgment', example: '"That was wrong..." or "It\'s unfair..."' },
    { id: 'other', label: 'Other', example: 'Doesn\'t fit above categories' },
];

export function PrismSeparation({ onComplete }) {
    const {
        activeChain,
        addInterpretation,
        updateInterpretation,
        lockPrism,
        skipPrism,
    } = useChainStore();

    const [phase, setPhase] = useState('list'); // list | categorize | summary
    const [currentInput, setCurrentInput] = useState('');
    const [currentInterpIdx, setCurrentInterpIdx] = useState(0);

    const prismData = activeChain?.prism || {};
    const mirrorData = activeChain?.mirror || {};
    const interpretations = prismData.interpretations || [];

    // Add new interpretation
    const handleAdd = () => {
        if (currentInput.trim()) {
            addInterpretation(currentInput.trim());
            setCurrentInput('');
        }
    };

    // Move to categorization phase
    const handleStartCategorize = () => {
        if (interpretations.length > 0) {
            setCurrentInterpIdx(0);
            setPhase('categorize');
        }
    };

    // Set support status for current interpretation
    const handleSetSupport = (isSupported) => {
        const interp = interpretations[currentInterpIdx];
        if (interp) {
            updateInterpretation(interp.id, { isSupported });

            // Move to next or summary
            if (currentInterpIdx < interpretations.length - 1) {
                setCurrentInterpIdx(currentInterpIdx + 1);
            } else {
                setPhase('summary');
            }
        }
    };

    // Set category for current interpretation
    const handleSetCategory = (category) => {
        const interp = interpretations[currentInterpIdx];
        if (interp) {
            updateInterpretation(interp.id, { category });
        }
    };

    // Handle lock
    const handleLock = () => {
        try {
            lockPrism();
        } catch (err) {
            console.error('Error locking prism:', err);
        }
        onComplete?.();
    };

    // Handle skip
    const handleSkip = () => {
        skipPrism();
        onComplete?.();
    };

    // Calculate stats
    const supportedCount = interpretations.filter(i => i.isSupported === true).length;
    const unsupportedCount = interpretations.filter(i => i.isSupported === false).length;
    const categorizedCount = interpretations.filter(i => i.isSupported !== null).length;
    const total = interpretations.length;
    const supportedRatio = total > 0 ? Math.round((supportedCount / total) * 100) : 0;

    // ══════════════════════════════════════════════════════════════════
    // PHASE 1: List Interpretations
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'list') {
        return (
            <div className="flex flex-col h-full px-6 py-4 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2 text-center"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Prism — Step 1 of 2
                </p>

                {/* Locked Mirror Anchor */}
                <div
                    className="mb-4 p-3 rounded-lg"
                    style={{
                        background: 'rgba(147, 197, 253, 0.1)',
                        border: '1px solid rgba(147, 197, 253, 0.2)',
                    }}
                >
                    <p className="text-xs text-blue-300/60 mb-1">Locked Observation:</p>
                    <p
                        className="text-sm"
                        style={{
                            fontFamily: "'Crimson Pro', serif",
                            color: 'rgba(255,255,255,0.85)',
                        }}
                    >
                        "{mirrorData.neutralSentence}"
                    </p>
                </div>

                <h2
                    className="text-base mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    What thoughts arise about this?
                </h2>
                <p
                    className="text-xs mb-4 text-center"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    List the interpretations, predictions, and stories your mind generates.
                </p>

                {/* Interpretation list */}
                <div className="flex-1 mb-4 space-y-2 overflow-y-auto max-h-40">
                    {interpretations.map((interp, idx) => (
                        <div
                            key={interp.id}
                            className="px-3 py-2 rounded text-sm"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.8)',
                            }}
                        >
                            {idx + 1}. "{interp.text}"
                        </div>
                    ))}
                </div>

                {/* Add input */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="E.g., 'I am going to be fired'"
                        className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400/50"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 rounded bg-white/10 text-white/60 hover:text-white transition-all text-sm"
                    >
                        Add
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={handleSkip}
                        className="px-4 py-2 rounded border border-white/20 text-white/40 hover:text-white/60 transition-all text-xs"
                    >
                        SKIP PRISM
                    </button>
                    <button
                        onClick={handleStartCategorize}
                        disabled={interpretations.length === 0}
                        className="px-6 py-2 rounded border transition-all"
                        style={{
                            borderColor: interpretations.length > 0
                                ? 'rgba(251, 191, 36, 0.5)'
                                : 'rgba(255,255,255,0.2)',
                            color: interpretations.length > 0
                                ? 'rgba(251, 191, 36, 0.9)'
                                : 'rgba(255,255,255,0.4)',
                        }}
                    >
                        CATEGORIZE ({interpretations.length})
                    </button>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2: Categorize (Supported/Unsupported)
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'categorize') {
        const currentInterp = interpretations[currentInterpIdx];

        return (
            <div className="flex flex-col items-center h-full px-6 py-4 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Prism — {currentInterpIdx + 1} of {interpretations.length}
                </p>

                {/* Mirror anchor (compact) */}
                <div
                    className="w-full max-w-md mb-4 p-2 rounded text-xs"
                    style={{
                        background: 'rgba(147, 197, 253, 0.08)',
                        border: '1px solid rgba(147, 197, 253, 0.15)',
                        color: 'rgba(147, 197, 253, 0.7)',
                    }}
                >
                    Mirror: "{mirrorData.neutralSentence}"
                </div>

                {/* The interpretation */}
                <div
                    className="w-full max-w-md mb-4 p-4 rounded-lg"
                    style={{
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                    }}
                >
                    <p
                        className="text-center"
                        style={{
                            fontFamily: "'Crimson Pro', serif",
                            fontSize: '16px',
                            color: 'rgba(255,255,255,0.95)',
                        }}
                    >
                        "{currentInterp?.text}"
                    </p>
                </div>

                {/* The question */}
                <h2
                    className="text-base mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    Does the Mirror text prove this?
                </h2>
                <p
                    className="text-xs mb-6 text-center max-w-sm"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    Supported = the exact words in the observation prove it explicitly.
                    <br />
                    Unsupported = it's an assumption, prediction, or added story.
                </p>

                {/* Supported / Unsupported buttons */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => handleSetSupport(true)}
                        className="px-6 py-3 rounded-lg border transition-all hover:scale-105"
                        style={{
                            borderColor: 'rgba(34, 197, 94, 0.5)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: 'rgba(34, 197, 94, 0.9)',
                        }}
                    >
                        ✓ SUPPORTED
                    </button>
                    <button
                        onClick={() => handleSetSupport(false)}
                        className="px-6 py-3 rounded-lg border transition-all hover:scale-105"
                        style={{
                            borderColor: 'rgba(239, 68, 68, 0.5)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'rgba(239, 68, 68, 0.9)',
                        }}
                    >
                        ✕ UNSUPPORTED
                    </button>
                </div>

                {/* Category selector (optional refinement) */}
                <div className="w-full max-w-md">
                    <p className="text-xs text-white/40 mb-2 text-center">Category (optional):</p>
                    <div className="grid grid-cols-3 gap-2">
                        {INTERPRETATION_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleSetCategory(cat.id)}
                                className="px-2 py-1.5 rounded text-xs transition-all"
                                style={{
                                    background: currentInterp?.category === cat.id
                                        ? 'rgba(251, 191, 36, 0.2)'
                                        : 'rgba(255,255,255,0.05)',
                                    color: currentInterp?.category === cat.id
                                        ? 'rgba(251, 191, 36, 0.9)'
                                        : 'rgba(255,255,255,0.5)',
                                    border: `1px solid ${currentInterp?.category === cat.id ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                                }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 3: Summary
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'summary') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-4 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Prism — Summary
                </p>

                <h2
                    className="text-lg mb-6 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    Separation Complete
                </h2>

                {/* Stats */}
                <div className="flex gap-8 mb-6">
                    <div className="text-center">
                        <div
                            className="text-3xl mb-1"
                            style={{ color: 'rgba(34, 197, 94, 0.9)' }}
                        >
                            {supportedCount}
                        </div>
                        <div className="text-xs text-white/50">Supported</div>
                    </div>
                    <div className="text-center">
                        <div
                            className="text-3xl mb-1"
                            style={{ color: 'rgba(239, 68, 68, 0.9)' }}
                        >
                            {unsupportedCount}
                        </div>
                        <div className="text-xs text-white/50">Unsupported</div>
                    </div>
                </div>

                {/* Ratio bar */}
                <div
                    className="w-full max-w-sm h-2 rounded-full mb-2 overflow-hidden"
                    style={{ background: 'rgba(239, 68, 68, 0.3)' }}
                >
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${supportedRatio}%`,
                            background: 'rgba(34, 197, 94, 0.7)',
                        }}
                    />
                </div>
                <p className="text-xs text-white/50 mb-6">
                    {supportedRatio}% of interpretations were supported by evidence
                </p>

                {/* Interpretation breakdown */}
                <div className="w-full max-w-sm space-y-2 mb-6 max-h-32 overflow-y-auto">
                    {interpretations.map((interp, idx) => (
                        <div
                            key={interp.id}
                            className="flex items-center gap-2 text-xs"
                        >
                            <span
                                style={{
                                    color: interp.isSupported
                                        ? 'rgba(34, 197, 94, 0.8)'
                                        : 'rgba(239, 68, 68, 0.8)',
                                }}
                            >
                                {interp.isSupported ? '✓' : '✕'}
                            </span>
                            <span
                                className="truncate"
                                style={{ color: 'rgba(255,255,255,0.6)' }}
                            >
                                "{interp.text}"
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleLock}
                    className="px-6 py-2 rounded border transition-all"
                    style={{
                        borderColor: 'rgba(251, 191, 36, 0.7)',
                        color: 'rgba(251, 191, 36, 1)',
                        background: 'rgba(251, 191, 36, 0.15)',
                    }}
                >
                    LOCK PRISM
                </button>
            </div>
        );
    }

    return null;
}
