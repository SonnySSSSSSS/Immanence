// src/components/PracticeSection.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { addSession } from "../state/practiceStore.js";
import { recordPracticeEffect } from "../state/mandalaStore.js";
import { BreathingRing } from "./BreathingRing.jsx";
import { Avatar } from "./Avatar.jsx";

// available practice types
const PRACTICES = ["Breathing", "Meditation", "Yoga", "Visualization"];
const DURATIONS_MIN = [5, 10, 15, 20];

// simple presets for pattern
const PATTERN_PRESETS = {
  Box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  "4-7-8": { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  Kumbhaka: { inhale: 4, hold1: 16, exhale: 8, hold2: 0 },
};

// normalize an error in ms to 0..1 where 1 = perfect
function normalizeAccuracy(errorMs) {
  if (errorMs == null) return 0;
  const clamped = Math.min(Math.abs(errorMs), 1500); // cap at 1.5s
  return 1 - clamped / 1500;
}

// ---- OPTION A: Pulse visual ----
function AccuracyPulse({ avgErrorMs, bestErrorMs }) {
  const baseError =
    bestErrorMs != null
      ? bestErrorMs
      : avgErrorMs != null
      ? avgErrorMs
      : 4000;
  const acc = normalizeAccuracy(baseError);

  // EXAGGERATED for debugging
  const minScale = 0.6;
  const maxScale = 1 + 0.8 * acc; // much bigger breathing at high accuracy
  const duration = 4 - 3 * acc; // 4s -> ~1s as accuracy improves

  return (
    <div className="relative w-28 h-28 mx-auto">
      {/* static ring */}
      <div className="absolute inset-0 rounded-full border border-white/25" />
      {/* animated pulse */}
      <motion.div
        className="absolute inset-2 rounded-full bg-emerald-400/40 blur-md"
        animate={{
          scale: [minScale, maxScale, minScale],
          opacity: [0.1, 1, 0.1],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* inner core */}
      <div className="absolute inset-6 rounded-full border border-white/60 bg-white/10" />
    </div>
  );
}

// ---- OPTION B: Petal ring visual ----
function AccuracyPetals({ avgErrorMs, tapCount }) {
  const acc = normalizeAccuracy(
    avgErrorMs != null ? avgErrorMs : 4000
  );
  const maxPetals = 20; // EXAGGERATED
  const petals = Math.max(1, Math.round(acc * maxPetals));

  const center = 50;
  const innerR = 26;
  const outerR = 48;

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto">
      {/* background circle */}
      <circle
        cx={center}
        cy={center}
        r={innerR}
        fill="rgba(15,23,42,0.75)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.4"
      />
      {/* petals */}
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i / petals) * Math.PI * 2;
        const x1 = center + Math.cos(angle) * innerR;
        const y1 = center + Math.sin(angle) * innerR;
        const x2 = center + Math.cos(angle) * outerR;
        const y2 = center + Math.sin(angle) * outerR;

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(52,211,153,0.9)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      {/* tiny overlay text hint */}
      <text
        x={center}
        y={center + 3}
        textAnchor="middle"
        fontSize="6"
        fill="rgba(248,250,252,0.9)"
      >
        {tapCount > 0 ? `${tapCount} taps` : "no taps"}
      </text>
    </svg>
  );
}

// classify based on average error + tap volume
function classifyAccuracy(avgErrorMs, tapCount) {
  if (tapCount < 2 || avgErrorMs == null) return null;
  const acc = normalizeAccuracy(avgErrorMs);
  if (acc > 0.75) return "held";
  if (acc > 0.45) return "mostly";
  return "struggled";
}

// --- live/transient accuracy tuning ---
const LIVE_WINDOW_TAPS = 6; // how many recent taps to consider (slightly tighter window)
const TRANSIENT_MIN_TAPS = 2; // start reacting after just 2 taps
const TRANSIENT_MIN_INTERVAL_MS = 1000; // allow live updates up to once per second

