// src/components/Avatar.jsx
// THREE-LAYER AVATAR:
// 1) Ambient halo
// 2) Breathing aura (practice only)
// 3) Static sigil core (real image)

import React, { useEffect, useState } from "react";

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
// ─── STATIC SIGIL CORE (real image) ────────────────────────────────────────────
//
function StaticSigilCore() {
  return (
    <div className="relative z-10 flex items-center justify-center">
      <img
        src="/sigils/flame.png"
        alt="Flame sigil"
        className="pointer-events-none select-none"
        style={{
          width: "60%",
          height: "60%",
          objectFit: "contain",
          filter:
            "drop-shadow(0 0 18px rgba(253,224,71,0.9)) drop-shadow(0 0 42px rgba(251,191,36,0.65))",
        }}
      />
    </div>
  );
}

//
// ─── AMBIENT HALO / STATIC RINGS ───────────────────────────────────────────────
//
function AmbientHalo({ mode }) {
  const rings = [
    { r: 92, opacity: 0.14, strokeWidth: 0.5 },
    { r: 82, opacity: 0.18, strokeWidth: 0.6 },
    { r: 72, opacity: 0.25, strokeWidth: 0.7 },
    { r: 62, opacity: 0.32, strokeWidth: 0.8 },
  ];

  // Mode-based color accents
  let haloColor = "rgba(234,179,8,0.35)"; // hub / default – amber
  let ringColor = "rgba(248,250,252,0.9)";

  if (mode === "practice") {
    haloColor = "rgba(251,191,36,0.5)"; // warmer, stronger
  } else if (mode === "wisdom") {
    haloColor = "rgba(129,140,248,0.45)"; // indigo
    ringColor = "rgba(219,234,254,0.95)";
  } else if (mode === "application") {
    haloColor = "rgba(45,212,191,0.45)"; // teal
    ringColor = "rgba(204,251,241,0.95)";
  } else if (mode === "navigation") {
    haloColor = "rgba(192,132,252,0.45)"; // violet
    ringColor = "rgba(237,233,254,0.95)";
  }

  return (
    <>
      {/* Soft base halo */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${haloColor} 0%, transparent 70%)`,
          filter: "blur(12px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Fine white rings for structure */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {rings.map((ring, i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={ring.r}
            fill="none"
            stroke={ringColor}
            strokeWidth={ring.strokeWidth}
            opacity={ring.opacity}
          />
        ))}
      </svg>
    </>
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
function AvatarContainer({ mode, label, breathPattern }) {
  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Layer 1: ambient halo + structural rings */}
        <AmbientHalo mode={mode} />

        {/* Layer 2: breathing aura (only in Practice mode) */}
        {mode === "practice" && (
          <BreathingAura breathPattern={breathPattern} />
        )}

        {/* Layer 3: static sigil core (real image) */}
        <StaticSigilCore />
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

  return (
    <div className="flex flex-col items-center">
      <AvatarContainer
        mode={mode}
        label={label}
        breathPattern={patternForBreath}
      />

      <div className="mt-3 text-[10px] text-white/70 text-center space-y-0.5">
        <div>
          acc {accPct} ({accLabel}) · wk {wkPct} ({wkLabel}) · phase {phase}
        </div>
        <div>
          live f {Math.round(focus * 100)} · c {Math.round(clarity * 100)} · d{" "}
          {Math.round(distortion * 100)}
        </div>
      </div>
    </div>
  );
}
