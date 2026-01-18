// src/components/VisualizationConfig.jsx
// Config panel for Visualization practice

import React, { useState } from 'react';
import { CycleRingControl } from './CycleRingControl.jsx';

export function VisualizationConfig({
    geometry,
    setGeometry,
    fadeInDuration,
    setFadeInDuration,
    displayDuration,
    setDisplayDuration,
    fadeOutDuration,
    setFadeOutDuration,
    voidDuration,
    setVoidDuration,
    duration,
    setDuration,
    audioEnabled,
    setAudioEnabled,
    isLight = false,
}) {
    // Basic shapes
    const BASIC_GEOMETRIES = ['enso', 'circle', 'triangle', 'square'];
    // Sacred/Spiritual symbols (SVG files)
    const RELIGIOUS_GEOMETRIES = ['mandala', 'sri-yantra', 'wheel-of-dharma', 'buddha', 'cross', 'yin-yang', 'zen-stones'];
    const DURATIONS = [5, 10, 15, 20];

    const totalCycleDuration = fadeInDuration + displayDuration + fadeOutDuration + voidDuration;

    // Local UI toggles
    const [showAllSymbols, setShowAllSymbols] = useState(false);
    const [showPhaseEditor, setShowPhaseEditor] = useState(false);

    return (
        <div className="space-y-6">
            {/* Geometry Selector */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3 text-[var(--accent-60)] font-bold"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Shapes
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4 min-w-0">
                    {BASIC_GEOMETRIES.map((g) => (
                        <button
                            key={g}
                            onClick={() => setGeometry(g)}
                            className={`
                w-full px-3 py-2 rounded-xl text-xs transition-all text-center min-h-[44px] leading-tight whitespace-normal min-w-0
                ${geometry === g
                                    ? 'border-[var(--accent-40)] bg-[var(--accent-10)] text-[var(--text-primary)]'
                                    : 'border-[var(--accent-15)] text-[var(--text-secondary)] hover:border-[var(--accent-25)] hover:bg-[var(--accent-10)]'
                                }
              `}
                            style={{
                                border: geometry === g ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                letterSpacing: '0.05em'
                            }}
                        >
                            <span className="min-w-0 break-words whitespace-normal">{g.toUpperCase()}</span>
                        </button>
                    ))}
                </div>

                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3 text-[var(--accent-60)] font-bold mt-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Sacred Symbols
                </div>
                <div className="grid grid-cols-2 gap-2 min-w-0">
                    {(showAllSymbols ? RELIGIOUS_GEOMETRIES : RELIGIOUS_GEOMETRIES.slice(0, 4)).map((g) => (
                        <button
                            key={g}
                            onClick={() => setGeometry(g)}
                            className={`
                w-full px-3 py-2 rounded-xl text-xs transition-all text-center min-h-[44px] leading-tight whitespace-normal min-w-0
                ${geometry === g
                                    ? 'border-[var(--accent-40)] bg-[var(--accent-10)] text-[var(--text-primary)]'
                                    : 'border-[var(--accent-15)] text-[var(--text-secondary)] hover:border-[var(--accent-25)] hover:bg-[var(--accent-10)]'
                                }
              `}
                            style={{
                                border: geometry === g ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 600,
                                letterSpacing: '0.02em',
                            }}
                        >
                            <span className="min-w-0 break-words whitespace-normal">{g.replace(/-/g, ' ').toUpperCase()}</span>
                        </button>
                    ))}
                </div>

                {/* More/Less toggle */}
                <div className="mt-2">
                    <button
                        onClick={() => setShowAllSymbols(v => !v)}
                        className="w-full px-3 py-2 rounded-xl text-xs transition-all text-center min-h-[40px] leading-tight whitespace-normal min-w-0"
                        style={{
                            border: '1px solid var(--accent-25)',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            letterSpacing: '0.1em'
                        }}
                    >
                        {showAllSymbols ? 'LESS' : 'MORE'}
                    </button>
                </div>
            </div>

            {/* Timing Controls - Cycle Ring */}
            <div className="min-w-0">
                {/* Toggle row button */}
                <button
                    onClick={() => setShowPhaseEditor(v => !v)}
                    className="w-full px-3 py-2 rounded-xl text-xs transition-all text-center min-h-[44px] leading-tight whitespace-normal min-w-0"
                    style={{
                        border: '1px solid var(--accent-25)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        letterSpacing: '0.1em'
                    }}
                >
                    PHASE DURATIONS (Advanced)
                </button>

                {showPhaseEditor && (
                    <div className="mt-3 min-w-0">
                        <div className="mx-auto w-[180px] max-w-full">
                            <CycleRingControl
                                fadeInDuration={fadeInDuration}
                                setFadeInDuration={setFadeInDuration}
                                displayDuration={displayDuration}
                                setDisplayDuration={setDisplayDuration}
                                fadeOutDuration={fadeOutDuration}
                                setFadeOutDuration={setFadeOutDuration}
                                voidDuration={voidDuration}
                                setVoidDuration={setVoidDuration}
                                isLight={isLight}
                                size={180}
                                showLegend={false}
                            />
                        </div>

                        {/* 2x2 compact controls */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {[
                                { key: 'fadeIn', label: 'IN', value: fadeInDuration, set: setFadeInDuration, min: 1, max: 5 },
                                { key: 'display', label: 'HOLD', value: displayDuration, set: setDisplayDuration, min: 1, max: 30 },
                                { key: 'fadeOut', label: 'OUT', value: fadeOutDuration, set: setFadeOutDuration, min: 1, max: 5 },
                                { key: 'void', label: 'VOID', value: voidDuration, set: setVoidDuration, min: 1, max: 30 },
                            ].map((p) => (
                                <div key={p.key} className="flex items-center justify-between px-2 py-1 rounded-xl" style={{ border: '1px solid var(--accent-20)' }}>
                                    <span className="text-[10px] uppercase tracking-wider leading-tight">{p.label}</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => p.set(Math.max(p.min, p.value - 1))}
                                            className="w-5 h-5 rounded-full text-xs flex items-center justify-center"
                                            style={{
                                                background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(255,255,255,0.1)',
                                                color: isLight ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)',
                                                border: isLight ? '1px solid var(--light-border)' : '1px solid rgba(255,255,255,0.15)'
                                            }}
                                            disabled={p.value <= p.min}
                                        >
                                            −
                                        </button>
                                        <span className="text-xs text-[var(--accent-color)] w-6 text-center font-bold">{p.value}</span>
                                        <button
                                            onClick={() => p.set(Math.min(p.max, p.value + 1))}
                                            className="w-5 h-5 rounded-full text-xs flex items-center justify-center"
                                            style={{
                                                background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(255,255,255,0.1)',
                                                color: isLight ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)',
                                                border: isLight ? '1px solid var(--light-border)' : '1px solid rgba(255,255,255,0.15)'
                                            }}
                                            disabled={p.value >= p.max}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Audio Toggle */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3 text-[var(--accent-60)] font-bold"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Audio Cues
                </div>
                <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                        border: audioEnabled ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                        background: audioEnabled ? 'var(--accent-10)' : 'transparent',
                        color: audioEnabled ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                >
                    {audioEnabled ? 'ON' : 'OFF'}
                </button>
            </div>
        </div>
    );
}
