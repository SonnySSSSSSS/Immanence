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
import { LightModeInstrumentRing } from "./LightModeInstrumentRing.jsx";
import { useLunarStore } from "../state/lunarStore";
import { useDisplayModeStore } from "../state/displayModeStore";
import { useSettingsStore } from "../state/settingsStore";
import "./Avatar.css";

// Local fallback until ../state/mandalaStore.js exists
function getMandalaState() {
  return {
    avgAccuracy: 0,
    weeklyConsistency: 0,
    weeklyPracticeLog: [true, true, false, true, false, true, false],
    phase: "foundation",
    transient: {
      focus: 0,
      clarity: 0,
      distortion: 0,
    },
  };
}

// ─── BREATHING AURA ────────────────────────────────────────
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
    scale = maxScale - (maxScale - minScale) * ((progress - tHoldTop) / (tExhale - tHoldTop));
  } else {
    scale = minScale;
  }

  const theme = useTheme();
  const gradient = 'radial-gradient(circle, var(--accent-80) 0%, var(--accent-40) 32%, var(--accent-20) 58%, rgba(248,250,252,0.02) 75%, transparent 100%)';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
      <div
        className="rounded-full absolute"
        style={{
          width: "80%",
          height: "80%",
          background: `radial-gradient(circle at 30% 30%, rgba(252, 211, 77, 0.3) 0%, transparent 40%)`,
          filter: "blur(8px)",
          transform: `scale(${scale})`,
          transition: "transform 80ms linear",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

// ─── CONSISTENCY AURA ─────────────────────────────────────────
function ConsistencyAura({ weeklyConsistency = 0 }) {
  const minOpacity = 0.15;
  const maxOpacity = 0.5;
  const opacity = minOpacity + (maxOpacity - minOpacity) * (weeklyConsistency / 7);
  const pulseScale = 0.05 + (0.1 * (weeklyConsistency / 7));
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
          "--pulse-scale": pulseScale,
        }}
      />
    </div>
  );
}

// ─── RUNE RING LAYER ────────────────────────────────────────────
const STAGE_RUNE_COLORS = {
  seedling: "rgba(75, 192, 192, 0.6)",
  ember: "rgba(255, 140, 0, 0.6)",
  flame: "rgba(255, 247, 216, 0.8)",
  beacon: "rgba(100, 200, 255, 0.6)",
  stellar: "rgba(200, 150, 255, 0.6)",
};

