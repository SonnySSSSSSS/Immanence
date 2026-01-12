// src/components/IndrasNet.jsx
// INDRA'S NET - Stage-aware cosmic particles at bottom
//
// ═══════════════════════════════════════════════════════════════════════════
// CRITICAL PATTERN: Display Mode Particle Rendering
// ═══════════════════════════════════════════════════════════════════════════
//
// PROBLEM: When switching between hearth (430px) and sanctuary (820px) modes,
// canvas-rendered particles would stretch or shrink because the canvas element
// was being resized while particles were still visible.
//
// SOLUTION: THREE-LAYER PROTECTION SYSTEM
//
// 1. KEY-BASED REMOUNTING (Primary Protection)
//    - Canvas gets a new React key when displayMode changes
//    - Forces complete unmount/remount cycle with clean state
//    - Prevents any possibility of stretched particles persisting
//
// 2. FADE TRANSITION (Visual Polish)
//    - Old canvas fades out (opacity: 0) over 300ms
//    - New canvas with correct dimensions fades in
//    - User sees smooth transition instead of visual artifacts
//
// 3. PROTECTED INITIALIZATION (Safety Net)
//    - initializedRef prevents duplicate particle creation
//    - Particles only created once per canvas mount
//    - Resize handler only reinitializes on significant width changes (>50px)
//
// ⚠️ DO NOT REMOVE OR MODIFY THIS PATTERN WITHOUT TESTING:
//    - Toggle between hearth/sanctuary modes multiple times
//    - Verify particles maintain consistent size across transitions
//    - Check that no stretching, squashing, or duplication occurs
//
// TESTING CHECKLIST:
// [ ] Switch hearth → sanctuary → hearth → sanctuary rapidly
// [ ] Verify particle size stays constant (no stretch/shrink)
// [ ] Confirm smooth fade transition (no flicker or jump)
// [ ] Check particle count remains consistent (no duplication)
// [ ] Test with different stages (seedling, ember, flame, beacon, stellar)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";

// Particle system version - increment to force reload
const PARTICLE_VERSION = 3;

// Stage-specific particle colors
const STAGE_PARTICLE_COLORS = {
    seedling: { primary: 'rgba(92, 185, 95, ', glow: 'rgba(78, 205, 96, ' },     // Green
    ember: { primary: 'rgba(255, 140, 60, ', glow: 'rgba(255, 118, 43, ' },      // Deep orange
    flame: { primary: 'rgba(251, 191, 36, ', glow: 'rgba(252, 211, 77, ' },      // Gold
    beacon: { primary: 'rgba(96, 165, 250, ', glow: 'rgba(59, 130, 246, ' },     // Blue
    stellar: { primary: 'rgba(192, 132, 252, ', glow: 'rgba(168, 85, 247, ' },   // Purple
};

