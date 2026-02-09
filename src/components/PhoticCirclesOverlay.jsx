// src/components/PhoticCirclesOverlay.jsx
// Photic circles entrainment overlay
// Two pulsing circles with RAF-based timing (horizontal layout)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoticControlPanel } from './PhoticControlPanel';
import { useEffectivePhotic } from '../hooks/useEffectiveSettings';
import { computePhoticLayout } from '../utils/photicLayout';
import { useSettingsStore } from '../state/settingsStore';

export function PhoticCirclesOverlay({ isOpen, onClose, autoStart = false }) {
    const photic = useEffectivePhotic();

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

    // Drag state for adjusting spacing (horizontal layout, use X movement)
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragStartSpacing = useRef(0);

    // Handle pointer down - start potential drag
    const handlePointerDown = (e) => {
        if (isRunning) {
            setIsDragging(true);
            dragStartX.current = e.clientX;
            dragStartSpacing.current = photic.spacingPx || 160;
            e.preventDefault();
        }
    };

    // Handle pointer move - adjust spacing (horizontal drag for horizontal layout)
    const handlePointerMove = (e) => {
        if (isDragging && isRunning) {
            const deltaX = e.clientX - dragStartX.current;
            // Scale: 1px drag = 1px spacing change
            const newSpacing = Math.max(40, Math.min(800, dragStartSpacing.current + deltaX));
            useSettingsStore.getState().setPhoticSetting('spacingPx', newSpacing);
            e.preventDefault();
        }
    };

    // Handle pointer up - end drag or exit if no drag occurred
    const handlePointerUp = (e) => {
        if (isRunning) {
            const dragDistance = Math.abs(e.clientX - dragStartX.current);
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

    // Compute layout for circles (full-screen overlay uses viewport dimensions)
    const layout = computePhoticLayout({
        containerWidth: window.innerWidth,
        containerHeight: window.innerHeight,
        radiusPx: photic.radiusPx || 120,
        spacingPx: photic.spacingPx || 160,
        horizontalMargins: 80, // More margin for full-screen
        verticalMargins: 80,
    });

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
                    backgroundColor: '#000000', // Pure black
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isRunning ? (isDragging ? 'ew-resize' : 'pointer') : 'default',
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
                    {/* Left Circle */}
                    <div
                        ref={leftCircleRef}
                        className="photic-circle-left"
                        style={{
                            position: 'absolute',
                            top: `${layout.leftCircleY}px`,
                            left: `${layout.leftCircleX}px`,
                            transform: 'translate(-50%, -50%)',
                            width: `${layout.scaledRadius * 2}px`,
                            height: `${layout.scaledRadius * 2}px`,
                            borderRadius: '9999px',
                            backgroundColor: photic.colorLeft || '#FFFFFF',
                            opacity: 0,
                            boxShadow: 'none',
                            transition: 'none', // RAF handles timing
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Right Circle */}
                    <div
                        ref={rightCircleRef}
                        className="photic-circle-right"
                        style={{
                            position: 'absolute',
                            top: `${layout.rightCircleY}px`,
                            left: `${layout.rightCircleX}px`,
                            transform: 'translate(-50%, -50%)',
                            width: `${layout.scaledRadius * 2}px`,
                            height: `${layout.scaledRadius * 2}px`,
                            borderRadius: '9999px',
                            backgroundColor: photic.colorRight || '#FFFFFF',
                            opacity: 0,
                            boxShadow: 'none',
                            transition: 'none', // RAF handles timing
                            pointerEvents: 'none',
                        }}
                    />
                </div>

                {/* No instruction text - clean interface */}

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
