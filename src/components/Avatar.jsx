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

  const { primary, secondary, muted } = theme.accent;

  // Create gradient using pre-computed alpha variants
  const gradient = 'radial-gradient(circle, var(--accent-80) 0%, var(--accent-40) 32%, var(--accent-20) 58%, rgba(248,250,252,0.02) 75%, transparent 100%)';

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

import { useDisplayModeStore } from "../state/displayModeStore.js";

function LightModeRuneRing2D({ stage = "flame", isPracticing = false }) {
  // Use CSS variables (ink + accent) instead of neon glow filters.
  // Assumes your light-mode palette already sets --text-primary and --text-muted.
  // Accent is your stage hue via --accent-color (already used elsewhere).
  const sizePct = 88;

  // Deterministic tick pattern (no Math.random in render)
  const tickCount = 84; // 48–96 feels good; 84 is dense but not noisy.

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    // lengths in SVG units
    const isLong = i % 21 === 0;
    const isMid = i % 7 === 0;
    const isMissing = i % 19 === 0; // intentional gaps

    if (isMissing) return null;

    const len = isLong ? 6.2 : isMid ? 4.2 : 2.8;
    const alpha = isLong ? 0.26 : isMid ? 0.20 : 0.16;

    const angle = (i / tickCount) * 360;
    const r1 = 44.5;
    const r2 = r1 - len;

    return (
      <line
        key={`t-${i}`}
        x1="50"
        y1={50 - r1}
        x2="50"
        y2={50 - r2}
        stroke={`rgba(45,40,35,${alpha})`}
        strokeWidth="0.6"
        strokeLinecap="round"
        transform={`rotate(${angle} 50 50)`}
      />
    );
  });

  // Sparse accent arcs: calibration marks
  const arcs = [
    { start: 12, end: 38, r: 40.2, w: 1.1, a: 0.12 },
    { start: 112, end: 141, r: 41.6, w: 0.9, a: 0.10 },
    { start: 206, end: 232, r: 39.1, w: 1.0, a: 0.10 },
    { start: 292, end: 324, r: 42.4, w: 0.9, a: 0.08 },
  ];

  // Helper: arc path for a circle sector
  const arcPath = (r, startDeg, endDeg) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const sx = 50 + r * Math.cos(toRad(startDeg - 90));
    const sy = 50 + r * Math.sin(toRad(startDeg - 90));
    const ex = 50 + r * Math.cos(toRad(endDeg - 90));
    const ey = 50 + r * Math.sin(toRad(endDeg - 90));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    >
      <div
        className="rune-ring-wrapper w-[88%] h-[88%] relative flex items-center justify-center"
        style={{ animationPlayState: isPracticing ? "paused" : "running" }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <defs>
            {/* Single capped bloom copy (allowed, but subtle) */}
            <filter id="lmRingBloom" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>

            {/* Specular glint */}
            <radialGradient id="lmGlint" cx="35%" cy="30%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </radialGradient>

            {/* Very faint glass fill */}
            <radialGradient id="lmGlassFill" cx="50%" cy="45%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.03)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </radialGradient>
          </defs>

          {/* Glass pane fill (no fog) */}
          <circle cx="50" cy="50" r="46" fill="url(#lmGlassFill)" />

          {/* Bevel illusion (outer dark edge + inner light edge) */}
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(45,40,35,0.10)"
            strokeWidth="0.9"
          />
          <circle
            cx="50"
            cy="50"
            r="43.7"
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="0.9"
          />

          {/* Micro ticks */}
          <g>{ticks}</g>

          {/* Accent arcs in ink */}
          <g>
            {arcs.map((a, idx) => (
              <path
                key={`a-${idx}`}
                d={arcPath(a.r, a.start, a.end)}
                fill="none"
                stroke={`rgba(45,40,35,${a.a})`}
                strokeWidth={a.w}
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Accent arcs lightly tinted by accent color */}
          <g opacity="0.22">
            <path
              d={arcPath(41.0, 24, 52)}
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth="1.0"
              strokeLinecap="round"
            />
            <path
              d={arcPath(39.6, 248, 270)}
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>

          {/* Specular glint (top-right) */}
          <path
            d={arcPath(45.5, 310, 350)}
            fill="none"
            stroke="url(#lmGlint)"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.14"
          />

          {/* Single bloom copy (tinted, capped opacity) */}
          <g filter="url(#lmRingBloom)" opacity="0.14">
            <circle
              cx="50"
              cy="50"
              r="45.2"
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth="1.2"
            />
          </g>
        </svg>

        {/* Keep hairline trace if you want it; it reads as “etched guide” in light mode */}
        <div className="absolute inset-0 hairline-ring opacity-20 scale-[1.005]" />
      </div>
    </div>
  );
}

function RuneRingLayer({ stage = "flame", isPracticing = false }) {
  const glowColor = STAGE_RUNE_COLORS[stage] || STAGE_RUNE_COLORS.flame;
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  if (isLight) {
    return <LightModeRuneRing2D stage={stage} isPracticing={isPracticing} />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Dark backdrop for Flame stage only - improves rune contrast (dark mode only) */}
      {stage === "flame" && !isLight && (
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

      <div
        className="rune-ring-wrapper w-[88%] h-[88%] relative flex items-center justify-center"
        style={{ animationPlayState: isPracticing ? 'paused' : 'running' }}
      >
        {/* Hairline trace behind the image */}
        <div className="absolute inset-0 hairline-ring opacity-40 scale-[1.005]" />

        <img
          src={`${import.meta.env.BASE_URL}sigils/${stage === 'flame' ? 'rune-ring2.png' : 'rune-ring.png'}`}
          alt="Rune ring"
          className="w-full h-full object-contain"
          style={{
            filter: `brightness(1.05) saturate(1.1) drop-shadow(0 0 2px ${glowColor})`,
            opacity: 0.8,
          }}
        />

        {/* Tiny Labels around the ring */}
        <div className="absolute inset-0 pointer-events-none">
          {['SOMA', 'PRANA', 'DHYANA', 'DRISHTI'].map((label, i) => (
            <div
              key={label}
              className="absolute text-[6px] text-suspended text-white/30"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-144px)`,
                fontFamily: 'var(--font-display)',
              }}
            >
              {label}
            </div>
          ))}
        </div>
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
function StaticSigilCore({ stage = "flame", path = null, showCore = true, attention = 'vigilance', variationIndex = 0, hasVariations = false, isPracticing = false }) {
  // Determine image source based on stage, path, attention, and showCore flag
  const stageLower = stage.toLowerCase();
  const stageCapitalized = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();

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
    // Use core image
    src = `${import.meta.env.BASE_URL}avatars/${stageLower}-core.png`;
  } else if (attention && attention !== 'none') {
    // Use attention-specific image with variation
    const pathLower = path.toLowerCase();
    const attentionLower = attention.toLowerCase();
    const variationSuffix = `_0000${variationIndex + 1}_`;

    // Try with variation suffix first
    src = `${import.meta.env.BASE_URL}avatars/avatar-${stageLower}-${pathLower}-${attentionLower}${variationSuffix}.png`;
  } else {
    // Fallback to old Stage-Path.png format (when attention is null, empty, or 'none')
    const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1).toLowerCase();
    src = `${import.meta.env.BASE_URL}avatars/${stageCapitalized}-${pathCapitalized}.png`;
  }

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
          animationPlayState: isPracticing ? 'paused' : 'running',
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
        className="relative pointer-events-none select-none avatar-sigil-rotate"
        style={{
          width: "46%",
          height: "46%",
          borderRadius: "9999px",
          overflow: "hidden",
          animationPlayState: isPracticing ? 'paused' : 'running',
        }}
      >
        <img
          src={src}
          alt={`${stage} ${path || 'core'} ${attention || ''} avatar`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
          }}
        />
      </div>

      {/* Variation indicator - asterisk/sparkle when variations available */}
      {
        hasVariations && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: "8%",
              right: "8%",
              fontSize: "1.5rem",
              color: accentColor,
              textShadow: `0 0 8px ${accentColor}, 0 0 16px ${accentColor}`,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            ✦
          </div>
        )
      }

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
    </div >
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
  attention = 'vigilance',
  variationIndex = 0,
  hasVariations = false,
  totalSessions = 0,
  avgAccuracy = 0,
  weeklyConsistency = 0,
  weeklyPracticeLog = [],
  breathState,
  isPracticing = false
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
          animationPlayState: isPracticing ? 'paused' : 'running',
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
          animationPlayState: isPracticing ? 'paused' : 'running',
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
          animationPlayState: isPracticing ? 'paused' : 'running',
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
        <RuneRingLayer stage={stage} isPracticing={isPracticing} />

        {/* Layer 3: static sigil core (stage-aware + path-aware + attention-aware PNG) */}
        <StaticSigilCore
          stage={stage}
          path={path}
          showCore={showCore}
          attention={attention}
          variationIndex={variationIndex}
          hasVariations={hasVariations}
          isPracticing={isPracticing}
        />

        {/* Layer 4: Moon orbit (outermost layer) - SVG wrapper required */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          viewBox="0 0 288 288"
          style={{ overflow: 'visible' }}
        >
          <MoonOrbit avatarRadius={100} centerX={144} centerY={144} />
        </svg>
      </div>
    </div>
  );
}

//
// ─── MAIN AVATAR EXPORT ────────────────────────────────────────────────────────
//
export function Avatar({ mode, breathPattern, breathState, onStageChange, stage: controlledStage, path = null, showCore = true, attention = 'vigilance', isPracticing = false }) {
  const label = LABELS[mode] || "Center";

  const [mandalaSnapshot, setMandalaSnapshot] = useState(null);
  const [stageIndex, setStageIndex] = useState(2); // Start at Flame (index 2)
  const [variationIndex, setVariationIndex] = useState(0);
  const [maxVariations, setMaxVariations] = useState(1);

  const STAGE_NAMES = ["seedling", "ember", "flame", "beacon", "stellar"];
  const internalStage = STAGE_NAMES[stageIndex];

  // Use controlled stage if provided, otherwise internal
  const currentStage = controlledStage ? controlledStage.toLowerCase() : internalStage;

  // Detect available variations when stage/path/attention changes
  useEffect(() => {
    if (!path || showCore || !attention || attention === 'none') {
      setMaxVariations(1);
      setVariationIndex(0);
      return;
    }

    // Check for variations by trying to load images
    const stageLower = currentStage.toLowerCase();
    const pathLower = path.toLowerCase();
    const attentionLower = attention.toLowerCase();

    let count = 0;
    const checkVariation = (index) => {
      return new Promise((resolve) => {
        const img = new Image();
        const variationSuffix = `_0000${index + 1}_`;
        img.src = `${import.meta.env.BASE_URL}avatars/avatar-${stageLower}-${pathLower}-${attentionLower}${variationSuffix}.png`;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
    };

    // Check up to 10 variations
    Promise.all([...Array(10)].map((_, i) => checkVariation(i)))
      .then(results => {
        const foundCount = results.filter(Boolean).length;
        setMaxVariations(foundCount > 0 ? foundCount : 1);
        setVariationIndex(0);
      });
  }, [currentStage, path, attention, showCore]);

  // Notify parent when stage changes
  useEffect(() => {
    if (onStageChange) {
      const stageColors = STAGE_GLOW_COLORS[currentStage];
      // Capitalize first letter for theme system: "seedling" -> "Seedling"
      const stageName = currentStage.charAt(0).toUpperCase() + currentStage.slice(1);
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
    // If variations exist, cycle through them
    if (maxVariations > 1) {
      setVariationIndex((prev) => (prev + 1) % maxVariations);
    } else if (controlledStage && onStageChange) {
      // Controlled mode - calculate next stage and notify parent
      const currentIndex = STAGE_NAMES.indexOf(currentStage);
      const nextIndex = (currentIndex + 1) % STAGE_NAMES.length;
      const nextStage = STAGE_NAMES[nextIndex];
      const stageColors = STAGE_GLOW_COLORS[nextStage];
      const stageName = nextStage.charAt(0).toUpperCase() + nextStage.slice(1);
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
        attention={attention}
        variationIndex={variationIndex}
        hasVariations={maxVariations > 1}
        totalSessions={totalSessions}
        avgAccuracy={avgAccuracy}
        weeklyConsistency={weeklyConsistency}
        weeklyPracticeLog={weeklyPracticeLog}
        breathState={breathState}
        isPracticing={isPracticing}
      />
    </div>
  );
}