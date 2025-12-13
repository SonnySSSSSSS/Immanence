// src/components/SoundConfig.jsx
// Configuration panel for Sound practice mode
// Binaural beats, isochronic tones, mantras, nature sounds, silence
import React from 'react';

// Binaural beat frequency presets (difference frequency between L/R)
export const BINAURAL_PRESETS = [
    { id: 'delta', name: 'Delta', hz: 2, description: 'Deep sleep, healing', color: 'rgba(147, 51, 234, 0.8)' },
    { id: 'theta', name: 'Theta', hz: 6, description: 'Meditation, creativity', color: 'rgba(99, 102, 241, 0.8)' },
    { id: 'alpha', name: 'Alpha', hz: 10, description: 'Relaxation, calm focus', color: 'rgba(34, 197, 94, 0.8)' },
    { id: 'beta', name: 'Beta', hz: 20, description: 'Active thinking, focus', color: 'rgba(234, 179, 8, 0.8)' },
    { id: 'gamma', name: 'Gamma', hz: 40, description: 'Peak awareness, insight', color: 'rgba(239, 68, 68, 0.8)' },
];

// Isochronic tone presets
export const ISOCHRONIC_PRESETS = [
    { id: 'grounding', name: 'Grounding', hz: 7.83, description: 'Schumann resonance', color: 'rgba(168, 85, 247, 0.8)' },
    { id: 'relaxation', name: 'Relaxation', hz: 10, description: 'Alpha state calm', color: 'rgba(59, 130, 246, 0.8)' },
    { id: 'focus', name: 'Focus', hz: 14, description: 'SMR concentration', color: 'rgba(16, 185, 129, 0.8)' },
    { id: 'energy', name: 'Energy', hz: 18, description: 'Beta alertness', color: 'rgba(245, 158, 11, 0.8)' },
    { id: 'clarity', name: 'Clarity', hz: 40, description: 'Gamma perception', color: 'rgba(244, 63, 94, 0.8)' },
];

// Mantra presets
export const MANTRA_PRESETS = [
    { id: 'om', name: 'Om', description: 'Universal vibration' },
    { id: 'soham', name: 'So Hum', description: 'I am That' },
    { id: 'hamsa', name: 'Ham Sa', description: 'Breath mantra' },
    { id: 'om-namah', name: 'Om Namah Shivaya', description: 'Transformation' },
    { id: 'om-mani', name: 'Om Mani Padme Hum', description: 'Compassion' },
];

// Nature soundscapes
export const NATURE_PRESETS = [
    { id: 'rain', name: 'Rain', description: 'Gentle rainfall' },
    { id: 'ocean', name: 'Ocean Waves', description: 'Rhythmic waves' },
    { id: 'forest', name: 'Forest', description: 'Birds and wind' },
    { id: 'fire', name: 'Crackling Fire', description: 'Warm hearth' },
    { id: 'stream', name: 'Stream', description: 'Flowing water' },
    { id: 'thunder', name: 'Thunderstorm', description: 'Distant rumble' },
];

// Sound type options
export const SOUND_TYPES = [
    'Binaural Beats',
    'Isochronic Tones',
    'Mantra',
    'Nature',
    'Silence'
];

