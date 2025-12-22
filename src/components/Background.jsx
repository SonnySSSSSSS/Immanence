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
        {/* Warm cream base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #F5F0E6 0%, #EDE5D8 50%, #E8DFD0 100%)',
          }}
        />

        {/* Subtle warm radial glow for avatar area */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 25%, rgba(212, 168, 75, 0.08) 0%, transparent 70%)',
          }}
        />

        {/* Subtle stage-colored vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 50% 30%, transparent 50%, ${vignetteColor} 100%)`,
          }}
        />
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
