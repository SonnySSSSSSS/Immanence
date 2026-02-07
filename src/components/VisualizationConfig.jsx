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
    audioEnabled,
    setAudioEnabled,
    isLight = false,
}) {
    // Basic shapes
    const BASIC_GEOMETRIES = ['enso', 'circle', 'triangle', 'square'];
    // Sacred/Spiritual symbols (SVG files)
    const RELIGIOUS_GEOMETRIES = ['mandala', 'sri-yantra', 'wheel-of-dharma', 'buddha', 'cross', 'yin-yang', 'zen-stones'];
    const DURATIONS = [5, 10, 15, 20];
    const OPTIONS = [...BASIC_GEOMETRIES, ...RELIGIOUS_GEOMETRIES];
    const RELIGIOUS_SVG_BY_KEY = {
        mandala: '/visualization/mandala.svg',
        'sri-yantra': '/visualization/sri-yantra.svg',
        'wheel-of-dharma': '/visualization/wheel-of-dharma.svg',
        buddha: '/visualization/the-great-buddha-of-kamakura.svg',
        cross: '/visualization/cross-2.svg',
        'yin-yang': '/visualization/yin-yang.svg',
        'zen-stones': '/visualization/zen-stones.svg',
    };

    const rawIndex = OPTIONS.indexOf(geometry);
    const currentIndex = rawIndex >= 0 ? rawIndex : 0;

    // Local UI toggles
    const [showPhaseEditor, setShowPhaseEditor] = useState(false);

    return (
        <div className="space-y-6">
            {/* Geometry Selector */}
            <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <button
                        onClick={() => setGeometry(OPTIONS[(currentIndex - 1 + OPTIONS.length) % OPTIONS.length])}
                        className="w-10 h-10 rounded-xl text-sm flex items-center justify-center"
                        style={{
                            border: '1px solid var(--accent-25)',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            letterSpacing: '0.05em'
                        }}
                        aria-label="Previous geometry"
                    >
                        ◀
                    </button>
                    <div className="flex flex-col items-center min-w-0">
                        <div
                            className="text-[11px] uppercase tracking-[0.25em] text-[var(--accent-60)] font-bold text-center"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {geometry.replace(/-/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                            {currentIndex + 1} / {OPTIONS.length}
                        </div>
                    </div>
                    <button
                        onClick={() => setGeometry(OPTIONS[(currentIndex + 1) % OPTIONS.length])}
                        className="w-10 h-10 rounded-xl text-sm flex items-center justify-center"
                        style={{
                            border: '1px solid var(--accent-25)',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            letterSpacing: '0.05em'
                        }}
                        aria-label="Next geometry"
                    >
                        ▶
                    </button>
                </div>

                <div
                    className="rounded-xl flex items-center justify-center min-w-0"
                    style={{
                        border: '1px solid var(--accent-20)',
                        background: 'var(--accent-10)',
                        height: '104px'
                    }}
                >
                    {RELIGIOUS_GEOMETRIES.includes(geometry) && RELIGIOUS_SVG_BY_KEY[geometry] ? (
                        <img
                            src={RELIGIOUS_SVG_BY_KEY[geometry]}
                            alt={geometry}
                            className="max-w-[220px] max-h-[96px]"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            draggable={false}
                        />
                    ) : (
                        <svg
                            viewBox="0 0 100 100"
                            width="100%"
                            height="100%"
                            className="max-w-[220px] max-h-[96px]"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {BASIC_GEOMETRIES.includes(geometry) && geometry === 'circle' && (
                                <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
                            )}
                            {BASIC_GEOMETRIES.includes(geometry) && geometry === 'square' && (
                                <rect x="28" y="28" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="3" />
                            )}
                            {BASIC_GEOMETRIES.includes(geometry) && geometry === 'triangle' && (
                                <polygon points="50,22 78,76 22,76" fill="none" stroke="currentColor" strokeWidth="3" />
                            )}
                            {BASIC_GEOMETRIES.includes(geometry) && (geometry === 'enso' || geometry === 'ring') && (
                                <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="4" />
                            )}
                        </svg>
                    )}
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
