// src/components/wisdom/BigFiveAssessment.jsx
// TIPI (Ten Item Personality Inventory) assessment for Big Five personality traits
// Based on Gosling, Rentfrow, & Swann (2003) - validated 10-item measure

import React, { useState } from 'react';
import { useWaveStore } from '../../state/waveStore.js';

// TIPI Items (public domain alternative to copyrighted measures)
// Each item: text, dimension, reversed (whether to reverse score)
const TIPI_ITEMS = [
    { id: 1, text: 'Extraverted, enthusiastic', dimension: 'extraversion', reversed: false },
    { id: 2, text: 'Critical, quarrelsome', dimension: 'agreeableness', reversed: true },
    { id: 3, text: 'Dependable, self-disciplined', dimension: 'conscientiousness', reversed: false },
    { id: 4, text: 'Anxious, easily upset', dimension: 'neuroticism', reversed: false },
    { id: 5, text: 'Open to new experiences, complex', dimension: 'openness', reversed: false },
    { id: 6, text: 'Reserved, quiet', dimension: 'extraversion', reversed: true },
    { id: 7, text: 'Sympathetic, warm', dimension: 'agreeableness', reversed: false },
    { id: 8, text: 'Disorganized, careless', dimension: 'conscientiousness', reversed: true },
    { id: 9, text: 'Calm, emotionally stable', dimension: 'neuroticism', reversed: true },
    { id: 10, text: 'Conventional, uncreative', dimension: 'openness', reversed: true },
];

// 7-point Likert scale
const SCALE_OPTIONS = [
    { value: 1, label: 'Disagree strongly' },
    { value: 2, label: 'Disagree moderately' },
    { value: 3, label: 'Disagree a little' },
    { value: 4, label: 'Neither agree nor disagree' },
    { value: 5, label: 'Agree a little' },
    { value: 6, label: 'Agree moderately' },
    { value: 7, label: 'Agree strongly' },
];

// Calculate Big Five scores from responses
function calculateScores(responses) {
    const dimensions = {
        extraversion: [],
        agreeableness: [],
        conscientiousness: [],
        neuroticism: [],
        openness: [],
    };

    TIPI_ITEMS.forEach(item => {
        const response = responses[item.id];
        if (response !== undefined) {
            // Reverse score if needed (8 - response for 7-point scale)
            const score = item.reversed ? (8 - response) : response;
            dimensions[item.dimension].push(score);
        }
    });

    // Average each dimension and normalize to 0-1
    const scores = {};
    for (const [dim, values] of Object.entries(dimensions)) {
        if (values.length > 0) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            scores[dim] = (avg - 1) / 6; // Normalize from 1-7 to 0-1
        } else {
            scores[dim] = 0.5; // Default for missing data during live update
        }
    }

    return scores;
}

