import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProgressStore } from './progressStore.js';
import { getDateKey, getWeekStart } from '../utils/dateUtils.js';
import { normalizeStageKey } from '../config/avatarStageAssets.js';
import { DEFAULT_AVATAR_PRESETS, DEFAULT_AVATAR_PRESETS_LIGHT } from '../components/avatarV3/avatarDefaultPresets.js';

export const AVATAR_STAGE_DEFAULTS_PERSIST_KEY = 'immanence-avatar-stage-defaults-v1';
const AVATAR_STAGE_DEFAULTS_PERSIST_VERSION = 6;
export const AVATAR_STAGE_DEFAULT_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];
export const AVATAR_STAGE_DEFAULT_SCHEMES = ['dark', 'light'];
const AVATAR_STAGE_DEFAULT_LAYER_IDS = ['bg', 'stage', 'glass', 'ring'];
const AVATAR_STAGE_DEFAULT_LAYER = Object.freeze({
  enabled: true,
  opacity: 1,
  scale: 1,
  rotateDeg: 0,
  x: 0,
  y: 0,
  linkTo: null,
  linkOpacity: false,
});

const loadAvatarProbeModule = import.meta.env.DEV && import.meta.hot
  ? (() => {
      let probeModulePromise = null;
      return () => {
        probeModulePromise ??= import('../dev/avatarHmrProbes.js');
        return probeModulePromise;
      };
    })()
  : null;

function withAvatarProbe(callback) {
  if (!loadAvatarProbeModule) return;
  loadAvatarProbeModule()
    .then((module) => callback(module))
    .catch(() => {});
}

function logAvatarHmrOwnerProbe(source, event, detail = {}) {
  withAvatarProbe((module) => {
    module.logAvatarHmrProbe('owner', source, event, detail);
  });
}

export function logAvatarHmrDerivationProbe(source, event, detail = {}) {
  withAvatarProbe((module) => {
    module.logAvatarHmrProbe('derivation', source, event, detail);
  });
}

logAvatarHmrOwnerProbe('avatarV3Store', 'module-eval', {
  persistKey: AVATAR_STAGE_DEFAULTS_PERSIST_KEY,
  hasHotData: Boolean(import.meta.hot?.data),
  snapshotStoragePresent:
    typeof window !== 'undefined' ? window.localStorage?.getItem?.(AVATAR_STAGE_DEFAULTS_PERSIST_KEY) != null : null,
});

logAvatarHmrDerivationProbe('avatarV3Store', 'module-eval', {
  persistKey: AVATAR_STAGE_DEFAULTS_PERSIST_KEY,
  hasHotData: Boolean(import.meta.hot?.data),
});

function clampAvatarDefault(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAvatarDefaultLayerId(layerId) {
  if (typeof layerId !== 'string') return null;
  const normalized = layerId.trim().toLowerCase();
  return AVATAR_STAGE_DEFAULT_LAYER_IDS.includes(normalized) ? normalized : null;
}

function sanitizeAvatarDefaultLayerPatch(layerId, patch = {}) {
  const next = {};
  if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled;
  if (typeof patch.opacity === 'number' && Number.isFinite(patch.opacity)) {
    next.opacity = clampAvatarDefault(patch.opacity, 0, 1);
  }
  if (typeof patch.scale === 'number' && Number.isFinite(patch.scale)) {
    next.scale = clampAvatarDefault(patch.scale, 0.5, 2);
  }
  if (typeof patch.rotateDeg === 'number' && Number.isFinite(patch.rotateDeg)) {
    next.rotateDeg = clampAvatarDefault(patch.rotateDeg, -180, 180);
  }
  if (typeof patch.x === 'number' && Number.isFinite(patch.x)) {
    next.x = clampAvatarDefault(patch.x, -100, 100);
  }
  if (typeof patch.y === 'number' && Number.isFinite(patch.y)) {
    next.y = clampAvatarDefault(patch.y, -100, 100);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'linkTo')) {
    const normalizedTarget = normalizeAvatarDefaultLayerId(patch.linkTo);
    next.linkTo = normalizedTarget && normalizedTarget !== layerId ? normalizedTarget : null;
  }
  if (typeof patch.linkOpacity === 'boolean') next.linkOpacity = patch.linkOpacity;
  return next;
}

function normalizeAvatarDefaultScheme(colorScheme = 'dark') {
  return colorScheme === 'light' ? 'light' : 'dark';
}

