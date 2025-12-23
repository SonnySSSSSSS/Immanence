// src/components/BreathConfig.jsx
// Configuration panel for Breath & Stillness practice
// Pattern presets and inhale/hold/exhale sliders
import React from 'react';

// Breathing pattern presets
export const BREATH_PRESETS = {
    Box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    "4-7-8": { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
    Kumbhaka: { inhale: 4, hold1: 16, exhale: 8, hold2: 0 },
    Relax: { inhale: 4, hold1: 4, exhale: 6, hold2: 2 },
    Energy: { inhale: 3, hold1: 0, exhale: 3, hold2: 0 },
};

export const PRESET_NAMES = Object.keys(BREATH_PRESETS);

export function BreathConfig({
    pattern,
    setPattern,
    preset,
    setPreset,
    isLight = false,
}) {
    const handlePatternChange = (key, value) => {
        setPattern((prev) => ({
            ...prev,
            [key]: Number.parseInt(value, 10) || 0,
        }));
        setPreset(null);
    };

    return (
        <div className="breath-config">
            {/* Pattern Presets - centered, no label */}
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {PRESET_NAMES.map((name) => (
                    <button
                        key={name}
                        onClick={() => {
                            setPattern(BREATH_PRESETS[name]);
                            setPreset(name);
                        }}
                        className="rounded-full px-2.5 py-1 transition-all duration-200"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "8px",
                            fontWeight: 600,
                            letterSpacing: "var(--tracking-mythic)",
                            textTransform: "uppercase",
                            background: "transparent",
                            border: `1px solid ${preset === name ? "var(--accent-color)" : "var(--accent-10)"}`,
                            color: preset === name ? "var(--accent-color)" : "var(--text-muted)",
                            boxShadow: preset === name ? '0 0 12px var(--accent-15)' : "none",
                        }}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {/* Pattern Inputs */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: "Inhale", key: "inhale" },
                    { label: "Hold 1", key: "hold1" },
                    { label: "Exhale", key: "exhale" },
                    { label: "Hold 2", key: "hold2" },
                ].map(({ label, key }) => (
                    <div key={key} className="flex flex-col gap-1">
                        <label
                            style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "8px",
                                fontWeight: 600,
                                letterSpacing: "var(--tracking-wide)",
                                textTransform: "uppercase",
                                color: "var(--text-muted)",
                                textAlign: "center"
                            }}
                        >
                            {label}
                        </label>
                        <input
                            type="text"
                            value={pattern[key]}
                            onChange={(e) => handlePatternChange(key, e.target.value)}
                            className="text-center rounded-xl px-2 py-2 outline-none transition-all duration-200"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "14px",
                                fontWeight: 600,
                                background: isLight ? 'rgba(60,50,35,0.05)' : "rgba(0,0,0,0.4)",
                                border: isLight ? '1px solid var(--light-border)' : "1px solid var(--accent-10)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
