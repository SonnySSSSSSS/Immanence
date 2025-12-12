// src/components/BodyScanVisual.jsx
// Body scan with image asset and animated focus point

import React, { useState, useEffect, useRef } from 'react';
import { BODY_SCAN_POINTS, getBodyScanPrompt, getPointById } from '../data/bodyScanPrompts.js';

export function BodyScanVisual({ elapsedSeconds = 0, activePointId = null }) {
    const [activePoint, setActivePoint] = useState(BODY_SCAN_POINTS[0]);
    const [breathPhase, setBreathPhase] = useState(0);
    const animationRef = useRef(null);

    // Update active point based on prop or elapsed time
    useEffect(() => {
        if (activePointId) {
            // Use provided point ID (dev mode)
            const point = getPointById(activePointId);
            setActivePoint(point);
        } else {
            // Use time-based selection (normal mode)
            const prompt = getBodyScanPrompt(elapsedSeconds);
            const point = getPointById(prompt.point);
            setActivePoint(point);
        }
    }, [elapsedSeconds, activePointId]);

    // Breathing animation for the focus point
    useEffect(() => {
        const breathDuration = 6000; // 6 second breath cycle
        let startTime = performance.now();

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

    // Calculate glow properties based on breath
    const glowRadius = 12 + breathPhase * 8;
    const glowOpacity = 0.7 + breathPhase * 0.3;

    return (
        <div className="relative w-full flex items-center justify-center">
            <div className="relative w-full max-w-sm" style={{ aspectRatio: '1/1' }}>
                {/* Body silhouette image */}
                <img
                    src={`${import.meta.env.BASE_URL}sensory/body-scan-silhouette.png`}
                    alt="Body Scan"
                    className="w-full h-full object-contain"
                    style={{ filter: 'drop-shadow(0 0 20px var(--accent-20))' }}
                />

                {/* SVG overlay for chakra points */}
                <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        {/* Glow filter for the focus point */}
                        <filter id="focusGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* All body point markers (not active) */}
                    {BODY_SCAN_POINTS.map((point) => (
                        <circle
                            key={point.id}
                            cx={point.x}
                            cy={point.y}
                            r={point.id === activePoint.id ? 0 : 1}
                            fill="var(--accent-color)"
                            opacity={0.3}
                        />
                    ))}

                    {/* Active focus point with breathing glow */}
                    <g filter="url(#focusGlow)">
                        <circle
                            cx={activePoint.x}
                            cy={activePoint.y}
                            r={glowRadius}
                            fill="var(--accent-color)"
                            opacity={glowOpacity * 0.2}
                            style={{
                                transition: 'cx 0.8s ease-out, cy 0.8s ease-out',
                            }}
                        />
                        <circle
                            cx={activePoint.x}
                            cy={activePoint.y}
                            r={4 + breathPhase * 2}
                            fill="var(--accent-color)"
                            opacity={glowOpacity}
                            style={{
                                transition: 'cx 0.8s ease-out, cy 0.8s ease-out',
                            }}
                        />
                    </g>
                </svg>
            </div>

            {/* Point name display */}
            <div
                className="absolute bottom-0 left-0 right-0 text-center"
                style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '10px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-color)',
                    opacity: 0.7,
                }}
            >
                {activePoint.name}
            </div>
        </div>
    );
}
