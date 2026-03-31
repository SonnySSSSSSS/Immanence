import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isDevtoolsEnabled } from "../../dev/uiDevtoolsGate.js";
import {
  EIGENGRAU_RESULTS,
  formatCalibrationSignal,
  recordCalibrationTrial,
} from "../../services/eigengrau/calibration.js";
import { useEigengrauDevTuningStore } from "../../state/eigengrauDevTuningStore.js";

const EVENT_TYPES = ["cloud", "brightening", "iridescent", "nodal", "branching_veil"];

const TUNING_CONTROL_DEFS = [
  { key: "intensity", label: "Intensity", min: 0.5, max: 1.8, step: 0.02, format: (value) => value.toFixed(2), help: "Raises or lowers overall artifact visibility." },
  { key: "onsetMul", label: "Onset", min: 0.5, max: 2.4, step: 0.02, format: (value) => value.toFixed(2), help: "Controls how slowly the artifact emerges." },
  { key: "dwellMul", label: "Dwell", min: 0.5, max: 2.5, step: 0.02, format: (value) => value.toFixed(2), help: "Controls how long the artifact stays perceptible." },
  { key: "fadeMul", label: "Fade", min: 0.4, max: 2.5, step: 0.02, format: (value) => value.toFixed(2), help: "Controls how quickly the artifact dissolves." },
  { key: "edgeBlur", label: "Blur", min: -2, max: 6, step: 0.1, format: (value) => value.toFixed(1), help: "Softens edges and reduces hard structure." },
  { key: "frequencyMul", label: "Frequency", min: 0.35, max: 2.2, step: 0.02, format: (value) => value.toFixed(2), help: "Controls how often artifacts appear." },
  { key: "branchStrength", label: "Branch Str", min: 0.25, max: 2.4, step: 0.02, format: (value) => value.toFixed(2), help: "Strength of branching-veil structure." },
  { key: "branchDarkness", label: "Branch Dark", min: 0.25, max: 2.4, step: 0.02, format: (value) => value.toFixed(2), help: "How dark the branching silhouette becomes." },
  { key: "iridescenceAmp", label: "Iridescence", min: 0.2, max: 2, step: 0.02, format: (value) => value.toFixed(2), help: "Amount of subtle color shimmer at artifact edges." },
  { key: "coherence", label: "Coherence", min: 0.3, max: 1.8, step: 0.02, format: (value) => value.toFixed(2), help: "How complete or organized the artifact feels before dissolving." },
];

const BASE_PROFILE_BY_STAGE = {
  1: { minGapMs: 3600, maxGapMs: 7600, minDurationMs: 2000, maxDurationMs: 3600, contrast: 0.1, spreadPx: 240, chroma: 0.82 },
  2: { minGapMs: 5200, maxGapMs: 9800, minDurationMs: 2300, maxDurationMs: 4200, contrast: 0.072, spreadPx: 255, chroma: 0.58 },
  3: { minGapMs: 6200, maxGapMs: 12200, minDurationMs: 2600, maxDurationMs: 5000, contrast: 0.054, spreadPx: 270, chroma: 0.42 },
};

const ASSIST_BUNDLE = {
  softer: { contrastMul: 0.9, chromaMul: 0.92, durationMul: 0.96, spreadMul: 0.96 },
  balanced: { contrastMul: 1, chromaMul: 1, durationMul: 1, spreadMul: 1 },
  "slightly-clearer": { contrastMul: 1.2, chromaMul: 1.12, durationMul: 1.08, spreadMul: 1.08 },
};

function pickRange(min, max) {
  return min + Math.random() * (max - min);
}

function pickFieldCoord() {
  if (Math.random() < 0.5) return pickRange(0.1, 0.42);
  return pickRange(0.58, 0.9);
}

