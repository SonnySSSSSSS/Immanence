// src/components/PhoticControlPanel.jsx
// Control panel for Photic Circles overlay
// Sliders for rate, brightness, spacing, radius, blur
// Color palette and link toggle
import React from 'react';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';

// Color palette presets
const COLOR_PRESETS = [
    { id: 'white', name: 'White', color: '#FFFFFF' },
    { id: 'amber', name: 'Amber', color: '#FFD9A0' },
    { id: 'red', name: 'Red', color: '#FF6B6B' },
    { id: 'green', name: 'Green', color: '#7BC47F' },
    { id: 'blue', name: 'Blue', color: '#6FA8DC' },
    { id: 'violet', name: 'Violet', color: '#B589D6' },
];

export function PhoticControlPanel({ isRunning, onToggleRunning, onClose }) {
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const displayMode = useDisplayModeStore((s) => s.mode);
    const isLight = colorScheme === 'light';
    const isHearth = displayMode === 'hearth';

    const { photic, setPhoticSetting } = useSettingsStore();

    // Text colors (matching SoundConfig pattern)
    const textColors = {
        primary: isLight ? '#3D3425' : 'rgba(253,251,245,0.7)',
        secondary: isLight ? '#5A4D3C' : 'rgba(253,251,245,0.55)',
        muted: isLight ? '#7A6D58' : 'rgba(253,251,245,0.45)',
        faint: isLight ? '#9A8D78' : 'rgba(253,251,245,0.4)',
    };

    // Handle rate change with advanced input
    const handleRateChange = (value) => {
        setPhoticSetting('rateHz', value);
    };

    // Handle color change (applies to both if linked)
    const handleColorChange = (color) => {
        if (photic.linkColors) {
            setPhoticSetting('colorLeft', color);
            setPhoticSetting('colorRight', color);
        } else {
            // Only update left by default; user can set right separately
            setPhoticSetting('colorLeft', color);
        }
    };

    return (
        <div
            className={`photic-control-panel ${isHearth ? 'hearth-mode' : 'sanctuary-mode'}`}
            style={{
                position: 'fixed',
                ...(isHearth
                    ? {
                          // Bottom sheet for mobile/hearth
                          bottom: 0,
                          left: 0,
                          right: 0,
                          maxWidth: '100vw',
                          maxHeight: '70vh',
                      }
                    : {
                          // Centered panel for desktop/sanctuary - stays within UI boundaries
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 'min(340px, 90vw)',
                          maxHeight: '85vh',
                      }),
                backgroundColor: isLight ? 'rgba(250, 246, 238, 0.98)' : 'rgba(20, 15, 25, 0.98)',
                border: `1px solid ${isLight ? 'rgba(160, 120, 60, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: isHearth ? '24px 24px 0 0' : '16px',
                backdropFilter: 'blur(12px)',
                padding: isHearth ? '16px' : '20px',
                boxShadow: isLight
                    ? '0 -4px 20px rgba(0,0,0,0.1)'
                    : '0 4px 20px rgba(0,0,0,0.4)',
                zIndex: 1001,
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <div
                className="mb-3 flex items-center justify-between"
                style={{
                    borderBottom: `1px solid ${isLight ? 'rgba(160, 120, 60, 0.1)' : 'rgba(255,255,255,0.05)'}`,
                    paddingBottom: '12px',
                }}
            >
                <div
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.primary,
                    }}
                >
                    Photic Circles
                </div>
                <button
                    onClick={onClose}
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        color: textColors.muted,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        lineHeight: 1,
                    }}
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>

            {/* Rate Slider */}
            <div className="mb-3">
                <div
                    className="mb-2 flex items-center justify-between"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '8px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.muted,
                    }}
                >
                    <span>Rate (Hz)</span>
                    <span style={{ color: 'var(--accent-color)' }}>{photic.rateHz.toFixed(1)}</span>
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="12"
                    step="0.1"
                    value={photic.rateHz}
                    onChange={(e) => handleRateChange(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent-color)' }}
                />
                {/* Advanced input */}
                <div className="mt-1 flex items-center gap-2">
                    <label
                        htmlFor="advanced-rate"
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '9px',
                            color: textColors.faint,
                            fontStyle: 'italic',
                        }}
                    >
                        (advanced)
                    </label>
                    <input
                        id="advanced-rate"
                        type="number"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={photic.rateHz}
                        onChange={(e) => handleRateChange(Number(e.target.value))}
                        style={{
                            width: '60px',
                            padding: '2px 6px',
                            fontFamily: 'var(--font-body)',
                            fontSize: '10px',
                            color: textColors.primary,
                            backgroundColor: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                            border: `1px solid ${isLight ? 'rgba(160, 120, 60, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '4px',
                        }}
                    />
                </div>
            </div>

            {/* Brightness Slider */}
            <div className="mb-3">
                <div
                    className="mb-2 flex items-center justify-between"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '8px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.muted,
                    }}
                >
                    <span>Brightness</span>
                    <span style={{ color: 'var(--accent-color)' }}>
                        {Math.round(photic.brightness * 100)}%
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={photic.brightness}
                    onChange={(e) => setPhoticSetting('brightness', Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent-color)' }}
                />
            </div>

            {/* Spacing Slider */}
            <div className="mb-3">
                <div
                    className="mb-2 flex items-center justify-between"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '8px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.muted,
                    }}
                >
                    <span>Spacing</span>
                    <span style={{ color: 'var(--accent-color)' }}>{photic.spacingPx}px</span>
                </div>
                <input
                    type="range"
                    min="40"
                    max="320"
                    step="10"
                    value={photic.spacingPx}
                    onChange={(e) => setPhoticSetting('spacingPx', Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent-color)' }}
                />
            </div>

            {/* Radius Slider */}
            <div className="mb-3">
                <div
                    className="mb-2 flex items-center justify-between"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '8px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.muted,
                    }}
                >
                    <span>Radius</span>
                    <span style={{ color: 'var(--accent-color)' }}>{photic.radiusPx}px</span>
                </div>
                <input
                    type="range"
                    min="40"
                    max="240"
                    step="10"
                    value={photic.radiusPx}
                    onChange={(e) => setPhoticSetting('radiusPx', Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent-color)' }}
                />
            </div>

            {/* Blur Slider */}
            <div className="mb-3">
                <div
                    className="mb-2 flex items-center justify-between"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '8px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.muted,
                    }}
                >
                    <span>Glow</span>
                    <span style={{ color: 'var(--accent-color)' }}>{photic.blurPx}px</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={photic.blurPx}
                    onChange={(e) => setPhoticSetting('blurPx', Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent-color)' }}
                />
            </div>

            {/* Color Palette */}
            <div className="mb-3">
                <div
                    className="mb-3"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '8px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.muted,
                        textAlign: 'center',
                    }}
                >
                    Color
                </div>
                <div className="grid grid-cols-6 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handleColorChange(preset.color)}
                            className="rounded-full aspect-square"
                            style={{
                                backgroundColor: preset.color,
                                border: `2px solid ${
                                    photic.colorLeft === preset.color
                                        ? 'var(--accent-color)'
                                        : 'transparent'
                                }`,
                                boxShadow:
                                    photic.colorLeft === preset.color
                                        ? '0 0 12px var(--accent-10)'
                                        : 'none',
                                cursor: 'pointer',
                                transition: 'all 200ms ease',
                            }}
                            aria-label={preset.name}
                        />
                    ))}
                </div>
            </div>

            {/* Link Colors Toggle */}
            <div className="mb-3 flex items-center justify-between">
                <span
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-wide)',
                        textTransform: 'uppercase',
                        color: textColors.secondary,
                    }}
                >
                    Link Colors
                </span>
                <button
                    onClick={() => setPhoticSetting('linkColors', !photic.linkColors)}
                    style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontFamily: 'var(--font-display)',
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: photic.linkColors
                            ? 'var(--accent-color)'
                            : isLight
                            ? 'rgba(160, 120, 60, 0.1)'
                            : 'rgba(255,255,255,0.05)',
                        color: photic.linkColors ? '#000' : textColors.secondary,
                        border: `1px solid ${
                            photic.linkColors
                                ? 'transparent'
                                : isLight
                                ? 'rgba(160, 120, 60, 0.2)'
                                : 'rgba(255,255,255,0.1)'
                        }`,
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                    }}
                >
                    {photic.linkColors ? 'ON' : 'OFF'}
                </button>
            </div>

            {/* Start/Stop Button */}
            <button
                onClick={onToggleRunning}
                style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '10px',
                    borderRadius: '12px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: 'var(--tracking-wide)',
                    textTransform: 'uppercase',
                    backgroundColor: isRunning
                        ? isLight
                            ? '#D97706'
                            : '#EF4444'
                        : 'var(--accent-color)',
                    color: '#000',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: isRunning
                        ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                        : '0 4px 12px var(--accent-10)',
                    transition: 'all 200ms ease',
                }}
            >
                {isRunning ? '■ Stop' : '▶ Start'}
            </button>

            {/* Safety Notice */}
            <div
                className="text-center"
                style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '8px',
                    color: textColors.faint,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                }}
            >
                {isRunning
                    ? `Pulsing at ${photic.rateHz.toFixed(1)} Hz`
                    : 'Adjust settings before starting'}
            </div>
        </div>
    );
}
