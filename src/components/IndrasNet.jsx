// src/components/IndrasNet.jsx
// INDRA'S NET - Enhanced with Atmospheric Depth
// - Background particle dust and atmospheric fog for depth
// - Temperature-based color system (cool white to warm gold)
// - Dramatic node variation (2-12px, 0.1-1.0 brightness)
// - Soft halos on bright nodes
// - 3D Ocean Illusion: Perspective scaling (bottom=close, top=far)
// - Parallax Star Field: Background stars move opposite to the net
// - Organic motion: Woven feel, independent twinkling, traveling pulses
// - 30fps frame rate limiting for efficiency

import React, { useEffect, useRef } from "react";

export function IndrasNet() {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const nodesRef = useRef([]);
    const starsRef = useRef([]);
    const particlesRef = useRef([]); // Background dust
    const fogRef = useRef([]); // Atmospheric fog

    // Frame rate limiting (30fps)
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // ~33.33ms
    const lastFrameTimeRef = useRef(0);

    // Pulse state
    const pulseRef = useRef({
        active: false,
        x: -200,
        speed: 2,
        nextTrigger: 0,
        width: 300
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = 200; // Taller for better depth perception
        const dpr = window.devicePixelRatio || 1;

        // Helper: Temperature-based color mixing
        function getColorByTemperature(temp) {
            // temp: 0 = cool white, 1 = warm gold
            const cool = [255, 255, 255];
            const warm = [253, 224, 71];

            return [
                Math.round(cool[0] + (warm[0] - cool[0]) * temp),
                Math.round(cool[1] + (warm[1] - cool[1]) * temp),
                Math.round(cool[2] + (warm[2] - cool[2]) * temp)
            ].join(', ');
        }

        // Helper: Weighted random (favors lower values)
        function weightedRandom(min, max, power = 2) {
            return min + (max - min) * Math.pow(Math.random(), power);
        }

        function resize() {
            width = window.innerWidth;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            initializeElements();
        }

        function initializeElements() {
            // === LAYER 0: BACKGROUND PARTICLE DUST ===
            const particleCount = Math.floor(width / 20); // ~50-100 particles
            particlesRef.current = [];
            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: 1 + Math.random() * 1, // 1-2px
                    opacity: 0.05 + Math.random() * 0.10 // 5-15%
                });
            }

            // === LAYER 0.5: ATMOSPHERIC FOG ===
            fogRef.current = [
                {
                    x: width * 0.25,
                    y: height * 0.3,
                    radius: 150 + Math.random() * 100,
                    opacity: 0.08 + Math.random() * 0.05,
                    driftSpeedX: 0.008 + Math.random() * 0.004,
                    driftSpeedY: 0.003 + Math.random() * 0.004
                },
                {
                    x: width * 0.70,
                    y: height * 0.6,
                    radius: 180 + Math.random() * 80,
                    opacity: 0.10 + Math.random() * 0.05,
                    driftSpeedX: -0.006 - Math.random() * 0.004,
                    driftSpeedY: -0.002 - Math.random() * 0.003
                },
                {
                    x: width * 0.50,
                    y: height * 0.8,
                    radius: 200 + Math.random() * 100,
                    opacity: 0.08 + Math.random() * 0.04,
                    driftSpeedX: 0.005 + Math.random() * 0.005,
                    driftSpeedY: 0.004 + Math.random() * 0.003
                }
            ];

            // === LAYER 1: STAR FIELD (Background) ===
            const starCount = Math.floor(width / 15); // Density
            starsRef.current = [];
            for (let i = 0; i < starCount; i++) {
                starsRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: 0.5 + Math.random() * 1.0, // Tiny white stars
                    opacity: 0.1 + Math.random() * 0.3,
                    speed: 0.05 + Math.random() * 0.05, // Very slow drift LEFT
                    twinklePhase: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.005 + Math.random() * 0.01
                });
            }

            // === LAYER 2: INDRA'S NET NODES (Enhanced) ===
            const rows = 5;
            nodesRef.current = [];

            for (let row = 0; row < rows; row++) {
                // Perspective factor: 0 (top/far) to 1 (bottom/close)
                const depth = row / (rows - 1);

                // Spacing increases for closer rows (perspective)
                const baseSpacing = 60 + (depth * 40);
                const cols = Math.floor(width / baseSpacing) + 4;

                // Y position: compressed at top, expanded at bottom
                // Exponential curve for 3D ground plane effect
                const yPos = 20 + (Math.pow(depth, 1.5) * (height - 40));

                for (let col = 0; col < cols; col++) {
                    // Organic offsets
                    const offsetX = (Math.random() - 0.5) * 30;
                    const offsetY = (Math.random() - 0.5) * 10;

                    // === ENHANCED NODE PROPERTIES ===

                    // Size: 2-12px, weighted toward smaller (power of 2.5)
                    const baseSize = weightedRandom(2, 12, 2.5);

                    // Brightness: 0.1-1.0, weighted toward dimmer (power of 2.0)
                    const baseBrightness = weightedRandom(0.1, 1.0, 2.0);

                    // Temperature: 0.0 (cool white) to 1.0 (warm gold)
                    // Correlate with depth: closer = warmer, with some randomness
                    const temperature = depth * 0.6 + Math.random() * 0.4;

                    // Color from temperature
                    const color = getColorByTemperature(temperature);

                    nodesRef.current.push({
                        x: (col * baseSpacing) + offsetX - 100,
                        y: yPos + offsetY,
                        row,
                        col,
                        depth, // Store depth for parallax speed

                        // Enhanced properties
                        baseSize,
                        baseBrightness,
                        temperature,
                        color,

                        phaseY: Math.random() * Math.PI * 2,
                        twinklePhase: Math.random() * Math.PI * 2,
                        twinkleSpeed: 0.02 + Math.random() * 0.04,
                        starRotation: Math.random() * Math.PI * 2, // Random rotation for 8-pointed star

                        currentX: 0,
                        currentY: 0,
                        currentOpacity: 0,
                        currentSize: 0
                    });
                }
            }
        }

        // Helper: Draw 8-pointed star for bright nodes
        function draw8PointedStar(ctx, x, y, innerRadius, outerRadius, rotation, color, opacity) {
            const points = 8;
            const angleStep = (Math.PI * 2) / points;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            // Draw 8 rays with gradients
            for (let i = 0; i < points; i++) {
                const angle = i * angleStep;
                const nextAngle = (i + 1) * angleStep;

                // Create gradient for this ray
                const rayEndX = Math.cos(angle) * outerRadius;
                const rayEndY = Math.sin(angle) * outerRadius;

                const gradient = ctx.createRadialGradient(0, 0, innerRadius, rayEndX, rayEndY, 0);
                gradient.addColorStop(0, `rgba(${color}, ${opacity})`);
                gradient.addColorStop(0.5, `rgba(${color}, ${opacity * 0.3})`);
                gradient.addColorStop(1, 'transparent');

                // Draw ray as a triangle
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                ctx.lineTo(Math.cos(nextAngle) * innerRadius * 0.3, Math.sin(nextAngle) * innerRadius * 0.3);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        function draw(timestamp) {
            // === 30 FPS FRAME RATE LIMITING ===
            const elapsed = timestamp - lastFrameTimeRef.current;

            if (elapsed < FRAME_INTERVAL) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            lastFrameTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

            // === RENDERING START ===
            ctx.clearRect(0, 0, width, height);

            // --- LAYER 0: BACKGROUND PARTICLE DUST ---
            ctx.fillStyle = "#FFFFFF";
            particlesRef.current.forEach(particle => {
                ctx.globalAlpha = particle.opacity;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            // --- LAYER 0.5: ATMOSPHERIC FOG ---
            fogRef.current.forEach(fog => {
                // Update position (slow drift)
                fog.x += fog.driftSpeedX;
                fog.y += fog.driftSpeedY;

                // Wrap around
                if (fog.x < -fog.radius) fog.x = width + fog.radius;
                if (fog.x > width + fog.radius) fog.x = -fog.radius;
                if (fog.y < -fog.radius) fog.y = height + fog.radius;
                if (fog.y > height + fog.radius) fog.y = -fog.radius;

                // Draw fog gradient
                const gradient = ctx.createRadialGradient(
                    fog.x, fog.y, 0,
                    fog.x, fog.y, fog.radius
                );
                gradient.addColorStop(0, `rgba(200, 200, 200, ${fog.opacity})`);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(fog.x, fog.y, fog.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // --- LAYER 1: STAR FIELD (Background) ---
            // Moves slowly LEFT (opposite to net drift)
            ctx.fillStyle = "#FFFFFF";

            starsRef.current.forEach(star => {
                // Update position (drift left)
                star.x -= star.speed;
                if (star.x < -10) star.x = width + 10; // Wrap around

                // Twinkle
                const twinkle = Math.sin(timestamp * 0.001 * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
                const currentOpacity = star.opacity * (0.5 + twinkle * 0.5);

                ctx.globalAlpha = currentOpacity;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0; // Reset


            // --- LAYER 2: INDRA'S NET (Foreground) ---

            // Update Pulse Logic
            const now = Date.now();
            if (!pulseRef.current.active && now > pulseRef.current.nextTrigger) {
                pulseRef.current.active = true;
                pulseRef.current.x = -300;
                pulseRef.current.nextTrigger = now + 8000 + Math.random() * 5000;
            }
            if (pulseRef.current.active) {
                pulseRef.current.x += pulseRef.current.speed;
                if (pulseRef.current.x > width + 300) pulseRef.current.active = false;
            }

            // Update Nodes
            const waveSpeed = 0.0004;

            nodesRef.current.forEach(node => {
                // Parallax Drift: Closer nodes move RIGHT faster than far nodes
                // This enhances the 3D rotation/ocean feel
                const driftSpeed = 0.02 + (node.depth * 0.08);
                node.x += driftSpeed;
                if (node.x > width + 50) node.x = -50; // Wrap around

                // Wave Motion: Y-axis undulation
                const waveAmp = 4 + (node.depth * 6); // Closer waves are bigger
                node.currentY = node.y + Math.sin(timestamp * 0.001 * waveSpeed + node.phaseY) * waveAmp;
                node.currentX = node.x;

                // Twinkle: EVERY node twinkles independently
                const twinkle = Math.sin(timestamp * 0.001 * 0.003 + node.twinklePhase) * 0.5 + 0.5;
                let targetOpacity = node.baseBrightness * (0.7 + twinkle * 0.3); // Vary around base
                let targetSize = node.baseSize;

                // Pulse Influence
                if (pulseRef.current.active) {
                    const dist = Math.abs(node.currentX - pulseRef.current.x);
                    if (dist < pulseRef.current.width) {
                        const influence = 1 - (dist / pulseRef.current.width);
                        const smoothInfluence = influence * influence * (3 - 2 * influence);
                        targetOpacity += smoothInfluence * 0.3;
                        targetSize += smoothInfluence * 2.0;
                    }
                }

                node.currentOpacity = targetOpacity;
                node.currentSize = targetSize;
            });

            // Draw Connections
            ctx.lineWidth = 1;
            nodesRef.current.forEach((node, i) => {
                // Connect to right neighbor in same row
                const nextNode = nodesRef.current[i + 1];
                if (nextNode && nextNode.row === node.row && Math.abs(nextNode.x - node.x) < 200) {
                    drawConnection(ctx, node, nextNode);
                }

                // Connect to bottom neighbor (approximate)
                if (node.row < 4) { // Not last row
                    const nextRowNodes = nodesRef.current.filter(n => n.row === node.row + 1);
                    let closest = null;
                    let minDst = 10000;

                    nextRowNodes.forEach(n => {
                        const dst = Math.abs(n.x - node.x);
                        if (dst < minDst) {
                            minDst = dst;
                            closest = n;
                        }
                    });

                    if (closest && minDst < 100) { // Only connect if reasonably close
                        drawConnection(ctx, node, closest);
                    }
                }
            });

            // Draw Nodes (HYBRID: Circular glow base + star highlights)
            nodesRef.current.forEach(node => {
                // === LAYER 1: CIRCULAR RADIAL GLOW (warmth and color) ===
                const glowRadius = node.currentSize * 3;
                const gradient = ctx.createRadialGradient(
                    node.currentX, node.currentY, 0,
                    node.currentX, node.currentY, glowRadius
                );
                gradient.addColorStop(0, `rgba(${node.color}, ${node.currentOpacity})`);
                gradient.addColorStop(1, `rgba(${node.color}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.currentX, node.currentY, glowRadius, 0, Math.PI * 2);
                ctx.fill();

                // === LAYER 2: SUBTLE 8-POINTED STAR HIGHLIGHTS (on top) ===
                // Only visible on brighter nodes, adds twinkling effect
                if (node.currentOpacity > 0.3) {
                    const starRadius = node.currentSize * 2.5;
                    const innerRadius = node.currentSize * 0.3;

                    draw8PointedStar(
                        ctx,
                        node.currentX,
                        node.currentY,
                        innerRadius,
                        starRadius,
                        node.starRotation,
                        node.color,
                        node.currentOpacity * 0.4 // Subtle, not overpowering
                    );
                }

                // === LAYER 3: BRIGHT CENTER (all nodes) ===
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, node.currentOpacity + 0.3)})`;
                ctx.beginPath();
                ctx.arc(node.currentX, node.currentY, node.currentSize * 0.4, 0, Math.PI * 2);
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(draw);
        }

        function drawConnection(ctx, nodeA, nodeB) {
            const avgBrightness = (nodeA.baseBrightness + nodeB.baseBrightness) / 2;
            const lineOpacity = avgBrightness * 0.15; // Subtle lines, brighter for bright nodes

            if (lineOpacity < 0.01) return;

            const gradient = ctx.createLinearGradient(nodeA.currentX, nodeA.currentY, nodeB.currentX, nodeB.currentY);
            gradient.addColorStop(0, `rgba(${nodeA.color}, ${nodeA.currentOpacity * 0.2})`);
            gradient.addColorStop(1, `rgba(${nodeB.color}, ${nodeB.currentOpacity * 0.2})`);

            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(nodeA.currentX, nodeA.currentY);

            // Slack Curve Logic (Organic/Hanging feel)
            const midX = (nodeA.currentX + nodeB.currentX) / 2;
            const midY = (nodeA.currentY + nodeB.currentY) / 2;
            const dist = Math.hypot(nodeB.currentX - nodeA.currentX, nodeB.currentY - nodeA.currentY);

            // "Gravity" pulls the line down based on distance and depth
            // Deeper (closer) nodes have more slack
            const depthFactor = (nodeA.depth + nodeB.depth) / 2;
            const slack = dist * (0.15 + depthFactor * 0.1);

            ctx.quadraticCurveTo(midX, midY + slack, nodeB.currentX, nodeB.currentY);
            ctx.stroke();
        }

        resize();
        window.addEventListener("resize", resize);
        animationRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "200px",
                zIndex: 0,
                pointerEvents: "none",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 90%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 90%, transparent 100%)",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    );
}
