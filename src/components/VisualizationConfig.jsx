// src/components/VisualizationConfig.jsx
// Config panel for Visualization practice

import React from 'react';
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
                <div className="flex gap-2 mb-4">
                    {BASIC_GEOMETRIES.map((g) => (
                        <button
                            key={g}
                            onClick={() => setGeometry(g)}
                            className={`
                flex-1 px-3 py-2 rounded-xl text-xs transition-all
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
                            {g.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3 text-[var(--accent-60)] font-bold"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Sacred Symbols
                </div>
                <div className="flex flex-wrap gap-2">
                    {RELIGIOUS_GEOMETRIES.map((g, index) => (
                        <button
                            key={g}
                            onClick={() => setGeometry(g)}
                            className={`
                px-3 py-2 rounded-xl text-xs transition-all
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
                            {g.replace(/-/g, ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timing Controls - Cycle Ring */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3 text-[var(--accent-60)] font-bold"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Phase Durations
                </div>
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
                />
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
