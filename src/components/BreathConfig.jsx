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
}) {
    const handlePatternChange = (key, value) => {
        setPattern((prev) => ({
            ...prev,
            [key]: Number.parseInt(value, 10) || 0,
        }));
        setPreset(null);
    };

    // Pattern preview calculations
    const totalDuration = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2 || 1;
    const width = 100;
    const height = 40;
    const iW = (pattern.inhale / totalDuration) * width;
    const h1W = (pattern.hold1 / totalDuration) * width;
    const eW = (pattern.exhale / totalDuration) * width;

    const pathD = `
        M 0 ${height}
        L ${iW} 0
        L ${iW + h1W} 0
        L ${iW + h1W + eW} ${height}
        L ${width} ${height}
    `;

    return (
        <div className="breath-config">
            {/* Pattern Presets */}
            <div className="flex items-center justify-between mb-4">
                <div
                    style={{
                        fontFamily: "Georgia, serif",
                        fontSize: "9px",
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        color: "rgba(253,251,245,0.55)",
                    }}
                >
                    Pattern
                </div>

                <div className="flex gap-2 flex-wrap">
                    {PRESET_NAMES.map((name) => (
                        <button
                            key={name}
                            onClick={() => setPreset(name)}
                            className="rounded-full px-2.5 py-1 transition-all duration-200"
                            style={{
                                fontFamily: "Georgia, serif",
                                fontSize: "8px",
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                background: "transparent",
                                border: `1px solid ${preset === name ? "var(--accent-color)" : "var(--accent-10)"}`,
                                color: preset === name ? "var(--accent-color)" : "rgba(253,251,245,0.55)",
                                boxShadow: preset === name ? '0 0 12px var(--accent-15)' : "none",
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pattern Inputs */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                    { label: "Inhale", key: "inhale" },
                    { label: "Hold 1", key: "hold1" },
                    { label: "Exhale", key: "exhale" },
                    { label: "Hold 2", key: "hold2" },
                ].map(({ label, key }) => (
                    <div key={key} className="flex flex-col gap-1">
                        <label
                            style={{
                                fontFamily: "Georgia, serif",
                                fontSize: "8px",
                                letterSpacing: "0.25em",
                                textTransform: "uppercase",
                                color: "rgba(253,251,245,0.55)",
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
                                fontFamily: "Georgia, serif",
                                fontSize: "14px",
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid var(--accent-10)",
                                color: "rgba(253,251,245,0.9)",
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Pattern Preview (trapezoid) */}
            <div className="flex justify-center mb-4">
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ opacity: 0.6 }}
                >
                    <path
                        d={pathD}
                        fill="none"
                        stroke="var(--accent-color)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
}