export function BigFiveAssessment({ onComplete, onCancel, onUpdate }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [scores, setScores] = useState(null);

    const setBigFive = useWaveStore(state => state.setBigFive);
    const getTraitSummary = useWaveStore(state => state.getTraitSummary);

    const currentItem = TIPI_ITEMS[currentIndex];
    const progress = Object.keys(responses).length / TIPI_ITEMS.length;
    const isComplete = Object.keys(responses).length === TIPI_ITEMS.length;

    const handleResponse = (value) => {
        const newResponses = { ...responses, [currentItem.id]: value };
        setResponses(newResponses);

        // Calculate live scores and notify parent
        const liveScores = calculateScores(newResponses);
        onUpdate?.(liveScores);

        // Auto-advance after slight delay
        setTimeout(() => {
            if (currentIndex < TIPI_ITEMS.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        }, 150);
    };

    const handleFinish = () => {
        const calculated = calculateScores(responses);
        setScores(calculated);
        setBigFive(calculated, 'tipi-10');
        setShowResults(true);
    };

    const handleDone = () => {
        onComplete?.();
    };

    // Results view
    if (showResults && scores) {
        const traits = getTraitSummary();

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="text-2xl mb-2">✦</div>
                    <h3
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-mythic)',
                            color: 'var(--accent-color)'
                        }}
                    >
                        Wave Function Established
                    </h3>
                    <p style={{ color: 'rgba(253,251,245,0.6)', fontSize: '13px' }}>
                        Your personality profile is now available for Four Modes guidance
                    </p>
                </div>

                {/* Score bars */}
                <div className="space-y-4">
                    {Object.entries(scores).map(([dimension, value]) => (
                        <div key={dimension}>
                            <div className="flex justify-between text-[11px] uppercase tracking-wider mb-1">
                                <span style={{ color: 'var(--accent-color)' }}>
                                    {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
                                </span>
                                <span style={{ color: 'rgba(253,251,245,0.5)' }}>
                                    {(value * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div
                                className="h-2 rounded-full overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.1)' }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${value * 100}%`,
                                        background: 'linear-gradient(90deg, var(--accent-40), var(--accent-color))',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trait summary */}
                {traits && traits.length > 0 && (
                    <div
                        className="p-4 rounded-xl"
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--accent-20)',
                        }}
                    >
                        <div
                            className="text-[10px] uppercase tracking-wider mb-2"
                            style={{ color: 'var(--accent-color)' }}
                        >
                            Your Profile
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {traits.map((trait, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 rounded-full text-[11px]"
                                    style={{
                                        background: 'var(--accent-10)',
                                        color: 'rgba(253,251,245,0.8)',
                                    }}
                                >
                                    {trait}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reliability note */}
                <div
                    className="text-center text-[11px] italic"
                    style={{ color: 'rgba(253,251,245,0.4)' }}
                >
                    This is a brief assessment. Take the full 44-item version for higher accuracy.
                </div>

                {/* Done button */}
                <button
                    onClick={handleDone}
                    className="w-full py-3 rounded-full text-[13px] uppercase tracking-wider transition-all"
                    style={{
                        background: 'var(--ui-button-gradient)',
                        color: 'rgba(0,0,0,0.9)',
                        fontWeight: 600,
                    }}
                >
                    Continue
                </button>
            </div>
        );
    }

    // Assessment view
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h3
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'var(--accent-color)'
                    }}
                >
                    Wave Function Setup
                </h3>
                <p style={{ color: 'rgba(253,251,245,0.5)', fontSize: '12px' }}>
                    Rate how well each pair describes you
                </p>
            </div>

            {/* Progress bar */}
            <div className="relative">
                <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${progress * 100}%`,
                            background: 'var(--accent-color)',
                        }}
                    />
                </div>
                <div
                    className="text-[10px] mt-1 text-right"
                    style={{ color: 'rgba(253,251,245,0.4)' }}
                >
                    {currentIndex + 1} of {TIPI_ITEMS.length}
                </div>
            </div>

            {/* Current item */}
            <div className="text-center py-4">
                <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: 'rgba(253,251,245,0.5)' }}>
                    I see myself as:
                </div>
                <div
                    className="text-[18px] font-medium"
                    style={{
                        fontFamily: 'var(--font-body)',
                        color: 'rgba(253,251,245,0.95)',
                    }}
                >
                    {currentItem.text}
                </div>
            </div>

            {/* Response options */}
            <div className="space-y-2">
                {SCALE_OPTIONS.map(option => {
                    const isSelected = responses[currentItem.id] === option.value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => handleResponse(option.value)}
                            className="w-full py-3 px-4 rounded-xl text-[13px] transition-all text-left flex items-center justify-between"
                            style={{
                                background: isSelected ? 'var(--accent-20)' : 'rgba(0,0,0,0.2)',
                                border: isSelected ? '1px solid var(--accent-40)' : '1px solid var(--accent-10)',
                                color: isSelected ? 'var(--accent-color)' : 'rgba(253,251,245,0.7)',
                            }}
                        >
                            <span>{option.label}</span>
                            <span style={{ opacity: 0.5 }}>{option.value}</span>
                        </button>
                    );
                })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
                <button
                    onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                    className="px-4 py-2 rounded-full text-[12px] transition-all"
                    style={{
                        opacity: currentIndex > 0 ? 1 : 0.3,
                        border: '1px solid var(--accent-20)',
                        color: 'rgba(253,251,245,0.6)',
                    }}
                    disabled={currentIndex === 0}
                >
                    ← Back
                </button>

                {isComplete ? (
                    <button
                        onClick={handleFinish}
                        className="px-6 py-2 rounded-full text-[12px] uppercase tracking-wider transition-all"
                        style={{
                            background: 'var(--ui-button-gradient)',
                            color: 'rgba(0,0,0,0.9)',
                            fontWeight: 600,
                        }}
                    >
                        View Results
                    </button>
                ) : (
                    <button
                        onClick={() => currentIndex < TIPI_ITEMS.length - 1 && setCurrentIndex(currentIndex + 1)}
                        className="px-4 py-2 rounded-full text-[12px] transition-all"
                        style={{
                            opacity: currentIndex < TIPI_ITEMS.length - 1 ? 1 : 0.3,
                            border: '1px solid var(--accent-20)',
                            color: 'rgba(253,251,245,0.6)',
                        }}
                        disabled={currentIndex === TIPI_ITEMS.length - 1}
                    >
                        Skip →
                    </button>
                )}
            </div>

            {/* Cancel option */}
            {onCancel && (
                <div className="text-center">
                    <button
                        onClick={onCancel}
                        className="text-[11px] uppercase tracking-wider transition-all"
                        style={{ color: 'rgba(253,251,245,0.3)' }}
                    >
                        Cancel Assessment
                    </button>
                </div>
            )}
        </div>
    );
}