function resolveProfile(sessionType, stage, assist) {
  const normalizedStage = Math.max(1, Math.min(3, Number(stage) || 1));
  const base = sessionType === "practice" ? BASE_PROFILE_BY_STAGE[3] : BASE_PROFILE_BY_STAGE[normalizedStage];
  const bundle = ASSIST_BUNDLE[assist] || ASSIST_BUNDLE.balanced;

  return {
    minGapMs: Math.round(base.minGapMs),
    maxGapMs: Math.round(base.maxGapMs),
    minDurationMs: Math.round(base.minDurationMs * bundle.durationMul),
    maxDurationMs: Math.round(base.maxDurationMs * bundle.durationMul),
    contrast: base.contrast * bundle.contrastMul,
    spreadPx: Math.round(base.spreadPx * bundle.spreadMul),
    chroma: base.chroma * bundle.chromaMul,
  };
}

function applyStageTuning(profile, tuning) {
  const t = tuning || {};
  const frequencyMul = Number.isFinite(Number(t.frequencyMul)) ? Number(t.frequencyMul) : 1;
  const intensity = Number.isFinite(Number(t.intensity)) ? Number(t.intensity) : 1;
  const dwellMul = Number.isFinite(Number(t.dwellMul)) ? Number(t.dwellMul) : 1;
  const onsetMul = Number.isFinite(Number(t.onsetMul)) ? Number(t.onsetMul) : 1;
  const fadeMul = Number.isFinite(Number(t.fadeMul)) ? Number(t.fadeMul) : 1;
  const edgeBlur = Number.isFinite(Number(t.edgeBlur)) ? Number(t.edgeBlur) : 0;
  const branchStrength = Number.isFinite(Number(t.branchStrength)) ? Number(t.branchStrength) : 1;
  const branchDarkness = Number.isFinite(Number(t.branchDarkness)) ? Number(t.branchDarkness) : 1;
  const coherence = Number.isFinite(Number(t.coherence)) ? Number(t.coherence) : 1;
  return {
    minGapMs: Math.max(900, Math.round(profile.minGapMs / Math.max(0.35, frequencyMul))),
    maxGapMs: Math.max(1500, Math.round(profile.maxGapMs / Math.max(0.35, frequencyMul))),
    minDurationMs: Math.max(700, Math.round(profile.minDurationMs * Math.max(0.5, dwellMul))),
    maxDurationMs: Math.max(1100, Math.round(profile.maxDurationMs * Math.max(0.5, dwellMul))),
    contrast: profile.contrast * Math.max(0.4, intensity),
    spreadPx: Math.max(120, Math.round(profile.spreadPx)),
    chroma: profile.chroma * Math.max(0.3, Number(t.iridescenceAmp) || 1),
    onsetMul: Math.max(0.5, onsetMul),
    fadeMul: Math.max(0.4, fadeMul),
    edgeBlur,
    branchStrength: Math.max(0.25, branchStrength),
    branchDarkness: Math.max(0.25, branchDarkness),
    coherence: Math.max(0.3, coherence),
  };
}

function resolveEventAnimationSeconds(durationMs, onsetMul, fadeMul) {
  const total = Math.max(0.9, durationMs / 1000);
  const onset = Math.max(0.5, onsetMul || 1);
  const fade = Math.max(0.4, fadeMul || 1);
  return total * ((onset * 0.34) + 0.66) * ((fade * 0.28) + 0.72);
}

function classifyTap(event, tapX, tapY) {
  const dx = tapX - event.x;
  const dy = tapY - event.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const strongRadius = event.spreadPx * 0.22;
  const nearRadius = event.spreadPx * 0.42;

  if (distance <= strongRadius) return EIGENGRAU_RESULTS.STRONG_OVERLAP;
  if (distance <= nearRadius) return EIGENGRAU_RESULTS.NEAR_SHIFT;
  return EIGENGRAU_RESULTS.NO_CLEAR_OVERLAP;
}

