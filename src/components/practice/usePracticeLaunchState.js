/**
 * usePracticeLaunchState.js
 *
 * Extracted from PracticeSection.jsx.
 * Owns:
 *  - Stillness-config constants and normalization helpers
 *  - Launch-context validation (getInvalidPracticeLaunchContextReason)
 *  - sharedBreathPreDelaySec and persistedStillnessDefaults derivation
 *  - The practiceLaunchContext useEffect (safe-fallback + full normalisation)
 *
 * PracticeSection.jsx imports the hook plus any helpers it calls directly.
 */

import { useMemo, useCallback, useEffect, useRef } from "react";
import { getPathById } from "../../data/navigationData.js";
import { PRACTICE_REGISTRY, resolvePracticeId } from "../PracticeSection/constants.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SAFE_LAUNCH_FALLBACK = Object.freeze({
  practiceId: 'breath',
  durationMin: 10,
});

export const DEFAULT_STILLNESS_CONFIG = Object.freeze({
  focusIntensity: "medium",
  focusSec: 40,
  restSec: 20,
  preDelaySec: 0,
  postDelaySec: 0,
  decompressionCue: "",
});

export const STILLNESS_TIMING_BY_INTENSITY = Object.freeze({
  light: Object.freeze({ focusSec: 45, restSec: 15 }),
  medium: Object.freeze({ focusSec: 40, restSec: 20 }),
  heavy: Object.freeze({ focusSec: 25, restSec: 25 }),
});

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function normalizeSeconds(value, fallback, min = 0, max = 600) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function normalizeFocusIntensity(value, fallback = "medium") {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "light" || raw === "medium" || raw === "heavy") return raw;
  return fallback;
}

export function resolveStillnessTimingForIntensity(intensity, fallback = "medium") {
  const normalizedIntensity = normalizeFocusIntensity(intensity, fallback);
  return STILLNESS_TIMING_BY_INTENSITY[normalizedIntensity] || STILLNESS_TIMING_BY_INTENSITY.medium;
}

export function normalizeStillnessConfig(raw, { fallback = DEFAULT_STILLNESS_CONFIG, sharedPreDelaySec = 0 } = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const fallbackCfg = fallback && typeof fallback === "object" ? fallback : DEFAULT_STILLNESS_CONFIG;
  const fallbackPreDelay = Number.isFinite(Number(fallbackCfg.preDelaySec))
    ? Number(fallbackCfg.preDelaySec)
    : Number(sharedPreDelaySec) || 0;
  const focusIntensity = normalizeFocusIntensity(src.focusIntensity, fallbackCfg.focusIntensity || "medium");
  const resolvedTiming = resolveStillnessTimingForIntensity(
    focusIntensity,
    fallbackCfg.focusIntensity || "medium"
  );

  return {
    focusIntensity,
    focusSec: normalizeSeconds(resolvedTiming.focusSec, DEFAULT_STILLNESS_CONFIG.focusSec, 5, 300),
    restSec: normalizeSeconds(resolvedTiming.restSec, DEFAULT_STILLNESS_CONFIG.restSec, 3, 180),
    preDelaySec: normalizeSeconds(
      src.preDelaySec,
      normalizeSeconds(fallbackPreDelay, DEFAULT_STILLNESS_CONFIG.preDelaySec, 0, 20),
      0,
      20
    ),
    postDelaySec: normalizeSeconds(
      src.postDelaySec,
      normalizeSeconds(fallbackCfg.postDelaySec, DEFAULT_STILLNESS_CONFIG.postDelaySec, 0, 180),
      0,
      180
    ),
    decompressionCue: typeof src.decompressionCue === "string"
      ? src.decompressionCue.trim()
      : (typeof fallbackCfg.decompressionCue === "string" ? fallbackCfg.decompressionCue.trim() : ""),
  };
}

