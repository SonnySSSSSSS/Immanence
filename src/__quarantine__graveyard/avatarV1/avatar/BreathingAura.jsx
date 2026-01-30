// src/components/avatar/BreathingAura.jsx
// Breathing animation component for practice mode

import React, { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext.jsx";

export function BreathingAura({ breathPattern }) {
    const {
        inhale = 4,
        holdTop = 4,
        exhale = 4,
        holdBottom = 2,
    } = breathPattern || {};

    const total = inhale + holdTop + exhale + holdBottom;
    const minScale = 0.75;
    const maxScale = 1.15;

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!total || total <= 0) return;
        const cycleMs = total * 1000;
        const start = performance.now();
        let frameId = null;

        const loop = (now) => {
            const elapsed = now - start;
            const t = (elapsed % cycleMs) / cycleMs;
            setProgress(t);
            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [total]);

    if (!total) return null;

    const tInhale = inhale / total;
    const tHoldTop = (inhale + holdTop) / total;
    const tExhale = (inhale + holdTop + exhale) / total;

    let scale = minScale;
    if (progress < tInhale) {
        scale = minScale + (maxScale - minScale) * (progress / tInhale);
    } else if (progress < tHoldTop) {
        scale = maxScale;
    } else if (progress < tExhale) {
        scale = maxScale - (maxScale - minScale) * ((progress - tHoldTop) / (tExhale - tHoldTop));
    } else {
        scale = minScale;
    }

    const theme = useTheme();
    const gradient = 'radial-gradient(circle, var(--accent-80) 0%, var(--accent-40) 32%, var(--accent-20) 58%, rgba(248,250,252,0.02) 75%, transparent 100%)';

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
                className="rounded-full"
                style={{
                    width: "80%",
                    height: "80%",
                    background: gradient,
                    filter: "blur(6px)",
                    transform: `scale(${scale})`,
                    transition: "transform 80ms linear, background 2s ease",
                    mixBlendMode: "screen",
                }}
            />
            <div
                className="rounded-full absolute"
                style={{
                    width: "80%",
                    height: "80%",
                    background: `radial-gradient(circle at 30% 30%, rgba(252, 211, 77, 0.3) 0%, transparent 40%)`,
                    filter: "blur(8px)",
                    transform: `scale(${scale})`,
                    transition: "transform 80ms linear",
                    mixBlendMode: "screen",
                }}
            />
        </div>
    );
}
