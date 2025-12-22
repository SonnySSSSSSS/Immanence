// src/components/AvatarLuminousCanvas.jsx
// RITUAL AESTHETIC: Dense Luminous Atmosphere
// - Background: Noise texture, Nebula wisps, Distant stars
// - Structure: Sacred geometry underlay
// - Foreground: Seven Flames, Multi-lane particles, Ambient dust, Filaments

import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useDisplayModeStore } from "../state/displayModeStore.js";

// CONFIGURATION
const CANVAS_SCALE = 3.0; // Increased to 300% to cover the whole screen/neighbor area
const VIRTUAL_RADIUS = 1000; // Deep space radius in virtual units
const VIRTUAL_SIZE = VIRTUAL_RADIUS * 2;

// Geometry constants scaled to new 1000 radius (VIRTUAL_SIZE = 2000)
// These maintain the same pixel size at center
const RUNE_RING_RADIUS_PCT = 0.103; // ~206 units
const INNER_BOUNDARY_PCT = 0.112;    // ~224 units
const MAX_RADIUS_PCT = 0.122;        // ~245 units
const FLAME_RADIUS_PCT = 0.126;      // ~252 units

const WEEK_NODES = [
  { day: 'Mon', angle: -Math.PI * 0.5 },
  { day: 'Tue', angle: -Math.PI * 0.214 },
  { day: 'Wed', angle: Math.PI * 0.071 },
  { day: 'Thu', angle: Math.PI * 0.357 },
  { day: 'Fri', angle: Math.PI * 0.643 },
  { day: 'Sat', angle: Math.PI * 0.929 },
  { day: 'Sun', angle: -Math.PI * 0.786 },
];

// PARTICLE LANES - Golden Ratio (φ ≈ 1.618) harmonics
// Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, 21...
// Trail lengths follow Fibonacci: 34, 55, 89, 144 (increased for visibility)
const PHI = 1.618033988749895; // Golden ratio
const PARTICLE_LANES = {
  short: { count: 5, speedMod: 1.0, sizeMod: 0.9, trailLen: 68 },      // Doubled from 34
  medium: { count: 3, speedMod: PHI * 0.5, sizeMod: 1.0, trailLen: 110 }, // Doubled from 55
  long: { count: 2, speedMod: PHI * 0.4, sizeMod: 1.1, trailLen: 178 },   // Doubled from 89
  vast: { count: 1, speedMod: PHI * 0.3, sizeMod: 1.2, trailLen: 288 },  // Doubled from 144
};

// UTILS
function createNoiseTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 25;
    data[i] = noise;     // R
    data[i + 1] = noise * 0.9;  // G (warm)
    data[i + 2] = noise * 0.7;  // B
    data[i + 3] = 8;       // A (low opacity)
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

class Particle {
  constructor(maxRadius, innerBoundary, laneConfig, baseColor = { h: 42, s: 95, l: 63 }) {
    this.maxRadius = maxRadius;
    this.innerBoundary = innerBoundary;
    this.laneConfig = laneConfig;
    this.trailLength = laneConfig.trailLen; // Store lane-specific trail length
    this.trail = [];
    this.baseColor = baseColor; // Store base color from theme
    this.color = { ...baseColor }; // Warm amber-gold or theme color
    this.reset();
  }

  reset() {
    // Spawn strictly outside inner boundary
    const minSpawn = this.innerBoundary * 1.43; // Spread outwards 30% from 1.1
    const range = this.innerBoundary * 0.52;    // Spread outwards 30% from 0.4
    this.radius = minSpawn + Math.random() * range;

    // Random starting angle
    this.angle = Math.random() * Math.PI * 2;
    this.startAngle = this.angle;

    // VARY COLOR: Warm range based on base color
    this.color = {
      h: this.baseColor.h + (Math.random() - 0.5) * 10, // ±5 hue variation
      s: Math.max(70, Math.min(100, this.baseColor.s + (Math.random() - 0.5) * 20)), // ±10 saturation
      l: Math.max(50, Math.min(80, this.baseColor.l + (Math.random() - 0.5) * 20))  // ±10 lightness
    };

    // Angular speed - 5x faster than original for visible trails
    // Golden ratio harmonics preserved via lane speedMod multipliers
    const baseAngular = 0.0015 * this.laneConfig.speedMod;
    this.angularSpeed = baseAngular * (0.8 + Math.random() * 0.4); // ±20% variation

    // Spiral speed with φ harmonic variation
    const baseSpiral = 0.05 * this.laneConfig.speedMod;
    this.spiralSpeed = baseSpiral * (PHI / 2) * (0.8 + Math.random() * 0.4);

    // Size variation influenced by lane and φ ratio
    const baseSize = 5 * this.laneConfig.sizeMod;
    this.size = baseSize * (1 + Math.random() * (PHI - 1)); // Range: baseSize to baseSize×φ

    // Brightness variation - increased for visibility
    this.brightness = 0.8 + Math.random() * 0.2;

    // Orbital eccentricity
    this.eccentricity = 0.9 + Math.random() * 0.2;

    // Orbital tilt
    this.tilt = (Math.random() - 0.5) * 0.3;

    // Lifecycle
    this.life = 0;
    this.fadeIn = true;
    this.orbitsCompleted = 0;

    this.trail = [];
  }

