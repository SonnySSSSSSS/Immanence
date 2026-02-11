import React, { useEffect, useMemo, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(Boolean(media.matches));
    update();
    if (typeof media.addEventListener === "function") media.addEventListener("change", update);
    else media.addListener(update);
    return () => {
      if (typeof media.removeEventListener === "function") media.removeEventListener("change", update);
      else media.removeListener(update);
    };
  }, []);

  return reduced;
}

function hash01(a, b) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function buildRoundedPerimeterPoints({ x, y, w, h, r, step = 10 }) {
  const radius = clamp(r, 0, Math.min(w, h) / 2);
  const points = [];

  const push = (px, py, nx, ny) => {
    points.push({ x: px, y: py, nx, ny });
  };

  const topY = y;
  const botY = y + h;
  const leftX = x;
  const rightX = x + w;

  for (let px = leftX + radius; px <= rightX - radius; px += step) push(px, topY, 0, -1);
  for (let a = -Math.PI / 2; a <= 0; a += Math.PI / 16) {
    const cx = rightX - radius;
    const cy = topY + radius;
    push(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, Math.cos(a), Math.sin(a));
  }
  for (let py = topY + radius; py <= botY - radius; py += step) push(rightX, py, 1, 0);
  for (let a = 0; a <= Math.PI / 2; a += Math.PI / 16) {
    const cx = rightX - radius;
    const cy = botY - radius;
    push(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, Math.cos(a), Math.sin(a));
  }
  for (let px = rightX - radius; px >= leftX + radius; px -= step) push(px, botY, 0, 1);
  for (let a = Math.PI / 2; a <= Math.PI; a += Math.PI / 16) {
    const cx = leftX + radius;
    const cy = botY - radius;
    push(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, Math.cos(a), Math.sin(a));
  }
  for (let py = botY - radius; py >= topY + radius; py -= step) push(leftX, py, -1, 0);
  for (let a = Math.PI; a <= Math.PI * 1.5; a += Math.PI / 16) {
    const cx = leftX + radius;
    const cy = topY + radius;
    push(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, Math.cos(a), Math.sin(a));
  }

  return points;
}

export function ElectricBorder({
  width,
  height,
  innerRect,
  color = "rgba(255, 210, 120, 1)",
  speed = 0.06,
  chaos = 0.12,
  thickness = 2,
  showSparks = true,
}) {
  const canvasRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const effectiveSpeed = prefersReduced ? 0 : speed;
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const phaseRef = useRef(0);

  const points = useMemo(() => {
    if (!innerRect) return null;
    const r = Number(innerRect.radius) || 0;
    const step = clamp(Math.floor(Math.min(innerRect.width, innerRect.height) / 26), 7, 14);
    return buildRoundedPerimeterPoints({
      x: innerRect.x,
      y: innerRect.y,
      w: innerRect.width,
      h: innerRect.height,
      r,
      step,
    });
  }, [innerRect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (!width || !height || width < 2 || height < 2) return undefined;
    if (!innerRect || !points || points.length < 20) return undefined;

    const dpr = clamp(Math.floor(((typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1)), 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const baseAmp = 1.2 + chaos * 14;

    const draw = (tSec) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.06;
      ctx.lineWidth = thickness + 4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 1) {
        const p = points[i];
        const n = hash01(i * 1.31, tSec * 1.1 + phaseRef.current);
        const s = Math.sin((tSec * 4.0 + i * 0.22) * (1 + chaos * 1.1));
        const jitter = (n * 2 - 1) * baseAmp * 0.45 + s * baseAmp * 0.18;
        const px = p.x + p.nx * jitter;
        const py = p.y + p.ny * jitter;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.48;
      ctx.lineWidth = thickness;
      ctx.shadowColor = color;
      ctx.shadowBlur = 3.5;
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 1) {
        const p = points[i];
        const n = hash01(i * 2.03, tSec * 2.2 + 9.1 + phaseRef.current);
        const s = Math.sin((tSec * 6.0 + i * 0.35) * (1 + chaos * 1.55));
        const jitter = (n * 2 - 1) * baseAmp * 0.28 + s * baseAmp * 0.14;
        const px = p.x + p.nx * jitter;
        const py = p.y + p.ny * jitter;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      if (showSparks) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.1;
        for (let i = 0; i < points.length; i += 6) {
          const p = points[i];
          const n = hash01(i * 9.7, tSec * 3.0 + 3.7 + phaseRef.current);
          if (n < 0.972) continue;
          const len = 5 + n * 9;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.nx * len, p.y + p.ny * len);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const tick = (tMs) => {
      const t = tMs / 1000;
      const last = lastTRef.current || t;
      const dt = Math.min(0.05, Math.max(0, t - last));
      lastTRef.current = t;
      phaseRef.current += dt * (effectiveSpeed * 1.25);
      draw(t);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    draw(lastTRef.current || 0);

    if (effectiveSpeed > 0) {
      rafRef.current = window.requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [width, height, innerRect, points, color, effectiveSpeed, chaos, thickness, showSparks]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}

export default ElectricBorder;
