// src/components/AvatarLuminousCanvas.jsx
// LUMINOUS RING FIELD BACKGROUND FOR AVATAR
// - Procedural, resolution-independent
// - Responds to totalSessions (progression) and avgAccuracy (refinement)

import React, { useEffect, useRef } from "react";

const STAGES = [
  {
    id: 0,
    name: "SEEDLING",
    thresholdSessions: 0,
    ringCount: 3,
    baseHue: 190, // teal/cyan
    saturation: 80,
    lightnessInner: 70,
    lightnessOuter: 10,
    wobble: 0.4,
  },
  {
    id: 1,
    name: "EMBER",
    thresholdSessions: 5,
    ringCount: 4,
    baseHue: 28, // orange
    saturation: 88,
    lightnessInner: 72,
    lightnessOuter: 10,
    wobble: 0.6,
  },
  {
    id: 2,
    name: "FLAME",
    thresholdSessions: 15,
    ringCount: 5,
    baseHue: 48, // gold
    saturation: 90,
    lightnessInner: 78,
    lightnessOuter: 12,
    wobble: 0.8,
  },
  {
    id: 3,
    name: "BEACON",
    thresholdSessions: 40,
    ringCount: 6,
    baseHue: 190, // bright cyan
    saturation: 92,
    lightnessInner: 80,
    lightnessOuter: 14,
    wobble: 1.0,
  },
  {
    id: 4,
    name: "STELLAR",
    thresholdSessions: 80,
    ringCount: 7,
    baseHue: 265, // violet
    saturation: 90,
    lightnessInner: 82,
    lightnessOuter: 16,
    wobble: 1.2,
  },
];

// Choose stage based on totalSessions (primary) and avgAccuracy (secondary)
function pickStage(totalSessions = 0, avgAccuracy = 0) {
  const sessions = Math.max(0, totalSessions || 0);
  const acc = Math.max(0, Math.min(1, avgAccuracy || 0));

  let stage = STAGES[0];
  for (const s of STAGES) {
    if (sessions >= s.thresholdSessions) stage = s;
  }

  // Small accuracy boost: if accuracy is high, bias toward higher hue brightness
  const accuracyBoost = acc * 12; // up to +12 lightness
  return { ...stage, accuracyBoost };
}

export function AvatarLuminousCanvas({
  totalSessions = 0,
  avgAccuracy = 0,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

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
    }

    resize();
    window.addEventListener("resize", resize);

    let startTime = performance.now();

    function drawFrame(now) {
      const t = (now - startTime) / 1000; // seconds
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.45;

      const stage = pickStage(totalSessions, avgAccuracy);

      ctx.clearRect(0, 0, width, height);

      // --- Background radial haze ---
      const bgGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.1,
        centerX,
        centerY,
        radius * 1.2
      );
      bgGradient.addColorStop(
        0,
        `hsla(${stage.baseHue}, ${stage.saturation}%, ${
          stage.lightnessInner + stage.accuracyBoost
        }%, 0.35)`
      );
      bgGradient.addColorStop(
        1,
        `hsla(${stage.baseHue}, ${stage.saturation}%, ${
          stage.lightnessOuter
        }%, 0)`
      );

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // --- Concentric noisy rings ---
      const ringCount = stage.ringCount;
      const baseLightness = stage.lightnessInner + stage.accuracyBoost;

      for (let i = 0; i < ringCount; i++) {
        const progress = i / (ringCount - 1 || 1);
        const ringRadius = radius * (0.35 + 0.5 * progress);
        const wobbleAmp = stage.wobble * (0.4 + 0.8 * progress); // outer rings wobble more
        const lineWidth = 0.8 + 0.9 * (1 - progress);

        ctx.beginPath();
        const segments = 160;
        for (let s = 0; s <= segments; s++) {
          const angle = (Math.PI * 2 * s) / segments;
          const noise =
            Math.sin(angle * 3 + t * 0.7 + i * 0.9) * 0.3 +
            Math.cos(angle * 5 - t * 0.4 + i * 1.3) * 0.2;
          const r = ringRadius * (1 + wobbleAmp * noise * 0.02);

          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const alpha = 0.35 + 0.4 * (1 - progress);
        const lightness = baseLightness - progress * 24;

        ctx.strokeStyle = `hsla(${stage.baseHue}, ${stage.saturation}%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      // --- Soft inner core glow ---
      const innerGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 0.55
      );
      innerGradient.addColorStop(
        0,
        `hsla(${stage.baseHue}, ${stage.saturation}%, ${
          baseLightness + 6
        }%, 0.6)`
      );
      innerGradient.addColorStop(
        0.75,
        `hsla(${stage.baseHue}, ${stage.saturation}%, ${
          baseLightness
        }%, 0.18)`
      );
      innerGradient.addColorStop(
        1,
        `hsla(${stage.baseHue}, ${stage.saturation}%, ${
          stage.lightnessOuter
        }%, 0)`
      );

      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(drawFrame);
    }

    animationRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [totalSessions, avgAccuracy]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}