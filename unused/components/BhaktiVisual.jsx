// src/components/BhaktiVisual.jsx
// Bhakti visualization using ritual image assets

import React, { useState, useEffect, useRef } from 'react';

const RITUAL_IMAGES = {
    gratitude: `${import.meta.env.BASE_URL}bhakti/gratitude.png`,
    heartOpening: `${import.meta.env.BASE_URL}bhakti/heart-opening.png`,
    deityCommunnion: `${import.meta.env.BASE_URL}bhakti/deity-communion.png`,
    surrender: `${import.meta.env.BASE_URL}bhakti/surrender.png`,
    metta: `${import.meta.env.BASE_URL}bhakti/metta.png`,
    forgiveness: `${import.meta.env.BASE_URL}bhakti/forgiveness.png`,
    ancestral: `${import.meta.env.BASE_URL}bhakti/ancestral.png`,
    divineLight: `${import.meta.env.BASE_URL}bhakti/divine-light.png`,
    sankalpa: `${import.meta.env.BASE_URL}bhakti/sankalpa.png`,
    union: `${import.meta.env.BASE_URL}bhakti/union.png`,
};

export function BhaktiVisual({ elapsedSeconds = 0, ritual = 'gratitude' }) {
    const [breathPhase, setBreathPhase] = useState(0);
    const [pulseIntensity, setPulseIntensity] = useState(0);
    const animationRef = useRef(null);

    // Breathing animation
    useEffect(() => {
        const breathDuration = 5000; // 5 second breath cycle
        let startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const cycle = (elapsed % breathDuration) / breathDuration;
            const phase = (Math.sin(cycle * Math.PI * 2 - Math.PI / 2) + 1) / 2;
            setBreathPhase(phase);

            // Secondary slower pulse
            const slowCycle = ((elapsed / 2) % breathDuration) / breathDuration;
            const slowPhase = (Math.sin(slowCycle * Math.PI * 2) + 1) / 2;
            setPulseIntensity(slowPhase);

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const imageOpacity = 0.85 + breathPhase * 0.15;
    const glowIntensity = 15 + breathPhase * 10;

    return (
        <div
            className="relative w-full h-64 flex items-center justify-center overflow-hidden rounded-2xl"
            style={{
                background: 'radial-gradient(ellipse at center, rgba(20,15,25,1) 0%, rgba(8,8,12,1) 100%)',
            }}
        >
            {/* Ritual image with breathing opacity */}
            <img
                src={RITUAL_IMAGES[ritual]}
                alt={ritual}
                className="w-48 h-48 object-contain transition-all duration-300"
                style={{
                    opacity: imageOpacity,
                    filter: `drop-shadow(0 0 ${glowIntensity}px var(--accent-30)) brightness(1.1)`,
                }}
            />

            {/* SVG overlay for radiating lines */}
            <svg
                viewBox="0 0 200 200"
                className="absolute w-64 h-64 pointer-events-none"
                style={{ opacity: 0.1 + breathPhase * 0.05 }}
            >
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line
                        key={angle}
                        x1="100"
                        y1="100"
                        x2={100 + Math.cos((angle * Math.PI) / 180) * (50 + breathPhase * 30)}
                        y2={100 + Math.sin((angle * Math.PI) / 180) * (50 + breathPhase * 30)}
                        stroke="var(--accent-color)"
                        strokeWidth="0.5"
                        strokeOpacity={0.4}
                    />
                ))}
            </svg>

            {/* Ambient glow behind image */}
            <div
                className="absolute rounded-full transition-all duration-1000 pointer-events-none"
                style={{
                    width: `${120 + pulseIntensity * 40}px`,
                    height: `${120 + pulseIntensity * 40}px`,
                    background: `radial-gradient(circle, var(--accent-color) 0%, transparent 70%)`,
                    opacity: (0.15 + breathPhase * 0.1),
                    filter: 'blur(40px)',
                }}
            />
        </div>
    );
}
