// src/components/PhoticCirclesOverlay.jsx
// Photic circles entrainment overlay
// Two pulsing circles with RAF-based timing
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoticControlPanel } from './PhoticControlPanel';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';

export function PhoticCirclesOverlay({ isOpen, onClose, autoStart = false }) {
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const isLight = colorScheme === 'light';
    const { photic } = useSettingsStore();

    // Component state (not persisted)
    // Initialize to autoStart value to prevent flash of control panel
    const [isRunning, setIsRunning] = useState(autoStart);

    // Sync isRunning with autoStart when overlay opens
    useEffect(() => {
        if (isOpen && autoStart) {
            setIsRunning(true);
        }
    }, [isOpen, autoStart]);

    // Reset running state when overlay closes
    useEffect(() => {
        if (!isOpen) {
            setIsRunning(false);
        }
    }, [isOpen]);

    // Refs for RAF loop and DOM manipulation
    const rafRef = useRef(null);
    const startTimeRef = useRef(null);
    const lastIntensityRef = useRef(0);
    const leftCircleRef = useRef(null);
    const rightCircleRef = useRef(null);

    // Pulse loop using requestAnimationFrame
    const pulseLoop = useCallback(() => {
        // Fallback for missing startTime
        if (startTimeRef.current === null) {
            startTimeRef.current = performance.now();
        }

        const now = performance.now();
        const rate = photic.rateHz || 2.0;
        const duty = photic.dutyCycle || 0.5;
        const brightness = photic.brightness ?? 0.6;
        const mode = photic.timingMode || 'simultaneous';
        const gap = photic.gapMs || 0;

        const periodMs = 1000 / rate;
        const elapsed = (now - startTimeRef.current) % periodMs;
        
        let leftIntensity = 0, rightIntensity = 0;

        if (mode === 'alternating') {
            // Alternating mode: 180° phase offset
            const halfPeriod = periodMs / 2;
            const effectiveDutyCycle = duty * periodMs;

            // Left circle: active in first half of period
            const leftPhase = elapsed;
            const leftIsOn = leftPhase < (effectiveDutyCycle - gap);
            leftIntensity = leftIsOn ? brightness : 0;

            // Right circle: active in second half of period (180° offset)
            const rightPhase = (elapsed + halfPeriod) % periodMs;
            const rightIsOn = rightPhase < (effectiveDutyCycle - gap);
            rightIntensity = rightIsOn ? brightness : 0;
        } else {
            // Simultaneous mode: both circles pulse together
            const isOn = elapsed < (duty * periodMs);
            const intensity = isOn ? brightness : 0;
            leftIntensity = intensity;
            rightIntensity = intensity;
        }

        // Direct DOM updates (no React re-render)
        if (leftCircleRef.current) {
            leftCircleRef.current.style.opacity = leftIntensity;
        }
        if (rightCircleRef.current) {
            rightCircleRef.current.style.opacity = rightIntensity;
        }

        rafRef.current = requestAnimationFrame(pulseLoop);
    }, [photic.rateHz, photic.dutyCycle, photic.brightness, photic.timingMode, photic.gapMs]);

    // Start/stop RAF loop
    useEffect(() => {
        if (isRunning && isOpen) {
            startTimeRef.current = performance.now();
            rafRef.current = requestAnimationFrame(pulseLoop);
        } else {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            // Reset circle opacity when stopped
            if (leftCircleRef.current) leftCircleRef.current.style.opacity = 0;
            if (rightCircleRef.current) rightCircleRef.current.style.opacity = 0;
        }

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [isRunning, isOpen, pulseLoop]);

    // Reset phase when timing parameters change during running
    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = performance.now();
        }
    }, [photic.rateHz, photic.dutyCycle, photic.timingMode, photic.gapMs]);

    // Drag state for adjusting spacing
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartSpacing = useRef(0);

    // Handle pointer down - start potential drag
    const handlePointerDown = (e) => {
        if (isRunning) {
            setIsDragging(true);
            dragStartY.current = e.clientY;
            dragStartSpacing.current = photic.spacingPx || 160;
            e.preventDefault();
        }
    };

    // Handle pointer move - adjust spacing
    const handlePointerMove = (e) => {
        if (isDragging && isRunning) {
            const deltaY = e.clientY - dragStartY.current;
            // Scale: 1px drag = 1px spacing change
            const newSpacing = Math.max(40, Math.min(800, dragStartSpacing.current + deltaY));
            useSettingsStore.getState().setPhoticSetting('spacingPx', newSpacing);
            e.preventDefault();
        }
    };

    // Handle pointer up - end drag or exit if no drag occurred
    const handlePointerUp = (e) => {
        if (isRunning) {
            const dragDistance = Math.abs(e.clientY - dragStartY.current);
            setIsDragging(false);
            
            // If drag distance is small (< 10px), treat as tap to exit
            if (dragDistance < 10) {
                setIsRunning(false);
                onClose();
            }
        }
    };

    // Toggle running state (for potential future use, though we skip panel if autoStart is true)
    const handleToggleRunning = () => {
        setIsRunning((prev) => !prev);
    };

    // Close overlay (stop pulse first)
    const handleClose = () => {
        setIsRunning(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="photic-circles-overlay"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000, // Very high to cover everything
                    backgroundColor: `rgba(0, 0, 0, ${photic.bgOpacity || 0.95})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isRunning ? (isDragging ? 'ns-resize' : 'pointer') : 'default',
                    overflow: 'hidden',
                }}
            >
                {/* Circles Container */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                    }}
                >
                    {/* Top Circle */}
                    <div
                        ref={leftCircleRef}
                        className="photic-circle-top"
                        style={{
                            position: 'absolute',
                            top: `calc(50% - ${(photic.spacingPx || 160) / 2}px)`,
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: `${(photic.radiusPx || 120) * 2}px`,
                            height: `${(photic.radiusPx || 120) * 2}px`,
                            borderRadius: '9999px',
                            backgroundColor: photic.colorLeft || '#FFFFFF',
                            opacity: 0,
                            boxShadow: `0 0 ${photic.blurPx || 20}px ${ (photic.blurPx || 20) / 2}px ${photic.colorLeft || '#FFFFFF'}`,
                            transition: 'none', // RAF handles timing
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Bottom Circle */}
                    <div
                        ref={rightCircleRef}
                        className="photic-circle-bottom"
                        style={{
                            position: 'absolute',
                            top: `calc(50% + ${(photic.spacingPx || 160) / 2}px)`,
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: `${(photic.radiusPx || 120) * 2}px`,
                            height: `${(photic.radiusPx || 120) * 2}px`,
                            borderRadius: '9999px',
                            backgroundColor: photic.colorRight || '#FFFFFF',
                            opacity: 0,
                            boxShadow: `0 0 ${photic.blurPx || 20}px ${ (photic.blurPx || 20) / 2}px ${photic.colorRight || '#FFFFFF'}`,
                            transition: 'none', // RAF handles timing
                            pointerEvents: 'none',
                        }}
                    />
                </div>

                {/* Tap to stop instruction (when running) */}
                {isRunning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            bottom: '40px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontFamily: 'var(--font-display)',
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-wide)',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.4)',
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                    >
                        Tap to exit • Drag to adjust spacing
                    </motion.div>
                )}

                {/* Control Panel - Only show if NOT auto-starting, or if explicitly stopped */}
                {/* This eliminates the redundant menu when starting from the practice card */}
                {!isRunning && !autoStart && (
                    <div onClick={(e) => e.stopPropagation()} style={{ zIndex: 10 }}>
                        <PhoticControlPanel
                            isRunning={isRunning}
                            onToggleRunning={handleToggleRunning}
                            onClose={handleClose}
                        />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
