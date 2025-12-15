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
    atmosphericEvent = null,
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

            // PHASE 3: Visual Budget - Tiered rendering
            const totalThoughts = visibleThoughts.length;
            const overflowCount = Math.max(0, totalThoughts - 22);

            // Particle Haze: Draw first (behind thoughts)
            if (overflowCount > 0) {
                const hazeStamps = getHazeStamps();
                const hazeAlpha = Math.min(overflowCount * 0.015, 0.2);

                hazeStamps.forEach(stamp => {
                    const hazeX = stamp.x * rect.width;
                    const hazeY = stamp.y * rect.height;
                    ctx.globalAlpha = hazeAlpha * stamp.variance;
                    if (stamp.canvas) {
                        ctx.drawImage(stamp.canvas, hazeX - 64, hazeY - 64);
                    }
                });
                ctx.globalAlpha = 1.0; // Reset
            }

            // Draw thoughts with tiered quality
            visibleThoughts.forEach((thought, index) => {
                const now = Date.now();
                const age = (now - thought.spawnTime) / 1000; // seconds
                const lifetime = thought.baseDuration * thought.fadeModifier;
                const progress = Math.min(age / lifetime, 1);

                // Determine tier based on index
                let tierAlphaModifier = 1.0;
                let tierScaleModifier = 1.0;

                if (index >= 22) {
                    // Overflow: Skip rendering (already in haze)
                    return;
                } else if (index >= 18) {
                    // Fading (19-22): Gradual fade to haze
                    const fadingProgress = (index - 18) / 4; // 0 to 1
                    tierAlphaModifier = 1.0 - fadingProgress * 0.7;
                    tierScaleModifier = 1.0 - fadingProgress * 0.5;
                } else if (index >= 12) {
                    // Secondary (13-18): Reduced presence
                    tierAlphaModifier = 0.4;
                    tierScaleModifier = 0.7;
                }
                // Primary (1-12): Full render (no modifiers)

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

                // Apply tier modifiers
                opacity *= tierAlphaModifier;
                scale *= tierScaleModifier;

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
                // Use thought's stored elementType so old thoughts keep their shape
                const themeElement = thought.elementType || theme?.thoughtElement || 'cloud';
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

            // PHASE 5: Atmospheric Events rendering (after thoughts)
            if (atmosphericEvent) {
                const eventAge = (Date.now() - atmosphericEvent.startTime) / 1000;
                const eventProgress = eventAge / (atmosphericEvent.type === 'ufo' ? 0.8 :
                    atmosphericEvent.type === 'rainShimmer' ? 1.5 : 2.0);

                ctx.save();

                if (atmosphericEvent.type === 'rainShimmer') {
                    // Subtle vertical shimmer lines across screen
                    const lineCount = 40;
                    ctx.strokeStyle = 'rgba(200, 220, 240, 0.15)';
                    ctx.lineWidth = 1;

                    for (let i = 0; i < lineCount; i++) {
                        const x = (i / lineCount) * rect.width + (Math.sin(now / 300 + i) * 10);
                        const offset = Math.sin(now / 200 + i * 0.5) * 50;
                        ctx.globalAlpha = 0.1 + Math.sin(eventProgress * Math.PI) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(x, offset);
                        ctx.lineTo(x, rect.height);
                        ctx.stroke();
                    }
                } else if (atmosphericEvent.type === 'birdsDispersing') {
                    // 30-50% of bird-type thoughts scatter outward
                    const disperseCount = Math.floor(visibleThoughts.length * (0.3 + Math.random() * 0.2));
                    const birdStamp = getStamp('birds', 0, 'neutral', 1);

                    ctx.globalAlpha = 0.3 * (1 - eventProgress);

                    for (let i = 0; i < disperseCount; i++) {
                        const angle = (i / disperseCount) * Math.PI * 2 + eventProgress * Math.PI;
                        const radius = 200 + eventProgress * 400;
                        const x = rect.width / 2 + Math.cos(angle) * radius;
                        const y = rect.height / 2 + Math.sin(angle) * radius;

                        if (birdStamp) {
                            ctx.drawImage(birdStamp, x - 36, y - 36, 48, 48);
                        }
                    }
                } else if (atmosphericEvent.type === 'rainbow') {
                    // Faint rainbow arc at top edge
                    const arcCenterY = -200;
                    const arcRadius = rect.width * 0.8;

                    ctx.globalAlpha = 0.08 * Math.sin(eventProgress * Math.PI);

                    const rainbowColors = [
                        'rgba(255, 0, 0, 0.5)',
                        'rgba(255, 127, 0, 0.5)',
                        'rgba(255, 255, 0, 0.5)',
                        'rgba(0, 255, 0, 0.5)',
                        'rgba(0, 0, 255, 0.5)',
                        'rgba(75, 0, 130, 0.5)',
                        'rgba(148, 0, 211, 0.5)',
                    ];

                    rainbowColors.forEach((color, i) => {
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 20;
                        ctx.beginPath();
                        ctx.arc(rect.width / 2, arcCenterY, arcRadius + i * 22, 0, Math.PI);
                        ctx.stroke();
                    });
                } else if (atmosphericEvent.type === 'ufo') {
                    // Small ellipse crossing top-right periphery
                    const pathProgress = eventProgress;
                    const startX = rect.width * 1.1;
                    const endX = rect.width * -0.1;
                    const x = startX + (endX - startX) * pathProgress;
                    const y = rect.height * 0.1 + Math.sin(pathProgress * Math.PI * 2) * 20;

                    ctx.globalAlpha = 0.4;
                    ctx.fillStyle = 'rgba(200, 220, 255, 0.6)';
                    ctx.beginPath();
                    ctx.ellipse(x, y, 30, 12, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Light beam
                    ctx.fillStyle = 'rgba(200, 255, 255, 0.1)';
                    ctx.beginPath();
                    ctx.moveTo(x - 10, y + 5);
                    ctx.lineTo(x + 10, y + 5);
                    ctx.lineTo(x + 30, y + 80);
                    ctx.lineTo(x - 30, y + 80);
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.restore();
            }

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
