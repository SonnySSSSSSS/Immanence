// src/components/CymaticsConfig.jsx
import React from 'react';
import { getAllSets } from '../utils/frequencyLibrary.js';

export function CymaticsConfig({
    // Frequency selection
    frequencySet,
    setFrequencySet,
    selectedFrequency,
    setSelectedFrequency,

    // Timing
    fadeInDuration,
    setFadeInDuration,
    displayDuration,
    setDisplayDuration,
    fadeOutDuration,
    setFadeOutDuration,
    voidDuration,
    setVoidDuration,

    // Options
    driftEnabled,
    setDriftEnabled,
    audioEnabled,
    setAudioEnabled,
}) {
    const frequencySets = getAllSets();
    const currentSet = frequencySets.find(s => s.id === frequencySet);
    const frequencies = currentSet ? currentSet.frequencies : [];

    const totalCycleDuration = fadeInDuration + displayDuration + fadeOutDuration + voidDuration;

    return (
        <div className="space-y-6">
            {/* Frequency Set Selector */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'rgba(253,251,245,0.4)'
                    }}
                >
                    Frequency Set
                </div>
                <div className="flex gap-2">
                    {frequencySets.map((set) => (
                        <button
                            key={set.id}
                            onClick={() => {
                                setFrequencySet(set.id);
                                // Auto-select first frequency in new set
                                if (set.frequencies.length > 0) {
                                    setSelectedFrequency(set.frequencies[0]);
                                }
                            }}
                            className="flex-1 px-4 py-3 rounded-xl text-sm transition-all"
                            style={{
                                border: frequencySet === set.id ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                                background: frequencySet === set.id ? 'var(--accent-10)' : 'transparent',
                                color: frequencySet === set.id ? 'rgba(253,251,245,0.9)' : 'rgba(253,251,245,0.6)',
                                fontFamily: 'var(--font-display)',
                                letterSpacing: 'var(--tracking-wide)',
                                fontWeight: 500,
                            }}
                        >
                            {set.name.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Frequency Grid Selector */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'rgba(253,251,245,0.4)'
                    }}
                >
                    Frequency
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {frequencies.map((freq) => (
                        <button
                            key={freq.hz}
                            onClick={() => setSelectedFrequency(freq)}
                            className="px-3 py-3 rounded-xl text-left transition-all"
                            style={{
                                border: selectedFrequency?.hz === freq.hz
                                    ? '1px solid var(--accent-color)'
                                    : '1px solid var(--accent-15)',
                                background: selectedFrequency?.hz === freq.hz
                                    ? 'var(--accent-10)'
                                    : 'rgba(0,0,0,0.2)',
                                color: selectedFrequency?.hz === freq.hz
                                    ? 'var(--accent-color)'
                                    : 'rgba(253,251,245,0.6)',
                                fontFamily: 'var(--font-display)',
                                letterSpacing: 'var(--tracking-wide)',
                                fontWeight: 500,
                                animation: selectedFrequency?.hz === freq.hz
                                    ? 'cymaticRipple 2s ease-out infinite'
                                    : 'none',
                            }}
                        >
                            <div className="text-xs font-semibold mb-1">
                                {freq.hz} Hz
                            </div>
                            <div className="text-[10px] opacity-70">
                                {freq.name}
                            </div>
                        </button>
                    ))}
                </div>

                {selectedFrequency && (
                    <div
                        className="mt-3 p-3 rounded-xl text-center"
                        style={{
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--accent-15)',
                        }}
                    >
                        <div
                            className="text-sm mb-1 font-semibold"
                            style={{
                                fontFamily: 'var(--font-display)',
                                color: 'var(--accent-color)',
                                letterSpacing: 'var(--tracking-wide)'
                            }}
                        >
                            {selectedFrequency.name}
                        </div>
                        <div
                            className="text-[10px]"
                            style={{ color: 'rgba(253,251,245,0.5)' }}
                        >
                            {selectedFrequency.quality}
                        </div>
                    </div>
                )}
            </div>

            {/* Timing Controls */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'rgba(253,251,245,0.4)'
                    }}
                >
                    Phase Durations
                </div>
                <div className="space-y-3">
                    {/* Fade In */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span
                                className="text-xs"
                                style={{ color: 'rgba(253,251,245,0.7)' }}
                            >
                                Fade In
                            </span>
                            <span
                                className="text-xs"
                                style={{ color: 'var(--accent-color)' }}
                            >
                                {fadeInDuration}s
                            </span>
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
                            <span
                                className="text-xs"
                                style={{ color: 'rgba(253,251,245,0.7)' }}
                            >
                                Display
                            </span>
                            <span
                                className="text-xs"
                                style={{ color: 'var(--accent-color)' }}
                            >
                                {displayDuration}s
                            </span>
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
                            <span
                                className="text-xs"
                                style={{ color: 'rgba(253,251,245,0.7)' }}
                            >
                                Fade Out
                            </span>
                            <span
                                className="text-xs"
                                style={{ color: 'var(--accent-color)' }}
                            >
                                {fadeOutDuration}s
                            </span>
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
                            <span
                                className="text-xs"
                                style={{ color: 'rgba(253,251,245,0.7)' }}
                            >
                                Void
                            </span>
                            <span
                                className="text-xs"
                                style={{ color: 'var(--accent-color)' }}
                            >
                                {voidDuration}s
                            </span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="60"
                            step="5"
                            value={voidDuration}
                            onChange={(e) => setVoidDuration(parseInt(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${((voidDuration - 5) / 55) * 100}%, rgba(255,255,255,0.1) ${((voidDuration - 5) / 55) * 100}%, rgba(255,255,255,0.1) 100%)`,
                            }}
                        />
                    </div>
                </div>

                <div
                    className="mt-3 text-center text-xs"
                    style={{ color: 'rgba(253,251,245,0.5)' }}
                >
                    Total Cycle: {totalCycleDuration}s
                </div>
            </div>

            {/* Options */}
            <div>
                <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-3"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'rgba(253,251,245,0.4)'
                    }}
                >
                    Options
                </div>
                <div className="space-y-2">
                    {/* Drift Toggle */}
                    <button
                        onClick={() => setDriftEnabled(!driftEnabled)}
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between"
                        style={{
                            border: driftEnabled ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                            background: driftEnabled ? 'var(--accent-10)' : 'transparent',
                            color: driftEnabled ? 'rgba(253,251,245,0.9)' : 'rgba(253,251,245,0.6)',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: 'var(--tracking-wide)',
                            fontWeight: 500,
                        }}
                    >
                        <span>Drift (Micro-variations)</span>
                        <span className="text-xs opacity-70">{driftEnabled ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Audio Toggle */}
                    <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between"
                        style={{
                            border: audioEnabled ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                            background: audioEnabled ? 'var(--accent-10)' : 'transparent',
                            color: audioEnabled ? 'rgba(253,251,245,0.9)' : 'rgba(253,251,245,0.6)',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: 'var(--tracking-wide)',
                            fontWeight: 500,
                        }}
                    >
                        <span>Audio</span>
                        <span className="text-xs opacity-70">{audioEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div
                className="p-3 rounded-xl text-xs leading-relaxed"
                style={{
                    border: '1px solid var(--accent-15)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'rgba(253,251,245,0.6)',
                }}
            >
                <span style={{ color: 'var(--accent-color)' }}>Note:</span> Audio continues during void phase.
                Use the tone to recall the visual pattern from sound alone.
            </div>
        </div>
    );
}
