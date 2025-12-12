// src/components/CymaticsCanvas.jsx
import React, { useRef, useEffect, useState } from 'react';
import {
    getChladniAmplitude,
    applyDrift
} from '../utils/chladniMath.js';

/**
 * CymaticsCanvas: Particle-based visualization of Chladni plates
 * Particles migrate toward nodal lines (where amplitude = 0)
 */

export function CymaticsCanvas({
    n = 5,
    m = 7,
    width = 400,
    height = 400,
    driftEnabled = false,
    modes = null,
    phase = 'display',
    phaseProgress = 0
}) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animationIdRef = useRef(null);
    const startTimeRef = useRef(performance.now());

    const PARTICLE_COUNT = 4000;
    const PARTICLE_SIZE = 1.5;

    // Initialize particles randomly
    useEffect(() => {
        const particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: 0,
                vy: 0
            });
        }
        particlesRef.current = particles;
    }, [width, height]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const particles = particlesRef.current;

        function animate() {
            const time = (performance.now() - startTimeRef.current) / 1000;

            // Clear canvas
            ctx.fillStyle = 'rgba(5, 5, 8, 1)';
            ctx.fillRect(0, 0, width, height);

            // Skip particle updates during void phase
            if (phase === 'void') {
                animationIdRef.current = requestAnimationFrame(animate);
                return;
            }

            // Get accent color
            const accentColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--accent-color')
                .trim() || '#d4af37';

            // Determine effective mode numbers (with optional drift)
            let effectiveN = n;
            let effectiveM = m;
            if (driftEnabled && phase === 'display') {
                const drifted = applyDrift(n, m, time, 0.15, 0.15);
                effectiveN = drifted.n;
                effectiveM = drifted.m;
            }

            // Calculate force multiplier based on phase
            let forceMult = 1;
            if (phase === 'fadeIn') {
                forceMult = phaseProgress;
            } else if (phase === 'fadeOut') {
                forceMult = 1 - phaseProgress;
            }

            // Calculate opacity based on phase
            let opacity = 1;
            if (phase === 'fadeIn') {
                opacity = phaseProgress;
            } else if (phase === 'fadeOut') {
                opacity = 1 - phaseProgress;
            }

            // Update particles
            const delta = 1; // Gradient step size
            const forceFactor = 0.5; // How strongly particles are pushed
            const damping = 0.85; // Velocity decay

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Get current amplitude (absolute value)
                const amp = Math.abs(getChladniAmplitude(p.x, p.y, effectiveN, effectiveM, width, height));

                // Calculate gradient by sampling nearby points
                const ampRight = Math.abs(getChladniAmplitude(p.x + delta, p.y, effectiveN, effectiveM, width, height));
                const ampLeft = Math.abs(getChladniAmplitude(p.x - delta, p.y, effectiveN, effectiveM, width, height));
                const ampDown = Math.abs(getChladniAmplitude(p.x, p.y + delta, effectiveN, effectiveM, width, height));
                const ampUp = Math.abs(getChladniAmplitude(p.x, p.y - delta, effectiveN, effectiveM, width, height));

                // Calculate gradient (direction of increasing amplitude)
                const gradX = (ampRight - ampLeft) / (2 * delta);
                const gradY = (ampDown - ampUp) / (2 * delta);

                // Move OPPOSITE to gradient (toward lower amplitude = nodal lines)
                p.vx -= gradX * forceFactor * forceMult;
                p.vy -= gradY * forceFactor * forceMult;

                // Add random scatter during fadeOut
                if (phase === 'fadeOut') {
                    p.vx += (Math.random() - 0.5) * 0.5 * phaseProgress;
                    p.vy += (Math.random() - 0.5) * 0.5 * phaseProgress;
                }

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Apply damping
                p.vx *= damping;
                p.vy *= damping;

                // Boundary wrap
                if (p.x < 0) p.x += width;
                if (p.x > width) p.x -= width;
                if (p.y < 0) p.y += height;
                if (p.y > height) p.y -= height;
            }

            // Render particles
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = opacity * 0.8;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                ctx.fillRect(p.x, p.y, PARTICLE_SIZE, PARTICLE_SIZE);
            }

            // Add subtle glow layer
            ctx.globalAlpha = opacity * 0.2;
            for (let i = 0; i < particles.length; i += 3) { // Every 3rd particle for performance
                const p = particles[i];
                ctx.fillRect(p.x - 0.5, p.y - 0.5, PARTICLE_SIZE + 1, PARTICLE_SIZE + 1);
            }

            ctx.globalAlpha = 1;
            animationIdRef.current = requestAnimationFrame(animate);
        }

        animate();

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, [n, m, width, height, driftEnabled, modes, phase, phaseProgress]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                borderRadius: '8px'
            }}
        />
    );
}
