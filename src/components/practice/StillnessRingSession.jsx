import React, { useEffect, useMemo, useRef } from "react";
import { BreathingRing } from "../BreathingRing.jsx";
import { useStillnessIntervalSessionState } from "./useStillnessIntervalSessionState.js";
import { STILLNESS_INTENSITY_META } from "../../data/stillnessIntensityMeta.js";

const STILLNESS_TIMING_BY_INTENSITY = Object.freeze({
  light: Object.freeze({ focusSec: 45, restSec: 15 }),
  medium: Object.freeze({ focusSec: 40, restSec: 20 }),
  heavy: Object.freeze({ focusSec: 25, restSec: 25 }),
});

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

  const intensity = String(config?.focusIntensity || "medium").toLowerCase();
  const intensityTiming = STILLNESS_TIMING_BY_INTENSITY[intensity] || STILLNESS_TIMING_BY_INTENSITY.medium;
  const focusSec = Number.isFinite(Number(config?.focusSec))
    ? Number(config.focusSec)
    : intensityTiming.focusSec;
  const restSec = Number.isFinite(Number(config?.restSec))
    ? Number(config.restSec)
    : intensityTiming.restSec;
  const postDelaySec = Math.max(0, Number(config?.postDelaySec) || 0);
  const decompressionCue = typeof config?.decompressionCue === "string" && config.decompressionCue.trim()
    ? config.decompressionCue.trim()
    : "Relax. Let the focus unpack like a glacier turning into a river.";

  const {
    totalRemainingSec,
    segmentType,
    nextSegmentType,
    segmentDurationSec,
    segmentElapsedSec,
    segmentRemainingSec,
    segmentIndex,
    focusPhaseLabel,
    decompressionActive,
    completionBoundaryKind,
    pendingBoundaryReached,
  } = useStillnessIntervalSessionState({
    isRunning,
    isPaused,
    sessionStartTime,
    totalDurationSec,
    focusSec,
    restSec,
    postDelaySec,
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
      boundary: completionBoundaryKind,
    });
  }, [completionBoundaryKind, isRunning, onPendingBoundaryComplete, pendingBoundaryReached, pendingFinish, segmentIndex, segmentType]);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    if (decompressionActive) return;
    if (segmentRemainingSec !== 3) return;

    const cueKey = `${segmentIndex}:${segmentType}`;
    if (lastCueKeyRef.current === cueKey) return;
    lastCueKeyRef.current = cueKey;
    triggerTransitionCue(audioContextRef);
  }, [decompressionActive, isPaused, isRunning, segmentIndex, segmentRemainingSec, segmentType]);

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
    : segmentType === "decompression"
      ? Math.max(6, Math.min(segmentDurationSec, 12))
      : Math.max(4, Math.min(segmentDurationSec, 6));
  const visualCycleElapsedSec = ((segmentElapsedSec % visualCycleDurationSec) + visualCycleDurationSec) % visualCycleDurationSec;
  const cycleProgress01 = visualCycleDurationSec > 0
    ? Math.max(0, Math.min(1, visualCycleElapsedSec / visualCycleDurationSec))
    : 0;

  const stillnessVisual = useMemo(() => ({
    segmentType,
    segmentLabel: segmentType === "focus" ? "FOCUS" : segmentType === "decompression" ? "RELEASE" : "REST",
    segmentDurationSec,
    segmentProgress01,
    segmentRemainingSec,
    cycleProgress01,
    visualCycleDurationSec,
    totalRemainingSec,
    nextSegmentLabel: nextSegmentType === "focus" ? "FOCUS" : nextSegmentType === "complete" ? "COMPLETE" : "REST",
    intensity,
    intensityCopy: (STILLNESS_INTENSITY_META[intensity] || STILLNESS_INTENSITY_META.medium).copy,
    focusPhaseLabel,
    ringMode,
    isPaused,
    supportInfoDetached: true,
    suppressSupportBox: true,
  }), [
    cycleProgress01,
    focusPhaseLabel,
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
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <BreathingRing
        startTime={sessionStartTime}
        practiceActive={isRunning}
        totalSessionDurationSec={totalDurationSec}
        ringMode={ringMode}
        stillnessVisual={stillnessVisual}
      />
      {!decompressionActive && (segmentType === "focus" || segmentType === "rest") && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(54px + env(safe-area-inset-bottom))",
            transform: "translateX(-50%)",
            zIndex: 40,
            pointerEvents: "none",
            width: "min(78vw, 300px)",
            padding: "10px 16px",
            borderRadius: "18px",
            background: "rgba(2, 6, 14, 0.52)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            textAlign: "center",
          }}
        >
          {segmentType === "focus" && (
            <div
              style={{
                color: "rgba(245,245,245,0.82)",
                fontFamily: "var(--font-display)",
                fontSize: "0.92rem",
                lineHeight: 1.3,
              }}
            >
              {(STILLNESS_INTENSITY_META[intensity] || STILLNESS_INTENSITY_META.medium).copy}
            </div>
          )}
          <div
            style={{
              color: segmentType === "focus" ? "rgba(245,245,245,0.50)" : "rgba(245,245,245,0.65)",
              fontFamily: "var(--font-display)",
              fontSize: segmentType === "focus" ? "0.72rem" : "0.78rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1.35,
            }}
          >
            {isPaused
              ? "Phase timing paused"
              : segmentType === "focus"
                ? `${focusPhaseLabel}  ·  Next ${nextSegmentType === "complete" ? "Complete" : "Rest"} in ${segmentRemainingSec}s`
                : `Next ${nextSegmentType === "complete" ? "Complete" : "Focus"} in ${segmentRemainingSec}s`
            }
          </div>
        </div>
      )}
      {!isPaused && decompressionActive && postDelaySec > 0 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(46px + env(safe-area-inset-bottom))",
            transform: "translateX(-50%)",
            zIndex: 40,
            pointerEvents: "none",
            width: "min(82vw, 320px)",
            padding: "10px 14px",
            borderRadius: "18px",
            background: "rgba(2, 6, 14, 0.52)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "rgba(245,245,245,0.82)",
              fontFamily: "var(--font-display)",
              fontSize: "0.74rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Decompression
          </div>
          <div
            style={{
              marginTop: "4px",
              color: "rgba(245,245,245,0.66)",
              fontSize: "0.92rem",
              lineHeight: 1.3,
            }}
          >
            {decompressionCue}
          </div>
        </div>
      )}
    </div>
  );
}

export default StillnessRingSession;