function getCanonicalAvatarPresetsByScheme(colorScheme = 'dark') {
  return normalizeAvatarDefaultScheme(colorScheme) === 'light'
    ? DEFAULT_AVATAR_PRESETS_LIGHT
    : DEFAULT_AVATAR_PRESETS;
}

export function getCanonicalAvatarStageDefaultTransforms(stageKey, colorScheme = 'dark') {
  const normalizedStage = normalizeStageKey(stageKey);
  const presets = getCanonicalAvatarPresetsByScheme(colorScheme);
  const canonical = presets[normalizedStage] || presets.seedling || {};
  return sanitizeAvatarDefaultStageTransforms(canonical, canonical);
}

export function getAvatarStageDefaultProbeSnapshot(stageKey, colorScheme = 'dark') {
  const normalizedStage = normalizeStageKey(stageKey);
  const scheme = normalizeAvatarDefaultScheme(colorScheme);
  const state = useAvatarStageDefaultsStore.getState();
  return {
    normalizedStage,
    scheme,
    hasHydrated: useAvatarStageDefaultsStore.persist?.hasHydrated?.() ?? null,
    persistedSnapshot: state.snapshotsByScheme?.[scheme]?.[normalizedStage] ?? null,
    canonicalPreset: getCanonicalAvatarStageDefaultTransforms(normalizedStage, scheme),
    resolvedDefault: state.getResolvedStageDefault(normalizedStage, scheme),
  };
}

function sanitizeAvatarDefaultStageTransforms(stageTransforms = {}, canonicalStageTransforms = {}) {
  const source = stageTransforms && typeof stageTransforms === 'object' ? stageTransforms : {};
  const canonical = canonicalStageTransforms && typeof canonicalStageTransforms === 'object'
    ? canonicalStageTransforms
    : {};
  const sanitized = {};
  AVATAR_STAGE_DEFAULT_LAYER_IDS.forEach((layerId) => {
    const canonicalLayerPatch = sanitizeAvatarDefaultLayerPatch(layerId, canonical[layerId]);
    sanitized[layerId] = {
      ...AVATAR_STAGE_DEFAULT_LAYER,
      ...canonicalLayerPatch,
      ...sanitizeAvatarDefaultLayerPatch(layerId, source[layerId]),
    };
  });
  return sanitized;
}

// ─── SNAPSHOT PERSISTENCE HELPERS ───────────────────────────────────────────

function sanitizeStageSnapshot(stageKey, colorScheme, rawLayers) {
  const normalizedStage = normalizeStageKey(stageKey);
  const scheme = normalizeAvatarDefaultScheme(colorScheme);
  const canonical = getCanonicalAvatarStageDefaultTransforms(normalizedStage, scheme);
  return sanitizeAvatarDefaultStageTransforms(rawLayers, canonical);
}

function sanitizeSnapshotsByScheme(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const result = { dark: {}, light: {} };

  AVATAR_STAGE_DEFAULT_SCHEMES.forEach((scheme) => {
    const schemeSource = source[scheme] && typeof source[scheme] === 'object' ? source[scheme] : {};
    Object.entries(schemeSource).forEach(([rawStageKey, stageLayers]) => {
      const stageKey = normalizeStageKey(rawStageKey);
      if (!AVATAR_STAGE_DEFAULT_KEYS.includes(stageKey)) return;
      if (!stageLayers || typeof stageLayers !== 'object') return;
      result[scheme][stageKey] = sanitizeStageSnapshot(stageKey, scheme, stageLayers);
    });
  });

  return result;
}

// PROBE:avatar-scheme-isolation:START
const AVATAR_SCHEME_ISOLATION_PROBE_ENABLED = import.meta.env.DEV;

function logSchemeisolationProbe(event, detail = {}) {
  if (!AVATAR_SCHEME_ISOLATION_PROBE_ENABLED) return;
  console.info('[PROBE:avatar-scheme-isolation]', { event, timestamp: new Date().toISOString(), ...detail });
}
// PROBE:avatar-scheme-isolation:END

