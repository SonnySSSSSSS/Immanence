// src/components/AvatarLuminousCanvas.jsx
// RITUAL AESTHETIC: Warm amber particles with organic motion
// - Particles always warm (gold/amber), not stage-colored
// - VERY slow hypnotic drift (50% slower rotation)
// - Organic wobble, varying opacity, smoke-like trails
// - VERY LONG TRAILS for maximum visibility

import React, { useEffect, useRef } from "react";

// RITUAL AESTHETIC: Warm amber particles (practice energy, not stage color)
// Particles always stay in gold/amber family regardless of stage
const WARM_PARTICLE_COLOR = { h: 48, s: 90, l: 65 }; // Gold

class Particle {
  constructor(maxRadius) {
    this.maxRadius = maxRadius;
    this.reset();
  }

  reset() {
    // Start at outer edge
    this.radius = this.maxRadius;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0.11 + Math.random() * 0.165; // SLOW: 0.11-0.275 px/frame
    this.angularSpeed = 0.0019 + Math.random() * 0.0039; // VERY SLOW: 0.0019-0.0058 radians/frame (50% slower)
    this.size = 2 + Math.random() * 1; // 2-3px (50% smaller to distinguish from badges)
    this.opacity = 0.64 + Math.random() * 0.16; // 0.64-0.8 (20% reduction)

    // ORGANIC BEHAVIOR: Add wobble and variation
    this.wobblePhase = Math.random() * Math.PI * 2; // Random phase for wobble
    this.wobbleSpeed = 0.03 + Math.random() * 0.02; // How fast wobble cycles
    this.wobbleAmount = 2 + Math.random() * 1; // 2-3px drift
    this.opacityPhase = Math.random() * Math.PI * 2; // For varying opacity
    this.opacitySpeed = 0.02 + Math.random() * 0.01; // Slow opacity fluctuation
  }

  update() {
    // Spiral inward
    this.radius -= this.speed;
    this.angle += this.angularSpeed;

    // ORGANIC: Update wobble and opacity phases
    this.wobblePhase += this.wobbleSpeed;
    this.opacityPhase += this.opacitySpeed;

    // Reset when reaching center
    if (this.radius < 40) {
      this.reset();
    }
  }

  draw(ctx, centerX, centerY, color, scaleMod = 1.0, glowMod = 1.0, wobbleMod = 1.0) {
    // ORGANIC: Add wobble offset (drift away from perfect spiral)
    const wobbleX = Math.cos(this.wobblePhase) * this.wobbleAmount * wobbleMod;
    const wobbleY = Math.sin(this.wobblePhase) * this.wobbleAmount * wobbleMod;

    // Apply breath scaling to radius
    const effectiveRadius = this.radius * scaleMod;

    const x = centerX + Math.cos(this.angle) * effectiveRadius + wobbleX;
    const y = centerY + Math.sin(this.angle) * effectiveRadius + wobbleY;

    // Calculate opacity with organic variation
    // Note: use maxRadius * scaleMod for distance factor to keep proportions
    const maxR = this.maxRadius * scaleMod;
    const distanceFactor = Math.min(
      effectiveRadius / (maxR * 0.7),
      (maxR - effectiveRadius) / (maxR * 0.3)
    );

    // ORGANIC: Varying opacity using sine wave (not linear fade)
    const opacityVariation = 0.85 + Math.sin(this.opacityPhase) * 0.15; // 0.7-1.0
    const alpha = this.opacity * distanceFactor * opacityVariation * glowMod;

    ctx.beginPath();
    // Scale particle size slightly with breath
    ctx.arc(x, y, this.size * Math.sqrt(scaleMod), 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha})`;
    ctx.fill();

    // Add glow
    ctx.shadowBlur = 10 * glowMod;
    ctx.shadowColor = `hsla(${color.h}, ${color.s}%, ${color.l + 10}%, ${alpha * 0.9})`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function AvatarLuminousCanvas({ breathState }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  // Keep latest breath state in ref for animation loop
  const breathStateRef = useRef(breathState);
  useEffect(() => {
    breathStateRef.current = breathState;
  }, [breathState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Reinitialize particles on resize
      const maxRadius = Math.min(width, height) * 0.48;
      particlesRef.current = Array.from({ length: 15 }, () => new Particle(maxRadius));
    }

    resize();
    window.addEventListener("resize", resize);

    function drawFrame() {
      const centerX = width / 2;
      const centerY = height / 2;

      // Calculate breath modifiers
      const bs = breathStateRef.current || { phase: 'rest', progress: 0, isPracticing: false };
      let scaleMod = 1.0;
      let glowMod = 1.0;
      let wobbleMod = 1.0;

      if (bs.isPracticing) {
        if (bs.phase === 'inhale') {
          // Expand 1.0 -> 1.1 (more visible expansion)
          scaleMod = 1.0 + (bs.progress * 0.1);
          // Glow 1.0 -> 1.5
          glowMod = 1.0 + (bs.progress * 0.5);
          // Wobble increases
          wobbleMod = 1.0 + (bs.progress * 0.5);
        } else if (bs.phase === 'holdTop') {
          scaleMod = 1.1;
          glowMod = 1.5;
          wobbleMod = 0.5; // Calmer wobble at top
        } else if (bs.phase === 'exhale') {
          // Contract 1.1 -> 1.0
          scaleMod = 1.1 - (bs.progress * 0.1);
          // Glow 1.5 -> 1.0
          glowMod = 1.5 - (bs.progress * 0.5);
          wobbleMod = 1.5 - (bs.progress * 0.5);
        } else if (bs.phase === 'holdBottom') {
          scaleMod = 1.0;
          glowMod = 1.0;
          wobbleMod = 1.0;
        }
      }

      // ORGANIC: Varying trail fade (smoke-like breakup) - VERY LONG TRAILS
      // Reduced fade rate even more for longer, more visible trails
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.02)"; // Very slow fade for long trails
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      // Always use warm particle color (not stage-based)
      const particleColor = WARM_PARTICLE_COLOR;

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        particle.update();
        particle.draw(ctx, centerX, centerY, particleColor, scaleMod, glowMod, wobbleMod);
      });

      animationRef.current = requestAnimationFrame(drawFrame);
    }

    animationRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // No stage dependency - particles are always warm

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}