export function SoundConfig({
    soundType,
    setSoundType,
    binauralPreset,
    setBinauralPreset,
    isochronicPreset,
    setIsochronicPreset,
    mantraPreset,
    setMantraPreset,
    naturePreset,
    setNaturePreset,
    carrierFrequency,
    setCarrierFrequency,
    volume,
    setVolume,
}) {
    return (
        <div className="sound-config space-y-6">
            {/* Sound Type Selection */}
            <div>
                <div
                    className="mb-3"
                    style={{
                        fontFamily: "Georgia, serif",
                        fontSize: "9px",
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        color: "rgba(253,251,245,0.55)",
                        textAlign: "center"
                    }}
                >
                    Soundscape
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {['Binaural Beats', 'Isochronic Tones', 'Mantra', 'Nature', 'Silence'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setSoundType(type)}
                            className="rounded-xl px-3 py-2.5 transition-all duration-200 text-center"
                            style={{
                                fontFamily: "Georgia, serif",
                                fontSize: "10px",
                                letterSpacing: "0.05em",
                                background: soundType === type ? "rgba(255,255,255,0.05)" : "transparent",
                                border: `1px solid ${soundType === type ? "var(--accent-color)" : "var(--accent-10)"}`,
                                color: soundType === type ? "var(--accent-color)" : "rgba(253,251,245,0.6)",
                                boxShadow: soundType === type ? "0 0 15px var(--accent-10)" : "none",
                                gridColumn: type === 'Silence' ? 'span 3' : 'auto',
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Binaural Beats Options */}
            {soundType === 'Binaural Beats' && (
                <div className="animate-fade-in">
                    <div
                        className="mb-3"
                        style={{
                            fontFamily: "Georgia, serif",
                            fontSize: "9px",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            color: "rgba(253,251,245,0.55)",
                            textAlign: "center"
                        }}
                    >
                        Brainwave Target
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {BINAURAL_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => setBinauralPreset(preset)}
                                className="rounded-lg px-2 py-3 transition-all duration-200 text-center flex flex-col items-center gap-1"
                                style={{
                                    background: binauralPreset?.id === preset.id
                                        ? `linear-gradient(135deg, ${preset.color}20, transparent)`
                                        : "transparent",
                                    border: `1px solid ${binauralPreset?.id === preset.id ? preset.color : "var(--accent-10)"}`,
                                    boxShadow: binauralPreset?.id === preset.id ? `0 0 15px ${preset.color}30` : "none",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        color: binauralPreset?.id === preset.id ? preset.color : "rgba(253,251,245,0.7)",
                                    }}
                                >
                                    {preset.name}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: "8px",
                                        color: "rgba(253,251,245,0.4)",
                                    }}
                                >
                                    {preset.hz} Hz
                                </span>
                            </button>
                        ))}
                    </div>
                    {binauralPreset && (
                        <p
                            className="mt-3 text-center"
                            style={{
                                fontFamily: "Georgia, serif",
                                fontSize: "10px",
                                fontStyle: "italic",
                                color: "rgba(253,251,245,0.5)",
                            }}
                        >
                            {binauralPreset.description}
                        </p>
                    )}

                    {/* Carrier Frequency */}
                    <div className="mt-4">
                        <div
                            className="mb-2 flex items-center justify-between"
                            style={{
                                fontFamily: "Georgia, serif",
                                fontSize: "8px",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                color: "rgba(253,251,245,0.5)",
                            }}
                        >
                            <span>Base Frequency</span>
                            <span style={{ color: 'var(--accent-color)' }}>{carrierFrequency} Hz</span>
                        </div>
                        <input
                            type="range"
                            min="100"
                            max="500"
                            step="10"
                            value={carrierFrequency}
                            onChange={(e) => setCarrierFrequency(Number(e.target.value))}
                            className="w-full accent-slider"
                            style={{
                                accentColor: 'var(--accent-color)',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Isochronic Tones Options */}
            {soundType === 'Isochronic Tones' && (
                <div className="animate-fade-in">
                    <div
                        className="mb-3"
                        style={{
                            fontFamily: "Georgia, serif",
                            fontSize: "9px",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            color: "rgba(253,251,245,0.55)",
                            textAlign: "center"
                        }}
                    >
                        Pulse Frequency
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {ISOCHRONIC_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => setIsochronicPreset(preset)}
                                className="rounded-lg px-2 py-3 transition-all duration-200 text-center flex flex-col items-center gap-1"
                                style={{
                                    background: isochronicPreset?.id === preset.id
                                        ? `linear-gradient(135deg, ${preset.color}20, transparent)`
                                        : "transparent",
                                    border: `1px solid ${isochronicPreset?.id === preset.id ? preset.color : "var(--accent-10)"}`,
                                    boxShadow: isochronicPreset?.id === preset.id ? `0 0 15px ${preset.color}30` : "none",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        color: isochronicPreset?.id === preset.id ? preset.color : "rgba(253,251,245,0.7)",
                                    }}
                                >
                                    {preset.name}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: "8px",
                                        color: "rgba(253,251,245,0.4)",
                                    }}
                                >
                                    {preset.hz} Hz
                                </span>
                            </button>
                        ))}
                    </div>
                    {isochronicPreset && (
                        <p
                            className="mt-3 text-center"
                            style={{
                                fontFamily: "Georgia, serif",
                                fontSize: "10px",
                                fontStyle: "italic",
                                color: "rgba(253,251,245,0.5)",
                            }}
                        >
                            {isochronicPreset.description}
                        </p>
                    )}
                </div>
            )}

            {/* Mantra Options */}
            {soundType === 'Mantra' && (
                <div className="animate-fade-in">
                    <div
                        className="mb-3"
                        style={{
                            fontFamily: "Georgia, serif",
                            fontSize: "9px",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            color: "rgba(253,251,245,0.55)",
                            textAlign: "center"
                        }}
                    >
                        Sacred Sound
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {MANTRA_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => setMantraPreset(preset)}
                                className="rounded-lg px-3 py-3 transition-all duration-200 text-left"
                                style={{
                                    background: mantraPreset?.id === preset.id
                                        ? "rgba(255,255,255,0.05)"
                                        : "transparent",
                                    border: `1px solid ${mantraPreset?.id === preset.id ? "var(--accent-color)" : "var(--accent-10)"}`,
                                    boxShadow: mantraPreset?.id === preset.id ? "0 0 15px var(--accent-10)" : "none",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: mantraPreset?.id === preset.id ? "var(--accent-color)" : "rgba(253,251,245,0.7)",
                                    }}
                                >
                                    {preset.name}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: "9px",
                                        display: "block",
                                        marginTop: "2px",
                                        color: "rgba(253,251,245,0.4)",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {preset.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Nature Sounds Options */}
            {soundType === 'Nature' && (
                <div className="animate-fade-in">
                    <div
                        className="mb-3"
                        style={{
                            fontFamily: "Georgia, serif",
                            fontSize: "9px",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            color: "rgba(253,251,245,0.55)",
                            textAlign: "center"
                        }}
                    >
                        Natural Ambience
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {NATURE_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => setNaturePreset(preset)}
                                className="rounded-lg px-2 py-3 transition-all duration-200 text-center flex flex-col items-center gap-1"
                                style={{
                                    background: naturePreset?.id === preset.id
                                        ? "rgba(255,255,255,0.05)"
                                        : "transparent",
                                    border: `1px solid ${naturePreset?.id === preset.id ? "var(--accent-color)" : "var(--accent-10)"}`,
                                    boxShadow: naturePreset?.id === preset.id ? "0 0 15px var(--accent-10)" : "none",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        color: naturePreset?.id === preset.id ? "var(--accent-color)" : "rgba(253,251,245,0.7)",
                                    }}
                                >
                                    {preset.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Silence - just a note */}
            {soundType === 'Silence' && (
                <div className="animate-fade-in text-center py-4">
                    <p
                        style={{
                            fontFamily: "Georgia, serif",
                            fontSize: "11px",
                            fontStyle: "italic",
                            color: "rgba(253,251,245,0.5)",
                        }}
                    >
                        Practice in intentional silence.<br />
                        No sound will be played.
                    </p>
                </div>
            )}

            {/* Volume Slider (for all except Silence) */}
            {soundType !== 'Silence' && (
                <div className="mt-4">
                    <div
                        className="mb-2 flex items-center justify-between"
                        style={{
                            fontFamily: "Georgia, serif",
                            fontSize: "8px",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "rgba(253,251,245,0.5)",
                        }}
                    >
                        <span>Volume</span>
                        <span style={{ color: 'var(--accent-color)' }}>{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full"
                        style={{
                            accentColor: 'var(--accent-color)',
                        }}
                    />
                </div>
            )}

            {/* Info note */}
            <div
                className="text-center pt-2"
                style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "9px",
                    color: "rgba(253,251,245,0.35)",
                    fontStyle: "italic",
                }}
            >
                Use headphones for binaural beats
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
