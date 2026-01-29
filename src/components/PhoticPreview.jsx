// src/components/PhoticPreview.jsx
// Live preview of photic circles effect for control panel
// Reuses the same RAF-based timing/rendering logic as PhoticCirclesOverlay
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { computePhoticLayout } from '../utils/photicLayout';

export function PhoticPreview() {
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const isLight = colorScheme === 'light';
    const { photic } = useSettingsStore();

    // Refs for RAF loop and DOM manipulation
    const rafRef = useRef(null);
    const startTimeRef = useRef(null);
    const leftCircleRef = useRef(null);
    const rightCircleRef = useRef(null);
    const containerRef = useRef(null);

    // Container dimensions
    const [containerWidth, setContainerWidth] = useState(0);
    const containerHeight = 96;

    // Visibility tracking for performance hygiene
    const isActiveRef = useRef(true);
    const isIntersectingRef = useRef(true);

    // Pulse loop - identical logic to PhoticCirclesOverlay
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

        // Only update if component is visible (for performance)
        if (isActiveRef.current && isIntersectingRef.current) {
            // Direct DOM updates (no React re-render)
            if (leftCircleRef.current) {
                leftCircleRef.current.style.opacity = leftIntensity;
            }
            if (rightCircleRef.current) {
                rightCircleRef.current.style.opacity = rightIntensity;
            }
        }

        // Request next frame only if active
        if (isActiveRef.current && isIntersectingRef.current) {
            rafRef.current = requestAnimationFrame(pulseLoop);
        }
    }, [photic.rateHz, photic.dutyCycle, photic.brightness, photic.timingMode, photic.gapMs]);

    // Start RAF loop on mount, cleanup on unmount
    useEffect(() => {
        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(pulseLoop);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [pulseLoop]);

    // Reset phase when timing parameters change
    useEffect(() => {
        startTimeRef.current = performance.now();
    }, [photic.rateHz, photic.dutyCycle, photic.timingMode, photic.gapMs]);

    // Measure container width via ResizeObserver
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Set initial width
        setContainerWidth(container.offsetWidth);

        // Create ResizeObserver to track width changes
        const resizeObserver = new ResizeObserver(() => {
            setContainerWidth(container.offsetWidth);
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Track document visibility (tab background/foreground)
    useEffect(() => {
        const handleVisibilityChange = () => {
            isActiveRef.current = document.visibilityState === 'visible';
            if (isActiveRef.current && isIntersectingRef.current) {
                // Resume RAF loop when becoming visible
                startTimeRef.current = performance.now();
                rafRef.current = requestAnimationFrame(pulseLoop);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [pulseLoop]);

    // Track container visibility (on-screen detection)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isIntersectingRef.current = entry.isIntersecting;
                if (isIntersectingRef.current && isActiveRef.current && !rafRef.current) {
                    // Resume RAF loop when becoming visible
                    startTimeRef.current = performance.now();
                    rafRef.current = requestAnimationFrame(pulseLoop);
                }
            },
            { threshold: 0 }
        );

        intersectionObserver.observe(container);

        return () => {
            intersectionObserver.disconnect();
        };
    }, [pulseLoop]);

    // Get available space via helper
    const layout = computePhoticLayout({
        containerWidth,
        containerHeight,
        radiusPx: photic.radiusPx,
        spacingPx: photic.spacingPx,
        horizontalMargins: 40,
        verticalMargins: 12,
    });

    const { availW, availH } = layout;

    // Preview-only direct mapping: map raw slider values independently
    // This ensures full range visibility in small container without re-coupling radius/spacing
    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const lerp = (a, b, t) => a + (b - a) * t;

    // Radius: map slider to visible range (rCap * 0.25 to rCap * 1.0)
    const radiusNorm = clamp01((photic.radiusPx - 40) / 200);
    const rCap = Math.max(0, availH / 2);
    const previewScaledRadius = rCap * (0.25 + radiusNorm * 0.75);

    // Spacing (FULLY DECOUPLED):
    // Map to fixed display range (40-200px), completely independent of radius
    const spacingNorm = clamp01((photic.spacingPx - 40) / 760);
    const previewScaledSpacing = lerp(40, 200, spacingNorm);
    // No sCap constraint—radius and spacing are fully independent
    // Circles may overflow at extreme combos; that's intentional for a true preview

    // Compute positions for horizontal layout (center-to-center ONLY)
    const previewCenterX = containerWidth / 2;
    const previewLeftCircleX = previewCenterX - previewScaledSpacing / 2;
    const previewRightCircleX = previewCenterX + previewScaledSpacing / 2;

    const textColors = {
        faint: isLight ? '#9A8D78' : 'rgba(253,251,245,0.4)',
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '96px',
                backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${isLight ? 'rgba(160, 120, 60, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Circles Container - landscape layout */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            >
                {/* Left Circle - positioned horizontally with preview scaling */}
                <div
                    ref={leftCircleRef}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${previewLeftCircleX}px`,
                        transform: 'translate(-50%, -50%)',
                        width: `${previewScaledRadius * 2}px`,
                        height: `${previewScaledRadius * 2}px`,
                        borderRadius: '9999px',
                        backgroundColor: photic.colorLeft || '#FFFFFF',
                        opacity: 0,
                        boxShadow: 'none',
                        transition: 'none',
                        pointerEvents: 'none',
                    }}
                />

                {/* Right Circle - positioned horizontally with preview scaling */}
                <div
                    ref={rightCircleRef}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${previewRightCircleX}px`,
                        transform: 'translate(-50%, -50%)',
                        width: `${previewScaledRadius * 2}px`,
                        height: `${previewScaledRadius * 2}px`,
                        borderRadius: '9999px',
                        backgroundColor: photic.colorRight || '#FFFFFF',
                        opacity: 0,
                        boxShadow: 'none',
                        transition: 'none',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            {/* DEV-only labels and debug info */}
            {import.meta.env.DEV && (
                <>
                    {/* Label above preview */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-16px',
                            left: '0',
                            fontSize: '8px',
                            color: textColors.faint,
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            opacity: 0.6,
                            pointerEvents: 'none',
                        }}
                    >
                        Live preview (scaled)
                    </div>

                    {/* Debug overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '2px',
                            right: '4px',
                            fontSize: '6px',
                            color: 'rgba(255,255,255,0.4)',
                            fontFamily: 'monospace',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            padding: '2px 4px',
                            borderRadius: '2px',
                            pointerEvents: 'none',
                            lineHeight: '1.2',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <div>W:{containerWidth.toFixed(0)} H:{containerHeight} (avail:{availW.toFixed(0)}x{availH.toFixed(0)})</div>
                        <div>preview: r:{previewScaledRadius.toFixed(1)} s:{previewScaledSpacing.toFixed(1)}</div>
                        <div>L:{previewLeftCircleX.toFixed(0)}px R:{previewRightCircleX.toFixed(0)}px</div>
                    </div>
                </>
            )}

            {/* Subtle label */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '8px',
                    fontSize: '7px',
                    color: textColors.faint,
                    fontFamily: 'var(--font-body)',
                    opacity: 0.5,
                    pointerEvents: 'none',
                }}
            >
                PREVIEW
            </div>
        </div>
    );
}
