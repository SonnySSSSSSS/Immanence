// src/components/OculusRing.jsx
// The "Targeting Frame" - SVG-based HUD ring with breathing animation

import React, { useState, useEffect } from 'react';

export function OculusRing({
    children,
    size = 300,
    totalSteps = 4,
    currentStep = 0,
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
            {/* ═══════════════════════════════════════════════════════════════
                ECLIPSE RIM - Ancient Artifact Physical Ring
                Using CSS shadows for volume instead of flat SVG lines
            ═══════════════════════════════════════════════════════════════ */}

            {/* Base "Obsidian" Ring Body */}
            <div
                className="absolute rounded-full"
                style={{
                    width: '92%',
                    height: '92%',
                    background: 'linear-gradient(135deg, rgba(20,20,30,0.4) 0%, rgba(5,5,10,0.6) 100%)',
                    border: '1px solid rgba(255,215,0,0.1)',
                    boxShadow: `
                        0 0 0 1px rgba(0,0,0,0.8),                /* Outer edge definition */
                        inset 0 0 20px rgba(0,0,0,0.9),           /* Inner depth */
                        0 0 ${20 * glowIntensity}px rgba(255, 200, 100, ${0.1 * breathPhase}) /* Breathing subtle ambient glow */
                    `,
                    backdropFilter: 'blur(4px)',
                    transform: `scale(${breathScale})`,
                    transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
                }}
            />

            {/* The "Golden Wire" - Fine metal rim */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: '92%',
                    height: '92%',
                    border: '1px solid rgba(253, 224, 71, 0.4)', // Amber-gold
                    boxShadow: `
                        inset 0 0 10px rgba(253, 224, 71, 0.2),
                        0 0 ${10 * glowIntensity}px rgba(253, 224, 71, ${0.3 * breathOpacity})
                    `,
                    opacity: 0.8,
                    transform: `scale(${breathScale})`,
                    transition: 'all 0.1s ease-out',
                }}
            />

            {/* Inner "Void" Bezel - Creates the recessed lens look */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: '84%',
                    height: '84%',
                    boxShadow: 'inset 0 0 20px 5px rgba(0,0,0,0.9)', // Deep inner shadow
                    border: '1px solid rgba(255,255,255,0.05)',
                    transform: `scale(${breathScale})`,
                    transition: 'transform 0.1s ease-out',
                }}
            />

            {/* ═══════════════════════════════════════════════════════════════
                 GEMSTONE INDICATORS - Physical Step Markers
            ═══════════════════════════════════════════════════════════════ */}
            <div className="absolute inset-0 pointer-events-none" style={{ transform: `scale(${breathScale})`, transition: 'transform 0.1s ease-out' }}>
                {stepAngles.map((angle, i) => {
                    const radian = (angle * Math.PI) / 180;
                    const radiusPercent = 46; // Matches the 92% width ring (46% radius)
                    const xPercent = 50 + Math.cos(radian) * radiusPercent;
                    const yPercent = 50 + Math.sin(radian) * radiusPercent;

                    const isCompleted = i < currentStep;
                    const isCurrent = i === currentStep;

                    return (
                        <div
                            key={i}
                            className="absolute rounded-full flex items-center justify-center"
                            style={{
                                left: `${xPercent}%`,
                                top: `${yPercent}%`,
                                width: isCurrent ? '12px' : '8px',
                                height: isCurrent ? '12px' : '8px',
                                transform: 'translate(-50%, -50%)',
                                background: isCompleted || isCurrent
                                    ? 'radial-gradient(circle at 30% 30%, #fff 0%, #fbbf24 30%, #92400e 100%)' // PBR Gold Gem
                                    : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, rgba(100,100,100,0.2) 100%)', // Dull Glass
                                boxShadow: isCurrent
                                    ? `0 0 10px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.4)` // Active Glow
                                    : 'inset 0 1px 2px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(0,0,0,0.5)',
                                zIndex: 10,
                                transition: 'all 0.5s ease-out'
                            }}
                        />
                    );
                })}
            </div>

            {/* The Content Layer (Image/Icon goes here) - NOW TRANSPARENT */}
            <div
                className="relative z-10 rounded-full overflow-hidden flex items-center justify-center"
                style={{
                    width: '76%', // Matches inner void
                    height: '76%',
                    pointerEvents: 'none', // Let clicks pass through
                }}
            >
                <div style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}


