// src/components/SoundConfig.jsx
// Configuration panel for Sound practice mode
// Binaural beats, isochronic tones, mantras, nature sounds, silence
import React from 'react';
import { BinauralTrainerPanel } from './BinauralTrainerPanel.jsx';
import { IsochronicTrainerPanel } from './IsochronicTrainerPanel';

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
    soundVolume,
    setVolume,
    setSoundVolume,
    isLight = false, // Accept isLight as prop from parent
}) {
    // Handle both prop name variants (volume/soundVolume, setVolume/setSoundVolume)
    const volumeValue = volume ?? soundVolume ?? 0.75;
    const setVolumeFunc = setVolume || setSoundVolume;
    // Light-mode-aware text colors
    const textColors = {
        primary: isLight ? '#3D3425' : 'rgba(253,251,245,0.7)',
        secondary: isLight ? '#5A4D3C' : 'rgba(253,251,245,0.55)',
        muted: isLight ? '#7A6D58' : 'rgba(253,251,245,0.45)',
        faint: isLight ? '#9A8D78' : 'rgba(253,251,245,0.4)',
        ghost: isLight ? '#AA9D88' : 'rgba(253,251,245,0.35)',
        description: isLight ? '#6B5E4A' : 'rgba(253,251,245,0.5)',
    };

    // UI-level exact frequency (entrainment target) for Card 2
    const [exactHz, setExactHz] = React.useState(() => {
        if (soundType === 'Isochronic Tones') return isochronicPreset?.hz ?? 10;
        if (soundType === 'Binaural Beats') return binauralPreset?.hz ?? 10;
        return 10;
    });

    // Track if user is actively adjusting frequency slider
    const [isAdjustingFrequency, setIsAdjustingFrequency] = React.useState(false);
    const adjustStartTimeRef = React.useRef(null);
    const [isAccelerated, setIsAccelerated] = React.useState(false);
    const adjustTimerRef = React.useRef(null);

    const [reverbWet, setReverbWet] = React.useState(0);
    const [chorusWet, setChorusWet] = React.useState(0);
    const [reverbSize, setReverbSize] = React.useState('M');

    // Monitor adjustment duration for acceleration (5+ seconds)
    React.useEffect(() => {
        if (!isAdjustingFrequency) return;

        adjustTimerRef.current = setInterval(() => {
            if (adjustStartTimeRef.current) {
                const elapsed = Date.now() - adjustStartTimeRef.current;
                if (elapsed > 5000 && !isAccelerated) {
                    setIsAccelerated(true);
                }
            }
        }, 100);

        return () => clearInterval(adjustTimerRef.current);
    }, [isAdjustingFrequency, isAccelerated]);

    // Debounced end of adjustment
    React.useEffect(() => {
        if (!isAdjustingFrequency) return;

        const debounceTimer = setTimeout(() => {
            setIsAdjustingFrequency(false);
            adjustStartTimeRef.current = null;
            setIsAccelerated(false);
        }, 200);

        return () => clearTimeout(debounceTimer);
    }, [isAdjustingFrequency]);

    // Sync exactHz when active sound type or presets change
    React.useEffect(() => {
        if (soundType === 'Isochronic Tones') {
            setExactHz(isochronicPreset?.hz ?? 10);
        } else if (soundType === 'Binaural Beats') {
            setExactHz(binauralPreset?.hz ?? 10);
        }
    }, [soundType, isochronicPreset?.hz, binauralPreset?.hz]);

    return (
        <div className="sound-config space-y-6">

            {/* CARD 1 — SOUNDSCAPE */}
            <div
                className="rounded-2xl p-4 space-y-4"
                style={{
                    border: `1px solid ${isLight ? "var(--light-border)" : "rgba(255,255,255,0.10)"}`,
                }}
            >
                {/* Sound Type Selection */}
                <div>
                    <div
                        className="mb-3"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "9px",
                            fontWeight: 600,
                            letterSpacing: "var(--tracking-mythic)",
                            textTransform: "uppercase",
                            color: textColors.muted,
                            textAlign: "center"
                        }}
                    >
                        Soundscape
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {['Binaural Beats', 'Isochronic Tones', 'Mantra', 'Nature'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setSoundType(type)}
                                className="rounded-xl px-3 py-2.5 text-center leading-tight min-h-[44px] whitespace-normal min-w-0"        
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    letterSpacing: "var(--tracking-wide)",
                                    background: soundType === type ? (isLight ? "var(--accent-10)" : "rgba(255,255,255,0.05)") : "transparent",                                                                                                                                          
                                    border: `1px solid ${soundType === type ? "var(--accent-color)" : (isLight ? "var(--light-border)" : "var(--accent-10)")}`,
                                    color: soundType === type ? "var(--accent-color)" : textColors.secondary,
                                    boxShadow: soundType === type ? (isLight ? "0 2px 8px var(--light-shadow-tint)" : "0 0 15px var(--accent-10)") : "none",
                                    transition: 'background 800ms cubic-bezier(0.4, 0, 0.2, 1), border-color 800ms ease-in-out, color 400ms ease, box-shadow 800ms ease',
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CARD 2 — FREQUENCY / CONTENT */}
            <div
                className="rounded-2xl p-4 space-y-4"
                style={{
                    border: `1px solid ${isLight ? "var(--light-border)" : "rgba(255,255,255,0.10)"}`,
                }}
            >
                {/* Exact Frequency (Hz) */}
                <div
                    className={`space-y-2 ${!(soundType === 'Binaural Beats' || soundType === 'Isochronic Tones') ? 'opacity-40 pointer-events-none' : ''}`}
                >
                    <div
                        className="flex items-center justify-between"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "9px",
                            fontWeight: 600,
                            letterSpacing: "var(--tracking-mythic)",
                            textTransform: "uppercase",
                            color: textColors.muted,
                        }}
                    >
                        <span>Exact Frequency</span>
                        <span style={{ color: 'var(--accent-color)' }}>
                            {Number.isFinite(exactHz) ? exactHz : '--'} Hz
                        </span>
                    </div>

                    <input
                        type="range"
                        min="1"
                        max="80"
                        step={isAccelerated ? "2" : "0.5"}
                        value={exactHz ?? 10}
                        onChange={(e) => {
                            if (!isAdjustingFrequency) {
                                setIsAdjustingFrequency(true);
                                adjustStartTimeRef.current = Date.now();
                                setIsAccelerated(false);
                            }
                            const hz = Number(e.target.value);
                            setExactHz(hz);
                            if (soundType === 'Isochronic Tones') {
                                setIsochronicPreset({
                                    id: 'custom',
                                    name: 'Custom',
                                    hz,
                                    description: 'Custom pulse frequency',
                                    color: 'var(--accent-color)',
                                });
                            }
                            if (soundType === 'Binaural Beats') {
                                setBinauralPreset({
                                    id: 'custom',
                                    name: 'Custom',
                                    hz,
                                    description: 'Custom beat frequency',
                                    color: 'var(--accent-color)',
                                });
                            }
                        }}
                        className="w-full"
                        style={{
                            accentColor: 'var(--accent-color)',
                        }}
                    />

                    <div
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "9px",
                            textAlign: "center",
                            color: textColors.ghost,
                            fontStyle: "italic",
                        }}
                    >
                        Adjusts entrainment target frequency
                    </div>
                </div>
                {/* Binaural Beats Options */}
                {soundType === 'Binaural Beats' && (
                    <div className="animate-fade-in">
                        <BinauralTrainerPanel isLight={isLight} deltaFOverride={exactHz} />
                    </div>
                )}

                {/* Isochronic Tones Options */}
                {soundType === 'Isochronic Tones' && (
                    <div className="animate-fade-in space-y-4">
                        <IsochronicTrainerPanel
                            pulseHz={exactHz}
                            volume={volumeValue}
                            isAdjustingFrequency={isAdjustingFrequency}
                            reverbWet={reverbWet}
                            chorusWet={chorusWet}
                            reverbSizePreset={reverbSize}
                        />

                        <div>
                            <div
                                className="mb-3"
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    letterSpacing: "var(--tracking-mythic)",
                                    textTransform: "uppercase",
                                    color: textColors.secondary,
                                    textAlign: "center"
                                }}
                            >
                                Pulse Presets
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {ISOCHRONIC_PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setIsochronicPreset(preset)}
                                        className="rounded-lg px-2 py-3 text-center flex flex-col items-center gap-1"
                                        style={{
                                            background: isochronicPreset?.id === preset.id
                                                ? `linear-gradient(135deg, ${preset.color}20, transparent)`
                                                : "transparent",
                                            border: `1px solid ${isochronicPreset?.id === preset.id ? preset.color : "var(--accent-10)"}`,
                                            boxShadow: isochronicPreset?.id === preset.id ? `0 0 15px ${preset.color}30` : "none",
                                            transition: 'background 800ms cubic-bezier(0.4, 0, 0.2, 1), border-color 800ms ease-in-out, box-shadow 800ms ease',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "var(--font-display)",
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                color: isochronicPreset?.id === preset.id ? preset.color : textColors.primary,
                                                textAlign: "center",
                                                width: "100%",
                                                lineHeight: 1.15,
                                                whiteSpace: "normal",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                wordBreak: "break-word",
                                                display: "block",
                                            }}
                                        >
                                            {preset.name}
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: "var(--font-body)",
                                                fontSize: "8px",
                                                color: textColors.faint,
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
                                        fontFamily: "var(--font-body)",
                                        fontSize: "10px",
                                        fontStyle: "italic",
                                        color: textColors.description,
                                    }}
                                >
                                    {isochronicPreset.description}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Mantra Options */}
                {soundType === 'Mantra' && (
                    <div className="animate-fade-in">
                        <div
                            className="mb-3"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "9px",
                                fontWeight: 600,
                                letterSpacing: "var(--tracking-mythic)",
                                textTransform: "uppercase",
                                color: textColors.muted,
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
                                    className="rounded-lg px-3 py-3 text-left"
                                    style={{
                                        background: mantraPreset?.id === preset.id
                                            ? (isLight ? "var(--accent-10)" : "rgba(255,255,255,0.05)")
                                            : "transparent",
                                        border: `1px solid ${mantraPreset?.id === preset.id ? "var(--accent-color)" : (isLight ? "var(--light-border)" : "var(--accent-10)")}`,
                                        boxShadow: mantraPreset?.id === preset.id ? (isLight ? "0 2px 8px var(--light-shadow-tint)" : "0 0 15px var(--accent-10)") : "none",
                                        transition: 'background 800ms cubic-bezier(0.4, 0, 0.2, 1), border-color 800ms ease-in-out, color 400ms ease, box-shadow 800ms ease',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "var(--font-display)",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: mantraPreset?.id === preset.id ? "var(--accent-color)" : textColors.primary,
                                        }}
                                    >
                                        {preset.name}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-body)",
                                            fontSize: "9px",
                                            display: "block",
                                            marginTop: "2px",
                                            color: textColors.faint,
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
                                fontFamily: "var(--font-display)",
                                fontSize: "9px",
                                fontWeight: 600,
                                letterSpacing: "var(--tracking-mythic)",
                                textTransform: "uppercase",
                                color: textColors.muted,
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
                                    className="rounded-lg px-2 py-3 text-center flex flex-col items-center gap-1"
                                    style={{
                                        background: naturePreset?.id === preset.id
                                            ? (isLight ? "var(--accent-10)" : "rgba(255,255,255,0.05)")
                                            : "transparent",
                                        border: `1px solid ${naturePreset?.id === preset.id ? "var(--accent-color)" : (isLight ? "var(--light-border)" : "var(--accent-10)")}`,
                                        boxShadow: naturePreset?.id === preset.id ? (isLight ? "0 2px 8px var(--light-shadow-tint)" : "0 0 15px var(--accent-10)") : "none",
                                        transition: 'background 800ms cubic-bezier(0.4, 0, 0.2, 1), border-color 800ms ease-in-out, color 400ms ease, box-shadow 800ms ease',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "var(--font-display)",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            color: naturePreset?.id === preset.id ? "var(--accent-color)" : textColors.primary,
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
                                fontFamily: "var(--font-body)",
                                fontSize: "11px",
                                fontStyle: "italic",
                                color: textColors.description,
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
                                fontFamily: "var(--font-display)",
                                fontSize: "8px",
                                fontWeight: 600,
                                letterSpacing: "var(--tracking-mythic)",
                                textTransform: "uppercase",
                                color: textColors.muted,
                            }}
                        >
                            <span>Volume</span>
                            <div className="flex items-center gap-2">
                                <span style={{ color: 'var(--accent-color)' }}>{Math.round(volumeValue * 100)}%</span>
                                <div className="flex gap-1">
                                    {[
                                        { label: 'Mute', v: 0 },
                                        { label: '50', v: 0.5 },
                                        { label: 'Max', v: 1 },
                                    ].map(btn => (
                                        <button
                                            key={btn.label}
                                            onClick={() => setVolumeFunc(btn.v)}
                                            className="px-2 py-0.5 rounded-md"
                                            style={{
                                                border: `1px solid ${isLight ? 'var(--light-border)' : 'var(--accent-10)'}`,
                                                color: textColors.secondary,
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '9px',
                                                fontWeight: 600,
                                                letterSpacing: 'var(--tracking-wide)'
                                            }}
                                            title={`Set volume to ${btn.label}`}
                                        >{btn.label}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volumeValue}
                            onChange={(e) => setVolumeFunc(Number(e.target.value))}
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
                        fontFamily: "var(--font-body)",
                        fontSize: "9px",
                        color: textColors.ghost,
                        fontStyle: "italic",
                    }}
                >
                    Use headphones for binaural beats
                </div>
            </div>

            {/* CARD 3 — ADVANCED */}
            <div
                className="rounded-2xl p-4 space-y-4"
                style={{
                    border: `1px solid ${isLight ? "var(--light-border)" : "rgba(255,255,255,0.10)"}`,
                }}
            >
                <div
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "9px",
                        fontWeight: 600,
                        letterSpacing: "var(--tracking-mythic)",
                        textTransform: "uppercase",
                        color: textColors.muted,
                        textAlign: "center",
                    }}
                >
                    Advanced
                </div>

                {/* Carrier Frequency (Binaural only) */}
                <div className={`${soundType !== "Binaural Beats" ? "opacity-40 pointer-events-none" : ""}`}>
                    <div
                        className="mb-2 flex items-center justify-between"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "8px",
                            fontWeight: 600,
                            letterSpacing: "var(--tracking-mythic)",
                            textTransform: "uppercase",
                            color: textColors.muted,
                        }}
                    >
                        <span>Carrier Frequency</span>
                        <span style={{ color: "var(--accent-color)" }}>{Math.round(carrierFrequency)} Hz</span>
                    </div>

                    <input
                        type="range"
                        min="100"
                        max="400"
                        step="1"
                        value={carrierFrequency}
                        onChange={(e) => setCarrierFrequency(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: "var(--accent-color)" }}
                    />

                    <div
                        className="text-center pt-2"
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "9px",
                            color: textColors.ghost,
                            fontStyle: "italic",
                        }}
                    >
                        Carrier affects tone color (not entrainment Hz)
                    </div>
                </div>

                {/* Effects placeholders (UI only, no engine yet) */}
                <div className={`${soundType !== "Isochronic Tones" ? "opacity-40 pointer-events-none" : ""}`}>
                    <div
                        className="mb-2 flex items-center justify-between"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "8px",
                            fontWeight: 600,
                            letterSpacing: "var(--tracking-mythic)",
                            textTransform: "uppercase",
                            color: textColors.muted,
                        }}
                    >
                        <span>Reverb</span>
                        <span style={{ color: "var(--accent-color)" }}>{Math.round(reverbWet * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="0.3"
                        step="0.01"
                        value={reverbWet}
                        onChange={(e) => setReverbWet(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: "var(--accent-color)" }}
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <div
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "8px",
                                fontWeight: 600,
                                letterSpacing: "var(--tracking-mythic)",
                                textTransform: "uppercase",
                                color: textColors.muted,
                            }}
                        >
                            Size
                        </div>
                        <div className="flex gap-1">
                            {(["S","M","L"]).map(sz => (
                                <button
                                    key={sz}
                                    onClick={() => setReverbSize(sz)}
                                    className="px-2 py-1 rounded-md"
                                    style={{
                                        border: `1px solid ${reverbSize===sz? 'var(--accent-color)' : (isLight ? 'var(--light-border)' : 'var(--accent-10)')}`,
                                        color: reverbSize===sz? 'var(--accent-color)' : textColors.secondary,
                                        fontFamily: "var(--font-display)",
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        letterSpacing: "var(--tracking-wide)",
                                    }}
                                >{sz}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`${soundType !== "Isochronic Tones" ? "opacity-40 pointer-events-none" : ""}`}>
                    <div
                        className="mb-2 flex items-center justify-between"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "8px",
                            fontWeight: 600,
                            letterSpacing: "var(--tracking-mythic)",
                            textTransform: "uppercase",
                            color: textColors.muted,
                        }}
                    >
                        <span>Chorus</span>
                        <span style={{ color: "var(--accent-color)" }}>{Math.round(chorusWet * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="0.2"
                        step="0.01"
                        value={chorusWet}
                        onChange={(e) => setChorusWet(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: "var(--accent-color)" }}
                    />
                </div>
            </div>

            {/* CARD 4 — DURATION (placeholder) */}
            <div
                className="rounded-2xl p-4 text-center text-xs opacity-50"
                style={{
                    border: `1px solid ${isLight ? "var(--light-border)" : "rgba(255,255,255,0.10)"}`,
                }}
            >
                Duration is configured at the practice level
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