function buildDefaultsByStage(snapshotsByScheme) {
  const dark = {};
  const light = {};

  AVATAR_STAGE_DEFAULT_KEYS.forEach((stageKey) => {
    // Deep-clone every stage so defaultsByStage / defaultsByStageLight NEVER
    // share object references with snapshotsByScheme. Without this, any
    // downstream mutation to a layer property (e.g. ring.rotateDeg) would
    // silently corrupt the persisted snapshot and cause cross-scheme drift.
    const darkSource = snapshotsByScheme.dark?.[stageKey];
    dark[stageKey] = darkSource
      ? sanitizeAvatarDefaultStageTransforms(darkSource, getCanonicalAvatarStageDefaultTransforms(stageKey, 'dark'))
      : getCanonicalAvatarStageDefaultTransforms(stageKey, 'dark');

    const lightSource = snapshotsByScheme.light?.[stageKey];
    light[stageKey] = lightSource
      ? sanitizeAvatarDefaultStageTransforms(lightSource, getCanonicalAvatarStageDefaultTransforms(stageKey, 'light'))
      : getCanonicalAvatarStageDefaultTransforms(stageKey, 'light');
  });

  // PROBE:avatar-scheme-isolation:START
  if (AVATAR_SCHEME_ISOLATION_PROBE_ENABLED) {
    const snapshotTopLevelShared = snapshotsByScheme.dark === snapshotsByScheme.light;
    const stageLevelShared = {};
    const layerLevelShared = {};
    AVATAR_STAGE_DEFAULT_KEYS.forEach((stageKey) => {
      stageLevelShared[stageKey] = dark[stageKey] === light[stageKey];
      const layerShare = {};
      AVATAR_STAGE_DEFAULT_LAYER_IDS.forEach((layerId) => {
        layerShare[layerId] = dark[stageKey]?.[layerId] === light[stageKey]?.[layerId];
      });
      layerLevelShared[stageKey] = layerShare;
    });
    const anyStageShared = Object.values(stageLevelShared).some(Boolean);
    const anyLayerShared = Object.values(layerLevelShared).some((l) => Object.values(l).some(Boolean));
    logSchemeisolationProbe('buildDefaultsByStage', {
      snapshotTopLevelShared,
      anyStageShared,
      anyLayerShared,
      stageLevelShared,
      layerLevelShared,
      snapshotDarkKeys: Object.keys(snapshotsByScheme.dark || {}),
      snapshotLightKeys: Object.keys(snapshotsByScheme.light || {}),
    });
    if (snapshotTopLevelShared || anyStageShared || anyLayerShared) {
      console.error(
        '[PROBE:avatar-scheme-isolation] CONTAMINATION DETECTED in buildDefaultsByStage — ' +
        'dark and light share object references. See detail above.'
      );
    }
  }
  // PROBE:avatar-scheme-isolation:END

  return { defaultsByStage: dark, defaultsByStageLight: light };
}

// ─── STORE ──────────────────────────────────────────────────────────────────

const INITIAL_SNAPSHOTS = { dark: {}, light: {} };

