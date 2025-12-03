// src/components/Avatar.jsx
// FIVE-LAYER AVATAR STACK:
// 0) Luminous field (canvas rings)
// 1) Breathing aura (practice only)
// 2) Rune ring (PNG, rotating)
// 3) Inner sigil core (PNG, stage-aware)
// 4) Metrics text

import React, { useEffect, useState } from "react";
import { AvatarLuminousCanvas } from "./AvatarLuminousCanvas.jsx";
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


  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Main breathing glow - uses stage color from CSS variables */}
      <div
        className="rounded-full"
        style={{
          width: "80%",
          height: "80%",
          background:
            `radial-gradient(circle, hsla(var(--accent-h), var(--accent-s), calc(var(--accent-l) + 15%), 0.95) 0%, hsla(var(--accent-h), calc(var(--accent-s) - 5%), var(--accent-l), 0.45) 32%, rgba(248,250,252,0.02) 75%, transparent 100%)`,
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

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="consistency-aura-pulse rounded-full"
        style={{
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle, rgba(252,211,77,${opacity}) 0%, rgba(253,224,71,${opacity * 0.6}) 35%, transparent 70%)`,
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
  flame: "rgba(253, 224, 71, 0.6)", // gold
  beacon: "rgba(100, 200, 255, 0.6)", // bright cyan
  stellar: "rgba(200, 150, 255, 0.6)", // purple
};

function RuneRingLayer({ stage = "flame" }) {
  const glowColor = STAGE_RUNE_COLORS[stage] || STAGE_RUNE_COLORS.flame;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Wrapper div rotates, img stays still inside */}
      <div className="rune-ring-wrapper w-[88%] h-[88%]">
        <img
          src="/sigils/rune-ring.png"
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
  seedling: "/sigils/seedling.png",
  ember: "/sigils/ember.png",
  flame: "/sigils/flame.png",
  beacon: "/sigils/beacon.png",
  stellar: "/sigils/stellar.png",
};

//
// ─── STATIC SIGIL CORE (stage-aware) ────────────────────────────────────────────
//
function StaticSigilCore({ stage = "flame" }) {
  const src = STAGE_SIGILS[stage] || STAGE_SIGILS.flame;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      {/* LIVING NEBULA VOID - Barely visible warm cloudiness with slow rotation */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "50%",
          height: "50%",
          borderRadius: "9999px",
          background: "radial-gradient(circle, #030302 0%, #050403 40%, #0a0806 100%)",
          boxShadow: "inset 0 0 20px rgba(253,224,71,0.15), inset 0 0 40px rgba(200,150,50,0.08)",
        }}
      />

      {/* Nebula Layer 1 - Rotating warm cloudiness (clearly visible) */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "50%",
          height: "50%",
          borderRadius: "9999px",
          background: `
            radial-gradient(ellipse at 30% 40%, rgba(80,55,30,0.9) 0%, transparent 45%),
            radial-gradient(ellipse at 70% 60%, rgba(65,45,25,0.8) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, rgba(75,50,28,0.85) 0%, transparent 35%)
          `,
          animation: "voidRotate 45s linear infinite, nebulaPulse 6s ease-in-out infinite",
        }}
      />

      {/* Nebula Layer 2 - Counter-rotating for depth */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "50%",
          height: "50%",
          borderRadius: "9999px",
          background: `
            radial-gradient(ellipse at 60% 30%, rgba(60,42,24,0.7) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 70%, rgba(70,48,26,0.65) 0%, transparent 45%)
          `,
          animation: "voidRotate 60s linear infinite reverse, nebulaPulse 7s ease-in-out infinite",
        }}
      />


      {/* WHIRLPOOL VORTEX - Spiraling lines pulling into void */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "70%",
          height: "70%",
          borderRadius: "9999px",
          background: `
            conic-gradient(
              from 0deg,
              transparent 0%,
              rgba(253,224,71,0.08) 10%,
              transparent 20%,
              rgba(253,224,71,0.08) 30%,
              transparent 40%,
              rgba(253,224,71,0.08) 50%,
              transparent 60%,
              rgba(253,224,71,0.08) 70%,
              transparent 80%,
              rgba(253,224,71,0.08) 90%,
              transparent 100%
            )
          `,
          animation: "whirlpool 90s linear infinite, whirlpoolWaver 8s ease-in-out infinite, whirlpoolFade 24s ease-in-out infinite",
        }}
      />

      {/* WHIRLPOOL Layer 2 - Counter-rotating for depth */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "70%",
          height: "70%",
          borderRadius: "9999px",
          background: `
            conic-gradient(
              from 45deg,
              transparent 0%,
              rgba(253,224,71,0.05) 15%,
              transparent 30%,
              rgba(253,224,71,0.05) 45%,
              transparent 60%,
              rgba(253,224,71,0.05) 75%,
              transparent 90%
            )
          `,
          animation: "whirlpool 120s linear infinite reverse, whirlpoolWaver 10s ease-in-out infinite, whirlpoolFade 24s ease-in-out infinite 4s",
        }}
      />

      {/* EVENT HORIZON - Intense multi-layer glow stack */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "50%",
          height: "50%",
          borderRadius: "9999px",
          border: "2px solid rgba(255, 190, 50, 0.3)", // Near-white core border
          boxShadow: `
            0 0 2px #fffbe8,
            0 0 6px #fde68a,
            0 0 12px #fcd34d,
            0 0 24px #f59e0b,
            0 0 48px rgba(180,83,9,0.6),
            0 0 80px rgba(120,50,5,0.3)
          `,
        }}
      />

      {/* Sigil overlay - Low opacity (25%) floating in void */}
      <div
        className="relative pointer-events-none select-none"
        style={{
          width: "50%",
          height: "50%",
          borderRadius: "9999px",
          overflow: "hidden",
          animation: "sigilRadiate 4s ease-in-out infinite",
          WebkitMaskImage:
            "radial-gradient(circle, white 72%, transparent 100%)",
          maskImage: "radial-gradient(circle, white 72%, transparent 100%)",
        }}
      >
        <img
          src={src}
          alt={`${stage} sigil`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "50% 50%",
            filter:
              "drop-shadow(0 0 16px rgba(255,190,50,0.6)) drop-shadow(0 0 32px rgba(255,160,40,0.2)) contrast(1.1)",
          }}
        />
      </div>
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
          <BreathingAura breathPattern={breathPattern} />
        )}

        {/* Layer 2: rune ring (rotating PNG, stage-aware color) */}
        <RuneRingLayer stage={stage} />

        {/* Layer 3: static sigil core (stage-aware PNG) */}
        <StaticSigilCore stage={stage} />
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
export function Avatar({ mode, breathPattern, breathState, onStageChange }) {
  const label = LABELS[mode] || "Center";

  const [mandalaSnapshot, setMandalaSnapshot] = useState(null);
  const [stageIndex, setStageIndex] = useState(2); // Start at Flame (index 2)

  const STAGE_NAMES = ["seedling", "ember", "flame", "beacon", "stellar"];
  const currentStage = STAGE_NAMES[stageIndex];

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
    setStageIndex((prev) => (prev + 1) % STAGE_NAMES.length);
  };

  return (
    <div className="flex flex-col items-center cursor-pointer overflow-visible" onClick={handleSigilClick}>
      <AvatarContainer
        mode={mode}
        label={label}
        breathPattern={patternForBreath}
        stage={currentStage}
        totalSessions={totalSessions}
        avgAccuracy={avgAccuracy}
        weeklyConsistency={weeklyConsistency}
        weeklyPracticeLog={weeklyPracticeLog}
        breathState={breathState}
      />
    </div>
  );
}