import { useEffect, useMemo } from "react";
import { quantizePatternToMusicStrict } from "../../utils/quantizePatternToMusic.js";

export function useBreathSessionState({
  isRunning,
  practice,
  pattern,
  duration,
  breathCount,
  hasBenchmark,
  calculateTotalCycles,
  getPatternForCycle,
  tempoSyncEnabled,
  tempoSyncBpm,
  tempoPhaseDuration,
  tempoBeatsPerPhase,
  tempoSessionActive,
  tempoSessionEffective,
  onBreathStateChange,
}) {
  const isBreathPractice = practice === "Breath & Stillness";

  useEffect(() => {
    if (!onBreathStateChange) {
      return;
    }
    
    if (!isRunning || !isBreathPractice) {
      onBreathStateChange(null);
      return;
    }
    
    const total = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;
    if (!total) {
      onBreathStateChange(null);
      return;
    }

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
  }, [isRunning, isBreathPractice, pattern, onBreathStateChange]);

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

  const breathingPatternForRing = useMemo(() => {
    const resolveBasePattern = () => {
      if (hasBenchmark && isRunning && isBreathPractice) {
        const totalCycles = calculateTotalCycles(duration, pattern);
        const progressivePattern = getPatternForCycle(breathCount + 1, totalCycles);
        if (progressivePattern) {
          return {
            inhale: progressivePattern.inhale,
            hold1: progressivePattern.hold1,
            exhale: progressivePattern.exhale,
            hold2: progressivePattern.hold2,
          };
        }
      }
      return {
        inhale: pattern.inhale,
        hold1: pattern.hold1,
        exhale: pattern.exhale,
        hold2: pattern.hold2,
      };
    };

    if (tempoSyncEnabled && isBreathPractice && hasBenchmark && Number.isFinite(tempoSyncBpm) && tempoSyncBpm > 0) {
      const quantized = quantizePatternToMusicStrict(resolveBasePattern(), tempoSyncBpm);
      return {
        inhale: quantized.inhale,
        holdTop: quantized.hold1,
        exhale: quantized.exhale,
        holdBottom: quantized.hold2,
      };
    }

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

    const basePattern = resolveBasePattern();
    return {
      inhale: basePattern.inhale,
      holdTop: basePattern.hold1,
      exhale: basePattern.exhale,
      holdBottom: basePattern.hold2,
    };
  }, [
    tempoSyncEnabled,
    tempoSyncBpm,
    tempoPhaseDuration,
    tempoBeatsPerPhase,
    hasBenchmark,
    isRunning,
    isBreathPractice,
    duration,
    pattern,
    breathCount,
    calculateTotalCycles,
    getPatternForCycle,
    tempoSessionActive,
    tempoSessionEffective,
  ]);

  const breathingPatternText = useMemo(() => {
    return `${Math.round(breathingPatternForRing.inhale)}-${Math.round(breathingPatternForRing.holdTop)}-${Math.round(breathingPatternForRing.exhale)}-${Math.round(breathingPatternForRing.holdBottom)}`;
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