export const useAvatarStageDefaultsStore = create(
  persist((set, get) => ({
    snapshotsByScheme: INITIAL_SNAPSHOTS,
    ...buildDefaultsByStage(INITIAL_SNAPSHOTS),

    getResolvedStageDefault: (stageKey, colorScheme = 'dark') => {
      const normalizedStage = normalizeStageKey(stageKey);
      const scheme = normalizeAvatarDefaultScheme(colorScheme);
      const state = get();
      const byScheme = scheme === 'light' ? state.defaultsByStageLight : state.defaultsByStage;
      const resolved = byScheme[normalizedStage] || byScheme.seedling;
      return sanitizeAvatarDefaultStageTransforms(
        resolved,
        getCanonicalAvatarStageDefaultTransforms(normalizedStage, scheme)
      );
    },

    getResolvedRoleDefault: (stageKey, layerId, colorScheme = 'dark') => {
      const normalizedLayerId = normalizeAvatarDefaultLayerId(layerId) || AVATAR_STAGE_DEFAULT_LAYER_IDS[0];
      const stageDefaults = get().getResolvedStageDefault(stageKey, colorScheme);
      return {
        ...AVATAR_STAGE_DEFAULT_LAYER,
        ...sanitizeAvatarDefaultLayerPatch(normalizedLayerId, stageDefaults[normalizedLayerId]),
      };
    },

    setStageDefault: (stageKey, stageTransforms, colorScheme = 'dark') =>
      set((state) => {
        const normalizedStage = normalizeStageKey(stageKey);
        const scheme = normalizeAvatarDefaultScheme(colorScheme);
        const oppositeScheme = scheme === 'dark' ? 'light' : 'dark';
        const snapshot = sanitizeStageSnapshot(normalizedStage, scheme, stageTransforms);

        // PROBE:avatar-scheme-isolation:START
        const beforeOtherSchemeSnapshot = state.snapshotsByScheme?.[oppositeScheme]?.[normalizedStage]
          ? JSON.stringify(state.snapshotsByScheme[oppositeScheme][normalizedStage])
          : null;
        const beforeThisSchemeSnapshot = state.snapshotsByScheme?.[scheme]?.[normalizedStage]
          ? JSON.stringify(state.snapshotsByScheme[scheme][normalizedStage])
          : null;
        const snapshotBranchesSharedBefore =
          state.snapshotsByScheme?.dark === state.snapshotsByScheme?.light;
        const stageBranchSharedBefore =
          state.snapshotsByScheme?.dark?.[normalizedStage] ===
          state.snapshotsByScheme?.light?.[normalizedStage];
        // PROBE:avatar-scheme-isolation:END

        const nextSnapshotsByScheme = {
          ...state.snapshotsByScheme,
          [scheme]: {
            ...state.snapshotsByScheme[scheme],
            [normalizedStage]: snapshot,
          },
        };

        const nextState = {
          ...state,
          snapshotsByScheme: nextSnapshotsByScheme,
          ...buildDefaultsByStage(nextSnapshotsByScheme),
        };

        // PROBE:avatar-scheme-isolation:START
        if (AVATAR_SCHEME_ISOLATION_PROBE_ENABLED) {
          const afterOtherSchemeSnapshot = nextState.snapshotsByScheme?.[oppositeScheme]?.[normalizedStage]
            ? JSON.stringify(nextState.snapshotsByScheme[oppositeScheme][normalizedStage])
            : null;
          const afterThisSchemeSnapshot = nextState.snapshotsByScheme?.[scheme]?.[normalizedStage]
            ? JSON.stringify(nextState.snapshotsByScheme[scheme][normalizedStage])
            : null;
          const otherSchemeChanged = beforeOtherSchemeSnapshot !== afterOtherSchemeSnapshot;
          const snapshotBranchesSharedAfter =
            nextState.snapshotsByScheme?.dark === nextState.snapshotsByScheme?.light;
          const stageBranchSharedAfter =
            nextState.snapshotsByScheme?.dark?.[normalizedStage] ===
            nextState.snapshotsByScheme?.light?.[normalizedStage];
          logSchemeisolationProbe('setStageDefault', {
            writingScheme: scheme,
            oppositeScheme,
            stageKey: normalizedStage,
            snapshotBranchesSharedBefore,
            snapshotBranchesSharedAfter,
            stageBranchSharedBefore,
            stageBranchSharedAfter,
            otherSchemeChanged,
            beforeThisSchemeSnapshot: beforeThisSchemeSnapshot ? JSON.parse(beforeThisSchemeSnapshot) : null,
            afterThisSchemeSnapshot: afterThisSchemeSnapshot ? JSON.parse(afterThisSchemeSnapshot) : null,
            beforeOtherSchemeSnapshot: beforeOtherSchemeSnapshot ? JSON.parse(beforeOtherSchemeSnapshot) : null,
            afterOtherSchemeSnapshot: afterOtherSchemeSnapshot ? JSON.parse(afterOtherSchemeSnapshot) : null,
          });
          if (otherSchemeChanged) {
            console.error(
              `[PROBE:avatar-scheme-isolation] CONTAMINATION: writing ${scheme}/${normalizedStage} ` +
              `unexpectedly changed ${oppositeScheme}/${normalizedStage}. ` +
              `Before: ${beforeOtherSchemeSnapshot} | After: ${afterOtherSchemeSnapshot}`
            );
          }
          if (snapshotBranchesSharedAfter || stageBranchSharedAfter) {
            console.error(
              `[PROBE:avatar-scheme-isolation] SHARED REF after write: ` +
              `snapshotBranchesSharedAfter=${snapshotBranchesSharedAfter}, ` +
              `stageBranchSharedAfter=${stageBranchSharedAfter}`
            );
          }
        }
        // PROBE:avatar-scheme-isolation:END

        // PROBE:avatar-rotation-space:START
        // Store values are coordinate-space neutral — x/y are stored and retrieved as plain
        // canonical numbers with no rotation-aware compensation. The coordinate meaning
        // (translate-first = parent-space) is enforced at the render boundary in
        // AvatarComposite.getDevStyleForLayer: transform = translate(x,y) rotate(deg) scale(s).
        // Writing x=10 here stores exactly 10 — no axis rotation is applied to the value.
        if (AVATAR_SCHEME_ISOLATION_PROBE_ENABLED) {
          logSchemeisolationProbe('setStageDefault-rotation-space', {
            stageKey: normalizedStage,
            writingScheme: scheme,
            rawXValues: Object.fromEntries(
              Object.entries(snapshot).map(([layerId, layer]) => [layerId, { x: layer.x, y: layer.y, rotateDeg: layer.rotateDeg }])
            ),
            finding: 'x/y stored as raw canonical numbers — no coordinate-space conversion',
          });
        }
        // PROBE:avatar-rotation-space:END

        return nextState;
      }),

    resetAllToCanonical: () =>
      set((state) => {
        const empty = { dark: {}, light: {} };
        return {
          ...state,
          snapshotsByScheme: empty,
          ...buildDefaultsByStage(empty),
        };
      }),
  }), {
    name: AVATAR_STAGE_DEFAULTS_PERSIST_KEY,
    version: AVATAR_STAGE_DEFAULTS_PERSIST_VERSION,
    partialize: (state) => ({
      snapshotsByScheme: state.snapshotsByScheme,
    }),
    migrate: (persistedState, version) => {
      // v6: force clean reset — data saved under v5 and earlier was
      // affected by reference-sharing and broken-persist bugs, so the
      // stored values are unreliable. A fresh start with canonical
      // presets is the safest path.
      if (typeof version === 'number' && version < 6) {
        return { snapshotsByScheme: { dark: {}, light: {} } };
      }

      // v6+ data: pass through (merge will sanitize).
      if (!persistedState || typeof persistedState !== 'object') {
        return { snapshotsByScheme: { dark: {}, light: {} } };
      }
      return persistedState;
    },
    merge: (persisted, current) => {
      const raw = persisted && typeof persisted === 'object' ? persisted : {};
      const nextSnapshotsByScheme = sanitizeSnapshotsByScheme(raw.snapshotsByScheme);
      logAvatarHmrOwnerProbe('avatarV3Store', 'persist-merge', {
        persistedSnapshotCount:
          Object.keys(nextSnapshotsByScheme.dark || {}).length +
          Object.keys(nextSnapshotsByScheme.light || {}).length,
      });
      return {
        ...current,
        snapshotsByScheme: nextSnapshotsByScheme,
        ...buildDefaultsByStage(nextSnapshotsByScheme),
      };
    },
    onRehydrateStorage: () => {
      logAvatarHmrOwnerProbe('avatarV3Store', 'persist-rehydrate-start', {
        snapshotStoragePresent:
          typeof window !== 'undefined'
            ? window.localStorage?.getItem?.(AVATAR_STAGE_DEFAULTS_PERSIST_KEY) != null
            : null,
      });
      return (state) => {
        const snapshots = state?.snapshotsByScheme;
        const hasSnapshots = Boolean(
          snapshots &&
          (Object.keys(snapshots.dark || {}).length > 0 || Object.keys(snapshots.light || {}).length > 0)
        );
        let forcedWriteback = false;

        logAvatarHmrOwnerProbe('avatarV3Store', 'persist-rehydrate-finish', {
          hasSnapshots,
          hasHydrated: useAvatarStageDefaultsStore.persist?.hasHydrated?.() ?? null,
          snapshotStoragePresent:
            typeof window !== 'undefined'
              ? window.localStorage?.getItem?.(AVATAR_STAGE_DEFAULTS_PERSIST_KEY) != null
              : null,
        });

        // After rehydration, verify the store wrote back to localStorage.
        // Zustand persist only writes on set() — if hydration produced the same
        // state as initial, the key might never be written. Force a write-back
        // so the persist key is always present and future reloads work.
        if (state && hasSnapshots) {
          // Trigger a no-op set to force persist to write
          useAvatarStageDefaultsStore.setState({});
          forcedWriteback = true;
        }

        logAvatarHmrOwnerProbe('avatarV3Store', 'persist-post-rehydrate-writeback', {
          forcedWriteback,
          hasHydrated: useAvatarStageDefaultsStore.persist?.hasHydrated?.() ?? null,
        });
      };
    },
  })
);