export function PracticeSection({ onPatternChange, onModeChange }) {
  const [practice, setPractice] = useState("Breathing");
  const [durationMin, setDurationMin] = useState(10);

  const [pattern, setPattern] = useState({
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  });
  const [selectedPreset, setSelectedPreset] = useState("Box");

  const [isRunning, setIsRunning] = useState(false);
  const [remainingSec, setRemainingSec] = useState(durationMin * 60);

  const [tapErrors, setTapErrors] = useState([]);
  const [lastErrorMs, setLastErrorMs] = useState(null);
  const [lastSignedErrorMs, setLastSignedErrorMs] = useState(null);

  const [accuracyView, setAccuracyView] = useState("pulse");
  const [ripple, setRipple] = useState(null);

  const timerRef = useRef(null);
  const breathStartTimeRef = useRef(null);

  const lastPhaseRef = useRef(null);
  const lastTransientSentRef = useRef(0);

  useEffect(() => {
    onPatternChange?.(pattern);
  }, [pattern, onPatternChange]);

  useEffect(() => {
    onModeChange?.(practice);
  }, [practice, onModeChange]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        const elapsedSec = Math.floor((Date.now() - start) / 1000);
        const next = durationMin * 60 - elapsedSec;
        if (next <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsRunning(false);
          return 0;
        }
        return next;
      });
    }, 250);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, durationMin]);

  useEffect(() => {
    setRemainingSec(durationMin * 60);
  }, [durationMin]);

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);
    setRemainingSec(durationMin * 60);
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    lastPhaseRef.current = null;
    lastTransientSentRef.current = 0;
    breathStartTimeRef.current = Date.now();
  };

  const handleStop = () => {
    setIsRunning(false);

    const tapCountLocal = tapErrors.length;
    let avgErrorMsLocal = null;
    let bestErrorMsLocal = null;

    if (tapCountLocal > 0) {
      avgErrorMsLocal = Math.round(
        tapErrors.reduce((sum, v) => sum + v, 0) / tapCountLocal
      );
      bestErrorMsLocal = Math.round(Math.min(...tapErrors));
    }

    const accuracyLabel = classifyAccuracy(
      avgErrorMsLocal,
      tapCountLocal
    );

    const id =
      typeof crypto !== "undefined" &&
      crypto.randomUUID &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : String(Date.now());

    const sessionPayload = {
      id,
      date: new Date().toISOString(),
      type: practice.toLowerCase(),
      durationMinutes: durationMin,
      pattern: { ...pattern },
      tapStats:
        tapCountLocal > 0
          ? {
              tapCount: tapCountLocal,
              avgErrorMs: avgErrorMsLocal,
              bestErrorMs: bestErrorMsLocal,
            }
          : null,
    };

    addSession(sessionPayload);

    if (accuracyLabel) {
      recordPracticeEffect({
        dateISO: sessionPayload.date,
        durationMinutes: sessionPayload.durationMinutes,
        accuracy: accuracyLabel,
      });
    }

    setRemainingSec(durationMin * 60);
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    lastPhaseRef.current = null;
    lastTransientSentRef.current = 0;
    breathStartTimeRef.current = null;
  };

  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  const applyPreset = (name) => {
    const preset = PATTERN_PRESETS[name];
    if (!preset) return;
    setPattern(preset);
    setSelectedPreset(name);
  };

  const updateField = (field, value) => {
    const numeric = parseFloat(value);
    setPattern((prev) => ({
      ...prev,
      [field]: isNaN(numeric) ? 0 : numeric,
    }));
    setSelectedPreset(null);
  };

  const totalPatternSeconds =
    (pattern.inhale || 0) +
    (pattern.hold1 || 0) +
    (pattern.exhale || 0) +
    (pattern.hold2 || 0);

  const patternSummary = `${pattern.inhale || 0}s in . ${
    pattern.hold1 || 0
  }s hold . ${pattern.exhale || 0}s out . ${
    pattern.hold2 || 0
  }s hold`;

  useEffect(() => {
    if (!isRunning || practice !== "Breathing") {
      return;
    }

    if (!breathStartTimeRef.current) {
      breathStartTimeRef.current = Date.now();
      return;
    }

    const id = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - breathStartTimeRef.current;
      const cycle = totalPatternSeconds * 1000 || 1;
      const elapsedSec = (elapsedMs % cycle) / 1000;
      const phase = (elapsedSec % cycle) / cycle;

      let segment = null;
      if (phase < (pattern.inhale || 0) / totalPatternSeconds) {
        segment = "inhale";
      } else if (
        phase <
        ((pattern.inhale || 0) + (pattern.hold1 || 0)) /
          totalPatternSeconds
      ) {
        segment = "holdTop";
      } else if (
        phase <
        ((pattern.inhale || 0) +
          (pattern.hold1 || 0) +
          (pattern.exhale || 0)) /
          totalPatternSeconds
      ) {
        segment = "exhale";
      } else {
        segment = "holdBottom";
      }

      lastPhaseRef.current = segment;
    }, 120);

    return () => {
      clearInterval(id);
    };
  }, [isRunning, practice, totalPatternSeconds, pattern]);

  const handleAccuracyTap = (errorMsFromRing = null) => {
    if (!isRunning || practice !== "Breathing") {
      return;
    }

    let errorMs;

    // If errorMs is provided by BreathingRing, use it directly
    if (errorMsFromRing !== null) {
      errorMs = errorMsFromRing;
    } else {
      // Otherwise calculate it (for non-ring taps, though this path isn't used currently)
      const now = Date.now();

      if (!breathStartTimeRef.current) {
        breathStartTimeRef.current = now;
      }

      const elapsedMs = now - breathStartTimeRef.current;
      const cycle = totalPatternSeconds * 1000 || 1;
      const phase = (elapsedMs % cycle) / cycle;

      const inhaleEnd =
        (pattern.inhale || 0) / totalPatternSeconds;
      const holdTopEnd =
        ((pattern.inhale || 0) + (pattern.hold1 || 0)) /
        totalPatternSeconds;
      const exhaleEnd =
        ((pattern.inhale || 0) +
          (pattern.hold1 || 0) +
          (pattern.exhale || 0)) /
        totalPatternSeconds;

      let isPeak = false;
      let expectedPhase = 0;

      // Inhale peak (end of inhale expansion)
      if (phase >= inhaleEnd - 0.15 && phase <= inhaleEnd + 0.15) {
        isPeak = true;
        expectedPhase = inhaleEnd;
      } 
      // Inhale release (end of hold top, start of exhale)
      else if (phase >= holdTopEnd - 0.15 && phase <= holdTopEnd + 0.15) {
        isPeak = true;
        expectedPhase = holdTopEnd;
      } 
      // Exhale peak (end of exhale contraction)
      else if (
        phase >= exhaleEnd - 0.15 &&
        phase <= exhaleEnd + 0.15
      ) {
        isPeak = true;
        expectedPhase = exhaleEnd;
      } 
      // Exhale release (end of hold bottom, start of next inhale)
      else if (phase >= 0.85 && phase <= 1.0) {
        isPeak = true;
        expectedPhase = 1.0;
      }

      if (!isPeak || totalPatternSeconds === 0) {
        return;
      }

      const expectedMs = expectedPhase * cycle;
      const actualMs = elapsedMs % cycle;
      errorMs = actualMs - expectedMs;
    }

    setLastErrorMs(Math.abs(errorMs));
    setLastSignedErrorMs(errorMs);
    
    // Trigger ripple animation
    setRipple({ id: Date.now() });
    setTimeout(() => setRipple(null), 600);

    setTapErrors((prev) => {
      const newTapErrors = [...prev, errorMs];
      if (newTapErrors.length > 48) {
        newTapErrors.shift();
      }

      const windowSlice = newTapErrors.slice(-LIVE_WINDOW_TAPS);
      const windowCount = windowSlice.length;

      let windowAvg =
        windowCount > 0
          ? windowSlice.reduce((sum, v) => sum + v, 0) /
            windowCount
          : null;

      let accuracyLabel = null;
      if (windowAvg != null) {
        const acc = normalizeAccuracy(windowAvg);
        if (acc > 0.75) accuracyLabel = "held";
        else if (acc > 0.45) accuracyLabel = "mostly";
        else accuracyLabel = "struggled";
      }

      if (accuracyLabel && windowCount >= TRANSIENT_MIN_TAPS) {
        const nowMs = Date.now();
        if (
          nowMs - lastTransientSentRef.current >=
          TRANSIENT_MIN_INTERVAL_MS
        ) {
          recordPracticeEffect({
            accuracy: accuracyLabel,
            transient: true,
            timestamp: nowMs,
          });
          lastTransientSentRef.current = nowMs;
        }
      }

      return newTapErrors;
    });
  };

  const tapCount = tapErrors.length;
  const avgErrorMs =
    tapCount > 0
      ? Math.round(
          tapErrors.reduce((sum, v) => sum + v, 0) / tapCount
        )
      : null;
  const bestErrorMs =
    tapCount > 0 ? Math.round(Math.min(...tapErrors)) : null;

  const safePattern = pattern || {};
  const patternForBreath = {
    inhale: typeof safePattern.inhale === "number" ? safePattern.inhale : 4,
    holdTop: typeof safePattern.hold1 === "number" ? safePattern.hold1 : 4,
    exhale: typeof safePattern.exhale === "number" ? safePattern.exhale : 4,
    holdBottom:
      typeof safePattern.hold2 === "number" ? safePattern.hold2 : 2,
  };

  // Show breathing ring as main focus during breathing practice
  if (practice === "Breathing" && isRunning) {
    // Calculate progress for progress ring
    const totalSec = durationMin * 60;
    const elapsed = totalSec - remainingSec;
    const progressPercent = (elapsed / totalSec) * 100;
    const circumference = 2 * Math.PI * 45; // radius 45
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    
    return (
      <div className="w-full max-w-md mx-auto mt-6 flex flex-col items-center">
        {/* Avatar peek - small, dimmed, at top */}
        <div style={{ opacity: 0.3, marginBottom: "-2rem", zIndex: 5, pointerEvents: "none" }}>
          <Avatar mode="practice" breathPattern={patternForBreath} />
        </div>
        
        {/* Breathing ring with ripple */}
        <div style={{ position: "relative", marginTop: "2rem" }}>
        <BreathingRing 
          breathPattern={patternForBreath}
          onTap={handleAccuracyTap}
        />
          
          {/* Tap ripple - expands outward on successful tap */}
          {ripple && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "20px",
              height: "20px",
              border: "2px solid #fcd34d",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              animation: "rippleExpand 0.6s ease-out forwards",
              pointerEvents: "none"
            }} />
          )}
        </div>
        
        {/* Timer with progress ring */}
        <div className="mt-6 text-center relative">
          {/* Progress ring SVG */}
          <svg style={{ position: "absolute", top: "-65px", left: "50%", transform: "translateX(-50%)", width: "120px", height: "120px" }}>
            {/* Background circle */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(253, 224, 71, 0.1)" strokeWidth="2" />
            {/* Progress arc */}
            <circle 
              cx="60" 
              cy="60" 
              r="45" 
              fill="none" 
              stroke="#fcd34d" 
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px", transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          
          <div style={{ fontSize: "1.25rem", fontFamily: "Cinzel, serif", letterSpacing: "0.2em", color: "rgba(253, 251, 245, 0.6)" }}>
            {mm}:{ss}
          </div>
          <button
            onClick={handleStop}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.5rem",
              fontFamily: "Cinzel, serif",
              fontSize: "0.625rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "1px solid rgba(253, 224, 71, 0.3)",
              color: "rgba(253, 251, 245, 0.8)",
              background: "transparent",
              borderRadius: "9999px",
              cursor: "pointer",
            }}
          >
            End
          </button>
        </div>

        {/* Tap tracker section */}
        <div className="mt-8 w-full max-w-sm">
          <button
            className="w-full h-16 rounded-2xl border border-white/30 bg-white/5 text-[11px] text-white/80 flex items-center justify-center active:bg-white/10"
            onClick={handleAccuracyTap}
          >
            <span 
              style={{ 
                fontFamily: "Crimson Pro, serif",
                fontSize: "0.8125rem",
                color: "rgba(253, 251, 245, 0.6)",
                letterSpacing: "0.03em"
              }}
            >
              Tap at the peak of each breath
            </span>
          </button>

          {/* Tap stats */}
          {tapCount > 0 && (
            <div className="mt-3 space-y-1 text-[10px] text-white/60">
              <div className="flex justify-between">
                <span>Taps recorded</span>
                <span>{tapCount}</span>
              </div>
              {avgErrorMs != null && (
                <div className="flex justify-between">
                  <span>Average offset</span>
                  <span>{avgErrorMs}ms</span>
                </div>
              )}
              {bestErrorMs != null && (
                <div className="flex justify-between">
                  <span>Best</span>
                  <span>{bestErrorMs}ms</span>
                </div>
              )}
              {lastSignedErrorMs != null && (
                <div className="flex justify-between">
                  <span>Last tap</span>
                  <span style={{
                    color: lastSignedErrorMs === 0 
                      ? '#fcd34d'
                      : lastSignedErrorMs > 0 
                      ? '#ff8c00'
                      : '#4dd4d4'
                  }}>
                    {lastSignedErrorMs === 0
                      ? "on beat"
                      : `${Math.abs(lastSignedErrorMs)}ms ${
                          lastSignedErrorMs > 0 ? "late" : "early"
                        }`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Accuracy visual */}
          {accuracyView === "pulse" ? (
            <div className="mt-4">
              <AccuracyPulse avgErrorMs={avgErrorMs} bestErrorMs={bestErrorMs} />
            </div>
          ) : (
            <div className="mt-4">
              <AccuracyPetals avgErrorMs={avgErrorMs} tapCount={tapCount} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="rounded-3xl border border-white/15 bg-black/40 backdrop-blur-xl px-4 py-4 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
        {/* TOP ROW: practice + duration */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/50">
              Practice
            </div>
            <div className="mt-1 flex gap-1 rounded-full bg-white/5 p-1 border border-white/10">
              {PRACTICES.map((name) => {
                const active = practice === name;
                return (
                  <button
                    key={name}
                    className={
                      "flex-1 rounded-full px-2 py-1 text-[10px] " +
                      (active
                        ? "bg-white text-bgEnd"
                        : "text-white/70 hover:text-white")
                    }
                    onClick={() => {
                      setPractice(name);
                      if (name !== "Breathing") {
                        setTapErrors([]);
                        setLastErrorMs(null);
                        setLastSignedErrorMs(null);
                      }
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-[84px]">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/50">
              Duration
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {DURATIONS_MIN.map((min) => {
                const active = durationMin === min;
                return (
                  <button
                    key={min}
                    className={
                      "flex-1 rounded-full px-2 py-1 text-[10px] " +
                      (active
                        ? "bg-white text-bgEnd"
                        : "text-white/70 hover:text-white")
                    }
                    onClick={() => {
                      setDurationMin(min);
                      setRemainingSec(min * 60);
                    }}
                  >
                    {min}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TIMER + STATUS */}
        <div className="flex items-center justify-between">
          <div className="text-[32px] tabular-nums font-light text-white tracking-[0.12em]">
            {mm}:{ss}
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                className="px-4 py-2 rounded-full bg-emerald-400 text-bgEnd text-[11px] font-semibold tracking-[0.14em] uppercase shadow-lg shadow-emerald-400/40"
                onClick={startTimer}
              >
                Start
              </button>
            ) : (
              <button
                className="px-4 py-2 rounded-full border border-white/40 text-white/90 text-[11px] tracking-[0.14em] uppercase"
                onClick={handleStop}
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* BREATHING SETTINGS */}
        {practice === "Breathing" && (
          <div className="space-y-4 border-t border-white/10 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-white/50">
                  Pattern
                </div>
                <div className="text-[11px] text-white/80 mt-1">
                  {patternSummary}
                </div>
              </div>
              <div className="flex gap-1">
                {Object.keys(PATTERN_PRESETS).map((name) => {
                  const active = selectedPreset === name;
                  return (
                    <button
                      key={name}
                      className={
                        "px-2 py-1 rounded-full text-[10px] border " +
                        (active
                          ? "bg-white text-bgEnd border-white"
                          : "border-white/25 text-white/70 hover:text-white")
                      }
                      onClick={() => applyPreset(name)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom inputs */}
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Inhale
                </label>
                <input
                  className="bg-white/5 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white/90 outline-none focus:border-white/70"
                  value={pattern.inhale}
                  onChange={(e) =>
                    updateField("inhale", e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Hold 1
                </label>
                <input
                  className="bg-white/5 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white/90 outline-none focus:border-white/70"
                  value={pattern.hold1}
                  onChange={(e) =>
                    updateField("hold1", e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Exhale
                </label>
                <input
                  className="bg-white/5 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white/90 outline-none focus:border-white/70"
                  value={pattern.exhale}
                  onChange={(e) =>
                    updateField("exhale", e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Hold 2
                </label>
                <input
                  className="bg-white/5 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white/90 outline-none focus:border-white/70"
                  value={pattern.hold2}
                  onChange={(e) =>
                    updateField("hold2", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* TAP-BASED ACCURACY (only really meaningful for Breathing) */}
        {practice === "Breathing" && (
          <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
            <button
              className="w-full h-16 rounded-2xl border border-white/30 bg-white/5 text-[11px] text-white/80 flex items-center justify-center active:bg-white/10"
              onClick={handleAccuracyTap}
            >
              Tap in time when the breath feels at its fullest and
              emptiest.
            </button>

            {tapCount > 0 && (
              <div className="text-[10px] text-white/60 space-y-1">
                <div>Tap attempts: {tapCount}</div>
                {avgErrorMs != null && bestErrorMs != null && (
                  <div>
                    Average offset: {avgErrorMs} ms . Best:{" "}
                    {bestErrorMs} ms
                  </div>
                )}
                {lastSignedErrorMs != null && (
                  <div>
                    Last tap:{" "}
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        color:
                          lastSignedErrorMs === 0
                            ? "#fcd34d" // Gold for perfect
                            : Math.abs(lastSignedErrorMs) <= 20
                            ? "#34d399" // Emerald for good (±20ms)
                            : lastSignedErrorMs > 0
                            ? "#ff8c00" // Orange for late
                            : "#4dd4d4", // Cyan for early
                      }}
                    >
                      {lastSignedErrorMs === 0
                        ? "on beat"
                        : `${Math.abs(lastSignedErrorMs)} ms ${
                            lastSignedErrorMs > 0 ? "late" : "early"
                          }`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Accuracy visual toggle */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Accuracy Visual
                </span>
                <div className="inline-flex rounded-full bg-white/5 p-0.5 border border-white/10">
                  {["pulse", "petals"].map((mode) => {
                    const active = mode === accuracyView;
                    return (
                      <button
                        key={mode}
                        onClick={() => setAccuracyView(mode)}
                        className={
                          "px-3 py-0.5 rounded-full text-[10px] capitalize " +
                          (active
                            ? "bg-white text-bgEnd"
                            : "text-white/70 hover:text-white")
                        }
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              {accuracyView === "pulse" ? (
                <AccuracyPulse
                  avgErrorMs={avgErrorMs}
                  bestErrorMs={bestErrorMs}
                />
              ) : (
                <AccuracyPetals
                  avgErrorMs={avgErrorMs}
                  tapCount={tapCount}
                />
              )}
            </div>
          </div>
        )}

        {/* FOOTNOTE */}
        <div className="pt-2 border-t border-white/10">
          <div className="text-[10px] text-white/45 flex items-center justify-between">
            <span>
              {practice} * {durationMin} min
            </span>
            <span>Immanence OS Â· Practice engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}