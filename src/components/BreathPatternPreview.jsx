// src/components/BreathPatternPreview.jsx
// Animated breath pattern preview with tracer dot
import React, { useEffect, useState, useRef, useMemo } from 'react';

export function BreathPatternPreview({ pattern }) {
    const [dotPosition, setDotPosition] = useState({ x: 5, y: 35 });
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);

    // Calculate total duration
    const totalDuration = useMemo(() =>
        (pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2) || 1,
        [pattern.inhale, pattern.hold1, pattern.exhale, pattern.hold2]
    );

    // Path dimensions (matching SVG viewBox)
    const width = 100;
    const height = 40;
    const padding = 5;

    // Memoize segment calculations
    const segments = useMemo(() => {
        const iW = (pattern.inhale / totalDuration) * (width - padding * 2);
        const h1W = (pattern.hold1 / totalDuration) * (width - padding * 2);
        const eW = (pattern.exhale / totalDuration) * (width - padding * 2);
        const h2W = (pattern.hold2 / totalDuration) * (width - padding * 2);

        return {
            p0: { x: padding, y: height - padding },
            p1: { x: padding + iW, y: padding },
            p2: { x: padding + iW + h1W, y: padding },
            p3: { x: padding + iW + h1W + eW, y: height - padding },
            p4: { x: padding + iW + h1W + eW + h2W, y: height - padding }
        };
    }, [pattern.inhale, pattern.hold1, pattern.exhale, pattern.hold2, totalDuration]);

    // Path string for SVG
    const pathD = `M ${segments.p0.x} ${segments.p0.y} L ${segments.p1.x} ${segments.p1.y} L ${segments.p2.x} ${segments.p2.y} L ${segments.p3.x} ${segments.p3.y} L ${segments.p4.x} ${segments.p4.y}`;

    // Animation matches real breath timing (1:1)
    const SPEED_MULTIPLIER = 1.0;

    useEffect(() => {
        // Initialize start time
        startTimeRef.current = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = (now - startTimeRef.current) / 1000 * SPEED_MULTIPLIER;
            const cycleTime = elapsed % totalDuration;

            const { p0, p1, p2, p3, p4 } = segments;
            let x = p0.x;
            let y = p0.y;

            if (cycleTime < pattern.inhale) {
                // Inhale phase
                const t = cycleTime / pattern.inhale;
                x = p0.x + (p1.x - p0.x) * t;
                y = p0.y + (p1.y - p0.y) * t;
            } else if (cycleTime < pattern.inhale + pattern.hold1) {
                // Hold top phase
                const t = (cycleTime - pattern.inhale) / (pattern.hold1 || 0.001);
                x = p1.x + (p2.x - p1.x) * t;
                y = p1.y;
            } else if (cycleTime < pattern.inhale + pattern.hold1 + pattern.exhale) {
                // Exhale phase
                const t = (cycleTime - pattern.inhale - pattern.hold1) / pattern.exhale;
                x = p2.x + (p3.x - p2.x) * t;
                y = p2.y + (p3.y - p2.y) * t;
            } else {
                // Hold bottom phase
                const holdTime = pattern.hold2 || 0.001;
                const t = (cycleTime - pattern.inhale - pattern.hold1 - pattern.exhale) / holdTime;
                x = p3.x + (p4.x - p3.x) * t;
                y = p3.y;
            }

            setDotPosition({ x, y });
            animationRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [segments, totalDuration, pattern.inhale, pattern.hold1, pattern.exhale, pattern.hold2]);

    return (
        <div
            className="relative w-full h-32 mt-2 rounded-xl overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2)'
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="patternGradientPreview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-20)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                    <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* The path shape */}
                <path
                    d={pathD}
                    fill="url(#patternGradientPreview)"
                    stroke="var(--accent-primary)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Animated tracer dot */}
                <circle
                    cx={dotPosition.x}
                    cy={dotPosition.y}
                    r="1.5"
                    fill="var(--accent-color)"
                    filter="url(#dotGlow)"
                />
            </svg>

            {/* Cycle duration label */}
            <div
                className="absolute bottom-2 left-3 text-[9px] font-semibold tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.3)' }}
            >
                {totalDuration}s Cycle
            </div>

            {/* Phase labels */}
            <div className="absolute bottom-2 right-3 flex gap-2">
                <span style={{ fontSize: "7px", color: "rgba(253,251,245,0.4)", textTransform: 'uppercase', letterSpacing: '0.1em' }}>IN</span>
                <span style={{ fontSize: "7px", color: "rgba(253,251,245,0.4)" }}>•</span>
                <span style={{ fontSize: "7px", color: "rgba(253,251,245,0.4)", textTransform: 'uppercase', letterSpacing: '0.1em' }}>HOLD</span>
                <span style={{ fontSize: "7px", color: "rgba(253,251,245,0.4)" }}>•</span>
                <span style={{ fontSize: "7px", color: "rgba(253,251,245,0.4)", textTransform: 'uppercase', letterSpacing: '0.1em' }}>OUT</span>
                <span style={{ fontSize: "7px", color: "rgba(253,251,245,0.4)" }}>•</span>
                <span style={{ fontSize: "7px", color: "rgba(253,251,245,0.4)", textTransform: 'uppercase', letterSpacing: '0.1em' }}>HOLD</span>
            </div>
        </div>
    );
}
