// src/components/SensoryConfig.jsx
// Configuration panel for Sensory practice mode
// Fluid slider for Body Scan vs Sakshi
import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

// Sensory practice types
export const SENSORY_TYPES = [
    { id: 'bodyScan', label: 'Body Scan', description: 'Progressive body awareness' },
    { id: 'sakshi', label: 'Sakshi', description: 'Witness consciousness' },
];

export function SensoryConfig({
    sensoryType,
    setSensoryType,
    isLight = false,
}) {
    const theme = useTheme();
    const isSakshi = sensoryType === 'sakshi';

    return (
        <div className="sensory-config mb-6">
            <div
                className="mb-3"
                style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "var(--tracking-mythic)",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    textAlign: "center"
                }}
            >
                Sensory Focus
            </div>

            {/* Fluid Slider */}
            <div
                className="relative rounded-full p-1 transition-all duration-300"
                style={{
                    background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${isLight ? 'var(--light-border)' : 'var(--accent-10)'}`,
                }}
            >
                {/* Sliding indicator with surface tension fill */}
                <div
                    className="absolute top-1 bottom-1 rounded-full"
                    style={{
                        left: isSakshi ? '50%' : '0.25rem',
                        right: isSakshi ? '0.25rem' : '50%',
                        background: isLight
                            ? 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-secondary) 100%)'
                            : 'var(--accent-color)',
                        boxShadow: isLight
                            ? 'inset 1px 1px 0 rgba(255,255,255,0.4), 0 1px 4px var(--light-shadow-tint)'
                            : '0 0 15px var(--accent-10)',
                        opacity: 1,
                        // Surface tension filling - ink soaking into paper
                        transition: 'left 800ms cubic-bezier(0.4, 0, 0.2, 1), right 800ms cubic-bezier(0.4, 0, 0.2, 1), background 800ms ease-in-out',
                    }}
                />

                {/* Buttons */}
                <div className="relative z-10 grid grid-cols-2 gap-0">
                    {SENSORY_TYPES.map((type) => {
                        const isActive = sensoryType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setSensoryType(type.id)}
                                className="rounded-full px-4 py-3 transition-all duration-300 text-center flex flex-col items-center gap-1"
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    letterSpacing: "var(--tracking-wide)",
                                    background: 'transparent',
                                }}
                            >
                                <span
                                    className="transition-all duration-500"
                                    style={{
                                        color: isActive
                                            ? (isLight ? 'var(--light-bg-base)' : '#050508')
                                            : 'var(--text-secondary)',
                                        fontWeight: isActive ? 600 : 500,
                                        // Inactive state recedes without implying inferiority
                                        opacity: isActive ? 1 : (isLight ? 0.65 : 0.5),
                                    }}
                                >
                                    {type.label}
                                </span>
                                <span
                                    className="transition-all duration-500"
                                    style={{
                                        fontSize: "8px",
                                        color: isActive
                                            ? (isLight ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)')
                                            : 'var(--text-muted)',
                                        opacity: isActive ? 1 : 0.5,
                                    }}
                                >
                                    {type.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
