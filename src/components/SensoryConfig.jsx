// src/components/SensoryConfig.jsx
// Configuration panel for Sensory practice mode
// Body Scan, Sakshi type selection
import React from 'react';

// Sensory practice types
export const SENSORY_TYPES = [
    { id: 'bodyScan', label: 'Body Scan', description: 'Progressive body awareness' },
    { id: 'sakshi', label: 'Sakshi', description: 'Witness consciousness' },
];

export function SensoryConfig({
    sensoryType,
    setSensoryType,
}) {
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
                    color: "rgba(253,251,245,0.45)",
                    textAlign: "center"
                }}
            >
                Sensory Focus
            </div>
            <div className="grid grid-cols-2 gap-3">
                {SENSORY_TYPES.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setSensoryType(type.id)}
                        className="rounded-xl px-3 py-3 transition-all duration-200 text-center flex flex-col items-center gap-1"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "var(--tracking-wide)",
                            background: sensoryType === type.id ? "rgba(255,255,255,0.05)" : "transparent",
                            border: `1px solid ${sensoryType === type.id ? "var(--accent-color)" : "var(--accent-10)"}`,
                            boxShadow: sensoryType === type.id ? "0 0 15px var(--accent-10)" : "none"
                        }}
                    >
                        <span
                            style={{
                                color: sensoryType === type.id ? "var(--accent-color)" : "rgba(253,251,245,0.7)",
                                fontWeight: 500,
                            }}
                        >
                            {type.label}
                        </span>
                        <span
                            style={{
                                fontSize: "8px",
                                color: "rgba(253,251,245,0.4)",
                            }}
                        >
                            {type.description}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
