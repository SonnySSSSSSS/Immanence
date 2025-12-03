// src/components/IndrasNet.jsx
// INDRA'S NET - Visual Effects without Background Image
// - Particles: Golden nodes scattered on waves
// - Effects: Center blur/brightness, subtle curve

import React, { useEffect, useRef } from "react";

export function IndrasNet() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let width = window.innerWidth;
        let height = 304;
        let animationFrame;

        const particles = [];
        const particleCount = 60; // Scattered nodes

        function initParticles() {
            particles.length = 0;
            for (let i = 0; i < particleCount; i++) {
                // Concentration: Bias towards center x (0.5)
                // Use a bell curve-like distribution for x
                const u = Math.random();
                const v = Math.random();
                const xBias = (u + v) / 2; // Central limit theorem approximation

                particles.push({
                    x: xBias * width,
                    y: Math.random() * height,
                    size: 1 + Math.random() * 2,
                    alpha: 0.2 + Math.random() * 0.6,
                    speed: 0.2 + Math.random() * 0.5,
                    offset: Math.random() * Math.PI * 2
                });
            }
        }

        function resize() {
            width = window.innerWidth;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);
            const time = Date.now() * 0.001;

            particles.forEach(p => {
                // Float animation
                const y = p.y + Math.sin(time + p.offset) * 5;

                // Draw particle
                ctx.fillStyle = `rgba(255, 190, 50, ${p.alpha})`; // Warmer amber
                ctx.beginPath();
                ctx.arc(p.x, y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Glow
                const glow = ctx.createRadialGradient(p.x, y, 0, p.x, y, p.size * 4);
                glow.addColorStop(0, `rgba(255, 190, 50, ${p.alpha * 0.5})`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(p.x, y, p.size * 4, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrame = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    return (
        <div
            className="fixed bottom-0 left-0 w-full z-0 pointer-events-none"
            style={{
                height: "304px",
                // General fade at top
                maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)",
            }}
        >
            {/* 1. Background Image Loop */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "url('/bottom loop.png')",
                    backgroundRepeat: "repeat-x",
                    backgroundPosition: "bottom center",
                    backgroundSize: "auto 100%",
                    animation: "indrasNetScroll 120s linear infinite",
                    opacity: 0.12, // 12% opacity
                }}
            />

            {/* 2. Blur Shadow Underneath */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%) scale(1.05)",
                    width: "60%",
                    height: "100%",
                    background: "radial-gradient(ellipse at bottom center, rgba(0, 0, 0, 0.2) 0%, transparent 70%)",
                    filter: "blur(15px)",
                    opacity: 0.2,
                }}
            />

            {/* 3. Breathing Pulse Center (Core) */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "60%",
                    height: "100%",
                    background: "radial-gradient(ellipse at bottom center, rgba(255, 255, 255, 0.1) 0%, transparent 60%)",
                    mixBlendMode: "overlay",
                    filter: "blur(40px)",
                    animation: "indrasPulse 4s ease-in-out infinite",
                }}
            />

            {/* 4. Particle Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            />

            {/* 4. Upward Curve Mask */}

            <style>{`
        @keyframes indrasNetScroll {
          from { background-position-x: 0px; }
          to { background-position-x: 1920px; }
        }
        @keyframes indrasPulse {
          0%, 100% { transform: translateX(-50%) scale(0.98); opacity: 0.85; }
          50% { transform: translateX(-50%) scale(1.02); opacity: 0.95; }
        }
      `}</style>
        </div>
    );
}
