// src/components/OculusRing.jsx
// The "Targeting Frame" - SVG-based HUD ring with breathing animation

import React, { useState, useEffect } from 'react';

export function OculusRing({
    children,
    size = 300,
    progress = 0, // 0-1 for step progress
    totalSteps = 4,
    currentStep = 0,
    accentColor = 'var(--accent-color)',
    breathDuration = 6, // 6-second breath cycle
}) {
    // Breathing animation state (0 to 1, where 0.5 is neutral)
    const [breathPhase, setBreathPhase] = useState(0);

    useEffect(() => {
        let animationFrame;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            // Sine wave from 0 to 1 over the breath duration
            const phase = (Math.sin((elapsed / breathDuration) * Math.PI * 2) + 1) / 2;
            setBreathPhase(phase);
            animationFrame = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrame);
    }, [breathDuration]);

    // Calculate breathing effects
    const breathScale = 1 + breathPhase * 0.03; // Subtle 3% expansion
    const breathOpacity = 0.6 + breathPhase * 0.4; // 60% to 100% opacity
    const glowIntensity = 1 + breathPhase * 1.5; // Glow pulsing

    // Calculate step positions around the ring (4 cardinal + additional steps)
    const stepAngles = Array.from({ length: totalSteps }, (_, i) =>
        (i / totalSteps) * 360 - 90 // Start from top (-90 degrees)
    );

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* The HUD Layer - SVG Overlay */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                style={{
                    transform: `scale(${breathScale})`,
                    transition: 'transform 0.1s ease-out',
                }}
            >
                <defs>
                    {/* Gold glow filter - intensity varies with breath */}
                    <filter id="oculus-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={1.5 * glowIntensity} result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Stronger glow for active elements */}
                    <filter id="oculus-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={2.5 * glowIntensity} result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Radial mask for center content */}
                    <radialGradient id="center-fade" cx="50%" cy="50%" r="50%">
                        <stop offset="70%" stopColor="black" stopOpacity="1" />
                        <stop offset="100%" stopColor="black" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Outer Thick Ring - BREATHING */}
                <circle
                    cx="50" cy="50" r="46"
                    fill="none"
                    stroke="var(--accent-color)"
                    strokeWidth="1.5"
                    filter="url(#oculus-glow)"
                    opacity={breathOpacity}
                />

                {/* Inner Thin Ring */}
                <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="var(--accent-secondary)"
                    strokeWidth="0.5"
                    opacity={0.4 + breathPhase * 0.3}
                />

                {/* Innermost decorative ring */}
                <circle
                    cx="50" cy="50" r="38"
                    fill="none"
                    stroke="var(--accent-color)"
                    strokeWidth="0.3"
                    opacity={0.2 + breathPhase * 0.2}
                    strokeDasharray="2 4"
                />

                {/* Cardinal Crosshairs (Tick Marks) - Top, Bottom, Left, Right */}
                <g stroke="var(--accent-color)" strokeWidth="2" filter="url(#oculus-glow)" opacity={breathOpacity}>
                    {/* Top */}
                    <path d="M50 2 V10" />
                    {/* Bottom */}
                    <path d="M50 90 V98" />
                    {/* Left */}
                    <path d="M2 50 H10" />
                    {/* Right */}
                    <path d="M90 50 H98" />
                </g>

                {/* Secondary tick marks (45-degree angles) */}
                <g stroke="var(--accent-color)" strokeWidth="1" opacity={0.3 + breathPhase * 0.3}>
                    {/* Top-Right */}
                    <path d="M83 17 L88 12" />
                    {/* Bottom-Right */}
                    <path d="M83 83 L88 88" />
                    {/* Bottom-Left */}
                    <path d="M17 83 L12 88" />
                    {/* Top-Left */}
                    <path d="M17 17 L12 12" />
                </g>

                {/* Step progress indicators around the ring */}
                {stepAngles.map((angle, i) => {
                    const radian = (angle * Math.PI) / 180;
                    const radius = 46;
                    const x = 50 + Math.cos(radian) * radius;
                    const y = 50 + Math.sin(radian) * radius;
                    const isCompleted = i < currentStep;
                    const isCurrent = i === currentStep;

                    return (
                        <g key={i}>
                            {/* Step indicator dot */}
                            <circle
                                cx={x}
                                cy={y}
                                r={isCurrent ? 3 : 2}
                                fill={isCompleted || isCurrent ? 'var(--accent-color)' : 'transparent'}
                                stroke="var(--accent-color)"
                                strokeWidth={isCurrent ? 1 : 0.5}
                                opacity={isCompleted ? 1 : isCurrent ? breathOpacity : 0.4}
                                filter={isCurrent ? 'url(#oculus-glow-strong)' : 'none'}
                            />

                            {/* Connecting arc to next step (if completed) */}
                            {isCompleted && i < totalSteps - 1 && (
                                <path
                                    d={arcPath(50, 50, 46, angle, stepAngles[i + 1])}
                                    fill="none"
                                    stroke="var(--accent-color)"
                                    strokeWidth="2"
                                    opacity="0.8"
                                    filter="url(#oculus-glow)"
                                />
                            )}
                        </g>
                    );
                })}

                {/* Decorative corner glyphs */}
                <g fill="var(--accent-color)" opacity={0.3 + breathPhase * 0.2} fontSize="4" fontFamily="Georgia, serif">
                    <text x="15" y="15" textAnchor="middle">◆</text>
                    <text x="85" y="15" textAnchor="middle">◆</text>
                    <text x="15" y="88" textAnchor="middle">◆</text>
                    <text x="85" y="88" textAnchor="middle">◆</text>
                </g>
            </svg>

            {/* The Content Layer (Image/Icon goes here) */}
            <div
                className="relative z-10 rounded-full overflow-hidden flex items-center justify-center"
                style={{
                    width: '76%',
                    height: '76%',
                    background: 'radial-gradient(circle at center, rgba(15,15,26,0.95) 0%, rgba(5,5,10,0.98) 70%, transparent 100%)',
                }}
            >
                {children}
            </div>
        </div>
    );
}

// Helper function to create SVG arc path
function arcPath(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, r, angleInDegrees) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians),
    };
}
