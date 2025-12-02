// src/components/AvatarLuminousCanvas.jsx
// RITUAL AESTHETIC: Seven Flames Avatar
// - Fixed flame nodes representing weekly progress
// - Streak arc connecting practiced days
// - Organic particle system spiraling inward

import React, { useEffect, useRef } from "react";

// RITUAL AESTHETIC: Warm amber particles (practice energy, not stage color)
const WARM_PARTICLE_COLOR = { h: 48, s: 90, l: 65 }; // Gold

// CONFIGURATION
const PARTICLE_COUNT = 6;
const TRAIL_HISTORY_LENGTH = 30;

// Geometry constants (relative to canvas center)
// Canvas is scaled 1.5x larger than container to prevent clipping
const CANVAS_SCALE = 1.5;
// Rune Ring wrapper is 88% of container -> radius is 44%
const RUNE_RING_RADIUS_PCT = 0.44 / CANVAS_SCALE;
const INNER_BOUNDARY_PCT = (0.44 * 1.08) / CANVAS_SCALE; // 8% buffer
const MAX_RADIUS_PCT = 0.495 / CANVAS_SCALE; // Just inside container edge (50%)

// SEVEN FLAMES CONFIGURATION
const FLAME_RADIUS_PCT = 0.54 / CANVAS_SCALE; // Outside the particle zone

const WEEK_NODES = [
  { day: 'Mon', angle: -Math.PI * 0.5 },      // Top (12 o'clock)
  { day: 'Tue', angle: -Math.PI * 0.214 },    // ~1:45
  { day: 'Wed', angle: Math.PI * 0.071 },     // ~3:30
  { day: 'Thu', angle: Math.PI * 0.357 },     // ~5:15
  { day: 'Fri', angle: Math.PI * 0.643 },     // ~7:00
  { day: 'Sat', angle: Math.PI * 0.929 },     // ~8:45
  { day: 'Sun', angle: -Math.PI * 0.786 },    // ~10:30
];

class Particle {
  constructor(maxRadius, innerBoundary) {
    this.maxRadius = maxRadius;
    this.innerBoundary = innerBoundary;
    this.trail = [];
    this.reset();
  }

  reset() {
    this.radius = this.maxRadius;
    this.angle = Math.random() * Math.PI * 2;

    // SPEED: Very slow to allow for "hypnotic" spiral within the narrow band
    this.speed = 0.02 + Math.random() * 0.02;
    this.angularSpeed = 0.002 + Math.random() * 0.002;

    this.trail = [];
  }

  update() {
    // Spiral inward
    this.radius -= this.speed;
    this.angle += this.angularSpeed;

    // Calculate position relative to center (0,0)
    const x = Math.cos(this.angle) * this.radius;
    const y = Math.sin(this.angle) * this.radius;

    // Boundary check
    if (this.radius >= this.innerBoundary) {
      this.trail.unshift({ x, y });
      if (this.trail.length > TRAIL_HISTORY_LENGTH) {
        this.trail.pop();
      }
    } else {
      // Inside boundary - do not add new points
      // Trim tail to simulate disappearing into the ring
      if (this.trail.length > 0) {
        this.trail.pop();
      } else {
        // Trail fully gone, reset particle
        this.reset();
      }
    }
  }

