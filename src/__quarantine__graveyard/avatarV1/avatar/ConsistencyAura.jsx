// src/components/avatar/ConsistencyAura.jsx
// Weekly consistency aura component (currently unused)

import React from "react";

export function ConsistencyAura({ weeklyConsistency = 0 }) {
    const minOpacity = 0.15;
    const maxOpacity = 0.5;
    const opacity = minOpacity + (maxOpacity - minOpacity) * (weeklyConsistency / 7);
    const pulseScale = 0.05 + (0.1 * (weeklyConsistency / 7));
    const centerOpacity = opacity * 0.7;

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
                className="consistency-aura-pulse rounded-full"
                style={{
                    width: "100%",
                    height: "100%",
                    background: `radial-gradient(circle, rgba(252,211,77,${centerOpacity}) 0%, rgba(253,224,71,${centerOpacity * 0.6}) 35%, rgba(253,224,71,${opacity * 0.6}) 50%, transparent 70%)`,
                    filter: "blur(12px)",
                    mixBlendMode: "screen",
                    "--pulse-scale": pulseScale,
                }}
            />
        </div>
    );
}