function RuneRingLayer({ stage = "flame", isPracticing = false }) {
  const isLight = useDisplayModeStore((state) => state.colorScheme === "light");
  const glowColor = STAGE_RUNE_COLORS[stage] || STAGE_RUNE_COLORS.flame;
  const ringType = useSettingsStore(s => s.lightModeRingType);
  const isAstrolabe = ringType === 'astrolabe';

  if (isLight) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="light-ring-rotate relative w-[100%] h-[100%] flex items-center justify-center"
          style={{
            transition: 'opacity 0.5s ease',
            animationPlayState: isPracticing ? 'paused' : 'running'
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}sigils/${isAstrolabe ? 'ring-structure.webp' : 'light-rune-ring.png'}`}
            alt="Instrument ring"
            className="absolute top-1/2 left-1/2 object-contain"
            style={{
              width: "100%",
              height: "100%",
              opacity: isPracticing ? 0.95 : 1,
              filter: isAstrolabe
                ? `sepia(0.22) contrast(1.05) brightness(0.96) drop-shadow(0 2px 6px var(--light-shadow-tint)) drop-shadow(0 0 2px #D4AF37) drop-shadow(0 0 4px #B8860B)`
                : `drop-shadow(0 2px 8px var(--light-shadow-tint)) drop-shadow(0 0 2px #D4AF37) drop-shadow(0 0 4px #B8860B)`,
              transition: 'transform 0.5s ease, opacity 0.5s ease',
              transform: isPracticing
                ? `translate(-50.35%, ${isAstrolabe ? '-49.2%' : '-48.0%'}) ${isAstrolabe ? 'scale(1.15)' : 'scale(1.08)'}`
                : `translate(-50.35%, ${isAstrolabe ? '-49.2%' : '-48.0%'}) ${isAstrolabe ? 'scale(1.1)' : 'scale(1.05)'}`,
            }}
          />
          {isAstrolabe && (
            <img
              src={`${import.meta.env.BASE_URL}sigils/ring-inner-lip.webp`}
              alt="Mechanical lip"
              className="absolute"
              style={{
                width: "48.5%",
                height: "48.5%",
                opacity: 0.12,
                mixBlendMode: "multiply",
                pointerEvents: "none"
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {stage === "flame" && (
        <div
          className="absolute w-[88%] h-[88%]"
          style={{
            borderRadius: "9999px",
            background: "radial-gradient(circle, transparent 45%, #2b2418 55%, #4a3a1d 100%)",
          }}
        />
      )}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "48.5%",
          height: "48.5%",
          borderRadius: "50%",
          boxShadow: isLight
            ? "inset 0 0 1px 1.5px rgba(0,0,0,0.15)"
            : "inset 0 0 2px 2px rgba(0,0,0,0.8)",
          zIndex: 10
        }}
      />
      <div
        className="absolute w-[88%] h-[88%]"
        style={{
          borderRadius: "9999px",
          background: "radial-gradient(circle, transparent 60%, rgba(0,0,0,0.15) 70%, transparent 80%)",
        }}
      />

      <div
        className="dark-ring-rotate w-[88%] h-[88%] relative flex items-center justify-center"
        style={{ animationPlayState: isPracticing ? 'paused' : 'running' }}
      >
        <div className="absolute inset-0 hairline-ring opacity-40 scale-[1.005]" />
        <img
          src={`${import.meta.env.BASE_URL}sigils/${stage === 'flame' ? 'rune-ring2.png' : 'rune-ring.png'}`}
          alt="Rune ring"
          className="w-full h-full object-contain"
          style={{
            filter: `brightness(1.1) saturate(1.2) drop-shadow(0 0 3px ${glowColor})`,
            opacity: 0.9,
          }}
        />
        <div className="absolute inset-0 pointer-events-none">
          {['SOMA', 'PRANA', 'DHYANA', 'DRISHTI'].map((label, i) => (
            <div
              key={label}
              className="absolute text-[6px] text-suspended text-white/30"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-32%)`,
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

// ─── STATIC SIGIL CORE ───────────────────────────────────────────
function StaticSigilCore({ stage = "flame", path = null, showCore = true, attention = 'vigilance', variationIndex = 0, hasVariations = false, isPracticing = false, isLight = false }) {
  const stageLower = stage.toLowerCase();
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
  } else if (attention && attention !== 'none') {
    const pathLower = path.toLowerCase();
    const attentionLower = attention.toLowerCase();
    const variationSuffix = `_0000${variationIndex + 1}_`;
    src = `${import.meta.env.BASE_URL}avatars/avatar-${stageLower}-${pathLower}-${attentionLower}${variationSuffix}.png`;
  } else {
    const stageCapitalized = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
    const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1).toLowerCase();
    src = `${import.meta.env.BASE_URL}avatars/${stageCapitalized}-${pathCapitalized}.png`;
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div
        className="absolute pointer-events-none"
        style={{
          width: "45%",
          height: "45%",
          borderRadius: "9999px",
          background: `conic-gradient(from 0deg, transparent 0%, var(--accent-10) 15%, transparent 30%, var(--accent-10) 45%, transparent 60%, var(--accent-10) 75%, transparent 90%)`,
          animation: "whirlpool 90s linear infinite",
          animationPlayState: isPracticing ? 'paused' : 'running',
          opacity: 0.5,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: "50%",
          height: "50%",
          borderRadius: "9999px",
          background: isLight
            ? "radial-gradient(circle, rgba(10, 25, 20, 0.45) 0%, rgba(10, 25, 20, 0.25) 50%, transparent 85%)"
            : "#000000",
          opacity: isLight ? 0.7 : 1,
        }}
      />
      <div
        className={`relative pointer-events-none select-none ${isLight ? 'light-orb-rotate' : 'dark-orb-rotate'}`}
        style={{
          width: "44%",
          height: "44%",
          borderRadius: "9999px",
          overflow: "hidden",
          animationPlayState: isPracticing ? 'paused' : 'running',
          boxShadow: "0 0 5px 2px rgba(0,0,0,0.6)",
        }}
      >
        <img
          src={src}
          alt={`${stage} avatar`}
          className="absolute top-1/2 left-1/2"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
            transform: "translate(-50%, -50%)",
            maskImage: "radial-gradient(circle, black 88%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(circle, black 88%, transparent 100%)",
          }}
        />
      </div>
      {hasVariations && (
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
      )}
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

// ─── LABELS ───────────────────────────────────────────────────
const LABELS = {
  hub: "Center",
  practice: "Practice",
  wisdom: "Wisdom",
  application: "Application",
  navigation: "Navigation",
};

// ─── STAGE GLOW COLORS ────────────────────────────────────────
const STAGE_GLOW_COLORS = {
  seedling: { h: 180, s: 70, l: 50 },
  ember: { h: 25, s: 85, l: 55 },
  flame: { h: 42, s: 95, l: 58 },
  beacon: { h: 200, s: 85, l: 60 },
  stellar: { h: 270, s: 80, l: 65 },
};

// ─── AVATAR CONTAINER ─────────────────────────────────────────
function AvatarContainer({
  mode,
  breathPattern,
  stage = "flame",
  path = null,
  showCore = true,
  attention = 'vigilance',
  variationIndex = 0,
  hasVariations = false,
  weeklyConsistency = 0,
  weeklyPracticeLog = [],
  breathState,
  isPracticing = false
}) {
  const glowColor = STAGE_GLOW_COLORS[stage] || STAGE_GLOW_COLORS.flame;
  const { h, s, l } = glowColor;
  const isLight = useDisplayModeStore((state) => state.colorScheme === 'light');
  const moonProgress = useLunarStore(s => s.progress);

  const moonAngle = (moonProgress / 12) * (Math.PI * 2) - Math.PI / 2;
  const shadowDist = isLight ? 10 : 0;
  const shadowX = -Math.cos(moonAngle) * shadowDist;
  const shadowY = -Math.sin(moonAngle) * shadowDist;

  return (
    <div className="relative flex items-center justify-center overflow-visible" style={{ width: 'min(90vw, 600px)', height: 'min(90vw, 600px)' }}>
      {!isLight && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle, hsla(${h}, ${s}%, ${l}%, 0.45) 0%, hsla(${h}, ${s}%, ${l - 5}%, 0.32) 35%, hsla(${h}, ${s}%, ${l - 10}%, 0.18) 60%, hsla(${h}, ${s}%, ${l - 15}%, 0.08) 80%, hsla(${h}, ${s}%, ${l - 20}%, 0.01) 90%, transparent 95%)`,
              filter: "blur(100px)",
              borderRadius: "50%",
              animation: "breathingPulse 8s ease-in-out infinite",
              animationPlayState: isPracticing ? 'paused' : 'running',
            }}
          />
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
        </>
      )}

      <div className="relative w-full h-full flex items-center justify-center overflow-visible">
        <div className="absolute w-[64%] h-[64%] flex items-center justify-center overflow-visible pointer-events-none">
          <AvatarLuminousCanvas
            breathState={breathState}
            weeklyPracticeLog={weeklyPracticeLog}
            weeklyConsistency={weeklyConsistency}
          />

          <RuneRingLayer stage={stage} isPracticing={isPracticing} />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              width: "100%",
              height: "100%",
              zIndex: 5
            }}
          >
            <div
              className="absolute"
              style={{
                width: "108%",
                height: "108%",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `1px solid hsla(${h}, ${s}%, ${l}%, 0.25)`,
                boxShadow: isLight ? 'none' : `inset 0 0 1px hsla(${h}, ${s}%, ${l}%, 0.2)`,
              }}
            />
            <div
              className="absolute"
              style={{
                width: "102%",
                height: "102%",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `1.5px solid hsla(${h}, ${s}%, ${l}%, 0.45)`,
                boxShadow: isLight ? 'none' : `inset 0 0 1px hsla(${h}, ${s}%, ${l}%, 0.4)`,
              }}
            >
              <div
                className="absolute"
                style={{
                  width: "2px",
                  height: "10px",
                  top: "-5px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: `hsla(${h}, ${s}%, ${l}%, 0.98)`,
                  boxShadow: `0 0 8px hsla(${h}, ${s}%, ${l}%, 0.9), 0 0 12px hsla(${h}, ${s}%, ${l}%, 0.4)`,
                  zIndex: 20
                }}
              />
            </div>
          </div>

          {isLight && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `radial-gradient(circle, hsla(${h}, ${s}%, ${l}%, ${stage === 'seedling' ? 0.28 : 0.18}) 0%, hsla(${h}, ${s}%, ${l}%, 0.08) 45%, transparent 70%)`,
                mixBlendMode: "plus-lighter",
                opacity: isPracticing ? 0.25 : 0.18,
                transition: "opacity 1.5s ease-in-out",
                zIndex: 1,
              }}
            />
          )}

          <div
            className="absolute pointer-events-none shadow-inner"
            style={{
              width: "50.5%",
              height: "50.5%",
              borderRadius: "50%",
              boxShadow: isLight
                ? `inset ${shadowX}px ${shadowY}px 12px rgba(0, 0, 0, 0.45)`
                : "inset 0 0 10px rgba(0, 0, 0, 0.45)",
              zIndex: 2,
              transition: 'box-shadow 0.8s ease-out'
            }}
          />

          <StaticSigilCore
            stage={stage}
            path={path}
            showCore={showCore}
            attention={attention}
            variationIndex={variationIndex}
            hasVariations={hasVariations}
            isPracticing={isPracticing}
            isLight={isLight}
          />
        </div>

        {mode === "practice" && (
          <BreathingAura key={stage} breathPattern={breathPattern} />
        )}

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          viewBox="0 0 600 600"
          style={{ overflow: 'visible', zIndex: 10 }}
        >
          <MoonOrbit avatarRadius={138} centerX={300} centerY={300} />
        </svg>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: "50%",
            opacity: 0.025,
            mixBlendMode: "overlay",
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctels='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            zIndex: 20
          }}
        />
      </div>
    </div>
  );
}

