// src/components/PracticeSection.jsx
import React, { useState, useEffect } from "react";
import { BreathingRing } from "./BreathingRing.jsx";
import { addSession } from "../state/practiceStore.js";
import { recordPracticeEffect } from "../state/mandalaStore.js";
import { useTheme } from "../context/ThemeContext";

const PRACTICES = ["Breathing", "Meditation", "Yoga", "Visualization"];
const DURATIONS = [5, 10, 15, 20];
const PRESETS = ["Box", "4-7-8", "Kumbhaka", "Relax", "Energy"];

const PATTERN_PRESETS = {
  Box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  "4-7-8": { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  Kumbhaka: { inhale: 4, hold1: 16, exhale: 8, hold2: 0 },
  Relax: { inhale: 4, hold1: 4, exhale: 6, hold2: 2 },
  Energy: { inhale: 3, hold1: 0, exhale: 3, hold2: 0 },
};

export function PracticeSection({ onPracticingChange, onBreathStateChange }) {

  // Core practice settings
  const [practice, setPractice] = useState("Breathing");
  const [duration, setDuration] = useState(10);
  const [preset, setPreset] = useState("Box");
  const [pattern, setPattern] = useState({
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  });

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  // Tap accuracy tracking
  const [tapErrors, setTapErrors] = useState([]);          // signed ms errors
  const [lastErrorMs, setLastErrorMs] = useState(null);    // absolute ms value of last tap
  const [lastSignedErrorMs, setLastSignedErrorMs] = useState(null); // signed last tap

  // Breath counter
  const [breathCount, setBreathCount] = useState(0);



  // keep timer in sync with duration
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isRunning]);

  // apply pattern preset
  useEffect(() => {
    if (preset && PATTERN_PRESETS[preset]) {
      setPattern(PATTERN_PRESETS[preset]);
    }
  }, [preset]);

  const handlePatternChange = (key, value) => {
    setPattern((prev) => ({
      ...prev,
      [key]: Number.parseInt(value, 10) || 0,
    }));
    setPreset(null); // manual edit breaks preset
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleStop = () => {
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);
    onBreathStateChange && onBreathStateChange(null);

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());

    // Calculate tap statistics
    const tapCount = tapErrors.length;
    let avgErrorMs = null;
    let bestErrorMs = null;

    if (tapCount > 0) {
      avgErrorMs = Math.round(
        tapErrors.reduce((sum, v) => sum + Math.abs(v), 0) / tapCount
      );
      bestErrorMs = Math.round(
        Math.min(...tapErrors.map(e => Math.abs(e)))
      );
    }

    const sessionPayload = {
      id,
      date: new Date().toISOString(),
      type: practice.toLowerCase(),
      durationMinutes: duration,
      pattern: { ...pattern },
      tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
    };

    try {
      addSession(sessionPayload);
      recordPracticeEffect({
        dateISO: sessionPayload.date,
        durationMinutes: sessionPayload.durationMinutes,
        accuracy: null,
      });
    } catch (e) {
      console.error("Failed to save session:", e);
    }

    setTimeLeft(duration * 60);
  };

  const handleStart = () => {
    setIsRunning(true);
    onPracticingChange && onPracticingChange(true);
    // Reset tap accuracy data for new session
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    setBreathCount(0);
  };

  const handleAccuracyTap = (errorMs) => {
    if (!isRunning) return;

    setLastErrorMs(Math.abs(errorMs));
    setLastSignedErrorMs(errorMs);

    setTapErrors(prev => {
      const updated = [...prev, errorMs];
      // Keep only last 50 taps to prevent memory growth
      if (updated.length > 50) updated.shift();
      return updated;
    });
  };

  // countdown timer
  useEffect(() => {
    if (!isRunning) return;

    let interval = null;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleStop();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]);

  // basic breathState feed (kept very simple; avatar just gets a phase name)
  useEffect(() => {
    if (!onBreathStateChange) return;
    if (!isRunning || practice !== "Breathing") {
      onBreathStateChange(null);
      return;
    }
    const total = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;
    if (!total) {
      onBreathStateChange(null);
      return;
    }
    // crude phase cycling based only on absolute time; good enough to keep avatar moving
    const now = performance.now() / 1000;
    const cyclePos = (now % total);

    let phase = "inhale";
    let phaseProgress = 0;

    if (cyclePos < pattern.inhale) {
      phase = "inhale";
      phaseProgress = cyclePos / pattern.inhale;
    } else if (cyclePos < pattern.inhale + pattern.hold1) {
      phase = "holdTop";
      phaseProgress =
        (cyclePos - pattern.inhale) / Math.max(pattern.hold1, 0.0001);
    } else if (
      cyclePos <
      pattern.inhale + pattern.hold1 + pattern.exhale
    ) {
      phase = "exhale";
      phaseProgress =
        (cyclePos - (pattern.inhale + pattern.hold1)) /
        Math.max(pattern.exhale, 0.0001);
    } else {
      phase = "holdBottom";
      phaseProgress =
        (cyclePos -
          (pattern.inhale + pattern.hold1 + pattern.exhale)) /
        Math.max(pattern.hold2 || 1, 1);
    }

    onBreathStateChange({
      phase,
      phaseProgress,
    });
  }, [isRunning, practice, pattern, onBreathStateChange]);

  // values for pattern preview
  const totalDuration =
    pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2 || 1;
  const width = 100;
  const height = 40;

  const iW = (pattern.inhale / totalDuration) * width;
  const h1W = (pattern.hold1 / totalDuration) * width;
  const eW = (pattern.exhale / totalDuration) * width;

  const pathD = `
    M 0 ${height}
    L ${iW} 0
    L ${iW + h1W} 0
    L ${iW + h1W + eW} ${height}
    L ${width} ${height}
  `;

  const breathingPatternForRing = {
    inhale: pattern.inhale,
    holdTop: pattern.hold1,
    exhale: pattern.exhale,
    holdBottom: pattern.hold2,
  };

  // Read theme for dynamic colors
  const theme = useTheme();
  const { primary, secondary, muted, glow } = theme.accent;

  // ───────────────────────────────────────────────────────────
  // RUNNING VIEW – full-screen breathing circle, no panel box
  // ───────────────────────────────────────────────────────────
  if (isRunning && practice === "Breathing") {
    // Determine button color based on last tap feedback
    // BRONZE (early/late/out), WHITE (perfect), THEME (good)
    let buttonBg = 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'; // Default theme
    let buttonGlow = '0 0 24px var(--accent-glow)';

    // Feedback text state
    let feedbackColor = 'var(--accent-primary)';
    let feedbackText = "";
    let feedbackShadow = "none";

    if (lastSignedErrorMs !== null) {
      const absError = Math.round(Math.abs(lastSignedErrorMs));

      if (absError > 1000) {
        // OUT OF BOUNDS - Bronze/Muted
        feedbackColor = 'var(--accent-muted)';
        feedbackText = "OUT OF BOUNDS";
        buttonBg = 'linear-gradient(180deg, var(--accent-muted) 0%, #1e1b4b 100%)';
        buttonGlow = '0 0 24px var(--accent-muted)66';
      } else if (absError <= 50) {
        // Perfect - WHITE
        feedbackColor = "#f8fafc";
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"}`;
        feedbackShadow = "0 0 10px rgba(255,255,255,0.5)";
        buttonBg = "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)";
        buttonGlow = "0 0 24px rgba(248,250,252,0.5)";
      } else if (absError <= 200) {
        // Good - THEME PRIMARY
        feedbackColor = 'var(--accent-primary)';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"}`;
        buttonBg = 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';
        buttonGlow = '0 0 24px var(--accent-glow)';
      } else {
        // Bad - Muted
        feedbackColor = 'var(--accent-muted)';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"}`;
        buttonBg = 'linear-gradient(180deg, var(--accent-muted) 0%, #1e1b4b 100%)';
        buttonGlow = '0 0 24px var(--accent-muted)66';
      }
    }
    return (
      <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
        {/* Breathing circle – Centered */}
        <div className="flex items-center justify-center w-full mb-16 overflow-visible">
          <BreathingRing
            breathPattern={breathingPatternForRing}
            onTap={handleAccuracyTap}
            onCycleComplete={() => setBreathCount(prev => prev + 1)}
          />
        </div>

        {/* Controls below ring */}
        <div className="flex flex-col items-center z-50">
          {/* Feedback Text - Above Button */}
          <div className="h-6 mb-3 flex items-center justify-center">
            {lastSignedErrorMs !== null && (
              <div
                key={lastSignedErrorMs} // Re-animate on change
                className="text-[11px] font-medium tracking-[0.15em] uppercase animate-fade-in-up"
                style={{
                  fontFamily: "Georgia, serif",
                  color: feedbackColor,
                  textShadow: feedbackShadow
                }}
              >
                {feedbackText}
              </div>
            )}
          </div>

          <button
            onClick={handleStop}
            className="rounded-full px-7 py-2.5 transition-all duration-200 hover:-translate-y-0.5 min-w-[200px] active:scale-95"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: buttonBg,
              color: "#050508",
              // Radiate effect: Pulse shadow based on last tap accuracy
              boxShadow: lastSignedErrorMs !== null
                ? `0 0 ${Math.abs(lastSignedErrorMs) <= 50 ? "40px rgba(255,255,255,0.6)" :
                  Math.abs(lastSignedErrorMs) <= 200 ? '30px var(--accent-glow)' :
                    '20px var(--accent-muted)4d'}, inset 0 1px 0 rgba(255,255,255,0.35)`
                : '0 0 24px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.35)',
              borderRadius: "999px",
            }}
          >
            Stop
          </button>

          <div
            className="mt-5"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(253,251,245,0.6)",
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {/* Breath Counter */}
          {breathCount > 0 && (
            <div
              className="mt-2"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: 'var(--accent-primary)80', // 50% opacity
              }}
            >
              Breath {breathCount}
            </div>
          )}
        </div>

        <style>{`
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.2s ease-out forwards;
          }
        `}</style>
      </section>
    );
  }




  // ───────────────────────────────────────────────────────────
  // CONFIG VIEW – panel with pattern, presets, preview
  // ───────────────────────────────────────────────────────────
  return (
    <section className="w-full flex flex-col items-center pt-16 pb-24">
      {/* Main panel */}
      <div
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(22,22,37,0.95) 0%, rgba(15,15,26,0.98) 100%)",
          border: '1px solid var(--accent-15)', // 12% opacity ~15%
          boxShadow:
            "0 0 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Top glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 40% at 50% 0%, var(--accent-10) 0%, transparent 70%)', // 6% opacity ~10%
          }}
        />

        {/* Corner ornaments */}
        <div
          className="absolute top-3 left-4"
          style={{ color: "rgba(245,158,11,0.4)", fontSize: "6px" }}
        >
          ◆
        </div>
        <div
          className="absolute top-3 right-4"
          style={{ color: "rgba(245,158,11,0.4)", fontSize: "6px" }}
        >
          ◆
        </div>

        <div className="relative px-7 py-6">
          {/* Row 1: Practice + Duration */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
            {/* Practice selector */}
            <div className="flex-1">
              <div
                className="mb-2"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "9px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(253,251,245,0.4)",
                }}
              >
                Practice
              </div>
              <div
                className="flex gap-1 p-1 rounded-full"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--accent-10)",
                }}
              >
                {PRACTICES.map((name) => (
                  <button
                    key={name}
                    onClick={() => setPractice(name)}
                    className={`rounded-full px-3 py-1.5 transition-all duration-200 ${practice === name ? 'bg-accent' : ''}`}
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "9px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      background:
                        practice === name
                          ? `linear-gradient(180deg, var(--accent-color) 0%, var(--accent-color) 100%)`
                          : "transparent",
                      color:
                        practice === name
                          ? "#050508"
                          : "rgba(253,251,245,0.4)",
                      boxShadow:
                        practice === name
                          ? "0 0 12px rgba(251,191,36,0.15)"
                          : "none",
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration selector */}
            <div>
              <div
                className="mb-2"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "9px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(253,251,245,0.4)",
                }}
              >
                Duration
              </div>
              <div className="flex gap-1">
                {DURATIONS.map((min) => (
                  <button
                    key={min}
                    onClick={() => setDuration(min)}
                    className={`rounded-full px-2 py-1 transition-all duration-200 ${duration === min ? 'border-accent text-accent' : ''}`}
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "8px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      background: "transparent",
                      border: `1px solid ${duration === min
                        ? "var(--accent-color)"
                        : "var(--accent-10)"
                        }`,
                      color:
                        duration === min
                          ? "var(--accent-color)"
                          : "rgba(253,251,245,0.4)",
                      boxShadow:
                        duration === min
                          ? "0 0 12px rgba(251,191,36,0.15)"
                          : "none",
                    }}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Timer + Start button */}
          <div className="flex items-center justify-between mb-6">
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "40px",
                fontWeight: 400,
                letterSpacing: "0.2em",
                color: "rgba(253,251,245,0.92)",
                textShadow: '0 0 32px var(--accent-30)', // 20% opacity ~30%
              }}
            >
              {formatTime(timeLeft)}
            </div>

            <button
              onClick={handleStart}
              className="rounded-full px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5 bg-accent"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                background:
                  `linear-gradient(180deg, var(--accent-color) 0%, var(--accent-color) 100%)`,
                color: "#050508",
                border: "none",
                boxShadow:
                  '0 0 24px var(--accent-30), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              Start
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div
              style={{
                height: "1px",
                background:
                  'linear-gradient(90deg, transparent 0%, var(--accent-15) 20%, var(--accent-30) 50%, var(--accent-15) 80%, transparent 100%)',
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2"
              style={{
                fontSize: "8px",
                color: 'var(--accent-70)', // 70% opacity
                background: "rgba(15,15,26,1)",
              }}
            >
              ✦
            </div>
          </div>

          {/* Pattern + presets */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div
                className="mb-1"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "9px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "rgba(253,251,245,0.4)",
                }}
              >
                Pattern
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((name) => (
                <button
                  key={name}
                  onClick={() => setPreset(name)}
                  className={`rounded-full px-2.5 py-1 transition-all duration-200 ${preset === name ? 'border-accent text-accent' : ''}`}
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "8px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    background: "transparent",
                    border: `1px solid ${preset === name
                      ? "var(--accent-color)"
                      : "var(--accent-10)"
                      }`,
                    color:
                      preset === name
                        ? "var(--accent-color)"
                        : "rgba(253,251,245,0.4)",
                    boxShadow:
                      preset === name
                        ? "0 0 12px rgba(251,191,36,0.15)"
                        : "none",
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Input fields */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "Inhale", key: "inhale" },
              { label: "Hold 1", key: "hold1" },
              { label: "Exhale", key: "exhale" },
              { label: "Hold 2", key: "hold2" },
            ].map(({ label, key }) => (
              <div key={key} className="flex flex-col gap-1">
                <label
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "8px",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "rgba(253,251,245,0.4)",
                  }}
                >
                  {label}
                </label>
                <input
                  type="text"
                  value={pattern[key]}
                  onChange={(e) =>
                    handlePatternChange(key, e.target.value)
                  }
                  className="text-center rounded-xl px-2 py-2 outline-none transition-all duration-200"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "14px",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid var(--accent-10)",
                    color: "rgba(253,251,245,0.9)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent 0%, var(--accent-15) 20%, var(--accent-40) 50%, var(--accent-15) 80%, transparent 100%)",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2"
              style={{
                fontSize: "8px",
                color: "rgba(245,158,11,0.7)",
                background: "rgba(15,15,26,1)",
              }}
            >
              ✦
            </div>
          </div>

          {/* Pattern preview */}
          <div className="mb-2">
            <div
              className="mb-3 text-center"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "9px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(253,251,245,0.4)",
              }}
            >
              Pattern Preview
            </div>

            <div className="relative w-full h-16">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="patternGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--accent-20)" // 20% opacity
                    />
                    <stop
                      offset="100%"
                      stopColor="transparent" // 0% opacity
                    />
                  </linearGradient>
                </defs>
                <path
                  d={pathD}
                  fill="url(#patternGradient)"
                  stroke="var(--accent-primary)"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div className="flex justify-between w-full px-1 mt-1">
                <span
                  style={{
                    fontSize: "6px",
                    color: "rgba(253,251,245,0.3)",
                    width: `${(pattern.inhale / totalDuration) * 100}%`,
                    textAlign: "center",
                  }}
                >
                  IN
                </span>
                <span
                  style={{
                    fontSize: "6px",
                    color: "rgba(253,251,245,0.3)",
                    width: `${(pattern.hold1 / totalDuration) * 100}%`,
                    textAlign: "center",
                  }}
                >
                  HOLD
                </span>
                <span
                  style={{
                    fontSize: "6px",
                    color: "rgba(253,251,245,0.3)",
                    width: `${(pattern.exhale / totalDuration) * 100}%`,
                    textAlign: "center",
                  }}
                >
                  OUT
                </span>
                <span
                  style={{
                    fontSize: "6px",
                    color: "rgba(253,251,245,0.3)",
                    width: `${(pattern.hold2 / totalDuration) * 100}%`,
                    textAlign: "center",
                  }}
                >
                  HOLD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
