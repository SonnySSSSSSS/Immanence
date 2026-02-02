// src/components/Background.jsx
// Stage-specific cosmic backgrounds with colored vignettes
// Light mode: Unified stacking (Parchment -> Clouds -> Aurora -> Textures)

import { useState, useEffect } from "react";
import { useDisplayModeStore } from "../state/displayModeStore";

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

export function Background({ stage = 'flame', showBottomLayer = true }) {
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const displayMode = useDisplayModeStore((s) => s.mode);
  const isLight = colorScheme === 'light';
  const isSanctuary = displayMode === 'sanctuary';


  const stageLower = (stage || 'flame').toLowerCase();
  const vignetteColor = isLight
    ? (STAGE_VIGNETTE_LIGHT[stageLower] ?? 'rgba(180, 155, 110, 0.12)')
    : (STAGE_VIGNETTE_COLOR[stageLower] ?? 'rgba(150, 40, 20, 0.3)');

  // Cloud background state (synced with DevPanel)
  const [cloudBackground, setCloudBackground] = useState('cloudier');

  // Bottom layer state with fallback handling
  const stageBottomUrl = `${import.meta.env.BASE_URL}bg/bg-${stageLower}-bottom.png`;
  const fallbackBottomUrl = `${import.meta.env.BASE_URL}bg/bg-seedling.png`;
  const [bottomSrc, setBottomSrc] = useState(stageBottomUrl);

  // Reset bottom src when stage changes
  useEffect(() => {
    setBottomSrc(stageBottomUrl);
  }, [stageBottomUrl]);

  useEffect(() => {
    // Listen for DevPanel cloud background changes
    const handleCloudChange = (e) => setCloudBackground(e.detail);
    window.addEventListener('dev-cloud-change', handleCloudChange);
    return () => window.removeEventListener('dev-cloud-change', handleCloudChange);
  }, []);


  // Stage-based watercolor aurora asset
  const auroraAsset = `aurora_${stageLower}.png`;

  // GRAVEYARD: Top wallpaper removed - only using bottom layer now
  // const backgroundImage = `${import.meta.env.BASE_URL}bg/bg-${stageLower}.png`;
  // const masks = getMaskStyles(BLEND_CONFIG);

  // Light mode: warm cream with subtle texture
  if (isLight) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden transition-colors duration-500">
        {/* Base parchment gradient (z-0) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(180deg, #F5F0E6 0%, #EDE5D8 50%, #E8DFD0 100%)',
          }}
        />

        {/* FULL-PAGE CLOUD BACKGROUND (z-1) */}
        {cloudBackground !== 'none' && (
          <>
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                backgroundImage: `url(${import.meta.env.BASE_URL}${stageLower}_${cloudBackground}.png)`,
                backgroundSize: 'auto 100%',
                backgroundPosition: 'center bottom',
                backgroundRepeat: 'no-repeat',
                opacity: 0.85,
                filter: 'contrast(1.1) saturate(1.1)',
                animation: 'cloudDriftGlobal 60s ease-in-out infinite',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none z-[2]"
              style={{
                background: 'linear-gradient(to bottom, rgba(245, 240, 230, 0.7) 0%, rgba(245, 240, 230, 0.4) 30%, transparent 75%)',
              }}
            />
          </>
        )}

        {/* Watercolor Aurora - Global "Crown" (z-3) - ON TOP OF CLOUDS */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none z-[3]"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}assets/${auroraAsset})`,
            backgroundSize: '115% auto',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
            height: '500px',
            opacity: 0.85,
            mixBlendMode: 'multiply',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 90%)',
          }}
        />

        {/* Organic texture layer (z-4) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.045] z-[4]" style={{ mixBlendMode: 'multiply' }}>
          <filter id="organic-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="5" seed="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0.6 0.3 0.2 0 0 0.3 0.5 0.2 0 0 0.2 0.2 0.4 0 0 0 0 0 1 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#organic-noise)" />
        </svg>

        {/* Luminance drift (z-5) */}
        <div
          className="absolute inset-0 z-[5]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 30%, rgba(0,0,0,0.02) 70%, transparent 100%)',
            opacity: 0.6,
          }}
        />

        {/* Radial glow for avatar area (z-6) */}
        <div
          className="absolute inset-0 z-[6]"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 25%, rgba(212, 168, 75, 0.06) 0%, transparent 70%)',
          }}
        />

        <style>{`
          @keyframes cloudDriftGlobal {
            0%, 100% { background-position: center bottom; }
            50% { background-position: calc(50% + 30px) bottom; }
          }
        `}</style>

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
      </div>
    );
  }

  // Dark mode: Original cosmic nebula design with blended top/bottom layers
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">

      {/* Deep dark base - almost black with slight blue tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#0d0d18] to-[#08080c]" />

      {/* GRAVEYARD: Top wallpaper layer removed - only using bottom layer */}

      {/* Single wallpaper layer - fixed-pixel approach to prevent resampling */}
      {showBottomLayer && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
          }}
        >
          <img
            src={bottomSrc}
            alt="wallpaper"
            style={{
              // FIXED-PIXEL APPROACH: Lock image dimensions to prevent resampling
              // Asset is 2560×1440; scale down to 1920×1080 (1.33:1 ratio)
              // This keeps image at constant pixel scale across all viewport widths
              // Parent overflow: hidden crops visible portion based on container
              position: 'absolute',
              width: '1920px',
              height: '1080px',
              left: '50%',
              top: '0',
              transform: 'translateX(-50%)',
              // NO objectFit - we're using fixed dimensions
              // This is critical: objectFit: cover was causing resampling
              opacity: 0.9,
              pointerEvents: 'none',
              // Hardening attributes
              imageRendering: 'auto',
              display: 'block',
            }}
            draggable={false}
            decoding="async"
            loading="eager"
            onError={() => setBottomSrc(fallbackBottomUrl)}
          />
        </div>
      )}


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