function renderEventGradient(event) {
  const a = Math.min(0.18, event.contrast * 0.72);
  const b = Math.min(0.14, event.contrast * 0.48);

  if (event.type === "branching_veil") {
    const s = Math.max(0.25, event.branchStrength || 1);
    const d = Math.max(0.25, event.branchDarkness || 1);
    return `
      radial-gradient(circle at 42% 58%, rgba(7, 9, 13, ${a * 1.8 * d}) 0%, rgba(8, 10, 14, ${b * 1.35 * d}) 26%, rgba(0,0,0,0) 72%),
      linear-gradient(${event.branchAngleA}deg, rgba(0,0,0,0) 0%, rgba(8, 10, 13, ${a * 1.4 * s * d}) 45%, rgba(0,0,0,0) 54%),
      linear-gradient(${event.branchAngleB}deg, rgba(0,0,0,0) 8%, rgba(8, 10, 14, ${b * 1.2 * s * d}) 48%, rgba(0,0,0,0) 58%),
      linear-gradient(${event.branchAngleC}deg, rgba(0,0,0,0) 12%, rgba(9, 11, 15, ${b * 0.92 * s * d}) 46%, rgba(0,0,0,0) 60%)`;
  }

  if (event.type === "iridescent") {
    return `radial-gradient(circle at 50% 50%, rgba(156, 169, 204, ${a * event.chroma}) 0%, rgba(132, 126, 176, ${b * event.chroma}) 26%, rgba(88, 97, 118, ${b * 0.32}) 54%, rgba(0, 0, 0, 0) 82%)`;
  }

  if (event.type === "nodal") {
    return `radial-gradient(circle at 50% 50%, rgba(178, 191, 219, ${a}) 0%, rgba(114, 124, 148, ${b}) 18%, rgba(70, 76, 90, ${b * 0.28}) 48%, rgba(0, 0, 0, 0) 74%)`;
  }

  if (event.type === "brightening") {
    return `radial-gradient(circle at 50% 50%, rgba(182, 194, 220, ${a}) 0%, rgba(125, 136, 162, ${b}) 36%, rgba(66, 74, 92, ${b * 0.18}) 60%, rgba(0, 0, 0, 0) 82%)`;
  }

  return `radial-gradient(circle at 50% 50%, rgba(166, 178, 206, ${a}) 0%, rgba(112, 122, 144, ${b}) 32%, rgba(62, 68, 82, ${b * 0.17}) 64%, rgba(0, 0, 0, 0) 86%)`;
}

