// src/components/SigilSlider.jsx
// Rune-based progress visualizer - shows journey through ritual steps
// Icons only mode - no text labels for cleaner aesthetic

import React from 'react';

// Runic/alchemical symbols for progress visualization
const SIGILS = ['☉', '☽', '☿', '♀', '♂', '♃', '♄']; // Planetary symbols
const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ']; // Elder Futhark
const ALCHEMICAL = ['🜁', '🜂', '🜃', '🜄', '🜔', '🜍', '🜎']; // Alchemical symbols

export function SigilSlider({
    progress = 0, // 0-1
    totalSteps = 4,
    currentStep = 0,
    variant = 'planetary', // 'planetary', 'runic', 'alchemical'
    stepNames = [],
}) {
    const symbols = variant === 'runic' ? RUNES : variant === 'alchemical' ? ALCHEMICAL : SIGILS;

    // Use totalSteps or symbols length, whichever is smaller
    const displaySymbols = symbols.slice(0, Math.min(totalSteps, symbols.length));

    return (
        <div className="w-full max-w-xs mx-auto">
            {/* The Track */}
            <div className="relative h-10 flex items-center">
                {/* Background track line */}
                <div
                    className="absolute left-4 right-4 h-[2px]"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, var(--accent-20) 10%, var(--accent-20) 90%, transparent 100%)',
                    }}
                />

                {/* Progress glow line */}
                <div
                    className="absolute left-4 h-[3px] transition-all duration-700 ease-out"
                    style={{
                        width: `calc(${(currentStep / Math.max(totalSteps - 1, 1)) * 100}% * 0.85)`,
                        background: 'linear-gradient(90deg, var(--accent-color) 0%, var(--accent-color) 80%, transparent 100%)',
                        boxShadow: '0 0 12px var(--accent-color), 0 0 24px var(--accent-50)',
                    }}
                />

                {/* Sigil markers - Icons Only */}
                <div className="relative w-full flex justify-between px-2">
                    {displaySymbols.map((sigil, i) => {
                        const isCompleted = i < currentStep;
                        const isCurrent = i === currentStep;
                        const isUpcoming = i > currentStep;

                        return (
                            <div
                                key={i}
                                className="flex flex-col items-center transition-all duration-500"
                                style={{
                                    transform: isCurrent ? 'scale(1.4)' : 'scale(1)',
                                }}
                            >
                                {/* The Sigil */}
                                <div
                                    className="relative transition-all duration-500"
                                    style={{
                                        fontFamily: 'Georgia, serif',
                                        fontSize: isCurrent ? '20px' : '16px',
                                        color: isCompleted
                                            ? '#fefce8' // Bright white-gold for completed
                                            : isCurrent
                                                ? 'var(--accent-color)' // Accent for current
                                                : 'var(--accent-30)', // Dim for upcoming
                                        textShadow: isCompleted
                                            ? '0 0 8px #fefce8, 0 0 16px var(--accent-color)'
                                            : isCurrent
                                                ? '0 0 12px var(--accent-color), 0 0 24px var(--accent-50)'
                                                : 'none',
                                        filter: isUpcoming ? 'saturate(0.3)' : 'none',
                                    }}
                                >
                                    {sigil}

                                    {/* Current step glow ring */}
                                    {isCurrent && (
                                        <div
                                            className="absolute inset-0 -m-3 rounded-full animate-pulse"
                                            style={{
                                                background: 'radial-gradient(circle, var(--accent-30) 0%, transparent 70%)',
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current step name - shows ONLY the active step name */}
            {stepNames[currentStep] && (
                <div
                    className="text-center mt-2"
                    style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '10px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--accent-color)',
                        textShadow: '0 0 10px var(--accent-30)',
                    }}
                >
                    {stepNames[currentStep]}
                </div>
            )}
        </div>
    );
}
