// src/components/Avatar.jsx
// FIVE-LAYER AVATAR STACK:
// 0) Luminous field (canvas rings)
// 1) Breathing aura (practice only)
// 2) Rune ring (PNG, rotating)
// 3) Inner sigil core (PNG, stage-aware)
// 4) Metrics text

import React, { useEffect, useState } from "react";
import { AvatarLuminousCanvas } from "./AvatarLuminousCanvas.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import MoonOrbit from "./MoonOrbit.jsx";
import "./Avatar.css";

// Local fallback until ../state/mandalaStore.js exists
// Replace this with a real import when mandalaStore.js is available:
// import { getMandalaState } from "../state/mandalaStore.js";
function getMandalaState() {
  return {
    avgAccuracy: 0,
    weeklyConsistency: 0,
    weeklyPracticeLog: [true, true, false, true, false, true, false], // Example: Mon-Sun practice pattern
    phase: "foundation",
    transient: {
      focus: 0,
      clarity: 0,
      distortion: 0,
    },
  };
}

//
// ─── BREATHING AURA (for Practice mode) ────────────────────────────────────────
//
function BreathingAura({ breathPattern }) {
  const {
    inhale = 4,
    holdTop = 4,
    exhale = 4,
    holdBottom = 2,
  } = breathPattern || {};

  const total = inhale + holdTop + exhale + holdBottom;
  const minScale = 0.75;
  const maxScale = 1.15;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!total || total <= 0) return;

    const cycleMs = total * 1000;
    const start = performance.now();
    let frameId = null;

    const loop = (now) => {
      const elapsed = now - start;
      const t = (elapsed % cycleMs) / cycleMs;
      setProgress(t);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [total]);

  if (!total) return null;

  const tInhale = inhale / total;
  const tHoldTop = (inhale + holdTop) / total;
  const tExhale = (inhale + holdTop + exhale) / total;

  let scale = minScale;
  if (progress < tInhale) {
    scale = minScale + (maxScale - minScale) * (progress / tInhale);
  } else if (progress < tHoldTop) {
    scale = maxScale;
  } else if (progress < tExhale) {
    scale =
      maxScale -
      (maxScale - minScale) * ((progress - tHoldTop) / (tExhale - tHoldTop));
  } else {
    scale = minScale;
  }

  // Read colors directly from theme context (bypasses CSS variable issues)
  const theme = useTheme();
  console.log('🎨 BreathingAura theme:', theme);

  const { primary, secondary, muted } = theme.accent;
  console.log('🎨 BreathingAura accent colors:', { primary, secondary, muted });

  // Create gradient using pre-computed alpha variants
  const gradient = 'radial-gradient(circle, var(--accent-80) 0%, var(--accent-40) 32%, var(--accent-20) 58%, rgba(248,250,252,0.02) 75%, transparent 100%)';

  console.log('🎨 BreathingAura gradient:', gradient);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Main breathing glow - uses stage color from CSS variables */}
      <div
        className="rounded-full"
        style={{
          width: "80%",
          height: "80%",
          background: gradient,
          filter: "blur(6px)",
          transform: `scale(${scale})`,
          transition: "transform 80ms linear, background 2s ease",
          mixBlendMode: "screen",
        }}
      />

      {/* Gold accent trace for 3D depth */}
      <div
        className="rounded-full absolute"
        style={{
          width: "80%",
          height: "80%",
          background:
            `radial-gradient(circle at 30% 30%, rgba(252, 211, 77, 0.3) 0%, transparent 40%)`,
          filter: "blur(8px)",
          transform: `scale(${scale})`,
          transition: "transform 80ms linear",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

//
// ─── CONSISTENCY AURA (pulsing outer glow based on weekly consistency) ─────────
//
function ConsistencyAura({ weeklyConsistency = 0 }) {
  // weeklyConsistency is 0-7 (days practiced this week)
  // Map to opacity: 0 days = 0.15, 7 days = 0.5
  const minOpacity = 0.15;
  const maxOpacity = 0.5;
  const opacity = minOpacity + (maxOpacity - minOpacity) * (weeklyConsistency / 7);

  // Pulse intensity also scales with consistency
  const pulseScale = 0.05 + (0.1 * (weeklyConsistency / 7));

  // Center opacity reduced by 30% to not obscure avatar, outer glow preserved
  const centerOpacity = opacity * 0.7;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="consistency-aura-pulse rounded-full"
        style={{
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle, rgba(252,211,77,${centerOpacity}) 0%, rgba(253,224,71,${centerOpacity * 0.6}) 35%, rgba(253,224,71,${opacity * 0.6}) 50%, transparent 70%)`,
          filter: "blur(12px)",
          mixBlendMode: "screen",
          // Custom CSS property for animation intensity
          "--pulse-scale": pulseScale,
        }}
      />
    </div>
  );
}

//
// ─── WEEKLY BADGES (7 dots around avatar showing practice days) ───────────────
//


//
// ─── RUNE RING LAYER (rotating outer glyph circle) ────────────────────────────
//
const STAGE_RUNE_COLORS = {
  seedling: "rgba(75, 192, 192, 0.6)", // cyan
  ember: "rgba(255, 140, 0, 0.6)", // orange
  flame: "rgba(255, 247, 216, 0.8)", // warm white for contrast
  beacon: "rgba(100, 200, 255, 0.6)", // bright cyan
  stellar: "rgba(200, 150, 255, 0.6)", // purple
};

function RuneRingLayer({ stage = "flame" }) {
  const glowColor = STAGE_RUNE_COLORS[stage] || STAGE_RUNE_COLORS.flame;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Dark backdrop for Flame stage only - improves rune contrast */}
      {stage === "flame" && (
        <div
          className="absolute w-[88%] h-[88%]"
          style={{
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, transparent 45%, #2b2418 55%, #4a3a1d 100%)",
          }}
        />
      )}

      {/* Radial shadow for depth - all stages */}
      <div
        className="absolute w-[88%] h-[88%]"
        style={{
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, transparent 60%, rgba(0,0,0,0.15) 70%, transparent 80%)",
        }}
      />

      {/* Wrapper div rotates, img stays still inside */}
      <div className="rune-ring-wrapper w-[88%] h-[88%]">
        <img
          src={`${import.meta.env.BASE_URL}sigils/${stage === 'flame' ? 'rune-ring2.png' : 'rune-ring.png'}`}
          alt="Rune ring"
          className="w-full h-full object-contain"
          style={{
            filter: `brightness(1.1) saturate(1.2) drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 24px ${glowColor}) drop-shadow(0 0 48px rgba(253, 224, 71, 0.4))`,
          }}
        />
      </div>
    </div>
  );
}

//
// ─── STAGE SIGILS ──────────────────────────────────────────────────────────────
//
const STAGE_SIGILS = {
  seedling: `${import.meta.env.BASE_URL}avatars/seedling-core.png`,
  ember: `${import.meta.env.BASE_URL}avatars/ember-core.png`,
  flame: `${import.meta.env.BASE_URL}avatars/flame-core.png`,
  beacon: `${import.meta.env.BASE_URL}avatars/beacon-core.png`,
  stellar: `${import.meta.env.BASE_URL}avatars/stellar-core.png`,
};

//
// ─── STATIC SIGIL CORE (stage-aware + path-aware) ────────────────────────────────
//
function StaticSigilCore({ stage = "flame", path = null, showCore = true }) {
  // Determine image source based on stage, path, and showCore flag
  // If showCore = true or no path, use /avatars/stage-core.png
  // If showCore = false and path exists, use /avatars/Stage-Path.png
  const stageLower = stage.toLowerCase();
  const stageCapitalized = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();

  console.log('🎭 StaticSigilCore props:', { stage, path, showCore });

  // Get stage-specific color (hardcoded to avoid import issues)
  const stageColors = {
    'seedling': '#4ade80',
    'ember': '#f97316',
    'flame': '#fcd34d',
    'beacon': '#22d3ee',
    'stellar': '#a78bfa',
  };
  const accentColor = stageColors[stageLower] || '#fcd34d';

  let src;
  if (showCore || !path) {
    src = `${import.meta.env.BASE_URL}avatars/${stageLower}-core.png`;
  } else {
    // Path files are named with capital: Stage-Path.png
    const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1).toLowerCase();
    src = `${import.meta.env.BASE_URL}avatars/${stageCapitalized}-${pathCapitalized}.png`;
  }
  console.log('🎭 StaticSigilCore using image:', src);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      {/* Subtle whirlpool effect behind the avatar image */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "45%",
          height: "45%",
          borderRadius: "9999px",
          background: `
            conic-gradient(
              from 0deg,
              transparent 0%,
              var(--accent-10) 15%,
              transparent 30%,
              var(--accent-10) 45%,
              transparent 60%,
              var(--accent-10) 75%,
              transparent 90%
            )
          `,
          animation: "whirlpool 90s linear infinite",
          opacity: 0.5,
        }}
      />

      {/* Black circular backdrop */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "50%",
          height: "50%",
          borderRadius: "9999px",
          background: "#000000",
        }}
      />

      {/* Stage Avatar Core Image */}
      <div
        className="relative pointer-events-none select-none"
        style={{
          width: "46%",
          height: "46%",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <img
          src={src}
          alt={`${stage} ${path || 'core'} avatar`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
          }}
        />
      </div>

      {/* Colored glow ring between avatar and black backdrop */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "48%",
          height: "48%",
          borderRadius: "9999px",
          background: accentColor,
          opacity: stage === "flame" ? 0.3 : 0.4,
          filter: "blur(8px)",
        }}
      />
    </div>
  );
}

//
// ─── LABELS ────────────────────────────────────────────────────────────────────
//
const LABELS = {
  hub: "Center",
  practice: "Practice",
  wisdom: "Wisdom",
  application: "Application",
  navigation: "Navigation",
};

//
// ─── STAGE GLOW COLORS ─────────────────────────────────────────────────────────
//
const STAGE_GLOW_COLORS = {
  seedling: { h: 180, s: 70, l: 50 },  // cyan
  ember: { h: 25, s: 85, l: 55 },      // orange
  flame: { h: 42, s: 95, l: 58 },      // warm amber-gold
  beacon: { h: 200, s: 85, l: 60 },    // bright cyan
  stellar: { h: 270, s: 80, l: 65 },   // violet
};

//
// ─── AVATAR CONTAINER ──────────────────────────────────────────────────────────
//
function AvatarContainer({
  mode,
  label,
  breathPattern,
  stage = "flame",
  path = null,
  showCore = true,
  totalSessions = 0,
  avgAccuracy = 0,
  weeklyConsistency = 0,
  weeklyPracticeLog = [],
  breathState
}) {
  const glowColor = STAGE_GLOW_COLORS[stage] || STAGE_GLOW_COLORS.flame;
  const { h, s, l } = glowColor;

  return (
    <div className="relative w-80 h-80 flex items-center justify-center overflow-visible">
      {/* Volumetric Glow Layers - AMPLIFIED */}

      {/* Layer 0a: Outer atmospheric wash - EXTENDED FALLOFF */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsla(${h}, ${s}%, ${l}%, 0.45) 0%, hsla(${h}, ${s}%, ${l - 5}%, 0.32) 35%, hsla(${h}, ${s - 5}%, ${l - 10}%, 0.18) 60%, hsla(${h}, ${s - 10}%, ${l - 15}%, 0.08) 80%, hsla(${h}, ${s - 15}%, ${l - 20}%, 0.03) 90%, transparent 95%)`,
          filter: "blur(100px)",
          borderRadius: "50%",
          animation: "breathingPulse 8s ease-in-out infinite",
        }}
      />

      {/* Layer 0b: Mid bloom - TRIPLED INTENSITY */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsla(${h}, ${s + 5}%, ${l + 10}%, 0.6) 0%, hsla(${h}, ${s}%, ${l + 5}%, 0.4) 30%, hsla(${h}, ${s - 5}%, ${l}%, 0.15) 55%, transparent 75%)`,
          filter: "blur(50px)",
          borderRadius: "50%",
          animation: "breathingPulse 8s ease-in-out infinite 0.2s",
        }}
      />

      {/* Layer 0c: Tight inner bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsla(${h}, ${s + 10}%, ${l + 15}%, 0.5) 0%, hsla(${h}, ${s + 5}%, ${l + 10}%, 0.25) 25%, transparent 50%)`,
          filter: "blur(30px)",
          borderRadius: "50%",
          animation: "breathingPulse 8s ease-in-out infinite 0.4s",
        }}
      />

      <div className="relative w-72 h-72 flex items-center justify-center overflow-visible">
        {/* Layer 0: luminous ring field (canvas) */}
        <AvatarLuminousCanvas
          breathState={breathState}
          weeklyPracticeLog={weeklyPracticeLog}
          weeklyConsistency={weeklyConsistency}
        />

        {/* Layer 1: breathing aura (only in Practice mode) */}
        {mode === "practice" && (
          <BreathingAura key={stage.label} breathPattern={breathPattern} />
        )}

        {/* Layer 2: rune ring (rotating PNG, stage-aware color) */}
        <RuneRingLayer stage={stage} />

        {/* Layer 3: static sigil core (stage-aware + path-aware PNG) */}
        <StaticSigilCore stage={stage} path={path} showCore={showCore} />

        {/* Layer 4: Moon orbit (outermost layer) - SVG wrapper required */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          viewBox="0 0 288 288"
          style={{ overflow: 'visible' }}
        >
          <MoonOrbit avatarRadius={100} centerX={144} centerY={144} />
        </svg>
      </div>

      {/* Label to the right */}
      <div className="absolute left-[calc(100%+1rem)] top-1/2 -translate-y-1/2 text-xs tracking-[0.25em] text-white/90 uppercase whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

//
// ─── MAIN AVATAR EXPORT ────────────────────────────────────────────────────────
//
export function Avatar({ mode, breathPattern, breathState, onStageChange, stage: controlledStage, path = null, showCore = true }) {
  console.log('🎭 Avatar received props:', { controlledStage, path, showCore });
  const label = LABELS[mode] || "Center";

  const [mandalaSnapshot, setMandalaSnapshot] = useState(null);
  const [stageIndex, setStageIndex] = useState(2); // Start at Flame (index 2)

  const STAGE_NAMES = ["seedling", "ember", "flame", "beacon", "stellar"];
  const internalStage = STAGE_NAMES[stageIndex];

  // Use controlled stage if provided, otherwise internal
  const currentStage = controlledStage ? controlledStage.toLowerCase() : internalStage;

  // Notify parent when stage changes
  useEffect(() => {
    if (onStageChange) {
      const stageColors = STAGE_GLOW_COLORS[currentStage];
      // Capitalize first letter for theme system: "seedling" -> "Seedling"
      const stageName = currentStage.charAt(0).toUpperCase() + currentStage.slice(1);
      console.log('🔄 Avatar stage changed to:', stageName, 'with colors:', stageColors);
      onStageChange(stageColors, stageName);
    }
  }, [stageIndex, currentStage, onStageChange]);

  useEffect(() => {
    function refresh() {
      const state = getMandalaState();
      setMandalaSnapshot(state || null);
    }
    refresh();
    const id = setInterval(refresh, 2000);
    return () => {
      if (id) clearInterval(id);
    };
  }, []);

  const avgAccuracy = mandalaSnapshot?.avgAccuracy || 0;
  const weeklyConsistency = mandalaSnapshot?.weeklyConsistency || 0;
  const weeklyPracticeLog = mandalaSnapshot?.weeklyPracticeLog || [false, false, false, false, false, false, false];
  const phase = mandalaSnapshot?.phase || "foundation";
  const transient = mandalaSnapshot?.transient || {};
  const focus = transient.focus || 0;
  const clarity = transient.clarity || 0;
  const distortion = transient.distortion || 0;

  // For now, derive totalSessions from avgAccuracy × 100 as a placeholder.
  // Later, wire this to real totalSessions from mandalaStore.
  const totalSessions = mandalaSnapshot?.totalSessions || Math.round(avgAccuracy * 100);

  const accPct = Math.round(avgAccuracy * 100);
  const wkPct = Math.round(weeklyConsistency * 100);

  let accLabel = "loose";
  if (accPct >= 75) accLabel = "tight";
  else if (accPct >= 40) accLabel = "mixed";

  let wkLabel = "sporadic";
  if (wkPct >= 75) wkLabel = "steady";
  else if (wkPct >= 40) wkLabel = "warming";

  const safePattern = breathPattern || {};
  const patternForBreath = {
    inhale: typeof safePattern.inhale === "number" ? safePattern.inhale : 4,
    holdTop: typeof safePattern.hold1 === "number" ? safePattern.hold1 : 4,
    exhale: typeof safePattern.exhale === "number" ? safePattern.exhale : 4,
    holdBottom:
      typeof safePattern.hold2 === "number" ? safePattern.hold2 : 2,
  };

  const handleSigilClick = () => {
    if (controlledStage && onStageChange) {
      // Controlled mode - calculate next stage and notify parent
      const currentIndex = STAGE_NAMES.indexOf(currentStage);
      const nextIndex = (currentIndex + 1) % STAGE_NAMES.length;
      const nextStage = STAGE_NAMES[nextIndex];
      const stageColors = STAGE_GLOW_COLORS[nextStage];
      const stageName = nextStage.charAt(0).toUpperCase() + nextStage.slice(1);
      console.log('🖱️ Avatar clicked - next stage:', stageName);
      onStageChange(stageColors, stageName);
    } else {
      // Uncontrolled mode - use internal state
      setStageIndex((prev) => (prev + 1) % STAGE_NAMES.length);
    }
  };

  return (
    <div className="flex flex-col items-center cursor-pointer overflow-visible" onClick={handleSigilClick}>
      <AvatarContainer
        mode={mode}
        label={label}
        breathPattern={patternForBreath}
        stage={currentStage}
        path={path}
        showCore={showCore}
        totalSessions={totalSessions}
        avgAccuracy={avgAccuracy}
        weeklyConsistency={weeklyConsistency}
        weeklyPracticeLog={weeklyPracticeLog}
        breathState={breathState}
      />
    </div>
  );
}