// ---------------------------------------------------------------------------
// Launch-context validation
// ---------------------------------------------------------------------------

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function getInvalidPracticeLaunchContextReason(ctx) {
  if (!isPlainObject(ctx)) return 'ctx_not_object';

  if (typeof ctx.source !== 'undefined' && typeof ctx.source !== 'string') {
    return 'source_not_string';
  }

  if (typeof ctx.practiceId !== 'undefined') {
    if (typeof ctx.practiceId !== 'string') return 'practice_id_not_string';
    const resolvedPracticeId = resolvePracticeId(ctx.practiceId);
    if (!PRACTICE_REGISTRY[resolvedPracticeId]) return `unknown_practice_id:${ctx.practiceId}`;
  }

  if (typeof ctx.durationMin !== 'undefined') {
    const durationMin = Number(ctx.durationMin);
    if (!Number.isFinite(durationMin) || durationMin <= 0) return 'duration_min_invalid';
  }

  if (typeof ctx.practiceParamsPatch !== 'undefined' && !isPlainObject(ctx.practiceParamsPatch)) {
    return 'practice_params_patch_invalid';
  }

  if (typeof ctx.overrides !== 'undefined') {
    if (!isPlainObject(ctx.overrides)) return 'overrides_invalid';

    if ('practiceParams' in ctx.overrides && !isPlainObject(ctx.overrides.practiceParams)) {
      return 'overrides_practice_params_invalid';
    }
    if ('settings' in ctx.overrides && !isPlainObject(ctx.overrides.settings)) {
      return 'overrides_settings_invalid';
    }
    if ('tempoSync' in ctx.overrides && !isPlainObject(ctx.overrides.tempoSync)) {
      return 'overrides_tempo_sync_invalid';
    }
    if ('awarenessScene' in ctx.overrides && !isPlainObject(ctx.overrides.awarenessScene)) {
      return 'overrides_awareness_scene_invalid';
    }
  }

  if (typeof ctx.pathContext !== 'undefined' && !isPlainObject(ctx.pathContext)) {
    return 'path_context_invalid';
  }

  if (typeof ctx.locks !== 'undefined' && !Array.isArray(ctx.locks) && !isPlainObject(ctx.locks)) {
    return 'locks_invalid';
  }

  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * usePracticeLaunchState
 *
 * Encapsulates:
 *  - sharedBreathPreDelaySec derivation
 *  - persistedStillnessDefaults derivation (useMemo)
 *  - resolveInitiationV2BenchmarkContext (useCallback, only used by the launch effect)
 *  - The practiceLaunchContext useEffect (safe-fallback path + full normalization)
 *
 * Returns { sharedBreathPreDelaySec, persistedStillnessDefaults } for use in
 * PracticeSection render logic.
 *
 * All setters, callbacks, and refs are passed in via the params object.
 * Stable references are kept in a useRef so the effect's dependency array only
 * reflects reactive data, matching the original behaviour in PracticeSection.
 */
export function usePracticeLaunchState({
  // Reactive data
  practiceLaunchContext,
  isRunning,
  practiceId,
  duration,
  practiceParams,
  activePath,
  // Stable store functions
  clearPracticeLaunchContext,
  applyLaunchConstraints,
  clearLaunchConstraints,
  getCircuit,
  // Stable callbacks
  mergePracticeParamsPatch,
  resetGuidanceCompletionState,
  // State setters (stable from useState)
  setPracticeId,
  setDuration,
  setLaunchStillnessConfig,
  setBreathSubmode,
  setPathLaunchGuidance,
  setPathLaunchInstructionVideo,
  setInitiationBenchmarkContext,
  setPendingPathAutoStart,
  setHasExpandedOnce,
  // Refs (stable MutableRefObjects from useRef in parent)
  pathGuidanceStartedRef,
  pathGuidanceWasPausedRef,
  pathGuidanceRanRef,
  activePathContextRef,
  activePathLaunchGuidanceRef,
  activePathInstructionVideoRef,
  circuitPendingRef,
  queuedPathAutoStartRequestIdRef,
  consumedPathAutoStartRequestIdRef,
  suppressPrefSaveRef,
}) {
  // -------------------------------------------------------------------------
  // Derived state (was directly inline in PracticeSection)
  // -------------------------------------------------------------------------

  const sharedBreathPreDelaySec = normalizeSeconds(
    practiceParams?.breath?.preDelaySec,
    DEFAULT_STILLNESS_CONFIG.preDelaySec,
    0,
    20
  );

  const persistedStillnessDefaults = useMemo(
    () => normalizeStillnessConfig(practiceParams?.breath?.stillness, {
      fallback: DEFAULT_STILLNESS_CONFIG,
      sharedPreDelaySec: sharedBreathPreDelaySec,
    }),
    [practiceParams?.breath?.stillness, sharedBreathPreDelaySec]
  );

  // -------------------------------------------------------------------------
  // resolveInitiationV2BenchmarkContext — only consumed by the launch effect
  // -------------------------------------------------------------------------

  const resolveInitiationV2BenchmarkContext = useCallback((ctx) => {
    if (!ctx || ctx.source !== 'dailySchedule' || ctx.practiceId !== 'breath') {
      return null;
    }

    const pathCtx = ctx.pathContext || {};
    const pathId = pathCtx.activePathId || activePath?.activePathId || null;
    const pathDef = pathId ? getPathById(pathId) : null;
    const curriculumId = pathDef?.tracking?.curriculumId || null;
    if (curriculumId !== 'ritual-initiation-14-v2') {
      return null;
    }

    const dayIndex = Number(pathCtx.dayIndex);
    if (!(dayIndex === 1 || dayIndex === 14)) {
      return null;
    }

    const slotIndexRaw = Number(pathCtx.slotIndex);
    let isMorningLeg = Number.isFinite(slotIndexRaw) ? slotIndexRaw === 0 : false;
    if (!Number.isFinite(slotIndexRaw)) {
      const selectedTimes = Array.isArray(activePath?.schedule?.selectedTimes)
        ? activePath.schedule.selectedTimes
        : [];
      const firstSlotTime = selectedTimes[0] || null;
      const slotTime = typeof pathCtx.slotTime === 'string' ? pathCtx.slotTime.substring(0, 5) : null;
      isMorningLeg = !!firstSlotTime && !!slotTime && firstSlotTime.substring(0, 5) === slotTime;
    }
    if (!isMorningLeg) {
      return null;
    }

    return {
      runId: pathCtx.runId || activePath?.runId || null,
      activePathId: pathId,
      dayIndex,
      slotIndex: Number.isFinite(slotIndexRaw) ? slotIndexRaw : 0,
      weekIndex: Number(pathCtx.weekIndex) || Math.ceil(dayIndex / 7),
    };
  }, [activePath]);

  // -------------------------------------------------------------------------
  // Stable-ref bundle — keeps setters/callbacks/refs out of effect deps.
  // All values here are stable between renders (store actions, useState setters,
  // useCallback with stable deps, or useRef objects). Storing them in a ref
  // prevents spurious re-runs while keeping the dependency array truthful about
  // the reactive data that should actually trigger the effect.
  // -------------------------------------------------------------------------

  const _stableRef = useRef(null);
  _stableRef.current = {
    clearPracticeLaunchContext,
    applyLaunchConstraints,
    clearLaunchConstraints,
    getCircuit,
    mergePracticeParamsPatch,
    resetGuidanceCompletionState,
    setPracticeId,
    setDuration,
    setLaunchStillnessConfig,
    setBreathSubmode,
    setPathLaunchGuidance,
    setPathLaunchInstructionVideo,
    setInitiationBenchmarkContext,
    setPendingPathAutoStart,
    setHasExpandedOnce,
    pathGuidanceStartedRef,
    pathGuidanceWasPausedRef,
    pathGuidanceRanRef,
    activePathContextRef,
    activePathLaunchGuidanceRef,
    activePathInstructionVideoRef,
    circuitPendingRef,
    consumedPathAutoStartRequestIdRef,
    queuedPathAutoStartRequestIdRef,
    suppressPrefSaveRef,
    resolveInitiationV2BenchmarkContext,
  };

  // -------------------------------------------------------------------------
  // Launch-context effect (was directly in PracticeSection)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isRunning) return;
    if (!practiceLaunchContext) return;

    const invalidLaunchContextReason = getInvalidPracticeLaunchContextReason(practiceLaunchContext);
    if (invalidLaunchContextReason) {
      console.warn('[PracticeSection] Invalid practiceLaunchContext; applying safe fallback.', {
        reason: invalidLaunchContextReason,
        practiceLaunchContext,
      });

      pathGuidanceStartedRef.current = false;
      pathGuidanceWasPausedRef.current = false;
      pathGuidanceRanRef.current = false;
      queueMicrotask(() => resetGuidanceCompletionState());
      activePathContextRef.current = null;
      activePathLaunchGuidanceRef.current = undefined;
      activePathInstructionVideoRef.current = undefined;
      suppressPrefSaveRef.current = false;
      queueMicrotask(() => setLaunchStillnessConfig(null));
      clearLaunchConstraints?.();
      const _fbResetPracticeId = practiceId !== SAFE_LAUNCH_FALLBACK.practiceId;
      const _fbResetDuration = duration !== SAFE_LAUNCH_FALLBACK.durationMin;
      queueMicrotask(() => {
        setPathLaunchGuidance(undefined);
        setPathLaunchInstructionVideo(undefined);
        setInitiationBenchmarkContext(null);
        setPendingPathAutoStart(null);
        queuedPathAutoStartRequestIdRef.current = null;
        if (_fbResetPracticeId) setPracticeId(SAFE_LAUNCH_FALLBACK.practiceId);
        setHasExpandedOnce(true);
        if (_fbResetDuration) setDuration(SAFE_LAUNCH_FALLBACK.durationMin);
      });
      clearPracticeLaunchContext?.();
      return;
    }

    const ctx = practiceLaunchContext;
    queueMicrotask(() => setPathLaunchGuidance(undefined));
    queueMicrotask(() => setPathLaunchInstructionVideo(
      Object.prototype.hasOwnProperty.call(ctx, 'instructionVideo')
        ? (ctx.instructionVideo ?? null)
        : undefined
    ));
    pathGuidanceStartedRef.current = false;
    pathGuidanceWasPausedRef.current = false;
    pathGuidanceRanRef.current = false;
    queueMicrotask(() => resetGuidanceCompletionState());
    const benchmarkCtx = resolveInitiationV2BenchmarkContext(ctx);
    queueMicrotask(() => setInitiationBenchmarkContext(benchmarkCtx));
    suppressPrefSaveRef.current = ctx.persistPreferences === false;

    // Apply session overrides + locks (ephemeral).
    if (ctx.source) {
      const normalizedOverrides = ctx.overrides && typeof ctx.overrides === 'object' ? ctx.overrides : null;

      const practiceParamsOverride =
        (normalizedOverrides?.practiceParams && typeof normalizedOverrides.practiceParams === 'object')
          ? normalizedOverrides.practiceParams
          : (ctx.practiceParamsPatch && typeof ctx.practiceParamsPatch === 'object' ? ctx.practiceParamsPatch : null);

      const mergedOverrides = {
        ...(normalizedOverrides || {}),
        ...(practiceParamsOverride ? { practiceParams: practiceParamsOverride } : {}),
      };

      const inferredLocks = (() => {
        if (ctx.locks) return ctx.locks;
        if (ctx.source === 'dailySchedule') {
          return ['practiceParams', 'settings', 'tempoSync', 'awarenessScene'];
        }
        if (!practiceParamsOverride) return null;
        const out = [];
        for (const [bucketKey, bucketVal] of Object.entries(practiceParamsOverride)) {
          if (!bucketVal || typeof bucketVal !== 'object') continue;
          for (const k of Object.keys(bucketVal)) {
            out.push(`practiceParams.${bucketKey}.${k}`);
          }
        }
        return out.length ? out : null;
      })();

      applyLaunchConstraints?.({
        source: ctx.source,
        overrides: Object.keys(mergedOverrides).length ? mergedOverrides : null,
        locks: inferredLocks,
      });
    } else {
      clearLaunchConstraints?.();
    }

    if (ctx.practiceId && ctx.practiceId !== practiceId) {
      queueMicrotask(() => setPracticeId(ctx.practiceId));
      queueMicrotask(() => setHasExpandedOnce(true));
    } else if (ctx.practiceId) {
      queueMicrotask(() => setHasExpandedOnce(true));
    }

    const nextDurationMin = Number(ctx.durationMin);
    if (Number.isFinite(nextDurationMin) && nextDurationMin > 0 && nextDurationMin !== duration) {
      queueMicrotask(() => setDuration(nextDurationMin));
    }

    // Apply practice param overrides.
    if (ctx.overrides?.practiceParams && typeof ctx.overrides.practiceParams === 'object') {
      queueMicrotask(() => mergePracticeParamsPatch(ctx.overrides.practiceParams));
    } else if (ctx.practiceParamsPatch) {
      queueMicrotask(() => mergePracticeParamsPatch(ctx.practiceParamsPatch));
    }

    // Best-effort mapping for common config fields.
    if (ctx.practiceId === 'breath') {
      const breathPattern = ctx.practiceConfig?.breathPattern;
      const stillnessConfig = ctx.practiceConfig?.stillness;
      if (breathPattern && typeof breathPattern === 'string') {
        queueMicrotask(() => setBreathSubmode('breath'));
        queueMicrotask(() => mergePracticeParamsPatch({ breath: { preset: breathPattern.toLowerCase() } }));
      }
      if (stillnessConfig && typeof stillnessConfig === 'object') {
        const normalizedStillnessConfig = normalizeStillnessConfig(stillnessConfig, {
          fallback: persistedStillnessDefaults,
          sharedPreDelaySec: sharedBreathPreDelaySec,
        });
        queueMicrotask(() => {
          setLaunchStillnessConfig(normalizedStillnessConfig);
          setBreathSubmode('stillness');
        });
      } else {
        queueMicrotask(() => setLaunchStillnessConfig(null));
      }
    } else {
      queueMicrotask(() => setLaunchStillnessConfig(null));
    }

    // Handle circuit practice from curriculum.
    if (ctx.practiceId === 'circuit' && ctx.practiceConfig?.circuitId) {
      const circuitDef = getCircuit(ctx.practiceConfig.circuitId);
      if (circuitDef && circuitDef.exercises && circuitDef.exercises.length > 0) {
        const circuitExercises = circuitDef.exercises.map((ex) => ({
          exercise: {
            id: ex.type || ex.id,
            name: ex.name,
            type: ex.type,
            practiceType: ex.practiceType,
            preset: ex.preset,
            sensoryType: ex.sensoryType,
          },
          duration: ex.duration,
        }));
        circuitPendingRef.current = {
          exercises: circuitExercises,
          intervalBreakSec: circuitDef.intervalBreakSec ?? 10,
          circuitId: ctx.practiceConfig.circuitId,
        };
      }
    }

    // Preserve pathContext for session recording (survives clearPracticeLaunchContext).
    if (ctx.pathContext) {
      activePathContextRef.current = ctx.pathContext;
    } else {
      activePathContextRef.current = null;
    }
    activePathLaunchGuidanceRef.current = Object.prototype.hasOwnProperty.call(ctx, 'guidance')
      ? (ctx.guidance ?? null)
      : undefined;
    activePathInstructionVideoRef.current = Object.prototype.hasOwnProperty.call(ctx, 'instructionVideo')
      ? (ctx.instructionVideo ?? null)
      : undefined;

    const shouldAutoStartBreathLaunch =
      ctx.source === 'dailySchedule' &&
      ctx.autoStart === true &&
      ctx.practiceId === 'breath';
    const autoStartRequestId =
      typeof ctx.autoStartRequestId === 'string' && ctx.autoStartRequestId.length > 0
        ? ctx.autoStartRequestId
        : null;
    const expectedDurationSec =
      Number.isFinite(nextDurationMin) && nextDurationMin > 0
        ? Math.round(nextDurationMin * 60)
        : null;
    const expectedBreathSubmode =
      ctx.practiceConfig?.stillness && typeof ctx.practiceConfig.stillness === 'object'
        ? 'stillness'
        : 'breath';
    if (
      shouldAutoStartBreathLaunch &&
      autoStartRequestId &&
      queuedPathAutoStartRequestIdRef.current !== autoStartRequestId &&
      consumedPathAutoStartRequestIdRef.current !== autoStartRequestId
    ) {
      queuedPathAutoStartRequestIdRef.current = autoStartRequestId;
      queueMicrotask(() => {
        setPendingPathAutoStart({
          requestId: autoStartRequestId,
          practiceId: 'breath',
          durationSec: expectedDurationSec,
          breathSubmode: expectedBreathSubmode,
        });
      });
    } else if (!shouldAutoStartBreathLaunch) {
      queueMicrotask(() => setPendingPathAutoStart(null));
    }

    clearPracticeLaunchContext?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    practiceLaunchContext,
    isRunning,
    practiceId,
    duration,
    persistedStillnessDefaults,
    sharedBreathPreDelaySec,
  ]);

  return { sharedBreathPreDelaySec, persistedStillnessDefaults };
}