  update(deltaTime = 16) {
    // Movement
    this.angle += this.angularSpeed * (deltaTime / 16);

    // Spiral inward
    this.radius -= this.spiralSpeed * (deltaTime / 16);

    // Track orbits
    const angleChange = this.angularSpeed * (deltaTime / 16);
    this.orbitsCompleted += angleChange / (Math.PI * 2);

    // Lifecycle: fade in
    if (this.fadeIn && this.life < 1) {
      this.life = Math.min(1, this.life + (deltaTime / 16) * 0.005);
      if (this.life >= 1) this.fadeIn = false;
    }

    // Fade out
    if (this.orbitsCompleted > 30 || this.radius < this.innerBoundary) {
      this.life -= (deltaTime / 16) * 0.002;
    }

    // Respawn
    if (this.life <= 0) {
      this.reset();
      return;
    }

    // Position with eccentricity and tilt
    const x = Math.cos(this.angle) * this.radius * this.eccentricity;
    const y = Math.sin(this.angle) * this.radius * (1 + this.tilt);

    // Update trail (using lane-specific length, not size-based)
    this.trail.unshift({ x, y });
    if (this.trail.length > this.trailLength) {
      this.trail.pop();
    }
  }

  draw(ctx, centerX, centerY, scaleMod, glowMod, isLight = false) {
    if (this.trail.length < 2 || this.life <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.life;

    const lifeMod = this.life;

    // Trail
    for (let i = 0; i < this.trail.length - 1; i++) {
      const p1 = this.trail[i];
      const p2 = this.trail[i + 1];
      const t = i / this.trail.length;

      ctx.beginPath();
      ctx.moveTo(centerX + p1.x * scaleMod, centerY + p1.y * scaleMod);
      ctx.lineTo(centerX + p2.x * scaleMod, centerY + p2.y * scaleMod);

      ctx.lineWidth = this.size * (1 - t * 0.9);
      const alpha = this.brightness * 0.9 * (1 - t * t) * glowMod * lifeMod; // Increased from 0.7 to 0.9 for visibility

      ctx.strokeStyle = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${alpha})`;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Head
    const head = this.trail[0];
    const hx = centerX + head.x * scaleMod;
    const hy = centerY + head.y * scaleMod;

    // Halo - skip in light mode (causes gray circles)
    if (!isLight) {
      const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, this.size * 4 * scaleMod);
      halo.addColorStop(0, `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${this.brightness * 0.5 * glowMod * lifeMod})`);
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(hx, hy, this.size * 4 * scaleMod, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core
    const core = ctx.createRadialGradient(hx, hy, 0, hx, hy, this.size * scaleMod);
    core.addColorStop(0, `rgba(255, 255, 250, ${1 * glowMod * lifeMod})`);
    core.addColorStop(0.4, `hsla(${this.color.h}, ${this.color.s}%, 85%, ${this.brightness * 0.9 * glowMod * lifeMod})`);
    core.addColorStop(1, 'transparent');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(hx, hy, this.size * scaleMod, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Dust {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.width;
    this.y = Math.random() * this.height;
    this.size = 1 + Math.random() * 1.5;
    this.opacity = 0.08 + Math.random() * 0.1;
    this.vx = (Math.random() - 0.5) * 0.1;
    this.vy = (Math.random() - 0.5) * 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = this.width;
    if (this.x > this.width) this.x = 0;
    if (this.y < 0) this.y = this.height;
    if (this.y > this.height) this.y = 0;
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(253, 224, 71, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// DRAWING HELPERS (Using 0,0 as center)

function drawNebulaWisps(ctx, time) {
  const wisps = [
    { angle: time * 0.0001, dist: 120, size: 150, opacity: 0.15 },
    { angle: time * 0.00015 + 2, dist: 150, size: 180, opacity: 0.12 },
    { angle: time * 0.00008 + 4, dist: 100, size: 120, opacity: 0.18 },
  ];

  wisps.forEach(wisp => {
    const x = Math.cos(wisp.angle) * wisp.dist;
    const y = Math.sin(wisp.angle) * wisp.dist;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, wisp.size);
    gradient.addColorStop(0, `rgba(180, 140, 80, ${wisp.opacity})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, wisp.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawSacredGeometry(ctx, radius) {
  // Sacred geometry at 50% opacity (increased from 10%)
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
  ctx.lineWidth = 2;

  // Concentric circles
  for (let r = 40; r < radius; r += 40) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Radial lines
  ctx.lineWidth = 1.5;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 60, Math.sin(angle) * 60);
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.stroke();
  }
}

