// src/components/PhoticControlPanel.jsx
// Control panel for Photic Circles overlay
// Sliders for rate, brightness, spacing, and radius
// Color palette and link toggle
import { useState } from 'react';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useTutorialStore } from '../state/tutorialStore';
import { PhoticPreview } from './PhoticPreview';
import { useEffectivePhotic } from '../hooks/useEffectiveSettings';
import { useSessionOverrideStore } from '../state/sessionOverrideStore';

// Color palette presets
const COLOR_PRESETS = [
    { id: 'white', name: 'White', color: '#FFFFFF' },
    { id: 'amber', name: 'Amber', color: '#FFD9A0' },
    { id: 'red', name: 'Red', color: '#FF6B6B' },
    { id: 'green', name: 'Green', color: '#7BC47F' },
    { id: 'blue', name: 'Blue', color: '#6FA8DC' },
    { id: 'violet', name: 'Violet', color: '#B589D6' },
];

export function PhoticControlPanel({ isRunning, onToggleRunning, onClose, isEmbedded = false }) {
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const displayMode = useDisplayModeStore((s) => s.mode);
    const isLight = colorScheme === 'light';
    const isHearth = displayMode === 'hearth';

    const photic = useEffectivePhotic();
    const setPhoticSettingBase = useSettingsStore((s) => s.setPhoticSetting);
    const sessionOverrideActive = useSessionOverrideStore((s) => s.active);
    const setOverride = useSessionOverrideStore((s) => s.setOverride);
    const isLocked = useSessionOverrideStore((s) => s.isLocked);
    const { isOpen: tutorialIsOpen, tutorialId } = useTutorialStore();

    const setPhoticSetting = (key, value) => {
        const lockPath = `settings.photic.${key}`;
        if (isLocked(lockPath)) return;
        if (sessionOverrideActive) {
            setOverride(lockPath, value);
            return;
        }
        setPhoticSettingBase(key, value);
    };

    // Highlight should only show if the photic tutorial is actually open
    const tutorialIsPhoticOpen = tutorialIsOpen && tutorialId === 'page:photic-beginner';

    // Track which color (left/right) the palette is currently editing when linkColors is OFF
    const [colorTarget, setColorTarget] = useState('left');

    // Text colors (matching SoundConfig pattern)
    const textColors = {
        primary: isLight ? '#3D3425' : 'rgba(253,251,245,0.7)',
        secondary: isLight ? '#5A4D3C' : 'rgba(253,251,245,0.55)',
        muted: isLight ? '#7A6D58' : 'rgba(253,251,245,0.45)',
        faint: isLight ? '#9A8D78' : 'rgba(253,251,245,0.4)',
    };

    // Handle rate change
    const handleRateChange = (value) => {
        setPhoticSetting('rateHz', value);
    };

    // Handle color change (applies to both if linked, or selected side if unlinked)
    const handleColorChange = (color) => {
        if (photic.linkColors) {
            setPhoticSetting('colorLeft', color);
            setPhoticSetting('colorRight', color);
        } else {
            // When unlinked, update only the selected target (left or right)
            const targetKey = colorTarget === 'left' ? 'colorLeft' : 'colorRight';
            setPhoticSetting(targetKey, color);
        }
    };

    const containerStyle = isEmbedded
        ? {
            width: '100%',
            maxWidth: '540px',
            margin: '0 auto',
            backgroundColor: 'transparent',
            padding: '0',
            overflow: 'visible'
          }
        : {
            position: 'fixed',
            ...(isHearth
                ? {
                        bottom: 0,
                        left: 0,
                        right: 0,
                        maxWidth: '100vw',
                        maxHeight: '70vh',
                    }
                : {
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
        };

    // Horizontal control row style (label, control, value)
    const controlRowStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        width: '100%',
        minWidth: 0,
    };

    const controlLabelStyle = {
        fontFamily: 'var(--font-display)',
        fontSize: '8px',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        color: textColors.muted,
        minWidth: '60px',
        flexShrink: 0,
    };

    const controlValueStyle = {
        fontFamily: 'var(--font-display)',
        fontSize: '8px',
        fontWeight: 600,
        color: 'var(--accent-color)',
        minWidth: '48px',
        textAlign: 'right',
        flexShrink: 0,
        whiteSpace: 'nowrap',
    };

    return (
        <div 
            className={`photic-control-panel ${isHearth ? 'hearth-mode' : 'sanctuary-mode'}`} 
            style={containerStyle}
        >
            {/* Header - Hidden if embedded */}
            {!isEmbedded && (
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
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Signal Panel (merged Protocol + Intensity) */}
                <div
                    className="rounded-xl p-3"
                    style={{
                        border: '1px solid var(--accent-25)',
                        boxShadow: tutorialIsPhoticOpen && (photic.activeGuideStep === 'protocol' || photic.activeGuideStep === 'intensity')
                            ? '0 0 0 2px var(--accent-color)'
                            : 'none',
                    }}
                    data-guide-step="protocol"
                >
                    <div
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '9px',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-wide)',
                            textTransform: 'uppercase',
                            color: 'var(--accent-60)',
                            marginBottom: '12px',
                        }}
                    >
                        Signal
                    </div>

                    {/* Invisible anchor for intensity tutorial step */}
                    <div
                        data-guide-step="intensity"
                        style={{
                            position: 'absolute',
                            width: 1,
                            height: 1,
                            overflow: 'hidden',
                            pointerEvents: 'none',
                            opacity: 0,
                        }}
                    />

                    {/* Rate Slider - Horizontal */}
                    <div style={controlRowStyle}>
                        <label style={controlLabelStyle}>Rate</label>
                        <input
                            type="range"
                            min="0.1"
                            max="12"
                            step="0.1"
                            value={photic.rateHz}
                            onChange={(e) => {
                                handleRateChange(Number(e.target.value));
                            }}
                            style={{ flex: 1, minWidth: 0, width: '100%', accentColor: 'var(--accent-color)' }}
                        />
                        <div style={controlValueStyle}>{photic.rateHz.toFixed(1)} Hz</div>
                    </div>

                    {/* Timing Mode - Horizontal */}
                    <div style={controlRowStyle}>
                        <label style={controlLabelStyle}>Timing</label>
                        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                            <button
                                onClick={() => {
                                    setPhoticSetting('timingMode', 'simultaneous');
                                }}
                                className="text-center text-xs px-2 py-1 rounded-lg transition-all overflow-hidden"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 600,
                                    fontSize: '9px',
                                    backgroundColor:
                                        photic.timingMode === 'simultaneous'
                                            ? 'var(--accent-color)'
                                            : 'transparent',
                                    color: photic.timingMode === 'simultaneous' ? '#000' : 'var(--text-secondary)',
                                    border: `1px solid ${
                                        photic.timingMode === 'simultaneous'
                                            ? 'var(--accent-color)'
                                            : 'var(--accent-20)'
                                    }`,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                }}
                            >
                                SIM
                            </button>

                            <button
                                onClick={() => {
                                    setPhoticSetting('timingMode', 'alternating');
                                }}
                                className="text-center text-xs px-2 py-1 rounded-lg transition-all overflow-hidden"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 600,
                                    fontSize: '9px',
                                    backgroundColor:
                                        photic.timingMode === 'alternating'
                                            ? 'var(--accent-color)'
                                            : 'transparent',
                                    color: photic.timingMode === 'alternating' ? '#000' : 'var(--text-secondary)',
                                    border: `1px solid ${
                                        photic.timingMode === 'alternating'
                                            ? 'var(--accent-color)'
                                            : 'var(--accent-20)'
                                    }`,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                }}
                            >
                                ALT
                            </button>
                        </div>
                    </div>

                    {/* Brightness Slider - Horizontal */}
                    <div style={controlRowStyle}>
                        <label style={controlLabelStyle}>Bright</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={photic.brightness}
                            onChange={(e) => {
                                setPhoticSetting('brightness', Number(e.target.value));
                            }}
                            style={{ flex: 1, minWidth: 0, width: '100%', accentColor: 'var(--accent-color)' }}
                        />
                        <div style={controlValueStyle}>{Math.round(photic.brightness * 100)}%</div>
                    </div>
                </div>

                {/* Group C: Geometry */}
                <div
                    className="rounded-xl p-3"
                    style={{
                        border: '1px solid var(--accent-25)',
                        boxShadow: tutorialIsPhoticOpen && photic.activeGuideStep === 'geometry'
                            ? '0 0 0 2px var(--accent-color)'
                            : 'none',
                    }}
                    data-guide-step="geometry"
                >
                    <div
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '9px',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-wide)',
                            textTransform: 'uppercase',
                            color: 'var(--accent-60)',
                            marginBottom: '12px',
                        }}
                    >
                        Geometry
                    </div>

                    {/* Radius Slider - Horizontal */}
                    <div style={controlRowStyle}>
                        <label style={controlLabelStyle}>Radius</label>
                        <input
                            type="range"
                            min="40"
                            max="240"
                            step="10"
                            value={photic.radiusPx}
                            onChange={(e) => {
                                setPhoticSetting('radiusPx', Number(e.target.value));
                            }}
                            style={{ flex: 1, minWidth: 0, width: '100%', accentColor: 'var(--accent-color)' }}
                        />
                        <div style={controlValueStyle}>{photic.radiusPx}px</div>
                    </div>

                    {/* Spacing Slider - Horizontal */}
                    <div style={controlRowStyle}>
                        <label style={controlLabelStyle}>Spacing</label>
                        <input
                            type="range"
                            min="40"
                            max="800"
                            step="10"
                            value={photic.spacingPx}
                            onChange={(e) => {
                                setPhoticSetting('spacingPx', Number(e.target.value));
                            }}
                            style={{ flex: 1, minWidth: 0, width: '100%', accentColor: 'var(--accent-color)' }}
                        />
                        <div style={controlValueStyle}>{photic.spacingPx}px</div>
                    </div>
                </div>

                {/* Group D: Color */}
                <div
                    className="rounded-xl p-3"
                    style={{
                        border: '1px solid var(--accent-25)',
                        boxShadow: tutorialIsPhoticOpen && photic.activeGuideStep === 'color'
                            ? '0 0 0 2px var(--accent-color)'
                            : 'none',
                    }}
                    data-guide-step="color"
                >
                    <div
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '9px',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-wide)',
                            textTransform: 'uppercase',
                            color: 'var(--accent-60)',
                            marginBottom: '12px',
                        }}
                    >
                        Color
                    </div>

                    {/* Color Target Toggle (only shown when linkColors is OFF) */}
                    {!photic.linkColors && (
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                <button
                                    onClick={() => setColorTarget('left')}
                                    className="text-center text-xs px-2 py-1 rounded-lg transition-all overflow-hidden flex-1"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 600,
                                        fontSize: '9px',
                                        backgroundColor:
                                            colorTarget === 'left'
                                                ? 'var(--accent-color)'
                                                : 'transparent',
                                        color: colorTarget === 'left' ? '#000' : 'var(--text-secondary)',
                                        border: `1px solid ${
                                            colorTarget === 'left'
                                                ? 'var(--accent-color)'
                                                : 'var(--accent-20)'
                                        }`,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    LEFT
                                </button>

                                <button
                                    onClick={() => setColorTarget('right')}
                                    className="text-center text-xs px-2 py-1 rounded-lg transition-all overflow-hidden flex-1"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 600,
                                        fontSize: '9px',
                                        backgroundColor:
                                            colorTarget === 'right'
                                                ? 'var(--accent-color)'
                                                : 'transparent',
                                        color: colorTarget === 'right' ? '#000' : 'var(--text-secondary)',
                                        border: `1px solid ${
                                            colorTarget === 'right'
                                                ? 'var(--accent-color)'
                                                : 'var(--accent-20)'
                                        }`,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    RIGHT
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Color Palette */}
                    <div
                        style={{ marginBottom: '8px' }}
                        data-guide-step="protocol"
                    >
                        <div className="grid grid-cols-6 gap-2">
                            {COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => {
                                        handleColorChange(preset.color);
                                    }}
                                    className="rounded-full aspect-square transition-all"
                                    style={{
                                        backgroundColor: preset.color,
                                        border: `2px solid ${
                                            (photic.linkColors || colorTarget === 'left' ? photic.colorLeft : photic.colorRight) === preset.color
                                                ? 'var(--accent-color)'
                                                : 'transparent'
                                        }`,
                                        boxShadow:
                                            (photic.linkColors || colorTarget === 'left' ? photic.colorLeft : photic.colorRight) === preset.color
                                                ? '0 0 12px var(--accent-10)'
                                                : 'none',
                                        cursor: 'pointer',
                                    }}
                                    aria-label={preset.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Link Colors Toggle - Horizontal */}
                    <div style={controlRowStyle}>
                        <label style={controlLabelStyle}>Link</label>
                        <div style={{ flex: 1 }} />
                        <button
                            onClick={() => {
                                setPhoticSetting('linkColors', !photic.linkColors);
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                fontFamily: 'var(--font-display)',
                                backgroundColor: photic.linkColors
                                    ? 'var(--accent-color)'
                                    : 'transparent',
                                color: photic.linkColors ? '#000' : 'var(--text-secondary)',
                                border: `1px solid ${
                                    photic.linkColors
                                        ? 'var(--accent-color)'
                                        : 'var(--accent-20)'
                                }`,
                                cursor: 'pointer',
                                minWidth: '48px',
                                textAlign: 'center',
                            }}
                        >
                            {photic.linkColors ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Start/Stop Button - Hidden if embedded (Card Start button handles this) */}
            {!isEmbedded && (
                <button
                    onClick={onToggleRunning}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '16px',
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
            )}

            {/* Live Preview */}
            <div
                style={{
                    marginTop: isEmbedded ? '20px' : '16px',
                }}
            >
                <PhoticPreview />
            </div>
        </div>
    );
}
