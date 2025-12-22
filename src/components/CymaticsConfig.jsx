// src/components/CymaticsConfig.jsx
import React, { useState } from 'react';
import { getAllSets } from '../utils/frequencyLibrary.js';

// Phase cycle presets with balanced proportions
const PHASE_CYCLE_PRESETS = [
    { id: 'quick', total: 25, in: 2.5, hold: 10, out: 2.5, void: 10 },
    { id: 'balanced', total: 30, in: 3, hold: 12, out: 3, void: 12 },
    { id: 'extended', total: 45, in: 4.5, hold: 18, out: 4.5, void: 18 },
    { id: 'deep', total: 60, in: 6, hold: 24, out: 6, void: 24 },
];

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

    const [showFrequencyModal, setShowFrequencyModal] = useState(false);

    const totalCycleDuration = fadeInDuration + displayDuration + fadeOutDuration + voidDuration;

    // Apply phase cycle preset
    const applyPreset = (preset) => {
        setFadeInDuration(preset.in);
        setDisplayDuration(preset.hold);
        setFadeOutDuration(preset.out);
        setVoidDuration(preset.void);
    };

    return (
        <div className="space-y-4">
            {/* Frequency Set Selector - Compact Pills */}
            <div>
                <div
                    className="text-[9px] uppercase tracking-[0.25em] mb-2"
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
                                const isSameSet = frequencySet === set.id;
                                setFrequencySet(set.id);
                                // Auto-select first frequency in new set
                                if (!isSameSet && set.frequencies.length > 0) {
                                    setSelectedFrequency(set.frequencies[0]);
                                }
                                // Toggle modal: if same set clicked, toggle; if different set, open
                                setShowFrequencyModal(isSameSet ? !showFrequencyModal : true);
                            }}
                            className="flex-1 px-3 py-2 rounded-full text-[10px] transition-all"
                            style={{
                                border: frequencySet === set.id ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                                background: frequencySet === set.id ? 'var(--accent-10)' : 'transparent',
                                color: frequencySet === set.id ? 'rgba(253,251,245,0.9)' : 'rgba(253,251,245,0.6)',
                                fontFamily: 'var(--font-display)',
                                letterSpacing: 'var(--tracking-wide)',
                                fontWeight: 500,
                            }}
                        >
                            {set.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Frequency Card - Large, Clickable */}
            <div>
                <div
                    className="text-[9px] uppercase tracking-[0.25em] mb-2"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'rgba(253,251,245,0.4)'
                    }}
                >
                    Frequency
                </div>
                <button
                    onClick={() => setShowFrequencyModal(!showFrequencyModal)}
                    className="w-full p-4 rounded-2xl text-center transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                        border: '1px solid var(--accent-30)',
                        boxShadow: '0 0 20px var(--accent-15), inset 0 0 20px var(--accent-08)',
                    }}
                >
                    <div
                        className="text-sm mb-1 font-semibold"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--accent-color)',
                            letterSpacing: 'var(--tracking-wide)',
                            fontSize: '14px',
                        }}
                    >
                        {selectedFrequency?.name || 'Select Frequency'}
                    </div>
                    <div
                        className="text-2xl font-bold mb-1"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: 'rgba(253,251,245,0.9)',
                        }}
                    >
                        {selectedFrequency?.hz || '---'} Hz
                    </div>
                    <div
                        className="text-[10px]"
                        style={{ color: 'rgba(253,251,245,0.5)' }}
                    >
                        {selectedFrequency?.quality || 'Tap to choose'}
                    </div>
                </button>

                {/* Frequency Selection Modal/Dropdown */}
                {showFrequencyModal && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {frequencies.map((freq) => (
                            <button
                                key={freq.hz}
                                onClick={() => {
                                    setSelectedFrequency(freq);
                                    setShowFrequencyModal(false);
                                }}
                                className="px-3 py-2 rounded-xl text-left transition-all"
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
                                }}
                            >
                                <div className="text-[10px] font-semibold">
                                    {freq.hz} Hz - {freq.name}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Phase Cycle - Compact Selector */}
            <div>
                <div
                    className="text-[9px] uppercase tracking-[0.25em] mb-2"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'rgba(253,251,245,0.4)'
                    }}
                >
                    Phase Cycle
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {PHASE_CYCLE_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => applyPreset(preset)}
                            className="px-2 py-2 rounded-lg text-center transition-all"
                            style={{
                                border: totalCycleDuration === preset.total
                                    ? '1px solid var(--accent-color)'
                                    : '1px solid var(--accent-15)',
                                background: totalCycleDuration === preset.total
                                    ? 'var(--accent-10)'
                                    : 'rgba(0,0,0,0.2)',
                                color: totalCycleDuration === preset.total
                                    ? 'var(--accent-color)'
                                    : 'rgba(253,251,245,0.6)',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 600,
                                fontSize: '11px',
                            }}
                        >
                            {preset.total}s
                        </button>
                    ))}
                </div>

                {/* Cymatic Arc - Visual Representation */}
                <div className="relative h-8 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {/* Phase segments */}
                    <div className="absolute inset-0 flex">
                        <div
                            className="h-full flex items-center justify-center text-[8px] font-semibold"
                            style={{
                                width: `${(fadeInDuration / totalCycleDuration) * 100}%`,
                                background: 'rgba(253,220,145,0.2)',
                                borderRight: '1px solid rgba(253,220,145,0.3)',
                                color: 'rgba(253,251,245,0.5)',
                                fontFamily: 'var(--font-display)',
                            }}
                            title={`Fade In: ${fadeInDuration}s`}
                        >
                            {fadeInDuration}s
                        </div>
                        <div
                            className="h-full flex items-center justify-center text-[8px] font-semibold"
                            style={{
                                width: `${(displayDuration / totalCycleDuration) * 100}%`,
                                background: 'var(--accent-10)',
                                borderRight: '1px solid var(--accent-20)',
                                color: 'var(--accent-color)',
                                fontFamily: 'var(--font-display)',
                            }}
                            title={`Display: ${displayDuration}s`}
                        >
                            {displayDuration}s
                        </div>
                        <div
                            className="h-full flex items-center justify-center text-[8px] font-semibold"
                            style={{
                                width: `${(fadeOutDuration / totalCycleDuration) * 100}%`,
                                background: 'rgba(253,220,145,0.2)',
                                borderRight: '1px solid rgba(253,220,145,0.3)',
                                color: 'rgba(253,251,245,0.5)',
                                fontFamily: 'var(--font-display)',
                            }}
                            title={`Fade Out: ${fadeOutDuration}s`}
                        >
                            {fadeOutDuration}s
                        </div>
                        <div
                            className="h-full flex items-center justify-center text-[8px] font-semibold"
                            style={{
                                width: `${(voidDuration / totalCycleDuration) * 100}%`,
                                background: 'rgba(0,0,0,0.4)',
                                color: 'rgba(253,251,245,0.4)',
                                fontFamily: 'var(--font-display)',
                            }}
                            title={`Void: ${voidDuration}s`}
                        >
                            {voidDuration}s
                        </div>
                    </div>
                </div>
                <div
                    className="mt-1 text-center text-[9px]"
                    style={{ color: 'rgba(253,251,245,0.4)' }}
                >
                    In → Hold → Out → Void
                </div>
            </div>

            {/* Toggles - Horizontal Row */}
            <div className="flex gap-2">
                <button
                    onClick={() => setDriftEnabled(!driftEnabled)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-[10px] transition-all flex items-center justify-between"
                    style={{
                        border: driftEnabled ? '1px solid var(--accent-40)' : '1px solid var(--accent-15)',
                        background: driftEnabled ? 'var(--accent-10)' : 'transparent',
                        color: driftEnabled ? 'rgba(253,251,245,0.9)' : 'rgba(253,251,245,0.6)',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: 'var(--tracking-wide)',
                        fontWeight: 500,
                    }}
                >
                    <span>Drift</span>
                    <span className="text-[9px] opacity-70">{driftEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-[10px] transition-all flex items-center justify-between"
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
                    <span className="text-[9px] opacity-70">{audioEnabled ? 'ON' : 'OFF'}</span>
                </button>
            </div>
        </div>
    );
}
