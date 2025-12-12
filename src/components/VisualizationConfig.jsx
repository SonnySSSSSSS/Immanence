// src/components/VisualizationConfig.jsx
// Config panel for Visualization practice

import React from 'react';

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
                    className="text-[10px] uppercase tracking-[0.2em] mb-3 text-[var(--accent-60)]"
                    style={{ fontFamily: 'Cinzel, serif' }}
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
                                    ? 'border-[var(--accent-40)] bg-[var(--accent-10)] text-[rgba(253,251,245,0.9)]'
                                    : 'border-[var(--accent-15)] text-[rgba(253,251,245,0.6)] hover:border-[var(--accent-25)] hover:bg-[var(--accent-10)]'
                                }
              `}
                            style={{
                                border: geometry === g ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                                fontFamily: 'Cinzel, serif',
                            }}
                        >
                            {g.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div
                    className="text-[10px] uppercase tracking-[0.2em] mb-3 text-[var(--accent-60)]"
                    style={{ fontFamily: 'Cinzel, serif' }}
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
                                    ? 'border-[var(--accent-40)] bg-[var(--accent-10)] text-[rgba(253,251,245,0.9)]'
                                    : 'border-[var(--accent-15)] text-[rgba(253,251,245,0.6)] hover:border-[var(--accent-25)] hover:bg-[var(--accent-10)]'
                                }
              `}
                            style={{
                                border: geometry === g ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                                fontFamily: 'Cinzel, serif',
                            }}
                        >
                            {g.replace(/-/g, ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timing Controls */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.2em] mb-3 text-[var(--accent-60)]"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    Phase Durations
                </div>
                <div className="space-y-3">
                    {/* Fade In */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[rgba(253,251,245,0.7)]">Fade In</span>
                            <span className="text-xs text-[var(--accent-color)]">{fadeInDuration}s</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.5"
                            value={fadeInDuration}
                            onChange={(e) => setFadeInDuration(parseFloat(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${((fadeInDuration - 1) / 4) * 100}%, rgba(255,255,255,0.1) ${((fadeInDuration - 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
                            }}
                        />
                    </div>

                    {/* Display */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[rgba(253,251,245,0.7)]">Display</span>
                            <span className="text-xs text-[var(--accent-color)]">{displayDuration}s</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="30"
                            step="1"
                            value={displayDuration}
                            onChange={(e) => setDisplayDuration(parseInt(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${((displayDuration - 5) / 25) * 100}%, rgba(255,255,255,0.1) ${((displayDuration - 5) / 25) * 100}%, rgba(255,255,255,0.1) 100%)`,
                            }}
                        />
                    </div>

                    {/* Fade Out */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[rgba(253,251,245,0.7)]">Fade Out</span>
                            <span className="text-xs text-[var(--accent-color)]">{fadeOutDuration}s</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.5"
                            value={fadeOutDuration}
                            onChange={(e) => setFadeOutDuration(parseFloat(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${((fadeOutDuration - 1) / 4) * 100}%, rgba(255,255,255,0.1) ${((fadeOutDuration - 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
                            }}
                        />
                    </div>

                    {/* Void */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[rgba(253,251,245,0.7)]">Void</span>
                            <span className="text-xs text-[var(--accent-color)]">{voidDuration}s</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="30"
                            step="1"
                            value={voidDuration}
                            onChange={(e) => setVoidDuration(parseInt(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${((voidDuration - 5) / 25) * 100}%, rgba(255,255,255,0.1) ${((voidDuration - 5) / 25) * 100}%, rgba(255,255,255,0.1) 100%)`,
                            }}
                        />
                    </div>
                </div>

                <div className="mt-3 text-center text-xs text-[rgba(253,251,245,0.5)]">
                    Total Cycle: {totalCycleDuration}s
                </div>
            </div>

            {/* Audio Toggle */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.2em] mb-3 text-[var(--accent-60)]"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    Audio Cues
                </div>
                <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                        border: audioEnabled ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                        background: audioEnabled ? 'var(--accent-10)' : 'transparent',
                        color: audioEnabled ? 'rgba(253,251,245,0.9)' : 'rgba(253,251,245,0.6)',
                    }}
                >
                    {audioEnabled ? 'ON' : 'OFF'}
                </button>
            </div>
        </div>
    );
}
