import React, { useEffect, useMemo, useRef } from "react";
import { useStillnessIntervalSessionState } from "./useStillnessIntervalSessionState.js";

const INTENSITY_COPY = {
  light: "Hold the kind of focus you would use in a normal conversation.",
  medium: "Hold the focus you would use to remember a spoken list.",
  heavy: "Hold the focus you would use to catch a whisper.",
};

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

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
    // Cue is best-effort only.
  }
}

export function StillnessIntervalSession({
  isRunning,
  isPaused,
  sessionStartTime,
  totalDurationSec,
  config,
  onComplete,
}) {
  const audioContextRef = useRef(null);
  const completionSentRef = useRef(false);
  const lastCueKeyRef = useRef(null);

  const focusSec = Number(config?.focusSec) || 45;
  const restSec = Number(config?.restSec) || 15;
  const intensity = String(config?.focusIntensity || "medium").toLowerCase();
  const intensityCopy = INTENSITY_COPY[intensity] || INTENSITY_COPY.medium;

  const {
    isComplete,
    totalRemainingSec,
    segmentType,
    nextSegmentType,
    segmentRemainingSec,
    segmentIndex,
    completedFocusIntervals,
  } = useStillnessIntervalSessionState({
    isRunning,
    isPaused,
    sessionStartTime,
    totalDurationSec,
    focusSec,
    restSec,
  });

  useEffect(() => {
    if (!isRunning) {
      completionSentRef.current = false;
      return;
    }
    if (!isComplete || completionSentRef.current) return;
    completionSentRef.current = true;
    onComplete?.();
  }, [isComplete, isRunning, onComplete]);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    if (segmentRemainingSec !== 3) return;

    const cueKey = `${segmentIndex}:${segmentType}`;
    if (lastCueKeyRef.current === cueKey) return;
    lastCueKeyRef.current = cueKey;
    triggerTransitionCue(audioContextRef);
  }, [isPaused, isRunning, segmentIndex, segmentRemainingSec, segmentType]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        try {
          void audioContextRef.current.close();
        } catch {
          // noop
        }
      }
    };
  }, []);

  const segmentLabel = segmentType === "focus" ? "FOCUS" : "REST";
  const nextLabel = nextSegmentType === "focus" ? "FOCUS" : "REST";
  const segmentClock = useMemo(() => formatClock(segmentRemainingSec), [segmentRemainingSec]);
  const totalClock = useMemo(() => formatClock(totalRemainingSec), [totalRemainingSec]);

  return (
    <div
      className="w-full flex flex-col items-center justify-center"
      style={{ gap: "16px", minHeight: 0 }}
      data-session="stillness-interval"
    >
      <div
        className="type-label"
        style={{
          padding: "8px 14px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.42)",
          color: "rgba(245,245,245,0.88)",
          letterSpacing: "0.12em",
        }}
      >
        {segmentLabel}
      </div>

      <div
        className="type-display"
        style={{
          fontSize: "clamp(4rem, 13vw, 6rem)",
          lineHeight: 1,
          color: "var(--accent-color)",
          textShadow: "0 0 28px var(--accent-40)",
        }}
      >
        {segmentClock}
      </div>

      <div
        className="type-caption"
        style={{
          color: "rgba(255,255,255,0.68)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Next {nextLabel} in {segmentRemainingSec}s
      </div>

      {segmentType === "focus" && (
        <div
          className="type-body text-center"
          style={{
            maxWidth: "min(82vw, 460px)",
            color: "rgba(255,255,255,0.84)",
            padding: "0 16px",
          }}
        >
          <div
            className="type-label"
            style={{
              marginBottom: "8px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.64)",
            }}
          >
            {intensity} intensity
          </div>
          {intensityCopy}
        </div>
      )}

      <div
        className="type-caption"
        style={{
          marginTop: "6px",
          color: "rgba(255,255,255,0.62)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Total {totalClock} • Rounds {completedFocusIntervals}
      </div>
    </div>
  );
}

