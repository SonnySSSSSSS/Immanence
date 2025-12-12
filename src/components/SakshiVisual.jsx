// src/components/SakshiVisual.jsx
// Sakshi (Witness) visualization using void image asset

import React, { useState, useEffect, useRef } from 'react';

export function SakshiVisual({ elapsedSeconds = 0, bellInterval = 150 }) {
    const [breathPhase, setBreathPhase] = useState(0);
    const [showBell, setShowBell] = useState(false);
    const animationRef = useRef(null);
    const lastBellTime = useRef(0);

    // Ambient breathing animation
    useEffect(() => {
        let startTime = performance.now();
        const breathDuration = 8000; // 8 second breath cycle

        const animate = (now) => {
            const elapsed = now - startTime;
            const cycle = (elapsed % breathDuration) / breathDuration;
            const phase = (Math.sin(cycle * Math.PI * 2 - Math.PI / 2) + 1) / 2;
            setBreathPhase(phase);
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Periodic bell flash
    useEffect(() => {
        if (elapsedSeconds > 0 && elapsedSeconds - lastBellTime.current >= bellInterval) {
            setShowBell(true);
            lastBellTime.current = elapsedSeconds;

            const timer = setTimeout(() => setShowBell(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [elapsedSeconds, bellInterval]);

    const imageOpacity = 0.7 + breathPhase * 0.2;
    const glowIntensity = 20 + breathPhase * 15;

    return (
        <div
            className="relative w-full h-64 flex items-center justify-center overflow-hidden rounded-2xl"
            style={{
                background: 'radial-gradient(ellipse at center, rgba(15,15,26,1) 0%, rgba(5,5,8,1) 100%)',
            }}
        >
            {/* Sakshi void image */}
            <img
                src={`${import.meta.env.BASE_URL}sakshi-void.png`}
                alt="Witness"
                className="w-full h-full object-cover transition-all duration-1000"
                style={{
                    opacity: imageOpacity,
                    filter: `drop-shadow(0 0 ${glowIntensity}px var(--accent-20))`,
                }}
            />

            {/* Bell flash overlay */}
            {showBell && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(253,251,245,0.1) 0%, transparent 50%)',
                        animation: 'bellFlash 2s ease-out forwards',
                    }}
                />
            )}

            <style>{`
                @keyframes bellFlash {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
