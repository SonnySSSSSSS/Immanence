// src/components/PracticeSection.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { addSession } from "../state/practiceStore.js";
import { recordPracticeEffect } from "../state/mandalaStore.js";

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

  const handleAccuracyTap = () => {
    if (!isRunning || practice !== "Breathing") {
      return;
    }

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

    if (phase >= inhaleEnd - 0.15 && phase <= inhaleEnd + 0.15) {
      isPeak = true;
      expectedPhase = inhaleEnd;
    } else if (
      phase >= exhaleEnd - 0.15 &&
      phase <= exhaleEnd + 0.15
    ) {
      isPeak = true;
      expectedPhase = exhaleEnd;
    }

    if (!isPeak || totalPatternSeconds === 0) {
      setLastErrorMs(null);
      setLastSignedErrorMs(null);
      return;
    }

    const expectedMs = expectedPhase * cycle;
    const actualMs = elapsedMs % cycle;
    const errorMs = actualMs - expectedMs;

    setLastErrorMs(Math.abs(errorMs));
    setLastSignedErrorMs(errorMs);

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
                    {lastSignedErrorMs === 0
                      ? "on beat"
                      : `${Math.abs(lastSignedErrorMs)} ms ${
                          lastSignedErrorMs > 0 ? "late" : "early"
                        }`}
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
            <span>Immanence OS · Practice engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
