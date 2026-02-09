// src/components/PhoticCirclesOverlay.jsx
// Photic circles entrainment overlay
// Two pulsing circles with RAF-based timing (horizontal layout)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoticControlPanel } from './PhoticControlPanel';
import { useEffectivePhotic } from '../hooks/useEffectiveSettings';
import { computePhoticLayout } from '../utils/photicLayout';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';

export function PhoticCirclesOverlay({ isOpen, onClose, autoStart = false }) {
    const photic = useEffectivePhotic();
    const displayMode = useDisplayModeStore((s) => s.mode);

    // Component state (not persisted)
    // Initialize to autoStart value to prevent flash of control panel
    const [isRunning, setIsRunning] = useState(autoStart);

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
    const [, forceViewportUpdate] = useState(0);

    const viewW = typeof window !== 'undefined'
        ? Math.round(window.visualViewport?.width || window.innerWidth || 0)
        : 0;
    const viewH = typeof window !== 'undefined'
        ? Math.round(window.visualViewport?.height || window.innerHeight || 0)
        : 0;

    // Always render the photic stage in a landscape coordinate system.
    // In portrait viewports, the stage rotates 90deg to stay landscape-oriented.
    const isViewportPortrait = viewH > viewW;
    const stageOuterW = Math.max(viewW, viewH);
    const stageOuterH = Math.min(viewW, viewH);
    const stageRotationDeg = isViewportPortrait ? 90 : 0;

    // Keep viewport dimensions in sync so layout responds to orientation/resize changes.
    useEffect(() => {
        if (!isOpen) return;

        const updateViewport = () => {
            // Trigger re-render; we read dimensions directly from visualViewport/innerWidth.
            forceViewportUpdate((v) => (v + 1) % 1000000);
        };

        updateViewport();
        window.addEventListener('resize', updateViewport, { passive: true });
        window.addEventListener('orientationchange', updateViewport, { passive: true });
        window.visualViewport?.addEventListener('resize', updateViewport, { passive: true });

        return () => {
            window.removeEventListener('resize', updateViewport);
            window.removeEventListener('orientationchange', updateViewport);
            window.visualViewport?.removeEventListener('resize', updateViewport);
        };
    }, [isOpen]);

    // Sync isRunning with autoStart when overlay opens.
    useEffect(() => {
        if (!isOpen) return;
        if (autoStart) setIsRunning(true);
    }, [isOpen, autoStart]);

    // Best-effort landscape lock while overlay is open (supported browsers only).
    useEffect(() => {
        if (!isOpen || typeof screen === 'undefined') return;

        const orientation = screen.orientation;
        if (!orientation || typeof orientation.lock !== 'function') return;

        let locked = false;
        let cleanedUp = false;

        Promise.resolve(orientation.lock('landscape'))
            .then(() => {
                if (cleanedUp) {
                    if (typeof orientation.unlock === 'function') orientation.unlock();
                    return;
                }
                locked = true;
            })
            .catch(() => {
                // Ignore lock failures (unsupported browser, not fullscreen, permissions).
            });

        return () => {
            cleanedUp = true;
            if (locked && typeof orientation.unlock === 'function') {
                orientation.unlock();
            }
        };
    }, [isOpen]);

    // Pulse loop using requestAnimationFrame
    const pulseLoop = useCallback(function pulseLoopFrame() {
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

        rafRef.current = requestAnimationFrame(pulseLoopFrame);
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

    // Drag state for adjusting spacing (landscape X axis).
    // In portrait viewports the stage rotates 90deg, so we use Y movement to adjust spacing.
    const [isDragging, setIsDragging] = useState(false);
    const dragStartAxis = useRef(0);
    const dragStartSpacing = useRef(0);
    const getDragAxis = (e) => (isViewportPortrait ? e.clientY : e.clientX);

    // Handle pointer down - start potential drag
    const handlePointerDown = (e) => {
        if (isRunning) {
            setIsDragging(true);
            dragStartAxis.current = getDragAxis(e);
            dragStartSpacing.current = photic.spacingPx || 160;
            e.preventDefault();
        }
    };

    // Handle pointer move - adjust spacing (horizontal drag for horizontal layout)
    const handlePointerMove = (e) => {
        if (isDragging && isRunning) {
            const delta = getDragAxis(e) - dragStartAxis.current;
            // Scale: 1px drag = 1px spacing change
            const newSpacing = Math.max(40, Math.min(800, dragStartSpacing.current + delta));
            useSettingsStore.getState().setPhoticSetting('spacingPx', newSpacing);
            e.preventDefault();
        }
    };

    // Handle pointer up - end drag or exit if no drag occurred
    const handlePointerUp = (e) => {
        if (isRunning) {
            const dragDistance = Math.abs(getDragAxis(e) - dragStartAxis.current);
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

    const interfaceWidthCap = displayMode === 'sanctuary' ? 820 : 430;
    const stageInnerW = Math.max(0, Math.min(interfaceWidthCap, stageOuterW));

    // Compute layout for circles (stage is constrained to UI width, full viewport height)
    const layout = computePhoticLayout({
        containerWidth: stageInnerW,
        containerHeight: stageOuterH,
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
                    cursor: isRunning
                        ? (isDragging ? (isViewportPortrait ? 'ns-resize' : 'ew-resize') : 'pointer')
                        : 'default',
                    overflow: 'hidden',
                }}
            >
                {/* Circles Stage (always landscape; rotates in portrait viewports) */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: `${stageOuterW}px`,
                        height: `${stageOuterH}px`,
                        transform: `translate(-50%, -50%) rotate(${stageRotationDeg}deg)`,
                        transformOrigin: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'stretch',
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            width: `${stageInnerW}px`,
                            height: '100%',
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
