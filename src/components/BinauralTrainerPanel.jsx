// src/components/BinauralTrainerPanel.jsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { useBinauralEngine } from '../audio/useBinauralEngine';
import { ratioPresets } from '../audio/ratios';

// Voice Gain Presets
const VOICE_PRESETS = {
    focused: {
        name: 'Focused',
        description: 'Emphasis on primary tones',
        gains: [0.9, 0.8, 0.7, 0.4, 0.3, 0.2, 0.15, 0.1, 0.1, 0.1],
    },
    balanced: {
        name: 'Balanced',
        description: 'Even distribution',
        gains: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    },
    immersive: {
        name: 'Immersive',
        description: 'Full harmonic spectrum',
        gains: [0.8, 0.75, 0.75, 0.7, 0.7, 0.65, 0.65, 0.6, 0.6, 0.55],
    },
};

export function BinauralTrainerPanel({ isLight = false }) {
    const {
        isReady,
        isRunning,
        fc,
        ratio,
        deltaF,
        spreadMode,
        chaos,
        voiceGains,
        ensureReady,
        start,
        stop,
        setMasterCarrier,
        setSpread,
        setRatio,
        setDeltaF,
        setChaos,
        setVoiceGain,
    } = useBinauralEngine();

    const didInitDefaults = useRef(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [voicePreset, setVoicePreset] = useState('balanced');

    useEffect(() => {
        if (didInitDefaults.current) return;
        didInitDefaults.current = true;
        setMasterCarrier(144);
        setDeltaF(6);
        // Apply default balanced preset
        VOICE_PRESETS.balanced.gains.forEach((gain, index) => {
            setVoiceGain(index, gain);
        });
    }, [setDeltaF, setMasterCarrier, setVoiceGain]);

    const ratioOptions = useMemo(() => ratioPresets, []);

    // Apply voice preset
    const applyVoicePreset = (presetKey) => {
        setVoicePreset(presetKey);
        if (presetKey !== 'custom' && VOICE_PRESETS[presetKey]) {
            VOICE_PRESETS[presetKey].gains.forEach((gain, index) => {
                setVoiceGain(index, gain);
            });
        }
    };

    // Text color helpers for light/dark mode
    const textColors = {
        primary: isLight ? '#3D3425' : 'rgba(253,251,245,0.85)',
        secondary: isLight ? '#5A4D3C' : 'rgba(253,251,245,0.7)',
        muted: isLight ? '#7A6D58' : 'rgba(253,251,245,0.5)',
        faint: isLight ? '#9A8D78' : 'rgba(253,251,245,0.4)',
    };

    const sectionLabelStyle = {
        fontFamily: 'var(--font-display)',
        fontSize: '8px',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-mythic)',
        textTransform: 'uppercase',
        color: textColors.muted,
        marginBottom: '8px',
    };

    const sliderLabelStyle = {
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        color: textColors.secondary,
    };

    const buttonStyle = (isActive) => ({
        fontFamily: 'var(--font-display)',
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: 'var(--tracking-wide)',
        padding: '6px 12px',
        borderRadius: '6px',
        border: isActive
            ? '1px solid var(--accent-color)'
            : (isLight ? '1px solid rgba(160,120,60,0.3)' : '1px solid var(--accent-20)'),
        background: isActive
            ? (isLight ? 'rgba(180,140,90,0.15)' : 'rgba(255,255,255,0.1)')
            : 'transparent',
        color: isActive ? 'var(--accent-color)' : textColors.secondary,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    });

    const presetButtonStyle = (isActive) => ({
        fontFamily: 'var(--font-display)',
        fontSize: '9px',
        fontWeight: 500,
        letterSpacing: 'var(--tracking-wide)',
        padding: '5px 10px',
        borderRadius: '20px',
        border: isActive
            ? '1px solid var(--accent-color)'
            : (isLight ? '1px solid rgba(160,120,60,0.25)' : '1px solid var(--accent-15)'),
        background: isActive
            ? (isLight ? 'rgba(180,140,90,0.12)' : 'rgba(255,255,255,0.08)')
            : 'transparent',
        color: isActive ? 'var(--accent-color)' : textColors.muted,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    });

    return (
        <div className="w-full">
            <div className="flex min-h-0 flex-col gap-4">
                {/* Primary Controls - Always Visible */}
                <div className="flex flex-wrap gap-2">
                    {!isReady && (
                        <button
                            type="button"
                            onClick={ensureReady}
                            style={buttonStyle(false)}
                        >
                            Enable Audio
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={isRunning ? stop : start}
                        style={buttonStyle(isRunning)}
                    >
                        {isRunning ? 'Stop' : 'Start'}
                    </button>
                </div>

                {/* Advanced Tuning Toggle */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 w-full py-2 transition-colors"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-wide)',
                        color: showAdvanced ? 'var(--accent-color)' : textColors.secondary,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        justifyContent: 'flex-start',
                    }}
                >
                    <span style={{
                        display: 'inline-block',
                        transition: 'transform 0.2s ease',
                        transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}>
                        ▸
                    </span>
                    Advanced Tuning
                </button>

                {/* Collapsible Advanced Section */}
                <div
                    style={{
                        maxHeight: showAdvanced ? '800px' : '0px',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease-in-out, opacity 0.2s ease',
                        opacity: showAdvanced ? 1 : 0,
                    }}
                >
                    <div className="flex flex-col gap-6 pt-2">
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* CORE TONE SECTION                                               */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div>
                            <div style={sectionLabelStyle}>Core Tone</div>
                            <div className="flex flex-col gap-3">
                                {/* Master Carrier */}
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span style={sliderLabelStyle}>Master Carrier</span>
                                        <span style={{ ...sliderLabelStyle, color: 'var(--accent-color)' }}>
                                            {fc.toFixed(1)} Hz
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={40}
                                        max={1200}
                                        step={1}
                                        value={fc}
                                        onChange={(event) => setMasterCarrier(Number(event.target.value))}
                                        style={{ accentColor: 'var(--accent-color)' }}
                                    />
                                </label>

                                {/* DeltaF */}
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span style={sliderLabelStyle}>DeltaF</span>
                                        <span style={{ ...sliderLabelStyle, color: 'var(--accent-color)' }}>
                                            {deltaF.toFixed(2)} Hz
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={20}
                                        step={0.1}
                                        value={deltaF}
                                        onChange={(event) => setDeltaF(Number(event.target.value))}
                                        style={{ accentColor: 'var(--accent-color)' }}
                                    />
                                </label>

                                {/* Ratio */}
                                <label className="flex flex-col gap-1">
                                    <span style={sliderLabelStyle}>Ratio</span>
                                    <select
                                        value={ratio}
                                        onChange={(event) => setRatio(Number(event.target.value))}
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '12px',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: isLight ? '1px solid rgba(160,120,60,0.3)' : '1px solid var(--accent-20)',
                                            background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.3)',
                                            color: textColors.primary,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {ratioOptions.map((option) => (
                                            <option key={option.label} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* TEXTURE SECTION                                                 */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div>
                            <div style={sectionLabelStyle}>Texture</div>
                            <div className="flex flex-col gap-3">
                                {/* Spread Mode */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSpread('integer', 1)}
                                        style={buttonStyle(spreadMode === 'integer')}
                                    >
                                        Integer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSpread('phi', 1)}
                                        style={buttonStyle(spreadMode === 'phi')}
                                    >
                                        Phi
                                    </button>
                                </div>

                                {/* Chaos */}
                                <label className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span style={sliderLabelStyle}>Chaos</span>
                                        <span style={{ ...sliderLabelStyle, color: 'var(--accent-color)' }}>
                                            {chaos.toFixed(2)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={chaos}
                                        onChange={(event) => setChaos(Number(event.target.value))}
                                        style={{ accentColor: 'var(--accent-color)' }}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* MIX SECTION                                                     */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div>
                            <div style={sectionLabelStyle}>Mix</div>
                            <div className="flex flex-col gap-3">
                                {/* Voice Gain Presets */}
                                <div>
                                    <div style={{ ...sliderLabelStyle, marginBottom: '8px' }}>Balance</div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(VOICE_PRESETS).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => applyVoicePreset(key)}
                                                style={presetButtonStyle(voicePreset === key)}
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setVoicePreset('custom')}
                                            style={presetButtonStyle(voicePreset === 'custom')}
                                        >
                                            Custom…
                                        </button>
                                    </div>
                                </div>

                                {/* Individual Voice Gains - only visible when Custom selected */}
                                {voicePreset === 'custom' && (
                                    <div
                                        className="flex flex-col gap-2 pt-2"
                                        style={{
                                            animation: 'fadeIn 0.2s ease-out',
                                        }}
                                    >
                                        <div style={{ ...sliderLabelStyle, fontSize: '9px', color: textColors.faint }}>
                                            Individual Voice Gains
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            {voiceGains.map((gain, index) => (
                                                <label key={`gain-${index}`} className="flex items-center gap-2">
                                                    <span style={{
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '9px',
                                                        color: textColors.faint,
                                                        width: '16px',
                                                    }}>
                                                        {index + 1}
                                                    </span>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={1}
                                                        step={0.01}
                                                        value={gain}
                                                        onChange={(event) => setVoiceGain(index, Number(event.target.value))}
                                                        className="flex-1"
                                                        style={{ accentColor: 'var(--accent-color)' }}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