// ─── DEV-MODE COMMITTED-STATE WATCHPOINT ────────────────────────────────────
// Fires whenever snapshotsByScheme (the source of truth for committed avatar
// defaults) changes. Logs a full per-field diff and a stack trace so we can
// identify EVERY caller that mutates committed stage data.
//
// Usage:
//   - Filter DevTools console for "[AvatarDefaults]" to see every committed
//     change with its full before/after diff and source stack trace.
//   - After promoting a stage, call avatarWatchpointLockStage(stageKey, scheme,
//     snapshot) to mark it as "locked." Any subsequent change to that stage
//     will fire a red ⚠️ ERROR log with the stack trace of the culprit.
// ─────────────────────────────────────────────────────────────────────────────
let _watchLockedSnapshots = {}; // `${scheme}/${stageKey}` → JSON string

/**
 * Mark a promoted stage as locked so the watchpoint will loudly flag any
 * subsequent mutation. No-op in production builds.
 */
export function avatarWatchpointLockStage(stageKey, colorScheme, snapshotData) {
  if (!import.meta.env.DEV) return;
  const key = `${colorScheme}/${stageKey}`;
  _watchLockedSnapshots[key] = JSON.stringify(snapshotData ?? null);
}

if (import.meta.env.DEV) {
  let _watchPrevSnapshots = useAvatarStageDefaultsStore.getState().snapshotsByScheme;

  useAvatarStageDefaultsStore.subscribe((state) => {
    const nextSnapshots = state.snapshotsByScheme;
    if (nextSnapshots === _watchPrevSnapshots) return;

    const prev = _watchPrevSnapshots;
    _watchPrevSnapshots = nextSnapshots;

    ['dark', 'light'].forEach((scheme) => {
      const prevScheme = prev?.[scheme] || {};
      const nextScheme = nextSnapshots?.[scheme] || {};
      const stageKeys = new Set([
        ...Object.keys(prevScheme),
        ...Object.keys(nextScheme),
        ...AVATAR_STAGE_DEFAULT_KEYS,
      ]);

      stageKeys.forEach((stageKey) => {
        const prevVal = JSON.stringify(prevScheme[stageKey] ?? null);
        const nextVal = JSON.stringify(nextScheme[stageKey] ?? null);
        if (prevVal === nextVal) return;

        const lockKey = `${scheme}/${stageKey}`;
        const isLocked = Object.prototype.hasOwnProperty.call(_watchLockedSnapshots, lockKey);
        const lockedVal = _watchLockedSnapshots[lockKey];

        if (isLocked) {
          console.group(
            `%c[AvatarDefaults] ⚠️ LOCKED STAGE MUTATED: ${scheme}/${stageKey}`,
            'color: red; font-weight: bold; font-size: 13px',
          );
          console.error(
            'This stage was promoted and locked. Its snapshot changed unexpectedly.\n' +
            `Locked value was: ${lockedVal}\nNew value is:    ${nextVal}`,
          );
        } else {
          console.group(
            `%c[AvatarDefaults] committed change: ${scheme}/${stageKey}`,
            'color: orange; font-weight: bold',
          );
          if (import.meta.env.DEV) {
            console.log('Before:', JSON.parse(prevVal));
          }
          if (import.meta.env.DEV) {
            console.log('After: ', JSON.parse(nextVal));
          }
        }
        console.trace('Source (the set() call is a few frames above this line)');
        console.groupEnd();
      });
    });
  });
}
// ─────────────────────────────────────────────────────────────────────────────

