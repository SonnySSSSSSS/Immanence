// src/components/Avatar.jsx
// FIVE-LAYER AVATAR STACK:
// 0) Luminous field (canvas rings)
// 1) Breathing aura (practice only)
// 2) Rune ring (PNG, rotating)
// 3) Inner sigil core (PNG, stage-aware)
// 4) Metrics text

import React, { useEffect, useState } from "react";
import { AvatarLuminousCanvas } from "./AvatarLuminousCanvas.jsx";

// Local fallback until ../state/mandalaStore.js exists
// Replace this with a real import when mandalaStore.js is available:
// import { getMandalaState } from "../state/mandalaStore.js";
function getMandalaState() {
  return {
    avgAccuracy: 0,
    weeklyConsistency: 0,
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
      <div
        className="rounded-full"
        style={{
          width: "80%",
          height: "80%",
          background:
            "radial-gradient(circle, rgba(252,211,77,0.95) 0%, rgba(251,191,36,0.45) 32%, rgba(248,250,252,0.02) 75%, transparent 100%)",
          filter: "blur(6px)",
          transform: `scale(${scale})`,
          transition: "transform 80ms linear",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

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
            filter: `drop-shadow(0 0 18px ${glowColor}) drop-shadow(0 0 42px ${glowColor})`,
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
    <div className="relative z-10 flex items-center justify-center">
      {/* Circular crop container */}
      <div
        className="pointer-events-none select-none"
        style={{
          width: "64%",
          height: "64%",
          borderRadius: "9999px",
          overflow: "hidden",
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
              "drop-shadow(0 0 24px rgba(253,224,71,0.9)) drop-shadow(0 0 64px rgba(250,204,21,0.35))",
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
// ─── AVATAR CONTAINER ──────────────────────────────────────────────────────────
//
function AvatarContainer({ mode, label, breathPattern, stage = "flame", totalSessions = 0, avgAccuracy = 0 }) {
  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Layer 0: luminous ring field (canvas) */}
        <AvatarLuminousCanvas
          totalSessions={totalSessions}
          avgAccuracy={avgAccuracy}
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
      <div className="absolute left-[calc(100%+0.75rem)] top-1/2 -translate-y-1/2 text-xs tracking-[0.25em] text-white/90 uppercase whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

//
// ─── MAIN AVATAR EXPORT ────────────────────────────────────────────────────────
//
export function Avatar({ mode, breathPattern }) {
  const label = LABELS[mode] || "Center";

  const [mandalaSnapshot, setMandalaSnapshot] = useState(null);
  const [stageIndex, setStageIndex] = useState(2); // Start at Flame (index 2)

  const STAGE_NAMES = ["seedling", "ember", "flame", "beacon", "stellar"];
  const currentStage = STAGE_NAMES[stageIndex];

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
    <div className="flex flex-col items-center cursor-pointer" onClick={handleSigilClick}>
      <AvatarContainer
        mode={mode}
        label={label}
        breathPattern={patternForBreath}
        stage={currentStage}
        totalSessions={totalSessions}
        avgAccuracy={avgAccuracy}
      />

      <div className="mt-3 text-[10px] text-white/70 text-center space-y-0.5">
        <div>
          acc {accPct} ({accLabel}) · wk {wkPct} ({wkLabel}) · phase {phase}
        </div>
        <div>
          live f {Math.round(focus * 100)} · c {Math.round(clarity * 100)} · d{" "}
          {Math.round(distortion * 100)}
        </div>
        <div className="text-[9px] text-white/50">
          stage: {currentStage} (click to cycle)
        </div>
      </div>
    </div>
  );
}