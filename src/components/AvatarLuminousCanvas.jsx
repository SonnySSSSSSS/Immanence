// src/components/AvatarLuminousCanvas.jsx
// RITUAL AESTHETIC: Dense Luminous Atmosphere
// - Background: Noise texture, Nebula wisps, Distant stars
// - Structure: Sacred geometry underlay
// - Foreground: Seven Flames, Multi-lane particles, Ambient dust, Filaments

import React, { useEffect, useRef } from "react";

// CONFIGURATION
const CANVAS_SCALE = 1.5; // Used for DOM size (150%)
const VIRTUAL_RADIUS = 350; // The "World" radius in virtual units
const VIRTUAL_SIZE = VIRTUAL_RADIUS * 2;

// Geometry constants (relative to VIRTUAL_SIZE)
// Adjusted to maintain proportions in the larger virtual world
const RUNE_RING_RADIUS_PCT = 0.295; // ~206 units
const INNER_BOUNDARY_PCT = 0.32;    // ~224 units
const MAX_RADIUS_PCT = 0.35;        // ~245 units
const FLAME_RADIUS_PCT = 0.36;      // ~252 units

const WEEK_NODES = [
  { day: 'Mon', angle: -Math.PI * 0.5 },
  { day: 'Tue', angle: -Math.PI * 0.214 },
  { day: 'Wed', angle: Math.PI * 0.071 },
  { day: 'Thu', angle: Math.PI * 0.357 },
  { day: 'Fri', angle: Math.PI * 0.643 },
  { day: 'Sat', angle: Math.PI * 0.929 },
  { day: 'Sun', angle: -Math.PI * 0.786 },
];

// PARTICLE LANES
const PARTICLE_LANES = {
  outer: { count: 5, speedMod: 0.8, sizeMod: 1.2, trailLen: 35 },
  middle: { count: 5, speedMod: 1.0, sizeMod: 1.0, trailLen: 30 },
  inner: { count: 5, speedMod: 1.4, sizeMod: 0.8, trailLen: 25 },
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
  constructor(maxRadius, innerBoundary, laneConfig) {
    this.maxRadius = maxRadius;
    this.innerBoundary = innerBoundary;
    this.laneConfig = laneConfig;
    this.trail = [];
    this.color = { h: 48, s: 90, l: 65 }; // Default
    this.reset();
  }

  reset() {
    // Spawn strictly outside inner boundary
    const minSpawn = this.innerBoundary * 1.3;
    const range = this.innerBoundary * 0.7;
    this.radius = minSpawn + Math.random() * range;

    // Random starting angle
    this.angle = Math.random() * Math.PI * 2;
    this.startAngle = this.angle;

    // VARY COLOR: Warm range
    this.color = {
      h: 35 + Math.random() * 20,
      s: 80 + Math.random() * 20,
      l: 60 + Math.random() * 20
    };

    // Varied angular speed
    this.angularSpeed = 0.0003 + Math.random() * 0.0004;

    // Spiral speed
    this.spiralSpeed = 0.02 + Math.random() * 0.03;

    // Size variation (3-6px)
    this.size = 3 + Math.random() * 3;

    // Brightness variation
    this.brightness = 0.5 + Math.random() * 0.5;

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

    // Update trail
    this.trail.unshift({ x, y });
    const maxTrailLen = Math.ceil(this.size * 8);
    if (this.trail.length > maxTrailLen) {
      this.trail.pop();
    }
  }

  draw(ctx, centerX, centerY, scaleMod, glowMod) {
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
      const alpha = this.brightness * 0.7 * (1 - t * t) * glowMod * lifeMod;

      ctx.strokeStyle = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${alpha})`;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Head
    const head = this.trail[0];
    const hx = centerX + head.x * scaleMod;
    const hy = centerY + head.y * scaleMod;

    // Halo
    const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, this.size * 4 * scaleMod);
    halo.addColorStop(0, `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${this.brightness * 0.5 * glowMod * lifeMod})`);
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(hx, hy, this.size * 4 * scaleMod, 0, Math.PI * 2);
    ctx.fill();

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
  // These extend to ~330px. In virtual world (350px radius), they fit.
  const wisps = [
    { angle: time * 0.0001, dist: 120, size: 150, opacity: 0.04 },
    { angle: time * 0.00015 + 2, dist: 150, size: 180, opacity: 0.03 },
    { angle: time * 0.00008 + 4, dist: 100, size: 120, opacity: 0.05 },
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
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.10)';
  ctx.lineWidth = 1.5;

  // Concentric circles
  for (let r = 40; r < radius; r += 40) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Radial lines
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 60, Math.sin(angle) * 60);
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.stroke();
  }
}

function drawUnifyingGlow(ctx) {
  // Scaled up to match virtual world size
  const gradient = ctx.createRadialGradient(
    0, 0, 100,   // Start inside rune ring
    0, 0, 320    // Extend past outer decorative ring
  );

  gradient.addColorStop(0, 'rgba(253, 224, 71, 0.15)');
  gradient.addColorStop(0.3, 'rgba(253, 224, 71, 0.08)');
  gradient.addColorStop(0.6, 'rgba(200, 160, 60, 0.04)');
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 320, 0, Math.PI * 2);
  ctx.fill();
}

function drawAtmosphericHaze(ctx, time) {
  // Scaled up for virtual world
  const hazePoints = [
    { angle: time * 0.00008, dist: 190, size: 95 },
    { angle: time * 0.00012 + 2, dist: 220, size: 80 },
    { angle: time * 0.0001 + 4, dist: 170, size: 110 },
    { angle: time * 0.00009 + 1, dist: 150, size: 90 },
  ];

  hazePoints.forEach(h => {
    const x = Math.cos(h.angle) * h.dist;
    const y = Math.sin(h.angle) * h.dist;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, h.size);
    gradient.addColorStop(0, 'rgba(180, 140, 60, 0.06)');
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
    const intensity = 0.03 + Math.sin(i * 1.5) * 0.02;

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

  useEffect(() => {
    breathStateRef.current = breathState;
  }, [breathState]);

  useEffect(() => {
    weeklyPracticeLogRef.current = weeklyPracticeLog;
  }, [weeklyPracticeLog]);

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
            particlesRef.current.push(new Particle(maxRadius, innerBoundary, config));
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

      // Nebula & Stars
      drawNebulaWisps(ctx, time);

      // Sacred Geometry
      drawSacredGeometry(ctx, flameRadius * 1.2);

      // INTEGRATION LAYER 1: Unifying glow
      drawUnifyingGlow(ctx);

      // INTEGRATION LAYER 2: Light rays
      drawLightRays(ctx, 110, 300);

      // INTEGRATION LAYER 3: Atmospheric haze
      drawAtmosphericHaze(ctx, time);

      // Decorative dashed ring
      ctx.save();
      ctx.shadowColor = 'rgba(253, 224, 71, 0.3)';
      ctx.shadowBlur = 15;
      ctx.setLineDash([8, 12]);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, runeRingRadius * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

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
        particle.draw(ctx, 0, 0, scaleMod, glowMod);
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
      className="absolute w-[150%] h-[150%] -left-[25%] -top-[25%] pointer-events-none"
    />
  );
}