// ─── MAIN AVATAR EXPORT ──────────────────────────────────────────
export function Avatar({ mode, breathPattern, breathState, onStageChange, stage: controlledStage, path = null, showCore = true, attention = 'vigilance', isPracticing = false }) {
  const label = LABELS[mode] || "Center";

  const [mandalaSnapshot, setMandalaSnapshot] = useState(null);
  const [stageIndex, setStageIndex] = useState(2);
  const [variationIndex, setVariationIndex] = useState(0);
  const [maxVariations, setMaxVariations] = useState(1);

  const STAGE_NAMES = ["seedling", "ember", "flame", "beacon", "stellar"];
  const internalStage = STAGE_NAMES[stageIndex];
  const currentStage = controlledStage ? controlledStage.toLowerCase() : internalStage;

  useEffect(() => {
    if (!path || showCore || !attention || attention === 'none') {
      setMaxVariations(1);
      setVariationIndex(0);
      return;
    }
    const stageLower = currentStage.toLowerCase();
    const pathLower = path.toLowerCase();
    const attentionLower = attention.toLowerCase();

    const checkVariation = (index) => {
      return new Promise((resolve) => {
        const img = new Image();
        const variationSuffix = `_0000${index + 1}_`;
        img.src = `${import.meta.env.BASE_URL}avatars/avatar-${stageLower}-${pathLower}-${attentionLower}${variationSuffix}.png`;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
    };

    Promise.all([...Array(10)].map((_, i) => checkVariation(i)))
      .then(results => {
        const foundCount = results.filter(Boolean).length;
        setMaxVariations(foundCount > 0 ? foundCount : 1);
        setVariationIndex(0);
      });
  }, [currentStage, path, attention, showCore]);

  useEffect(() => {
    if (onStageChange) {
      const stageColors = STAGE_GLOW_COLORS[currentStage];
      const stageName = currentStage.charAt(0).toUpperCase() + currentStage.slice(1);
      onStageChange(stageColors, stageName);
    }
  }, [currentStage, onStageChange]);

  useEffect(() => {
    function refresh() {
      const state = getMandalaState();
      setMandalaSnapshot(state || null);
    }
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  const mandalaData = mandalaSnapshot || {};
  const avgAccuracy = mandalaData.avgAccuracy || 0;
  const weeklyConsistency = mandalaData.weeklyConsistency || 0;
  const weeklyPracticeLog = mandalaData.weeklyPracticeLog || [false, false, false, false, false, false, false];

  const safePattern = breathPattern || {};
  const patternForBreath = {
    inhale: typeof safePattern.inhale === "number" ? safePattern.inhale : 4,
    holdTop: typeof safePattern.hold1 === "number" ? safePattern.hold1 : 4,
    exhale: typeof safePattern.exhale === "number" ? safePattern.exhale : 4,
    holdBottom: typeof safePattern.hold2 === "number" ? safePattern.hold2 : 2,
  };

  const handleSigilClick = () => {
    if (maxVariations > 1) {
      setVariationIndex((prev) => (prev + 1) % maxVariations);
    } else if (controlledStage && onStageChange) {
      const currentIndex = STAGE_NAMES.indexOf(currentStage);
      const nextIndex = (currentIndex + 1) % STAGE_NAMES.length;
      const nextStage = STAGE_NAMES[nextIndex];
      const stageColors = STAGE_GLOW_COLORS[nextStage];
      const stageName = nextStage.charAt(0).toUpperCase() + nextStage.slice(1);
      onStageChange(stageColors, stageName);
    } else {
      setStageIndex((prev) => (prev + 1) % STAGE_NAMES.length);
    }
  };

  return (
    <div className="flex flex-col items-center cursor-pointer overflow-visible" onClick={handleSigilClick}>
      <AvatarContainer
        mode={mode}
        breathPattern={patternForBreath}
        stage={currentStage}
        path={path}
        showCore={showCore}
        attention={attention}
        variationIndex={variationIndex}
        hasVariations={maxVariations > 1}
        weeklyConsistency={weeklyConsistency}
        weeklyPracticeLog={weeklyPracticeLog}
        breathState={breathState}
        isPracticing={isPracticing}
      />
    </div>
  );
}