import React, { useEffect, useMemo, useRef } from "react";
import { BreathingRing } from "../BreathingRing.jsx";
import { useStillnessIntervalSessionState } from "./useStillnessIntervalSessionState.js";
import { STILLNESS_INTENSITY_META } from "../../data/stillnessIntensityMeta.js";

function triggerTransitionCue(audioContextRef) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(18);
  }

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new Ctx();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.09);
  } catch {
    // Best-effort only.
  }
}

// Intensity copy sourced from src/data/stillnessIntensityMeta.js (single source of truth).

export function StillnessRingSession({
  isRunning,
  isPaused,
  sessionStartTime,
  totalDurationSec,
  config,
  ringMode,
  pendingFinish = false,
  onPendingBoundaryComplete,
}) {
  const audioContextRef = useRef(null);
  const boundarySentRef = useRef(false);
  const lastCueKeyRef = useRef(null);

  const focusSec = Number(config?.focusSec) || 45;
  const restSec = Number(config?.restSec) || 15;
  const intensity = String(config?.focusIntensity || "medium").toLowerCase();

  const {
    totalRemainingSec,
    segmentType,
    nextSegmentType,
    segmentDurationSec,
    segmentElapsedSec,
    segmentRemainingSec,
    segmentIndex,
    pendingBoundaryReached,
  } = useStillnessIntervalSessionState({
    isRunning,
    isPaused,
    sessionStartTime,
    totalDurationSec,
    focusSec,
    restSec,
    pendingFinish,
  });

  useEffect(() => {
    if (!isRunning) {
      boundarySentRef.current = false;
      return;
    }
    if (!pendingFinish) {
      boundarySentRef.current = false;
      return;
    }
    if (!pendingBoundaryReached || boundarySentRef.current) return;
    boundarySentRef.current = true;
    onPendingBoundaryComplete?.({
      segmentIndex,
      segmentType,
      boundary: "segment-end",
    });
  }, [isRunning, onPendingBoundaryComplete, pendingBoundaryReached, pendingFinish, segmentIndex, segmentType]);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    if (segmentRemainingSec !== 3) return;

    const cueKey = `${segmentIndex}:${segmentType}`;
    if (lastCueKeyRef.current === cueKey) return;
    lastCueKeyRef.current = cueKey;
    triggerTransitionCue(audioContextRef);
  }, [isPaused, isRunning, segmentIndex, segmentRemainingSec, segmentType]);

  useEffect(() => {
    const audioContext = audioContextRef.current;
    return () => {
      if (audioContext) {
        try {
          void audioContext.close();
        } catch {
          // noop
        }
      }
    };
  }, []);

  const segmentProgress01 = segmentDurationSec > 0
    ? Math.max(0, Math.min(1, segmentElapsedSec / segmentDurationSec))
    : 0;
  const visualCycleDurationSec = segmentType === "focus"
    ? Math.max(4, Math.min(segmentDurationSec, 10))
    : Math.max(4, Math.min(segmentDurationSec, 6));
  const visualCycleElapsedSec = ((segmentElapsedSec % visualCycleDurationSec) + visualCycleDurationSec) % visualCycleDurationSec;
  const cycleProgress01 = visualCycleDurationSec > 0
    ? Math.max(0, Math.min(1, visualCycleElapsedSec / visualCycleDurationSec))
    : 0;

  const stillnessVisual = useMemo(() => ({
    segmentType,
    segmentLabel: segmentType === "focus" ? "FOCUS" : "REST",
    segmentDurationSec,
    segmentProgress01,
    segmentRemainingSec,
    cycleProgress01,
    visualCycleDurationSec,
    totalRemainingSec,
    nextSegmentLabel: nextSegmentType === "focus" ? "FOCUS" : "REST",
    intensity,
    intensityCopy: (STILLNESS_INTENSITY_META[intensity] || STILLNESS_INTENSITY_META.medium).copy,
    ringMode,
    isPaused,
  }), [
    cycleProgress01,
    intensity,
    isPaused,
    nextSegmentType,
    ringMode,
    segmentDurationSec,
    segmentProgress01,
    segmentRemainingSec,
    segmentType,
    totalRemainingSec,
    visualCycleDurationSec,
  ]);

  return (
    <BreathingRing
      startTime={sessionStartTime}
      practiceActive={isRunning}
      totalSessionDurationSec={totalDurationSec}
      ringMode={ringMode}
      stillnessVisual={stillnessVisual}
    />
  );
}

export default StillnessRingSession;