const MODE_WINDOW_DAYS = 42;
const CADENCE_WINDOW_WEEKS = 26;
const MIN_QUALIFYING_MINUTES = 3;
const MIN_SESSIONS_PER_WEEK = 3;

// ═══════════════════════════════════════════════════════════════════════════
// STAGE COMPUTATION — PLACEHOLDER LOGIC
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ WARNING: This is structural scaffolding, NOT final logic.
//
// Final implementation MUST enforce:
//   1. Cadence-based consistency (e.g., "3+ sessions/week for N weeks")
//   2. Foundation criteria per session (minimum duration, completion)
//   3. Regression when cadence drops below threshold
//
// Current logic uses simplified cadence + duration filters.
// DO NOT ship to production without rigorous prerequisite definitions.
//
// ═══════════════════════════════════════════════════════════════════════════
const STAGE_PREREQUISITES = {
  seedling: { minQualifyingSessions: 0, minCadenceWeeks: 0 },
  ember: { minQualifyingSessions: 7, minCadenceWeeks: 2 },
  flame: { minQualifyingSessions: 30, minCadenceWeeks: 4 },
  beacon: { minQualifyingSessions: 90, minCadenceWeeks: 12 },
  stellar: { minQualifyingSessions: 180, minCadenceWeeks: 26 },
};

