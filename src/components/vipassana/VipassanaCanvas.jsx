// src/components/vipassana/VipassanaCanvas.jsx
// Canvas-based renderer for Vipassana thoughts
// AA-Level: Stamp-based rendering with pre-baked tints

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { initializeStamps, getStamp, getHazeStamps } from '../../utils/stamps.js';

export function VipassanaCanvas({
    thoughts = [],
    theme,
    onThoughtTap,
    onThoughtLongPress,
}) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const longPressThoughtRef = useRef(null);

    // Dev debug overlay toggle
    const [showDebug, setShowDebug] = useState(false);
    const [fps, setFps] = useState(60);
    const lastFrameTimeRef = useRef(performance.now());
    const frameCountRef = useRef(0);
    const stampsReadyRef = useRef(false);

    // Initialize stamps once on mount
    useEffect(() => {
        initializeStamps();
        stampsReadyRef.current = true;
    }, []);

    // DPR calculation with battery awareness
    const getDPR = useCallback(() => {
        // Check battery status (if available)
        const isBattery = navigator.getBattery?.()?.then(battery => !battery.charging);
        const dprCap = isBattery ? 1.5 : 2.0;
        return Math.min(window.devicePixelRatio || 1, dprCap);
    }, []);

    // Hit-testing: Find thought at coordinate
    const getThoughtAtCoordinate = useCallback((x, y) => {
        if (!canvasRef.current) return null;

        const rect = canvasRef.current.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;

        // Iterate in reverse (top-most first)
        for (let i = thoughts.length - 1; i >= 0; i--) {
            const thought = thoughts[i];
            const dx = canvasX - thought.x;
            const dy = canvasY - thought.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Use a default radius of 36px (half of 72px thought size)
            const radius = 36;
            if (dist < radius) {
                return thought;
            }
        }
        return null;
    }, [thoughts]);

    // Canvas event handlers - stop propagation only when thought is hit
    const handleCanvasPointerDown = useCallback((e) => {
        const thought = getThoughtAtCoordinate(e.clientX, e.clientY);

        if (thought) {
            // Hit a thought - stop propagation so parent doesn't spawn
            e.stopPropagation();

            // Start long-press timer
            longPressThoughtRef.current = thought;
            longPressTimerRef.current = setTimeout(() => {
                onThoughtLongPress?.(thought.id);
                longPressTimerRef.current = null;
            }, 350); // Match PRACTICE_INVARIANT.longPressThreshold
        }
        // If no thought hit, let event bubble to parent for empty space handling
    }, [getThoughtAtCoordinate, onThoughtLongPress]);

    const handleCanvasPointerUp = useCallback((e) => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;

            // Was a short tap on thought
            const thought = longPressThoughtRef.current;
            if (thought) {
                e.stopPropagation(); // Prevent parent from spawning
                onThoughtTap?.(thought.id);
            }
        }
        longPressThoughtRef.current = null;
    }, [onThoughtTap]);

    const handleCanvasPointerLeave = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        longPressThoughtRef.current = null;
    }, []);

    // Toggle debug overlay (long-press bottom-right corner)
    const handleDebugToggle = useCallback((e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cornerSize = 50;

        if (x > rect.width - cornerSize && y > rect.height - cornerSize) {
            setShowDebug(prev => !prev);
        }
    }, []);

    // Setup canvas and handle resize
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const rect = container.getBoundingClientRect();
            const dpr = getDPR();

            // Set actual size in memory (scaled by DPR)
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            // Set display size (CSS pixels)
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            // Scale context to match DPR
            ctx.scale(dpr, dpr);
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [getDPR]);

    // Render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();

        const render = (currentTime) => {
            // FPS calculation
            frameCountRef.current++;
            const elapsed = currentTime - lastFrameTimeRef.current;
            if (elapsed >= 1000) {
                setFps(Math.round((frameCountRef.current * 1000) / elapsed));
                frameCountRef.current = 0;
                lastFrameTimeRef.current = currentTime;
            }

            // Clear canvas
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Viewport culling: only render visible thoughts
            const margin = 50;
            const visibleThoughts = thoughts.filter(t =>
                t.x > -margin &&
                t.x < rect.width + margin &&
                t.y > -margin &&
                t.y < rect.height + margin
            );

            // Draw thoughts using theme-specific motion
            visibleThoughts.forEach(thought => {
                const now = Date.now();
                const age = (now - thought.spawnTime) / 1000; // seconds
                const lifetime = thought.baseDuration * thought.fadeModifier;
                const progress = Math.min(age / lifetime, 1);

                // Calculate position using per-thought motion parameters
                const driftX = age * thought.vx * 15;
                const driftY = age * thought.vy * 15;

                // Theme-specific motion additions
                let motionX = 0, motionY = 0;

                // Clouds: gentle vertical bob
                if (thought.bobAmplitude) {
                    motionY = Math.sin(now / 1000 * thought.bobFrequency + thought.phase) * thought.bobAmplitude * 20;
                }

                // Lanterns: subtle horizontal flicker
                if (thought.flickerVariance) {
                    motionX = Math.sin(now / 200 + thought.phase) * thought.flickerVariance * 5;
                    motionY += Math.sin(now / 400 + thought.phase * 1.5) * thought.flickerVariance * 2;
                }

                const renderX = (thought.originX || thought.x) + driftX + motionX;
                const renderY = (thought.originY || thought.y) + driftY + motionY;

                // Calculate opacity and scale based on lifecycle phase
                let opacity = 1;
                let scale = 1;

                if (progress < 0.045) {
                    // Appearing phase (~1 second)
                    opacity = progress / 0.045;
                    scale = 0.95 + (opacity * 0.05);
                } else if (progress > 0.77) {
                    // Dissolving phase (~5 seconds)
                    const dissolveProgress = (progress - 0.77) / 0.23;
                    opacity = 1 - dissolveProgress * 0.85;
                    scale = 1 + (dissolveProgress * 0.15);
                }

                // Sticky thoughts don't fade
                if (thought.isSticky) {
                    opacity = 1;
                    scale = 1;
                }

                // Bird animation: calculate current wing frame
                let animFrame = 0;
                if (thought.flapRate) {
                    animFrame = Math.floor((now / 1000 + thought.phase) * thought.flapRate * 3) % 3;
                }

                // Leaf rotation: accumulate over time
                let rotation = 0;
                if (thought.rotationSpeed) {
                    rotation = (age * thought.rotationSpeed + thought.phase) % (Math.PI * 2);
                }

                ctx.globalAlpha = opacity;

                // Draw sticky indicator ring (before thought)
                if (thought.isSticky) {
                    const pulseScale = 1 + Math.sin(now / 400) * 0.08;
                    ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(renderX, renderY, 42 * pulseScale, 0, Math.PI * 2);
                    ctx.stroke();

                    // Inner glow
                    ctx.strokeStyle = 'rgba(255, 255, 200, 0.3)';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.arc(renderX, renderY, 38 * pulseScale, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Render using stamp system
                const themeElement = theme?.thoughtElement || 'cloud';
                const variant = thought.variant || 0;
                const stamp = getStamp(themeElement + 's', variant, thought.category, animFrame);
                const stampSize = 72;

                if (stamp) {
                    // Apply rotation for leaves using setTransform (faster than save/restore)
                    if (rotation !== 0) {
                        ctx.translate(renderX, renderY);
                        ctx.rotate(rotation);
                        ctx.scale(scale, scale);
                        ctx.drawImage(stamp, -stampSize / 2, -stampSize / 2, stampSize, stampSize);
                        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity
                    } else {
                        // Non-rotating elements (clouds, birds, lanterns)
                        ctx.translate(renderX, renderY);
                        ctx.scale(scale, scale);
                        ctx.drawImage(stamp, -stampSize / 2, -stampSize / 2, stampSize, stampSize);
                        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity
                    }
                } else {
                    // Fallback: simple circle if stamps not loaded
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.arc(renderX, renderY, 24, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Debug overlay
            if (showDebug) {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(10, 10, 150, 80);
                ctx.fillStyle = '#0f0';
                ctx.font = '12px monospace';
                ctx.fillText(`FPS: ${fps}`, 20, 30);
                ctx.fillText(`Thoughts: ${thoughts.length}`, 20, 50);
                ctx.fillText(`Visible: ${visibleThoughts.length}`, 20, 70);

                // Draw bounding boxes
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 1;
                visibleThoughts.forEach(t => {
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, 36, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [thoughts, showDebug, fps]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ cursor: 'crosshair' }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
                onPointerDown={handleCanvasPointerDown}
                onPointerUp={handleCanvasPointerUp}
                onPointerLeave={handleCanvasPointerLeave}
                onContextMenu={handleDebugToggle}
            />
        </div>
    );
}

export default VipassanaCanvas;
