// src/components/PhoticCirclesOverlay.jsx
// Photic circles entrainment overlay
// Two pulsing circles with RAF-based timing
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoticControlPanel } from './PhoticControlPanel';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';

export function PhoticCirclesOverlay({ isOpen, onClose }) {
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const isLight = colorScheme === 'light';
    const { photic } = useSettingsStore();

    // Component state (not persisted)
    const [isRunning, setIsRunning] = useState(false);

    // Refs for RAF loop and DOM manipulation
    const rafRef = useRef(null);
    const startTimeRef = useRef(null);
    const lastIntensityRef = useRef(0);
    const leftCircleRef = useRef(null);
    const rightCircleRef = useRef(null);

    // Pulse loop using requestAnimationFrame
    const pulseLoop = useCallback(() => {
        if (!isRunning) return;

        const now = performance.now();
        const periodMs = 1000 / photic.rateHz;
        const elapsed = (now - startTimeRef.current) % periodMs;
        const isOn = elapsed < photic.dutyCycle * periodMs;

        // Square wave: full brightness when on, 0 when off
        const intensity = isOn ? photic.brightness : 0;

        // Only update DOM when intensity actually changes
        if (intensity !== lastIntensityRef.current) {
            lastIntensityRef.current = intensity;

            // Direct DOM updates (no React re-render)
            if (leftCircleRef.current) {
                leftCircleRef.current.style.opacity = intensity;
            }
            if (rightCircleRef.current) {
                rightCircleRef.current.style.opacity = intensity;
            }
        }

        rafRef.current = requestAnimationFrame(pulseLoop);
    }, [isRunning, photic.rateHz, photic.dutyCycle, photic.brightness]);

    // Start/stop RAF loop
    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = performance.now();
            rafRef.current = requestAnimationFrame(pulseLoop);
        } else {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        }

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [isRunning, pulseLoop]);

    // Reset phase when rate or dutyCycle changes during running
    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = performance.now();
        }
    }, [photic.rateHz, photic.dutyCycle]);

    // Toggle running state
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
                }}
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

                {/* Control Panel */}
                <PhoticControlPanel
                    isRunning={isRunning}
                    onToggleRunning={handleToggleRunning}
                    onClose={handleClose}
                />
            </motion.div>
        </AnimatePresence>
    );
}