const BREATH_PRESET_TO_MODE = {
  box: 'haptic',
  '4-7-8': 'haptic',
  kumbhaka: 'ritual',
  relax: 'haptic',
  energy: 'haptic',
  resonance: 'sonic',
  humming: 'sonic',
  toning: 'sonic',
  pranayama: 'ritual',
  'nadi shodhana': 'ritual',
  kapalabhati: 'ritual',
};

const PRACTICE_ID_TO_MODE = {
  photic: 'photic',
  visualization: 'photic',
  perception: 'photic',

  sound: 'sonic',
  cymatics: 'sonic',
  resonance: 'sonic',

  ritual: 'ritual',
  integration: 'ritual',
  circuit: 'ritual',
  'circuit-training': 'ritual',

  somatic_vipassana: 'haptic',
  cognitive_vipassana: 'haptic',
  feeling: 'haptic',
  awareness: 'haptic',
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const normalizeWeights = (weights) => {
  const photic = clamp01(weights.photic || 0);
  const haptic = clamp01(weights.haptic || 0);
  const sonic = clamp01(weights.sonic || 0);
  const ritual = clamp01(weights.ritual || 0);
  const total = photic + haptic + sonic + ritual;
  if (!total) {
    return { photic: 0.25, haptic: 0.25, sonic: 0.25, ritual: 0.25 };
  }
  return {
    photic: photic / total,
    haptic: haptic / total,
    sonic: sonic / total,
    ritual: ritual / total,
  };
};

const resolveSessionTimestamp = (session) => {
  const raw =
    session?.endedAt ||
    session?.startedAt ||
    session?.date ||
    (session?.dateKey ? `${session.dateKey}T00:00:00` : null);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveSessionDurationMinutes = (session) => {
  if (typeof session?.durationSec === 'number') {
    return session.durationSec / 60;
  }
  if (typeof session?.duration === 'number') {
    return session.duration;
  }
  if (typeof session?.durationMinutes === 'number') {
    return session.durationMinutes;
  }
  return 0;
};

const resolveBreathMode = (session) => {
  const preset =
    session?.configSnapshot?.breathPreset ||
    session?.metadata?.breathPreset ||
    session?.metadata?.subType ||
    null;
  if (typeof preset !== 'string') return 'haptic';
  const key = preset.trim().toLowerCase();
  return BREATH_PRESET_TO_MODE[key] || 'haptic';
};

const resolveModeFromSession = (session) => {
  const practiceId = session?.practiceId ? String(session.practiceId).toLowerCase() : '';
  const domain = session?.domain ? String(session.domain).toLowerCase() : '';

  if (practiceId.includes('breath') || domain === 'breathwork') {
    return resolveBreathMode(session);
  }

  if (PRACTICE_ID_TO_MODE[practiceId]) {
    return PRACTICE_ID_TO_MODE[practiceId];
  }

  if (domain === 'visualization') return 'photic';
  if (domain === 'sound') return 'sonic';
  if (domain === 'ritual') return 'ritual';

  return 'haptic';
};

const normalizeSessions = (sessionsV2 = [], legacySessions = []) => {
  const normalizedV2 = sessionsV2.map((session) => ({
    id: session.id,
    practiceId: session.practiceId || null,
    practiceMode: session.practiceMode || null,
    configSnapshot: session.configSnapshot || {},
    completion: session.completion || null,
    durationMinutes: resolveSessionDurationMinutes(session),
    timestamp: resolveSessionTimestamp(session),
    domain: session.domain || null,
    metadata: session.metadata || null,
  }));

  const normalizedLegacy = legacySessions.map((session) => ({
    id: session.id || null,
    practiceId: session.practiceId || null,
    practiceMode: session.practiceMode || null,
    configSnapshot: session.configSnapshot || {},
    completion: session.completion || null,
    durationMinutes: resolveSessionDurationMinutes(session),
    timestamp: resolveSessionTimestamp(session),
    domain: session.domain || null,
    metadata: session.metadata || null,
  }));

  return [...normalizedV2, ...normalizedLegacy].filter((session) => session.timestamp);
};

const computeCadenceWeeks = (sessions) => {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - CADENCE_WINDOW_WEEKS * 7);

  const weeklyCounts = new Map();

  sessions.forEach((session) => {
    const date = session.timestamp;
    if (!date || date < windowStart) return;
    const weekStart = getWeekStart(date);
    const weekKey = getDateKey(weekStart);
    weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) || 0) + 1);
  });

  let cadenceWeeks = 0;
  weeklyCounts.forEach((count) => {
    if (count >= MIN_SESSIONS_PER_WEEK) cadenceWeeks += 1;
  });

  return cadenceWeeks;
};

