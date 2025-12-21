import React, { useState, useEffect, useRef } from 'react';
import { getPointById, getBodyScanPrompt } from '../data/bodyScanPrompts';
import { useSettingsStore } from '../state/settingsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CoordinateHelper } from './dev/CoordinateHelper';
export function BodyScanVisual({ elapsedSeconds = 0, activePointId = null, scanPoints = [], scanPrompts = [], image = null }) {
    const [activePoint, setActivePoint] = useState(scanPoints[0] || { id: 'default', x: 50, y: 50, name: 'Center' });
    const [breathPhase, setBreathPhase] = useState(0);
    const animationRef = useRef(null);

    // Update active point based on prop or elapsed time
    useEffect(() => {
        if (activePointId) {
            // Use provided point ID (dev mode)
            const point = scanPoints.find(p => p.id === activePointId) || scanPoints[0];
            if (point) setActivePoint(point);
        } else {
            // Use time-based selection (normal mode)
            let activePrompt = scanPrompts[0];
            for (const prompt of scanPrompts) {
                if (elapsedSeconds >= prompt.timing) {
                    activePrompt = prompt;
                } else {
                    break;
                }
            }
            if (activePrompt) {
                const point = scanPoints.find(p => p.id === activePrompt.point) || scanPoints[0];
                if (point) setActivePoint(point);
            }
        }
    }, [elapsedSeconds, activePointId, scanPoints, scanPrompts]);

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

    // Calculate glow properties based on breath (User requested 75% max opacity and smaller size)
    const glowRadius = 8 + breathPhase * 6;
    const glowOpacity = 0.5 + breathPhase * 0.25;

    // Sushumna Pulse Logic - Only active when sushumna prompt is selected
    const [sushumnaPos, setSushumnaPos] = useState(null);
    useEffect(() => {
        if (activePoint.id === 'nadi_sushumna_top') {
            const top = scanPoints.find(p => p.id === 'nadi_sushumna_top');
            const bottom = scanPoints.find(p => p.id === 'nadi_sushumna_bottom');
            if (!top || !bottom) return;

            const pulseDuration = 2000; // 2 seconds to travel
            const breakDuration = 1000; // 1 second break
            const totalCycle = pulseDuration + breakDuration;

            let pulseStart = performance.now();

            const animatePulse = (now) => {
                const elapsed = now - pulseStart;
                const progress = (elapsed % totalCycle) / pulseDuration;

                if (progress <= 1) {
                    setSushumnaPos({
                        x: top.x + (bottom.x - top.x) * progress,
                        y: top.y + (bottom.y - top.y) * progress,
                        active: true
                    });
                } else {
                    setSushumnaPos({ ...bottom, active: false });
                }
                requestAnimationFrame(animatePulse);
            };

            const animId = requestAnimationFrame(animatePulse);
            return () => cancelAnimationFrame(animId);
        } else {
            setSushumnaPos(null);
        }
    }, [activePoint, scanPoints]);

    return (
        <div className="relative w-full flex items-center justify-center">
            <CoordinateHelper
                className="w-full max-w-sm"
                label={`BodyScan:${image || 'full'}`}
            >
                <div className="relative w-full h-full" style={{ aspectRatio: '1/1' }}>
                    {/* Body silhouette image */}
                    <img
                        key={image || 'default'}
                        src={image ? `${import.meta.env.BASE_URL}sensory/${image}` : `${import.meta.env.BASE_URL}sensory/body-scan-silhouette.png`}
                        alt="Body Scan"
                        className="w-full h-full object-contain transition-opacity duration-700 pointer-events-none"
                        style={{ filter: 'drop-shadow(0 0 20px var(--accent-20))' }}
                    />

                    {/* SVG overlay for chakra points */}
                    <svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 w-full h-full pointer-events-none"
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
                        {scanPoints.map((point) => (
                            <circle
                                key={point.id}
                                cx={point.x}
                                cy={point.y}
                                r={point.id === activePoint.id ? 0 : 1}
                                fill="var(--accent-color)"
                                opacity={0.3}
                            />
                        ))}

                        {/* Sushumna Pulse Point */}
                        {sushumnaPos && sushumnaPos.active && (
                            <circle
                                cx={sushumnaPos.x}
                                cy={sushumnaPos.y}
                                r={3}
                                fill="var(--accent-color)"
                                opacity={0.6}
                            />
                        )}

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
            </CoordinateHelper>
        </div>
    );
}