export function IndrasNet({ stage = 'flame', isPracticing = false, isLight = false, displayMode = 'hearth', currentPracticeId = null }) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const widthRef = useRef(430);
    const heightRef = useRef(600);

    // Hide particles during any practice session
    const hideParticles = isPracticing;
    const initializedRef = useRef(false);

    // ═══════════════════════════════════════════════════════════════════════════
    // LAYER 1: KEY-BASED REMOUNTING
    // ═══════════════════════════════════════════════════════════════════════════
    // ⚠️ CRITICAL: This key forces React to unmount/remount the canvas element
    // when displayMode changes, ensuring particles are never stretched
    const [canvasKey, setCanvasKey] = useState(`canvas-${displayMode}-0`);
    const [opacity, setOpacity] = useState(1);

    // Track mode changes and trigger remount with fade transition
    const prevModeRef = useRef(displayMode);
    useEffect(() => {
        if (prevModeRef.current !== displayMode) {
            // LAYER 2: FADE TRANSITION - Smooth visual experience
            setOpacity(0);

            // After fade completes, remount canvas with new key
            const timer = setTimeout(() => {
                // Update key → React unmounts old canvas, mounts new one
                setCanvasKey(`canvas-${displayMode}-${Date.now()}`);
                prevModeRef.current = displayMode;

                // Reset state for fresh initialization
                initializedRef.current = false;
                particlesRef.current = [];

                // Fade back in
                requestAnimationFrame(() => {
                    setOpacity(1);
                });
            }, 300); // ⚠️ Must match CSS transition duration

            return () => clearTimeout(timer);
        }
    }, [displayMode]);

    // NORMALIZED COORDINATE SYSTEM - Particles stored in 0-1 space
    // This ensures they never stretch regardless of canvas width
    const FIXED_PARTICLE_SIZE = 1.5;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let animationFrame;
        const particleCount = 60;

        // Get stage-specific colors
        const stageLower = (stage || 'flame').toLowerCase();
        const colors = STAGE_PARTICLE_COLORS[stageLower] || STAGE_PARTICLE_COLORS.flame;

        // ═══════════════════════════════════════════════════════════════════════════
        // LAYER 3: PROTECTED INITIALIZATION
        // ═══════════════════════════════════════════════════════════════════════════
        // ⚠️ CRITICAL: Prevents duplicate particle creation during canvas lifetime
        function initParticles() {
            if (initializedRef.current) return; // Already initialized for this mount
            initializedRef.current = true;

            particlesRef.current = [];
            for (let i = 0; i < particleCount; i++) {
                const u = Math.random();
                const v = Math.random();
                const xBias = (u + v) / 2; // Bias toward right (0-1)

                // STORE IN NORMALIZED SPACE (0-1)
                // This makes particles layout-independent
                particlesRef.current.push({
                    normX: xBias,           // 0-1 coordinate
                    normY: Math.random(),   // 0-1 coordinate
                    size: FIXED_PARTICLE_SIZE + Math.random() * 1.5,
                    alpha: 0.4 + Math.random() * 0.6,
                    speed: 0.2 + Math.random() * 0.5,
                    offset: Math.random() * Math.PI * 2
                });
            }
        }

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const newWidth = rect.width;
            const needsReinit = !initializedRef.current || Math.abs(newWidth - widthRef.current) > 50;

            widthRef.current = newWidth;
            heightRef.current = 600;
            canvas.width = widthRef.current;
            canvas.height = heightRef.current;

            // Only reinitialize if this is the first time OR width changed significantly
            // This prevents unnecessary reinitialization during minor resize events
            if (needsReinit) {
                initParticles();
            }
        }

        function draw() {
            const width = widthRef.current;
            const height = heightRef.current;
            ctx.clearRect(0, 0, width, height);
            const time = Date.now() * 0.001;

            particlesRef.current.forEach(p => {
                // MAP FROM NORMALIZED TO CANVAS COORDINATES
                const canvasX = p.normX * width;
                const canvasY = p.normY * height;
                const y = canvasY + Math.sin(time + p.offset) * 5;

                // Draw particle with stage color (capped at 20% opacity in light mode)
                const particleAlpha = isLight ? Math.min(p.alpha * 0.25, 0.2) : p.alpha;
                ctx.fillStyle = `${colors.primary}${particleAlpha})`;
                ctx.beginPath();
                ctx.arc(canvasX, y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Glow with stage color - enhanced for better visibility
                if (!isLight) {
                    const glow = ctx.createRadialGradient(canvasX, y, 0, canvasX, y, p.size * 5);
                    glow.addColorStop(0, `${colors.glow}${p.alpha * 0.7})`);
                    glow.addColorStop(0.5, `${colors.glow}${p.alpha * 0.3})`);
                    glow.addColorStop(1, 'transparent');
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(canvasX, y, p.size * 5, 0, Math.PI * 2);
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
    }, [stage, isPracticing, isLight, displayMode, PARTICLE_VERSION]);

    // Don't render particles during body scan practice
    if (hideParticles) {
        return null;
    }

    return (
        <div
            className="absolute bottom-0 left-0 w-full z-0 pointer-events-none"
            style={{
                height: "600px",
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

            {/* 4. Particle Canvas - Key-based remounting prevents stretching */}
            <canvas
                key={canvasKey}
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    opacity: opacity,
                    transition: "opacity 0.3s ease-in-out",
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
