// src/components/Background.jsx
// Stage-specific cosmic backgrounds with colored vignettes
// Light mode: Hides nebula, shows warm cream gradient

import React from "react";
import { useDisplayModeStore } from "../state/displayModeStore.js";

// Vignette edge colors for each stage
const STAGE_VIGNETTE_COLOR = {
  seedling: 'rgba(92, 64, 51, 0.34)',    // Earth brown
  ember: 'rgba(180, 60, 30, 0.30)',     // Deep red-orange
  flame: 'rgba(150, 40, 20, 0.26)',      // Red tint
  beacon: 'rgba(30, 60, 120, 0.30)',    // Deep blue
  stellar: 'rgba(75, 40, 100, 0.18)',   // Deep purple (was silver-gray)
};

// Light mode vignette colors (warm, subtle)
const STAGE_VIGNETTE_LIGHT = {
  seedling: 'rgba(160, 140, 110, 0.15)',
  ember: 'rgba(180, 140, 100, 0.12)',
  flame: 'rgba(200, 160, 100, 0.12)',
  beacon: 'rgba(140, 160, 180, 0.12)',
  stellar: 'rgba(160, 150, 180, 0.10)',
};

export function Background({ stage = 'flame' }) {
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const isLight = colorScheme === 'light';

  const stageLower = (stage || 'flame').toLowerCase();
  const vignetteColor = isLight
    ? (STAGE_VIGNETTE_LIGHT[stageLower] ?? 'rgba(180, 155, 110, 0.12)')
    : (STAGE_VIGNETTE_COLOR[stageLower] ?? 'rgba(150, 40, 20, 0.3)');

  // Use stage-specific background image (only in dark mode)
  const backgroundImage = `${import.meta.env.BASE_URL}bg/bg-${stageLower}.png`;

  // Light mode: warm cream with subtle texture
  if (isLight) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden transition-colors duration-500">
        {/* Base parchment gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #F5F0E6 0%, #EDE5D8 50%, #E8DFD0 100%)',
          }}
        />

        {/* Organic texture layer - SVG noise (EXAGGERATED) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.045]" style={{ mixBlendMode: 'multiply' }}>
          <filter id="organic-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="5"
              seed="2"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0.6 0.3 0.2 0 0
                      0.3 0.5 0.2 0 0
                      0.2 0.2 0.4 0 0
                      0 0 0 1 0"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#organic-noise)" />
        </svg>

        {/* Luminance drift - subtle uneven paper feel (±2-3%) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 30%, rgba(0,0,0,0.02) 70%, transparent 100%)',
            opacity: 0.6,
          }}
        />

        {/* Subtle warm radial glow for avatar area */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 25%, rgba(212, 168, 75, 0.06) 0%, transparent 70%)',
          }}
        />

        {/* Relic marbling - ultra-faint large-scale veins (aged vellum) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 800px 600px at 30% 20%, rgba(180, 140, 90, 0.02) 0%, transparent 50%),
              radial-gradient(ellipse 700px 900px at 70% 60%, rgba(160, 120, 80, 0.015) 0%, transparent 45%),
              radial-gradient(ellipse 900px 700px at 50% 80%, rgba(140, 110, 75, 0.012) 0%, transparent 40%)
            `,
            opacity: 0.5,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Subtle stage-colored vignette - highly desaturated */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 50% 30%, transparent 60%, ${vignetteColor} 100%)`,
            opacity: 0.4,
          }}
        />

        {/* Horizontal vignette - darkens sides for mobile focus */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(200, 185, 160, 0.05) 0%, transparent 15%, transparent 85%, rgba(200, 185, 160, 0.05) 100%)',
          }}
        />

        {/* Sacred geometry watermark - Flower of Life pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" style={{ mixBlendMode: 'multiply' }}>
          <defs>
            <pattern id="flower-of-life" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
              {/* Central circle */}
              <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(120, 90, 60, 0.8)" strokeWidth="1.5" />
              {/* Six outer circles forming the flower */}
              <circle cx="260" cy="200" r="60" fill="none" stroke="rgba(120, 90, 60, 0.8)" strokeWidth="1.5" />
              <circle cx="230" cy="148" r="60" fill="none" stroke="rgba(120, 90, 60, 0.8)" strokeWidth="1.5" />
              <circle cx="170" cy="148" r="60" fill="none" stroke="rgba(120, 90, 60, 0.8)" strokeWidth="1.5" />
              <circle cx="140" cy="200" r="60" fill="none" stroke="rgba(120, 90, 60, 0.8)" strokeWidth="1.5" />
              <circle cx="170" cy="252" r="60" fill="none" stroke="rgba(120, 90, 60, 0.8)" strokeWidth="1.5" />
              <circle cx="230" cy="252" r="60" fill="none" stroke="rgba(120, 90, 60, 0.8)" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#flower-of-life)" />
        </svg>
      </div>
    );
  }

  // Dark mode: Original cosmic nebula design
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Deep dark base - almost black with slight blue tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#0d0d18] to-[#08080c]" />

      {/* Stage-specific cosmic background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.9,
          mixBlendMode: 'lighten',
        }}
      />

      {/* Vertical fade - nebula dissolves into solid dark by ~40% */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, 
            transparent 0%, 
            transparent 20%, 
            rgba(10,10,18,0.4) 35%, 
            rgba(10,10,18,0.85) 50%, 
            #0a0a12 65%, 
            #0a0a12 100%
          )`,
        }}
      />

      {/* Stage-colored vignette - adds tinted edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 42% 36% at 50% 30%, transparent 40%, ${vignetteColor} 100%)`,
        }}
      />
    </div>
  );
}