export function EigengrauField({
  sessionType = "calibration",
  calibrationStage = 1,
  visibilityAssist = "balanced",
  practiceMarkerEnabled = true,
}) {
  const devToolsEnabled = isDevtoolsEnabled();
  const fieldRef = useRef(null);
  const eventTimeoutRef = useRef(null);
  const spawnTimeoutRef = useRef(null);
  const pendingEventRef = useRef(false);
  const scheduleNextEventRef = useRef(() => {});
  const forcedCadenceTypeIndexRef = useRef(0);

  const [activeEvent, setActiveEvent] = useState(null);
  const [lastSignal, setLastSignal] = useState(null);
  const [practiceNoticedCount, setPracticeNoticedCount] = useState(0);
  const [lastArtifactMeta, setLastArtifactMeta] = useState({ at: 0, type: null, forcedCadence: false });
  const [tooltipKey, setTooltipKey] = useState(null);

  const normalizedStage = Math.max(1, Math.min(3, Number(calibrationStage) || 1));
  const mode = sessionType === "practice" ? "practice" : "calibration";
  const panelOpen = useEigengrauDevTuningStore((s) => s.panelOpen);
  const setPanelOpen = useEigengrauDevTuningStore((s) => s.setPanelOpen);
  const targetStage = useEigengrauDevTuningStore((s) => s.targetStage);
  const setTargetStage = useEigengrauDevTuningStore((s) => s.setTargetStage);
  const forcedCadenceEnabled = useEigengrauDevTuningStore((s) => s.forcedCadenceEnabled);
  const setForcedCadenceEnabled = useEigengrauDevTuningStore((s) => s.setForcedCadenceEnabled);
  const stageTuning = useEigengrauDevTuningStore((s) => s.stageTuning);
  const patchStageTuning = useEigengrauDevTuningStore((s) => s.patchStageTuning);
  const resetStageTuning = useEigengrauDevTuningStore((s) => s.resetStageTuning);
  const sessionStage = mode === "calibration" ? normalizedStage : 3;
  const editingStage = Math.max(1, Math.min(3, Number(targetStage) || 1));
  const liveTuning = useMemo(() => stageTuning?.[sessionStage] || {}, [stageTuning, sessionStage]);
  const editingTuning = useMemo(() => stageTuning?.[editingStage] || {}, [stageTuning, editingStage]);
  const profile = useMemo(() => {
    const base = resolveProfile(mode, normalizedStage, visibilityAssist);
    return applyStageTuning(base, liveTuning);
  }, [mode, normalizedStage, visibilityAssist, liveTuning]);
  const liveRenderTuning = useMemo(() => ({
    intensity: Math.max(0.35, Number(liveTuning.intensity) || 1),
    edgeBlur: Number(liveTuning.edgeBlur) || 0,
    iridescenceAmp: Math.max(0.2, Number(liveTuning.iridescenceAmp) || 1),
    branchStrength: Math.max(0.25, Number(liveTuning.branchStrength) || 1),
    branchDarkness: Math.max(0.25, Number(liveTuning.branchDarkness) || 1),
    coherence: Math.max(0.25, Number(liveTuning.coherence) || 1),
    onsetMul: Math.max(0.5, Number(liveTuning.onsetMul) || 1),
    fadeMul: Math.max(0.4, Number(liveTuning.fadeMul) || 1),
  }), [liveTuning]);

  const resetTimers = useCallback(() => {
    if (eventTimeoutRef.current) {
      clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = null;
    }
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
  }, []);

  const scheduleNextEvent = useCallback(() => {
    const cadenceActive = devToolsEnabled && forcedCadenceEnabled;
    const durationMs = cadenceActive
      ? 3000
      : pickRange(profile.minDurationMs, profile.maxDurationMs);
    const delay = cadenceActive
      ? Math.max(220, 5000 - durationMs)
      : pickRange(profile.minGapMs, profile.maxGapMs);

    spawnTimeoutRef.current = setTimeout(() => {
      const coherence = Math.max(0.3, profile.coherence || 1);
      const eventType = cadenceActive
        ? EVENT_TYPES[forcedCadenceTypeIndexRef.current % EVENT_TYPES.length]
        : EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
      if (cadenceActive) {
        forcedCadenceTypeIndexRef.current += 1;
      }

      const rawContrast = profile.contrast * pickRange(0.83, 0.99 + ((coherence - 1) * 0.08));
      const contrastFloor = cadenceActive ? 0.085 : (mode === "practice" ? 0.058 : 0.05);
      const nextEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: eventType,
        x: pickFieldCoord(),
        y: pickRange(0.14, 0.86),
        spreadPx: Math.round(profile.spreadPx * (cadenceActive ? pickRange(1, 1.14) : pickRange(0.86, 1.06 + ((1 - Math.min(1.25, coherence)) * 0.18)))),
        durationMs,
        contrast: Math.max(contrastFloor, rawContrast),
        chroma: profile.chroma * pickRange(0.88, 1.02),
        branchAngleA: Math.round(pickRange(10, 170)),
        branchAngleB: Math.round(pickRange(185, 322)),
        branchAngleC: Math.round(pickRange(40, 290)),
        edgeBlur: profile.edgeBlur,
        branchStrength: profile.branchStrength,
        branchDarkness: profile.branchDarkness,
        coherence,
        onsetMul: profile.onsetMul,
        fadeMul: profile.fadeMul,
        forcedCadence: cadenceActive,
      };

      pendingEventRef.current = true;
      setActiveEvent(nextEvent);
      setLastArtifactMeta({ at: Date.now(), type: nextEvent.type, forcedCadence: cadenceActive });

      eventTimeoutRef.current = setTimeout(() => {
        if (mode === "calibration" && pendingEventRef.current) {
          recordCalibrationTrial({
            stage: normalizedStage,
            result: EIGENGRAU_RESULTS.NO_MARKED_EVENT,
            eventType: nextEvent.type,
            hadEvent: true,
          });
        }
        pendingEventRef.current = false;
        setActiveEvent(null);
        scheduleNextEventRef.current();
      }, durationMs);
    }, delay);
  }, [devToolsEnabled, forcedCadenceEnabled, mode, normalizedStage, profile]);

  useEffect(() => {
    scheduleNextEventRef.current = scheduleNextEvent;
  }, [scheduleNextEvent]);

  useEffect(() => {
    resetTimers();
    pendingEventRef.current = false;
    scheduleNextEventRef.current();

    return () => resetTimers();
  }, [scheduleNextEvent, resetTimers]);

  const recordSignal = useCallback((result) => {
    setLastSignal(result);
    if (mode === "calibration") {
      setTimeout(() => {
        setLastSignal((prev) => (prev === result ? null : prev));
      }, normalizedStage === 1 ? 1300 : 600);
    } else {
      setTimeout(() => {
        setLastSignal((prev) => (prev === result ? null : prev));
      }, 1000);
    }
  }, [mode, normalizedStage]);

  const handleFieldPointerDown = useCallback((event) => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    if (mode === "practice") {
      if (!practiceMarkerEnabled) return;
      setPracticeNoticedCount((v) => v + 1);
      setLastSignal("noticed");
      setTimeout(() => {
        setLastSignal((prev) => (prev === "noticed" ? null : prev));
      }, 850);
      return;
    }

    if (activeEvent) {
      const result = classifyTap(activeEvent, x, y);
      recordCalibrationTrial({
        stage: normalizedStage,
        result,
        eventType: activeEvent.type,
        hadEvent: true,
      });
      pendingEventRef.current = false;
      if (normalizedStage === 1) {
        recordSignal(result);
      }
      setActiveEvent(null);
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }
      scheduleNextEventRef.current();
      return;
    }

    recordCalibrationTrial({
      stage: normalizedStage,
      result: EIGENGRAU_RESULTS.NO_CLEAR_OVERLAP,
      eventType: "none",
      hadEvent: false,
    });
    if (normalizedStage === 1) {
      recordSignal(EIGENGRAU_RESULTS.NO_CLEAR_OVERLAP);
    }
  }, [activeEvent, mode, normalizedStage, practiceMarkerEnabled, recordSignal]);

  const setTune = useCallback((key, value) => {
    patchStageTuning(editingStage, { [key]: Number(value) });
  }, [editingStage, patchStageTuning]);

  const lastArtifactTimeLabel = useMemo(() => {
    if (!lastArtifactMeta.at) return "none";
    return new Date(lastArtifactMeta.at).toLocaleTimeString();
  }, [lastArtifactMeta.at]);
  const activeTooltipControl = useMemo(
    () => TUNING_CONTROL_DEFS.find((control) => control.key === tooltipKey) || null,
    [tooltipKey]
  );

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "92px 1fr 44px",
    gap: "8px",
    alignItems: "center",
  };
  const isEditingLiveStage = editingStage === sessionStage;

  return (
    <div
      ref={fieldRef}
      aria-label="Eigengrau visual field"
      onPointerDown={handleFieldPointerDown}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        overflow: "hidden",
        borderRadius: 0,
        background:
          "radial-gradient(circle at 50% 48%, rgba(44, 48, 56, 0.2) 0%, rgba(28, 31, 38, 0.34) 36%, rgba(16, 18, 22, 0.93) 72%, rgba(10, 11, 14, 1) 100%)",
        cursor: mode === "calibration" || practiceMarkerEnabled ? "crosshair" : "default",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-11%",
          background:
            "radial-gradient(circle at 54% 49%, rgba(136, 148, 170, 0.038) 0%, rgba(74, 82, 96, 0.016) 36%, rgba(0,0,0,0) 66%), linear-gradient(180deg, rgba(22, 24, 30, 0.86) 0%, rgba(15, 17, 22, 0.95) 60%, rgba(9, 10, 13, 1) 100%)",
          animation: "eigengrau-substrate-drift 84s ease-in-out infinite alternate",
          transformOrigin: "50% 50%",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.052,
          mixBlendMode: "soft-light",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.88) 1px, transparent 0)",
          backgroundSize: "3px 3px",
          backgroundPosition: "37px 61px",
          animation: "eigengrau-grain 12s steps(12, end) infinite",
        }}
      />

      {activeEvent && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${(activeEvent.x * 100).toFixed(2)}%`,
            top: `${(activeEvent.y * 100).toFixed(2)}%`,
            width: `${activeEvent.spreadPx}px`,
            height: `${activeEvent.spreadPx}px`,
            borderRadius: "999px",
            transform: "translate(-50%, -50%)",
            background: renderEventGradient({
              ...activeEvent,
              contrast: activeEvent.contrast * liveRenderTuning.intensity,
              chroma: activeEvent.chroma * liveRenderTuning.iridescenceAmp,
              branchStrength: (activeEvent.branchStrength || 1) * liveRenderTuning.branchStrength,
              branchDarkness: (activeEvent.branchDarkness || 1) * liveRenderTuning.branchDarkness,
            }),
            filter: activeEvent.type === "branching_veil"
              ? `blur(${Math.max(1.4, 3.6 + (activeEvent.edgeBlur || 0) + liveRenderTuning.edgeBlur)}px)`
              : `blur(${Math.max(0.9, 2.8 + ((activeEvent.edgeBlur || 0) + liveRenderTuning.edgeBlur) * 0.72)}px)`,
            mixBlendMode: activeEvent.type === "branching_veil" ? "multiply" : "screen",
            opacity: (activeEvent.type === "branching_veil" ? 0.64 : 1) * Math.min(1.5, Math.max(0.35, liveRenderTuning.coherence)) * (activeEvent.forcedCadence ? 1.35 : 1),
            animation: activeEvent.type === "branching_veil"
              ? `eigengrau-threshold-veil ${resolveEventAnimationSeconds(activeEvent.durationMs, activeEvent.onsetMul * liveRenderTuning.onsetMul, activeEvent.fadeMul * liveRenderTuning.fadeMul)}s cubic-bezier(0.18, 0.42, 0.24, 1) forwards`
              : `eigengrau-threshold ${resolveEventAnimationSeconds(activeEvent.durationMs, activeEvent.onsetMul * liveRenderTuning.onsetMul, activeEvent.fadeMul * liveRenderTuning.fadeMul)}s cubic-bezier(0.18, 0.42, 0.24, 1) forwards`,
          }}
        />
      )}

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 36%, rgba(0,0,0,0.2) 72%, rgba(0,0,0,0.48) 100%)",
          pointerEvents: "none",
        }}
      />

      {lastSignal && mode === "calibration" && normalizedStage === 1 && (
        <div
          style={{
            position: "absolute",
            right: "14px",
            top: "14px",
            zIndex: 4,
            padding: "8px 10px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(6, 8, 12, 0.58)",
            color: "rgba(255,255,255,0.86)",
            fontSize: "11px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            pointerEvents: "none",
          }}
        >
          {lastSignal === "noticed" ? "shift marked" : formatCalibrationSignal(lastSignal)}
        </div>
      )}

      {mode === "practice" && (
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "12px",
            zIndex: 8,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(7, 9, 13, 0.46)",
            borderRadius: "999px",
            padding: "6px 10px",
            fontSize: "10px",
            letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.68)",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          Notices: {practiceNoticedCount}
        </div>
      )}

      {devToolsEnabled && (
        <div style={{ position: "absolute", left: "12px", bottom: "calc(env(safe-area-inset-bottom) + 72px)", zIndex: 6, display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "999px",
              background: "rgba(8,10,15,0.5)",
              color: "rgba(255,255,255,0.84)",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "6px 10px",
            }}
          >
            Live Calibration: Cal {sessionStage}
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              border: "1px solid rgba(255,255,255,0.24)",
              borderRadius: "999px",
              background: "rgba(8,10,15,0.56)",
              color: "rgba(255,255,255,0.86)",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "7px 11px",
            }}
          >
            Eigengrau Tune
          </button>
        </div>
      )}

      {devToolsEnabled && panelOpen && (
        <div
          style={{
            position: "absolute",
            left: "12px",
            top: "12px",
            zIndex: 7,
            width: "min(92vw, 380px)",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(6,8,12,0.72)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.88)" }}>
              Dev Eigengrau Tuning
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              style={{
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "999px",
                background: "transparent",
                color: "rgba(255,255,255,0.74)",
                fontSize: "10px",
                padding: "4px 8px",
              }}
            >
              Close
            </button>
          </div>

          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.72)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span>Live Calibration: Cal {sessionStage}</span>
            <span style={{ color: isEditingLiveStage ? "rgba(167, 243, 208, 0.92)" : "rgba(255, 210, 138, 0.92)" }}>
              Editing Profile: Cal {editingStage}
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[1, 2, 3].map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setTargetStage(stage)}
                style={{
                  border: editingStage === stage ? "1px solid var(--accent-color)" : "1px solid rgba(255,255,255,0.18)",
                  background: editingStage === stage ? "rgba(212,175,55,0.2)" : "transparent",
                  color: sessionStage === stage ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.8)",
                  borderRadius: "999px",
                  fontSize: "10px",
                  padding: "4px 9px",
                  textTransform: "uppercase",
                  boxShadow: sessionStage === stage ? "inset 0 0 0 1px rgba(255,255,255,0.16)" : "none",
                }}
                title={sessionStage === stage ? `Cal ${stage} is live in the current session.` : `Edit the saved tuning profile for Cal ${stage}.`}
              >
                Cal {stage}{sessionStage === stage ? " Live" : ""}
              </button>
            ))}
          </div>

          {!isEditingLiveStage && (
            <div style={{ fontSize: "10px", color: "rgba(255,210,138,0.9)", border: "1px solid rgba(255,210,138,0.18)", borderRadius: "8px", padding: "6px 8px" }}>
              Live stage stays on Cal {sessionStage}. Slider changes are saving to Cal {editingStage}.
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.82)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <input
                type="checkbox"
                checked={!!forcedCadenceEnabled}
                onChange={(e) => setForcedCadenceEnabled(e.target.checked)}
              />
              Force Test Cadence
            </label>
            <span style={{ fontSize: "10px", color: forcedCadenceEnabled ? "rgba(167, 243, 208, 0.92)" : "rgba(255,255,255,0.55)" }}>
              {forcedCadenceEnabled ? "5s loop on" : "off"}
            </span>
          </div>

          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.64)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "6px 8px" }}>
            Last artifact: {lastArtifactTimeLabel} • {lastArtifactMeta.type || "none"} • cadence {lastArtifactMeta.forcedCadence ? "forced" : "normal"}
          </div>

          <div
            style={{
              minHeight: "34px",
              border: activeTooltipControl ? "1px solid rgba(212,175,55,0.22)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "7px 9px",
              background: activeTooltipControl ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)",
              color: activeTooltipControl ? "rgba(255,248,220,0.9)" : "rgba(255,255,255,0.44)",
              fontSize: "10px",
              lineHeight: 1.35,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflow: "hidden",
            }}
          >
            {activeTooltipControl ? (
              <>
                <span
                  style={{
                    flex: "0 0 auto",
                    padding: "3px 7px",
                    borderRadius: "999px",
                    background: "rgba(212,175,55,0.18)",
                    color: "rgba(255,248,220,0.96)",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeTooltipControl.label}
                </span>
                <span
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    color: "rgba(255,244,214,0.82)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeTooltipControl.help}
                </span>
              </>
            ) : (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Hover a control or info dot for quick help.
              </span>
            )}
          </div>

          {TUNING_CONTROL_DEFS.map((control) => {
            const value = Number(editingTuning[control.key] ?? 1);
            const tooltipOpen = tooltipKey === control.key;
            return (
              <div key={control.key}>
                <div style={rowStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "rgba(255,255,255,0.68)", fontSize: "10px" }}>{control.label}</span>
                    <button
                      type="button"
                      aria-label={`${control.label}: ${control.help}`}
                      title={control.help}
                      onFocus={() => setTooltipKey(control.key)}
                      onBlur={() => setTooltipKey((prev) => (prev === control.key ? null : prev))}
                      onMouseEnter={() => setTooltipKey(control.key)}
                      onMouseLeave={() => setTooltipKey((prev) => (prev === control.key ? null : prev))}
                      style={{
                        width: "15px",
                        height: "15px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: tooltipOpen ? "rgba(212,175,55,0.18)" : "transparent",
                        color: tooltipOpen ? "rgba(255,248,220,0.9)" : "rgba(255,255,255,0.64)",
                        fontSize: "9px",
                        fontWeight: 700,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      i
                    </button>
                  </div>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={value}
                    onChange={(e) => setTune(control.key, e.target.value)}
                    onFocus={() => setTooltipKey(control.key)}
                    onBlur={() => setTooltipKey((prev) => (prev === control.key ? null : prev))}
                    onMouseEnter={() => setTooltipKey(control.key)}
                    onMouseLeave={() => setTooltipKey((prev) => (prev === control.key ? null : prev))}
                    aria-label={`${control.label}. ${control.help}`}
                  />
                  <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "10px" }}>{control.format(value)}</span>
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => resetStageTuning(editingStage)}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "999px",
                background: "transparent",
                color: "rgba(255,255,255,0.78)",
                fontSize: "10px",
                padding: "5px 9px",
                textTransform: "uppercase",
              }}
            >
              Reset Editing Profile
            </button>
            {!isEditingLiveStage && (
              <button
                type="button"
                onClick={() => setTargetStage(sessionStage)}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "999px",
                  background: "transparent",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "10px",
                  padding: "5px 9px",
                  textTransform: "uppercase",
                }}
              >
                Edit Live Stage
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes eigengrau-substrate-drift {
          0% { transform: scale(1.008) translate3d(-0.22%, -0.16%, 0); }
          50% { transform: scale(1.02) translate3d(0.18%, 0.12%, 0); }
          100% { transform: scale(1.012) translate3d(-0.18%, 0.2%, 0); }
        }

        @keyframes eigengrau-threshold {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.985); }
          52% { opacity: ${0.56 * (liveTuning.coherence || 1)}; transform: translate(-50%, -50%) scale(1); }
          74% { opacity: ${0.5 * (liveTuning.coherence || 1)}; transform: translate(-50%, -50%) scale(1.012); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.004); }
        }

        @keyframes eigengrau-threshold-veil {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.996); }
          58% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          82% { opacity: 0.44; transform: translate(-50%, -50%) scale(1.005); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.002); }
        }

        @keyframes eigengrau-grain {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0.24%, -0.16%, 0); }
          100% { transform: translate3d(-0.2%, 0.22%, 0); }
        }
      `}</style>
    </div>
  );
}

export default EigengrauField;
