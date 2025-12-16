// src/components/IdleHearth.jsx
// Animated canvas ember particle system for the video hearth idle state

import React, { useEffect, useRef } from 'react';

export function IdleHearth({ flareIntensity = 0 }) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = particlesRef.current;

        // Create initial particles
        const createParticles = (count = 20) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: canvas.height + Math.random() * 50,
                    size: Math.random() * 4 + 2,
                    speedY: Math.random() * 1.2 + 0.4,
                    speedX: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.5 + 0.2,
                    hue: Math.random() * 30 + 20, // 20-50 (amber to orange range)
                    life: Math.random() * 100 + 50,
                });
            }
        };

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw particles
            particles.forEach((p, i) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

                // Amber-orange gradient
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${p.opacity})`);
                gradient.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);

                ctx.fillStyle = gradient;
                ctx.fill();

                // Update position
                p.y -= p.speedY;
                p.x += p.speedX + Math.sin(p.y * 0.015) * 0.4; // gentle drift
                p.life -= 1;
                p.opacity *= 0.995; // fade out

                // Reset particle when dead or off-screen
                if (p.life <= 0 || p.y < -20 || p.opacity < 0.02) {
                    particles[i] = {
                        x: Math.random() * canvas.width,
                        y: canvas.height + Math.random() * 20,
                        size: Math.random() * 4 + 2,
                        speedY: Math.random() * 1.2 + 0.4,
                        speedX: (Math.random() - 0.5) * 0.3,
                        opacity: Math.random() * 0.5 + 0.2,
                        hue: Math.random() * 30 + 20,
                        life: Math.random() * 100 + 50,
                    };
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        // Handle resize
        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            particles.length = 0;
            createParticles(25);
        };

        resize();
        window.addEventListener('resize', resize);
        animate();

        // Expose flare function globally for cross-component access
        window.flareEmbers = (intensity = 30) => {
            createParticles(intensity);
        };

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Trigger flare when flareIntensity prop changes
    useEffect(() => {
        if (flareIntensity > 0 && window.flareEmbers) {
            window.flareEmbers(flareIntensity);
        }
    }, [flareIntensity]);

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
            {/* Warm background gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at center bottom, rgba(255,100,30,0.15) 0%, rgba(20,10,5,0.95) 60%, #0a0a0f 100%)',
                }}
            />

            {/* Canvas for ember particles */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                    mixBlendMode: 'screen',
                    width: '100%',
                    height: '100%',
                }}
            />

            {/* Centered text */}
            <p
                className="relative z-10 text-[11px] uppercase tracking-[0.3em] text-neutral-500"
                style={{ fontFamily: 'Georgia, serif' }}
            >
                Select a video to tend the fire
            </p>
        </div>
    );
}
