// src/components/IndrasNet.jsx
// INDRA'S NET - Stage-aware cosmic particles at bottom

import React, { useEffect, useRef } from "react";

// Stage-specific particle colors
const STAGE_PARTICLE_COLORS = {
    seedling: { primary: 'rgba(92, 185, 95, ', glow: 'rgba(78, 205, 96, ' },     // Green
    ember: { primary: 'rgba(255, 140, 60, ', glow: 'rgba(255, 118, 43, ' },      // Deep orange
    flame: { primary: 'rgba(251, 191, 36, ', glow: 'rgba(252, 211, 77, ' },      // Gold
    beacon: { primary: 'rgba(96, 165, 250, ', glow: 'rgba(59, 130, 246, ' },     // Blue
    stellar: { primary: 'rgba(192, 132, 252, ', glow: 'rgba(168, 85, 247, ' },   // Purple
};

export function IndrasNet({ stage = 'flame', isPracticing = false, isLight = false }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let width = canvas.offsetWidth || 430; // Use actual canvas width, not window width
        let height = 304;
        let animationFrame;

        const particles = [];
        const particleCount = 60;

        // Get stage-specific colors
        const stageLower = (stage || 'flame').toLowerCase();
        const colors = STAGE_PARTICLE_COLORS[stageLower] || STAGE_PARTICLE_COLORS.flame;

        function initParticles() {
            particles.length = 0;
            for (let i = 0; i < particleCount; i++) {
                const u = Math.random();
                const v = Math.random();
                const xBias = (u + v) / 2;

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
            const rect = canvas.getBoundingClientRect();
            width = rect.width; // Use the actual bounded width from parent container
            canvas.width = width;
            canvas.height = height;
            initParticles();
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);
            const time = Date.now() * 0.001;

            particles.forEach(p => {
                const y = p.y + Math.sin(time + p.offset) * 5;

                // Draw particle with stage color (capped at 20% opacity in light mode)
                const particleAlpha = isLight ? Math.min(p.alpha * 0.25, 0.2) : p.alpha;
                ctx.fillStyle = `${colors.primary}${particleAlpha})`;
                ctx.beginPath();
                ctx.arc(p.x, y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Glow with stage color - skip in light mode to prevent gray artifacts
                if (!isLight) {
                    const glow = ctx.createRadialGradient(p.x, y, 0, p.x, y, p.size * 4);
                    glow.addColorStop(0, `${colors.glow}${p.alpha * 0.5})`);
                    glow.addColorStop(1, 'transparent');
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(p.x, y, p.size * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            if (isPracticing) return;
            animationFrame = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
        };
    }, [stage, isPracticing, isLight]);

    return (
        <div
            className="absolute bottom-0 left-0 w-full z-0 pointer-events-none"
            style={{
                height: "304px",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)",
            }}
        >
            {/* 1. Background Image - No repeat, ping-pong drift */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "140%",
                    left: "-20%",
                    backgroundImage: `url('${import.meta.env.BASE_URL}bottom loop.png')`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "bottom center",
                    backgroundSize: "cover",
                    animation: "indrasNetDrift 120s ease-in-out infinite alternate",
                    animationPlayState: isPracticing ? 'paused' : 'running',
                    opacity: isPracticing ? 0.08 : (isLight ? 0.12 : 0.284), // Fade out even more in light mode
                }}
            />


            {/* 3. Breathing Pulse Center with stage color */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "60%",
                    height: "100%",
                    background: `radial-gradient(ellipse at bottom center, var(--accent-glow)${isLight ? '10' : '15'} 0%, transparent 60%)`,
                    mixBlendMode: isLight ? "normal" : "overlay",
                    filter: "blur(40px)",
                    animation: "indrasPulse 8s ease-in-out infinite", // Slowed down from 4s
                    animationPlayState: isPracticing ? 'paused' : 'running',
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

            <style>{`
        @keyframes indrasNetDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-10%); }
        }
        @keyframes indrasPulse {
          0%, 100% { transform: translateX(-50%) scale(0.98); opacity: 0.85; }
          50% { transform: translateX(-50%) scale(1.02); opacity: 0.95; }
        }
      `}</style>
        </div>
    );
}
