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
    const [isRunning, setIsRunning] = useState(false);

    // Auto-start when overlay opens with autoStart=true
    useEffect(() => {
        if (isOpen && autoStart) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => setIsRunning(true), 100);
            return () => clearTimeout(timer);
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
        const now = performance.now();
        const periodMs = 1000 / photic.rateHz;
        const elapsed = (now - startTimeRef.current) % periodMs;
        
        let leftIntensity, rightIntensity;

        if (photic.timingMode === 'alternating') {
            // Alternating mode: 180° phase offset
            // Left circle pulses in first half, right in second half
            const halfPeriod = periodMs / 2;
            const effectiveDutyCycle = photic.dutyCycle * periodMs;
            const gapMs = photic.gapMs;

            // Left circle: active in first half of period
            const leftPhase = elapsed;
            const leftIsOn = leftPhase < (effectiveDutyCycle - gapMs);
            leftIntensity = leftIsOn ? photic.brightness : 0;

            // Right circle: active in second half of period (180° offset)
            const rightPhase = (elapsed + halfPeriod) % periodMs;
            const rightIsOn = rightPhase < (effectiveDutyCycle - gapMs);
            rightIntensity = rightIsOn ? photic.brightness : 0;
        } else {
            // Simultaneous mode: both circles pulse together
            const isOn = elapsed < photic.dutyCycle * periodMs;
            const intensity = isOn ? photic.brightness : 0;
            leftIntensity = intensity;
            rightIntensity = intensity;
        }

        // Update left circle
        if (leftCircleRef.current) {
            leftCircleRef.current.style.opacity = leftIntensity;
        }

        // Update right circle
        if (rightCircleRef.current) {
            rightCircleRef.current.style.opacity = rightIntensity;
        }

        rafRef.current = requestAnimationFrame(pulseLoop);
    }, [photic.rateHz, photic.dutyCycle, photic.brightness, photic.timingMode, photic.gapMs]);

    // Start/stop RAF loop
    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = performance.now();
            lastIntensityRef.current = 0;
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
    }, [isRunning, pulseLoop]);

    // Reset phase when timing parameters change during running
    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = performance.now();
        }
    }, [photic.rateHz, photic.dutyCycle, photic.timingMode, photic.gapMs, isRunning]);

    // Drag state for adjusting spacing
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartSpacing = useRef(0);

    // Handle pointer down - start potential drag
    const handlePointerDown = (e) => {
        if (isRunning) {
            setIsDragging(true);
            dragStartY.current = e.clientY;
            dragStartSpacing.current = photic.spacingPx;
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

    // Toggle running state (for control panel button)
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
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    backgroundColor: `rgba(0, 0, 0, ${photic.bgOpacity})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isRunning ? (isDragging ? 'ns-resize' : 'pointer') : 'default',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {/* Circles Container */}
                <div
                    style={{
                        position: 'relative',
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
                            top: `calc(50% - ${photic.spacingPx / 2}px)`,
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: `${photic.radiusPx * 2}px`,
                            height: `${photic.radiusPx * 2}px`,
                            borderRadius: '9999px',
                            backgroundColor: photic.colorLeft,
                            opacity: 0,
                            boxShadow: `0 0 ${photic.blurPx}px ${photic.blurPx / 2}px ${photic.colorLeft}`,
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
                            top: `calc(50% + ${photic.spacingPx / 2}px)`,
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: `${photic.radiusPx * 2}px`,
                            height: `${photic.radiusPx * 2}px`,
                            borderRadius: '9999px',
                            backgroundColor: photic.colorRight,
                            opacity: 0,
                            boxShadow: `0 0 ${photic.blurPx}px ${photic.blurPx / 2}px ${photic.colorRight}`,
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
                        }}
                    >
                        Tap to exit • Drag to adjust spacing
                    </motion.div>
                )}

                {/* Control Panel - Only show when NOT running */}
                {!isRunning && (
                    <div onClick={(e) => e.stopPropagation()}>
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