function drawUnifyingGlow(ctx) {
  // REFINED GLOW: Multi-layered bloom with lighter blend mode
  // Core-focused with tight falloff for elegant luminosity

  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; // Additive blending for true glow

  // Layer 1: Innermost core halo - very tight, warm white
  const core = ctx.createRadialGradient(0, 0, 60, 0, 0, 160);
  core.addColorStop(0, 'rgba(255, 250, 240, 0.19)');
  core.addColorStop(0.5, 'rgba(253, 224, 71, 0.15)');
  core.addColorStop(1, 'transparent');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, 160, 0, Math.PI * 2);
  ctx.fill();

  // Layer 2: Mid bloom - starts at rune ring edge
  const mid = ctx.createRadialGradient(0, 0, 140, 0, 0, 320);
  mid.addColorStop(0, 'rgba(253, 224, 71, 0.13)');
  mid.addColorStop(0.6, 'rgba(220, 180, 60, 0.10)');
  mid.addColorStop(1, 'transparent');
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.arc(0, 0, 320, 0, Math.PI * 2);
  ctx.fill();

  // Layer 3: Outer atmospheric bloom - soft but visible
  const outer = ctx.createRadialGradient(0, 0, 180, 0, 0, 600);
  outer.addColorStop(0, 'rgba(200, 160, 80, 0.08)');
  outer.addColorStop(0.5, 'rgba(180, 140, 60, 0.06)');
  outer.addColorStop(1, 'transparent');
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(0, 0, 600, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawAtmosphericHaze(ctx, time) {
  const hazePoints = [
    { angle: time * 0.00008, dist: 390, size: 195 },
    { angle: time * 0.00012 + 2, dist: 420, size: 180 },
    { angle: time * 0.0001 + 4, dist: 370, size: 210 },
    { angle: time * 0.00009 + 1, dist: 350, size: 190 },
  ];

  hazePoints.forEach(h => {
    const x = Math.cos(h.angle) * h.dist;
    const y = Math.sin(h.angle) * h.dist;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, h.size);
    gradient.addColorStop(0, 'rgba(180, 140, 60, 0.15)');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, h.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawLightRays(ctx, innerRadius, outerRadius) {
  const rayCount = 24;

  ctx.save();

  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    // REDUCED INTENSITY: from 0.03/0.02 to 0.015/0.01
    const intensity = 0.015 + Math.sin(i * 1.5) * 0.01;

    const innerX = Math.cos(angle) * innerRadius;
    const innerY = Math.sin(angle) * innerRadius;
    const outerX = Math.cos(angle) * outerRadius;
    const outerY = Math.sin(angle) * outerRadius;

    const gradient = ctx.createLinearGradient(innerX, innerY, outerX, outerY);
    gradient.addColorStop(0, `rgba(253, 224, 71, ${intensity})`);
    gradient.addColorStop(1, 'transparent');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFilaments(ctx, nodes, innerRadius) {
  nodes.forEach(node => {
    if (!node.practiced) return;

    const flameRadius = innerRadius;
    const startX = Math.cos(node.angle) * flameRadius;
    const startY = Math.sin(node.angle) * flameRadius;

    const endDist = flameRadius * 0.6;
    const endX = Math.cos(node.angle) * endDist;
    const endY = Math.sin(node.angle) * endDist;

    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, 'rgba(253, 224, 71, 0.15)');
    gradient.addColorStop(1, 'rgba(253, 224, 71, 0.0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    const cpX = (startX + endX) / 2 + (Math.random() - 0.5) * 10;
    const cpY = (startY + endY) / 2 + (Math.random() - 0.5) * 10;
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);

    ctx.stroke();
  });
}

function drawHexagram(ctx, x, y, size, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = `rgba(253, 224, 71, ${opacity})`;
  ctx.lineWidth = 1.5;

  // Triangle 1
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2 / 3);
    const px = Math.cos(angle) * size;
    const py = Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Triangle 2
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = Math.PI / 2 + (i * Math.PI * 2 / 3);
    const px = Math.cos(angle) * size;
    const py = Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

function drawWeekNode(ctx, x, y, practiced, isToday) {
  const intensity = practiced ? 1 : 0.15;
  const time = Date.now() / 1000;
  const pulseScale = isToday && !practiced
    ? 1 + Math.sin(time * 3) * 0.1
    : practiced
      ? 1 + Math.sin(time * 1.5) * 0.05
      : 1;

  if (practiced) {
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 40 * pulseScale);
    halo.addColorStop(0, `rgba(253, 224, 71, ${0.15 * intensity})`);
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 40 * pulseScale, 0, Math.PI * 2);
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(x, y, 0, x, y, 20 * pulseScale);
  glow.addColorStop(0, `rgba(253, 224, 71, ${0.4 * intensity})`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 20 * pulseScale, 0, Math.PI * 2);
  ctx.fill();

  drawHexagram(ctx, x, y, 6 * pulseScale, intensity * 0.9);

  if (practiced) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStreakArc(ctx, nodes, radius) {
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.25)';
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  for (let i = 0; i < nodes.length; i++) {
    const current = nodes[i];
    const nextIndex = (i + 1) % nodes.length;
    const next = nodes[nextIndex];

    if (current.practiced && next.practiced) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, current.angle, next.angle, false);
      ctx.stroke();
    }
  }
}