const computeStage = ({ qualifyingSessions, cadenceWeeks }) => {
  const stages = ['stellar', 'beacon', 'flame', 'ember', 'seedling'];
  for (const stage of stages) {
    const req = STAGE_PREREQUISITES[stage];
    if (qualifyingSessions >= req.minQualifyingSessions && cadenceWeeks >= req.minCadenceWeeks) {
      return stage;
    }
  }
  return 'seedling';
};

const computeModeWeights = (sessions) => {
  const cutoff = Date.now() - MODE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const counts = { photic: 0, haptic: 0, sonic: 0, ritual: 0 };

  sessions.forEach((session) => {
    const timestamp = session.timestamp?.getTime?.() || 0;
    if (!timestamp || timestamp < cutoff) return;

    const mode = resolveModeFromSession(session);
    const duration = Math.max(1, session.durationMinutes || 1);
    counts[mode] += duration;
  });

  return normalizeWeights(counts);
};

const getLatestCompletionTimestamp = (sessions) => {
  const completed = sessions
    .filter((session) => session.completion === 'completed')
    .map((session) => session.timestamp?.getTime?.() || 0)
    .filter(Boolean)
    .sort((a, b) => a - b);

  return completed.length ? completed[completed.length - 1] : null;
};

const isQualifyingSession = (session) => {
  const durationOk = (session.durationMinutes || 0) >= MIN_QUALIFYING_MINUTES;
  const completed = session.completion ? session.completion === 'completed' : true;
  return durationOk && completed;
};

export function useAvatarV3State() {
  const sessionsV2 = useProgressStore((s) => s.sessionsV2 || []);
  const legacySessions = useProgressStore((s) => s.sessions || []);

  const sessions = useMemo(
    () => normalizeSessions(sessionsV2, legacySessions),
    [sessionsV2, legacySessions]
  );

  const qualifyingSessions = useMemo(
    () => sessions.filter(isQualifyingSession).length,
    [sessions]
  );

  const cadenceWeeks = useMemo(() => computeCadenceWeeks(sessions), [sessions]);
  const stage = useMemo(
    () => computeStage({ qualifyingSessions, cadenceWeeks }),
    [qualifyingSessions, cadenceWeeks]
  );

  const modeWeights = useMemo(() => computeModeWeights(sessions), [sessions]);

  const [lastStageChange, setLastStageChange] = useState(null);
  const [lastModeChange, setLastModeChange] = useState(null);
  const [lastSessionComplete, setLastSessionComplete] = useState(null);

  const stageRef = useRef(stage);
  const weightsRef = useRef(modeWeights);
  const completionRef = useRef(null);

  useEffect(() => {
    if (stageRef.current !== stage) {
      stageRef.current = stage;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- time marker for stage transitions
      setLastStageChange(Date.now());
    }
  }, [stage]);

  useEffect(() => {
    const weightsChanged = Object.keys(modeWeights).some(
      (key) => Math.abs(modeWeights[key] - (weightsRef.current?.[key] ?? 0)) > 0.001
    );
    if (weightsChanged) {
      weightsRef.current = modeWeights;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- time marker for mode weight updates
      setLastModeChange(Date.now());
    }
  }, [modeWeights]);

  useEffect(() => {
    const latestCompletion = getLatestCompletionTimestamp(sessions);
    if (latestCompletion && completionRef.current !== latestCompletion) {
      completionRef.current = latestCompletion;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- time marker for latest completion
      setLastSessionComplete(latestCompletion);
    }
  }, [sessions]);

  return {
    stage,
    modeWeights,
    qualifyingSessions,
    cadenceWeeks,
    lastStageChange,
    lastModeChange,
    lastSessionComplete,
  };
}