  draw(ctx, centerX, centerY, color, scaleMod = 1.0, glowMod = 1.0) {
    if (this.trail.length < 2) return;

    // 1. Draw Smooth Tapered Trail
    for (let i = 0; i < this.trail.length - 1; i++) {
      const p1 = this.trail[i];
      const p2 = this.trail[i + 1];

      const t = i / this.trail.length; // 0 at head, 1 at tail

      ctx.beginPath();
      // Apply breathing scale to positions
      ctx.moveTo(centerX + p1.x * scaleMod, centerY + p1.y * scaleMod);
      ctx.lineTo(centerX + p2.x * scaleMod, centerY + p2.y * scaleMod);

      // Taper: 4px -> 0.4px
      ctx.lineWidth = 4 * (1 - t * 0.9);

      // Opacity: Quadratic falloff (0.7 -> 0)
      const alpha = 0.7 * (1 - t * t) * glowMod;

      ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha})`;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // 2. Draw Particle Head (Glow)
    const head = this.trail[0];
    const hx = centerX + head.x * scaleMod;
    const hy = centerY + head.y * scaleMod;

    // Pass 1: Large soft halo
    const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 24 * scaleMod);
    halo.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.5 * glowMod})`);
    halo.addColorStop(0.5, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.15 * glowMod})`);
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(hx, hy, 24 * scaleMod, 0, Math.PI * 2);
    ctx.fill();

    // Pass 2: Bright core
    const core = ctx.createRadialGradient(hx, hy, 0, hx, hy, 6 * scaleMod);
    core.addColorStop(0, `rgba(255, 255, 250, ${1 * glowMod})`);
    core.addColorStop(0.4, `rgba(253, 230, 138, ${0.9 * glowMod})`);
    core.addColorStop(1, 'transparent');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(hx, hy, 6 * scaleMod, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWeekNode(ctx, x, y, practiced, isToday) {
  const intensity = practiced ? 1 : 0.15;
  // Pulse effect for today (invitation) or practiced (alive)
  const time = Date.now() / 1000;
  const pulseScale = isToday && !practiced
    ? 1 + Math.sin(time * 3) * 0.1 // Faster invitation pulse
    : practiced
      ? 1 + Math.sin(time * 1.5) * 0.05 // Slow steady pulse
      : 1;

  // Layer 1: Outer halo (Large soft glow)
  if (practiced) {
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 40 * pulseScale);
    halo.addColorStop(0, `rgba(253, 224, 71, ${0.15 * intensity})`);
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 40 * pulseScale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 2: Medium glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 20 * pulseScale);
  glow.addColorStop(0, `rgba(253, 224, 71, ${0.4 * intensity})`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 20 * pulseScale, 0, Math.PI * 2);
  ctx.fill();

  // Layer 3: Bright core
  const core = ctx.createRadialGradient(x, y, 0, x, y, 8);
  core.addColorStop(0, `rgba(255, 251, 240, ${0.95 * intensity})`);
  core.addColorStop(0.5, `rgba(253, 224, 71, ${0.8 * intensity})`);
  core.addColorStop(1, 'transparent');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Layer 4: White-hot center (only if practiced)
  if (practiced) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStreakArc(ctx, nodes, centerX, centerY, radius) {
  // Find contiguous practiced days
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.25)';
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  for (let i = 0; i < nodes.length; i++) {
    const current = nodes[i];
    const nextIndex = (i + 1) % nodes.length;
    const next = nodes[nextIndex];

    if (current.practiced && next.practiced) {
      // Draw arc from current to next
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, current.angle, next.angle, false);
      ctx.stroke();
    }
  }
}

export function AvatarLuminousCanvas({ breathState, weeklyPracticeLog = [], weeklyConsistency = 0 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const breathStateRef = useRef(breathState);

  // Keep latest breath state in ref
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

      // Initialize particles
      const size = Math.min(width, height);
      const maxRadius = size * MAX_RADIUS_PCT;
      const innerBoundary = size * INNER_BOUNDARY_PCT;

      particlesRef.current = Array.from(
        { length: PARTICLE_COUNT },
        () => new Particle(maxRadius, innerBoundary)
      );
    }

    resize();
    window.addEventListener("resize", resize);

    function drawFrame() {
      const centerX = width / 2;
      const centerY = height / 2;
      const size = Math.min(width, height);
      const flameRadius = size * FLAME_RADIUS_PCT;

      // Calculate breath modifiers
      const bs = breathStateRef.current || { phase: 'rest', progress: 0, isPracticing: false };
      let scaleMod = 1.0;
      let glowMod = 1.0;

      if (bs.isPracticing) {
        if (bs.phase === 'inhale') {
          scaleMod = 1.0 + (bs.progress * 0.05); // Subtle expansion
          glowMod = 1.0 + (bs.progress * 0.3);   // Brighten
        } else if (bs.phase === 'holdTop') {
          scaleMod = 1.05;
          glowMod = 1.3;
        } else if (bs.phase === 'exhale') {
          scaleMod = 1.05 - (bs.progress * 0.05);
          glowMod = 1.3 - (bs.progress * 0.3);
        } else if (bs.phase === 'holdBottom') {
          scaleMod = 1.0;
          glowMod = 1.0;
        }
      }

      // Clear canvas completely each frame
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Week Nodes (Seven Flames) - Layer 3 (behind particles)
      // Prepare node data
      const currentDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon...
      // Map JS getDay() to our array index (Mon=0, Sun=6)
      const jsDayToMyIndex = [6, 0, 1, 2, 3, 4, 5];
      const todayIndex = jsDayToMyIndex[currentDayIndex];

      const nodes = WEEK_NODES.map((node, i) => ({
        ...node,
        practiced: weeklyPracticeLog[i] || false,
        isToday: i === todayIndex
      }));

      // Draw Streak Arc first (behind flames)
      drawStreakArc(ctx, nodes, centerX, centerY, flameRadius);

      // Draw Flames
      nodes.forEach(node => {
        const x = centerX + Math.cos(node.angle) * flameRadius;
        const y = centerY + Math.sin(node.angle) * flameRadius;
        drawWeekNode(ctx, x, y, node.practiced, node.isToday);
      });

      // 2. Draw Particles - Layer 5
      particlesRef.current.forEach((particle) => {
        particle.update();
        particle.draw(ctx, centerX, centerY, WARM_PARTICLE_COLOR, scaleMod, glowMod);
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
  }, [weeklyPracticeLog]); // Re-init if log changes

  return (
    <canvas
      ref={canvasRef}
      className="absolute w-[150%] h-[150%] -left-[25%] -top-[25%] pointer-events-none"
    // No zIndex, so it sits behind the Rune Ring
    />
  );
}