import React, { useEffect, useRef } from "react";

function createNoiseTexture(width, height) {
  if (!width || !height || width <= 0 || height <= 0) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 25;
    data[i] = noise; // R
    data[i + 1] = noise * 0.9; // G (warm)
    data[i + 2] = noise * 0.7; // B
    data[i + 3] = 8; // A (low opacity)
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function drawNebulaWisps(ctx, time) {
  const wisps = [
    { angle: time * 0.0001, dist: 120, size: 150, opacity: 0.15 },
    { angle: time * 0.00015 + 2, dist: 150, size: 180, opacity: 0.12 },
    { angle: time * 0.00008 + 4, dist: 100, size: 120, opacity: 0.18 },
  ];

  wisps.forEach((wisp) => {
    const x = Math.cos(wisp.angle) * wisp.dist;
    const y = Math.sin(wisp.angle) * wisp.dist;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, wisp.size);
    gradient.addColorStop(0, `rgba(180, 140, 80, ${wisp.opacity})`);
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, wisp.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function NebulaLayer() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const noiseRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const parent = canvas.parentElement;
      const { width = 0, height = 0 } = parent?.getBoundingClientRect() || {};
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height, dpr };
      noiseRef.current = createNoiseTexture(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
    };

    const render = () => {
      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      if (noiseRef.current) {
        ctx.drawImage(noiseRef.current, 0, 0, width, height);
      }

      ctx.save();
      ctx.translate(width / 2, height / 2);
      drawNebulaWisps(ctx, Date.now());
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />;
}
