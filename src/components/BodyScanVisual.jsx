import React, { useState, useEffect, useRef } from 'react';
import { getPointById, getBodyScanPrompt } from '../data/bodyScanPrompts';
import { useSettingsStore } from '../state/settingsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CoordinateHelper } from './dev/CoordinateHelper';
export function BodyScanVisual({ elapsedSeconds = 0, activePointId = null, scanPoints = [], scanPrompts = [], image = null, isLight = false }) {
    const [activePoint, setActivePoint] = useState(scanPoints[0] || { id: 'default', x: 50, y: 50, name: 'Center' });
    const [hoveredPoint, setHoveredPoint] = useState(null);
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
        <div className="relative w-full flex items-center justify-center quiet-zone py-12">
            <CoordinateHelper
                className="w-full max-w-sm"
                label={`BodyScan:${image || 'full'}`}
            >
                <div className={`relative w-full h-full glass-capsule overflow-hidden`} style={{ aspectRatio: '1/1' }}>
                    {/* Interior Quiet Zone Glow */}
                    <div className="absolute inset-0 bg-radial-gradient from-[var(--bg-void)] to-transparent opacity-40 rounded-[2rem] pointer-events-none" />
                    {/* Top Decorative Bar (Ember FX) */}
                    <div
                        className="absolute -top-4 left-0 right-0 h-[2px] ember-fx-bar z-10 pointer-events-none"
                        style={{ opacity: 0.6 }}
                    />
                    {/* Body silhouette image */}
                    <img
                        key={image || 'default'}
                        src={image ? (image.includes('://') || image.startsWith('/') ? image : `${import.meta.env.BASE_URL}sensory/${image}`) : `${import.meta.env.BASE_URL}sensory/body-scan-silhouette.png`}
                        alt="Body Scan"
                        className="w-full h-full object-contain transition-opacity duration-700 pointer-events-none"
                        style={{
                            filter: isLight ? 'none' : 'drop-shadow(0 0 20px var(--accent-20))',
                            maskImage: isLight ? 'radial-gradient(circle at center, black 70%, transparent 100%)' : 'none',
                            WebkitMaskImage: isLight ? 'radial-gradient(circle at center, black 70%, transparent 100%)' : 'none',
                        }}
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

                {/* Interaction layer for hovering points */}
                <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full"
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                    {scanPoints.map((point) => (
                        <circle
                            key={`hit-${point.id}`}
                            cx={point.x}
                            cy={point.y}
                            r={4}
                            fill="transparent"
                            className="pointer-events-auto cursor-help"
                            onMouseEnter={() => setHoveredPoint(point)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                    ))}
                </svg>

                {/* Info Card Overlay (Hover) */}
                <AnimatePresence>
                    {hoveredPoint && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute left-1/2 bottom-[-10%] -translate-x-1/2 w-full max-w-[280px] z-[200] pointer-events-none"
                        >
                            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                                {/* Hybrid Labels Header */}
                                <div className="flex flex-col gap-0.5 mb-3 border-b border-white/5 pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">
                                            {hoveredPoint.label_functional || 'Primary Node'}
                                        </span>
                                        <span className="text-[9px] text-[var(--accent-color)] font-mono opacity-60">
                                            {hoveredPoint.type}
                                        </span>
                                    </div>
                                    <h4 className="text-sm text-white/90 font-medium tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                                        {hoveredPoint.name}
                                    </h4>
                                    <div className="text-[10px] text-white/60">
                                        {hoveredPoint.label_anatomical && `${hoveredPoint.label_anatomical} • `}{hoveredPoint.location}
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="space-y-2.5">
                                    {hoveredPoint.function && (
                                        <div>
                                            <div className="text-[8px] uppercase tracking-wider text-white/30 mb-0.5">Function</div>
                                            <p className="text-[10px] leading-relaxed text-white/80 italic">
                                                {hoveredPoint.function}
                                            </p>
                                        </div>
                                    )}

                                    {(hoveredPoint.physical || hoveredPoint.sensory) && (
                                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                                            {hoveredPoint.physical && (
                                                <div>
                                                    <div className="text-[8px] uppercase tracking-wider text-white/30 mb-0.5">Physical</div>
                                                    <div className="text-[9px] text-white/60 font-mono leading-tight">{hoveredPoint.physical}</div>
                                                </div>
                                            )}
                                            {hoveredPoint.sensory && (
                                                <div>
                                                    <div className="text-[8px] uppercase tracking-wider text-white/30 mb-0.5">Sensory</div>
                                                    <div className="text-[9px] text-white/60 font-mono leading-tight">{hoveredPoint.sensory}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Point name label (Static/Active) */}
                <div
                    className="absolute left-1/2 bottom-6 -translate-x-1/2 pointer-events-none"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: 'var(--accent-color)',
                        opacity: hoveredPoint ? 0 : 0.7, // Hide regular label when hovering
                        transition: 'opacity 0.3s'
                    }}
                >
                    {activePoint.name}
                </div>
            </CoordinateHelper>
        </div>
    );
}