// MAIN COMPONENT
export function AvatarLuminousCanvas({ breathState, weeklyPracticeLog = [], weeklyConsistency = 0 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const dustRef = useRef([]);
  const noiseCanvasRef = useRef(null);
  const breathStateRef = useRef(breathState);
  const weeklyPracticeLogRef = useRef(weeklyPracticeLog);

  // Light mode check
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const isLightRef = useRef(isLight);

  // Interaction State
  const ritualHoverRef = useRef(null);
  const hoverIntensityRef = useRef(0);

  const theme = useTheme();

  // Default gold HSL for all stages except Flame
  const defaultGoldHSL = { h: 42, s: 95, l: 63 };

  // Only use particleColor for Flame stage (when it's explicitly defined)
  // Otherwise use default gold for all other stages
  const particleColorHSL = theme.accent.particleColor
    ? (() => {
      // Convert hex to HSL for Flame stage only
      const hex = theme.accent.particleColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    })()
    : defaultGoldHSL;

  useEffect(() => {
    breathStateRef.current = breathState;
  }, [breathState]);

  useEffect(() => {
    weeklyPracticeLogRef.current = weeklyPracticeLog;
  }, [weeklyPracticeLog]);

  useEffect(() => {
    isLightRef.current = isLight;
  }, [isLight]);

  // Setup Interaction Listeners
  useEffect(() => {
    const handleRitualHover = (e) => {
      ritualHoverRef.current = e.detail?.id || 'hover';
    };
    const handleRitualLeave = () => {
      ritualHoverRef.current = null;
    };

    window.addEventListener('ritual:hover', handleRitualHover);
    window.addEventListener('ritual:leave', handleRitualLeave);

    return () => {
      window.removeEventListener('ritual:hover', handleRitualHover);
      window.removeEventListener('ritual:leave', handleRitualLeave);
    };
  }, []);

  // Update particle colors when theme/stage changes
  useEffect(() => {
    if (particlesRef.current.length > 0) {
      particlesRef.current.forEach(particle => {
        particle.baseColor = particleColorHSL;
        // Reset color with new baseColor on next reset, but don't force reset now
        // This ensures smooth transition - particles will update on their natural lifecycle
      });
    }
  }, [particleColorHSL.h, particleColorHSL.s, particleColorHSL.l]);

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

      // Init Noise
      noiseCanvasRef.current = createNoiseTexture(width, height);

      // Init Particles (using VIRTUAL_SIZE)
      if (particlesRef.current.length === 0) {
        const maxRadius = VIRTUAL_SIZE * MAX_RADIUS_PCT;
        const innerBoundary = VIRTUAL_SIZE * INNER_BOUNDARY_PCT;

        Object.values(PARTICLE_LANES).forEach(config => {
          for (let i = 0; i < config.count; i++) {
            particlesRef.current.push(new Particle(maxRadius, innerBoundary, config, particleColorHSL));
          }
        });
      }

      // Init Dust (using Screen Size)
      dustRef.current = Array.from({ length: 40 }, () => new Dust(width, height));
    }

    resize();
    window.addEventListener("resize", resize);

    function drawFrame() {
      const centerX = width / 2;
      const centerY = height / 2;

      // Calculate scale to fit Virtual World into Canvas
      const scale = (Math.min(width, height) / 2) / VIRTUAL_RADIUS;

      // Virtual dimensions
      const flameRadius = VIRTUAL_SIZE * FLAME_RADIUS_PCT;
      const runeRingRadius = VIRTUAL_SIZE * RUNE_RING_RADIUS_PCT;

      const time = Date.now();

      // Breath mods
      const bs = breathStateRef.current || { phase: 'rest', progress: 0, isPracticing: false };
      let scaleMod = 1.0;
      let glowMod = 1.0;

      if (bs.isPracticing) {
        if (bs.phase === 'inhale') {
          scaleMod = 1.0 + (bs.progress * 0.05);
          glowMod = 1.0 + (bs.progress * 0.3);
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

      // INTELLIGENT RITUAL RESPONSE
      // Lerp intensity based on hover state
      const targetIntensity = ritualHoverRef.current ? 1 : 0;
      hoverIntensityRef.current += (targetIntensity - hoverIntensityRef.current) * 0.08;

      if (hoverIntensityRef.current > 0.01) {
        scaleMod += hoverIntensityRef.current * 0.12; // Slight expansion
        glowMod += hoverIntensityRef.current * 0.6;   // Significant brightness
      }

      // 1. Clear & Background
      ctx.clearRect(0, 0, width, height);

      // Noise Overlay (Screen Space)
      if (noiseCanvasRef.current) {
        ctx.drawImage(noiseCanvasRef.current, 0, 0, width, height);
      }

      // --- START VIRTUAL WORLD TRANSFORM ---
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      // Skip heavy visual effects in light mode (they create visible gray circles)
      const skipHeavyFx = isLightRef.current;

      // Nebula & Stars (skip in light mode)
      if (!skipHeavyFx) {
        drawNebulaWisps(ctx, time);
      }

      // Sacred Geometry (skip in light mode - causes gray circles)
      if (!skipHeavyFx) {
        drawSacredGeometry(ctx, flameRadius * 1.2);
      }

      // INTEGRATION LAYER 1: Refined multi-layered bloom glow (skip in light mode)
      if (!skipHeavyFx) {
        drawUnifyingGlow(ctx);
      }

      // INTEGRATION LAYER 2: Light rays (skip in light mode)
      if (!skipHeavyFx) {
        drawLightRays(ctx, 110, 800);
      }

      // INTEGRATION LAYER 3: Atmospheric haze (skip in light mode)
      if (!skipHeavyFx) {
        drawAtmosphericHaze(ctx, time);
      }

      // Decorative dashed ring - skip in light mode
      if (!skipHeavyFx) {
        ctx.save();
        ctx.shadowColor = 'rgba(253, 224, 71, 0.15)';
        ctx.shadowBlur = 8;
        ctx.setLineDash([8, 12]);
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, runeRingRadius * 1.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 2. Week Nodes & Filaments
      const currentDayIndex = new Date().getDay();
      const jsDayToMyIndex = [6, 0, 1, 2, 3, 4, 5];
      const todayIndex = jsDayToMyIndex[currentDayIndex];

      const nodes = WEEK_NODES.map((node, i) => ({
        ...node,
        practiced: weeklyPracticeLogRef.current[i] || false,
        isToday: i === todayIndex
      }));

      drawFilaments(ctx, nodes, flameRadius);
      drawStreakArc(ctx, nodes, flameRadius);

      nodes.forEach(node => {
        const x = Math.cos(node.angle) * flameRadius;
        const y = Math.sin(node.angle) * flameRadius;
        drawWeekNode(ctx, x, y, node.practiced, node.isToday);
      });

      // 3. Particles
      particlesRef.current.forEach((particle) => {
        particle.update();
        // Pass 0,0 as center because we are already translated
        particle.draw(ctx, 0, 0, scaleMod, glowMod, isLightRef.current);
      });

      ctx.restore();
      // --- END VIRTUAL WORLD TRANSFORM ---

      // 4. Ambient Dust (Screen Space)
      dustRef.current.forEach(dust => {
        dust.update();
        dust.draw(ctx);
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute w-[300%] h-[300%] -left-[100%] -top-[100%] pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}