import { useEffect, useMemo, useState } from "react";
import { quantizePatternToMusicStrict } from "../../utils/quantizePatternToMusic.js";

export function useBreathSessionState({
  isRunning,
  practice,
  pattern,
  duration,
  breathCount,
  hasBenchmark,
  benchmark,
  tempoSyncEnabled,
  tempoSyncBpm,
  tempoPhaseDuration,
  tempoBeatsPerPhase,
  tempoSessionActive,
  tempoSessionEffective,
  sessionStartTime,
  onBreathStateChange,
}) {
  const isBreathPractice = practice === "Breath & Stillness" || practice === "Foundation";

  const formatSec = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0";
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace(/\.0$/, "");
  };

  const quantizeHalf = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 2) / 2;
  };

  const computeCapacityMultiplier = (norm01) => {
    const n = Math.max(0, Math.min(1, Number(norm01)));
    if (n < 1 / 3) return 0.5;
    if (n < 2 / 3) return 0.75;

    // Final third: hold at 0.90, then ramp to 1.0 near the end so sessions "land" at max.
    const rampStart = 0.92; // last ~8% of the session
    if (n >= rampStart) {
      const t = (n - rampStart) / (1 - rampStart);
      return 0.9 + (0.1 * t);
    }
    return 0.9;
  };

  const [capacityMultiplier, setCapacityMultiplier] = useState(0.5);

  // Keep a session-wide capacity multiplier in sync with elapsed time (50% -> 75% -> 90% -> 100% landing).
  useEffect(() => {
    if (!isRunning || !isBreathPractice || !sessionStartTime || !duration) {
      setCapacityMultiplier(0.5);
      return;
    }

    const tick = () => {
      const elapsedSec = Math.max(0, (performance.now() - sessionStartTime) / 1000);
      const totalSec = Math.max(1, Number(duration) * 60);
      const norm = Math.min(1, elapsedSec / totalSec);
      const next = computeCapacityMultiplier(norm);
      setCapacityMultiplier((prev) => (Math.abs(prev - next) < 0.0001 ? prev : next));
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [isRunning, isBreathPractice, sessionStartTime, duration]);

  const breathingPatternForRing = useMemo(() => {
    // Tempo-sync mode uses its own 3-phase cap schedule (tempoSyncSessionStore) and should not be double-scaled.
    if (tempoSyncEnabled && isBreathPractice && hasBenchmark) {
      if (tempoSessionActive && tempoSessionEffective) {
        return {
          inhale: tempoSessionEffective.inhale,
          holdTop: tempoSessionEffective.holdIn,
          exhale: tempoSessionEffective.exhale,
          holdBottom: tempoSessionEffective.holdOut,
        };
      }
      return {
        inhale: tempoPhaseDuration,
        holdTop: tempoPhaseDuration,
        exhale: tempoPhaseDuration,
        holdBottom: tempoPhaseDuration,
      };
    }

    // Non-tempo sessions: scale from the user's selected pattern (or benchmark max) by the session capacity multiplier.
    const baseMax = (hasBenchmark && benchmark)
      ? {
          inhale: benchmark.inhale,
          hold1: benchmark.hold1,
          exhale: benchmark.exhale,
          hold2: benchmark.hold2,
        }
      : {
          inhale: pattern.inhale,
          hold1: pattern.hold1,
          exhale: pattern.exhale,
          hold2: pattern.hold2,
        };

    const scaled = {
      inhale: Math.max(1, quantizeHalf(baseMax.inhale * capacityMultiplier)),
      hold1: Math.max(0, quantizeHalf(baseMax.hold1 * capacityMultiplier)),
      exhale: Math.max(1, quantizeHalf(baseMax.exhale * capacityMultiplier)),
      hold2: Math.max(0, quantizeHalf((baseMax.hold2 ?? 0) * capacityMultiplier)),
    };

    // Optional: when BPM is provided (but not in full tempo-session mode), quantize the scaled pattern to music.
    if (tempoSyncEnabled && isBreathPractice && Number.isFinite(tempoSyncBpm) && tempoSyncBpm > 0) {
      const quantized = quantizePatternToMusicStrict(scaled, tempoSyncBpm);
      return {
        inhale: quantized.inhale,
        holdTop: quantized.hold1,
        exhale: quantized.exhale,
        holdBottom: quantized.hold2,
      };
    }

    return {
      inhale: scaled.inhale,
      holdTop: scaled.hold1,
      exhale: scaled.exhale,
      holdBottom: scaled.hold2,
    };
  }, [
    tempoSyncEnabled,
    tempoSyncBpm,
    tempoPhaseDuration,
    tempoBeatsPerPhase,
    tempoSessionActive,
    tempoSessionEffective,
    isBreathPractice,
    hasBenchmark,
    benchmark,
    pattern,
    capacityMultiplier,
  ]);

  // Drive external breath state from the same effective pattern that the ring is using.
  useEffect(() => {
    if (!onBreathStateChange) {
      return;
    }
    
    if (!isRunning || !isBreathPractice) {
      onBreathStateChange(null);
      return;
    }
    
    const p = {
      inhale: breathingPatternForRing.inhale,
      hold1: breathingPatternForRing.holdTop,
      exhale: breathingPatternForRing.exhale,
      hold2: breathingPatternForRing.holdBottom,
    };

    const total = p.inhale + p.hold1 + p.exhale + p.hold2;
    if (!total) {
      onBreathStateChange(null);
      return;
    }

    const now = performance.now() / 1000;
    const cyclePos = (now % total);

    let phase = "inhale";
    let phaseProgress = 0;

    if (cyclePos < p.inhale) {
      phase = "inhale";
      phaseProgress = cyclePos / p.inhale;
    } else if (cyclePos < p.inhale + p.hold1) {
      phase = "holdTop";
      phaseProgress =
        (cyclePos - p.inhale) / Math.max(p.hold1, 0.0001);
    } else if (
      cyclePos <
      p.inhale + p.hold1 + p.exhale
    ) {
      phase = "exhale";
      phaseProgress =
        (cyclePos - (p.inhale + p.hold1)) /
        Math.max(p.exhale, 0.0001);
    } else {
      phase = "holdBottom";
      phaseProgress =
        (cyclePos -
          (p.inhale + p.hold1 + p.exhale)) /
        Math.max(p.hold2 || 1, 1);
    }

    onBreathStateChange({
      phase,
      phaseProgress,
    });
  }, [isRunning, isBreathPractice, breathingPatternForRing, onBreathStateChange]);

  // (Removed) Old breath-state effect that used the unscaled UI pattern.

  const totalDuration = useMemo(() => {
    return pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2 || 1;
  }, [pattern]);
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

  const breathingPatternText = useMemo(() => {
    return `${formatSec(breathingPatternForRing.inhale)}-${formatSec(breathingPatternForRing.holdTop)}-${formatSec(breathingPatternForRing.exhale)}-${formatSec(breathingPatternForRing.holdBottom)}s`;
  }, [breathingPatternForRing]);

  const showBreathCount = breathCount > 0 && isBreathPractice;

  return {
    isBreathPractice,
    breathingPatternForRing,
    breathingPatternText,
    showBreathCount,
    totalDuration,
    pathD,
  };
}
