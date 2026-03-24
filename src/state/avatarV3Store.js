import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProgressStore } from './progressStore.js';
import { getDateKey, getWeekStart } from '../utils/dateUtils.js';
import { normalizeStageKey } from '../config/avatarStageAssets.js';
import { DEFAULT_AVATAR_PRESETS, DEFAULT_AVATAR_PRESETS_LIGHT } from '../components/avatarV3/avatarDefaultPresets.js';

export const AVATAR_STAGE_DEFAULTS_PERSIST_KEY = 'immanence-avatar-stage-defaults-v1';
const AVATAR_STAGE_DEFAULTS_PERSIST_VERSION = 3;
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
const EMPTY_AVATAR_DEFAULTS_BY_SCHEME = Object.freeze({ dark: {}, light: {} });

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

function cloneResolvedAvatarStageDefault(stageKey, colorScheme = 'dark', stageTransforms = null) {
  const normalizedStage = normalizeStageKey(stageKey);
  const sourceStageTransforms =
    stageTransforms && typeof stageTransforms === 'object'
      ? stageTransforms
      : getCanonicalAvatarStageDefaultTransforms(normalizedStage, colorScheme);
  return sanitizeAvatarDefaultStageTransforms(
    sourceStageTransforms,
    getCanonicalAvatarStageDefaultTransforms(normalizedStage, colorScheme)
  );
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

function getBaseAvatarDefaultStageTransforms(stageKey) {
  return getCanonicalAvatarStageDefaultTransforms(stageKey, 'dark');
}

export function sanitizeAvatarStageDefaultsByStage(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const next = {};

  Object.entries(source).forEach(([rawStageKey, stageTransforms]) => {
    const stageKey = normalizeStageKey(rawStageKey);
    next[stageKey] = sanitizeAvatarDefaultStageTransforms(
      stageTransforms,
      getCanonicalAvatarStageDefaultTransforms(stageKey, 'dark')
    );
  });

  AVATAR_STAGE_DEFAULT_KEYS.forEach((stageKey) => {
    if (!next[stageKey]) {
      next[stageKey] = getBaseAvatarDefaultStageTransforms(stageKey);
    }
  });

  return next;
}

function sanitizeAvatarStageOverridesByStage(input = {}, colorScheme = 'dark', options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const sanitized = {};
  const stripDarkLegacyX =
    Boolean(options.stripDarkLegacyX) && normalizeAvatarDefaultScheme(colorScheme) === 'dark';

  Object.entries(source).forEach(([rawStageKey, stageLayerOverrides]) => {
    const stageKey = normalizeStageKey(rawStageKey);
    const nextStage = {};
    const layerSource =
      stageLayerOverrides && typeof stageLayerOverrides === 'object' ? stageLayerOverrides : {};

    AVATAR_STAGE_DEFAULT_LAYER_IDS.forEach((layerId) => {
      const rawPatch =
        layerSource[layerId] && typeof layerSource[layerId] === 'object' ? layerSource[layerId] : null;
      if (!rawPatch) return;

      const sanitizedPatch = sanitizeAvatarDefaultLayerPatch(layerId, rawPatch);
      if (stripDarkLegacyX && Object.prototype.hasOwnProperty.call(sanitizedPatch, 'x')) {
        delete sanitizedPatch.x;
      }

      if (Object.keys(sanitizedPatch).length) {
        nextStage[layerId] = sanitizedPatch;
      }
    });

    if (Object.keys(nextStage).length) {
      sanitized[stageKey] = nextStage;
    }
  });

  return sanitized;
}

function sanitizeAvatarOverridesByScheme(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const hasSchemeShape = AVATAR_STAGE_DEFAULT_SCHEMES.some(
    (scheme) => source[scheme] && typeof source[scheme] === 'object'
  );

  if (hasSchemeShape) {
    return {
      dark: sanitizeAvatarStageOverridesByStage(source.dark || {}, 'dark', options),
      light: sanitizeAvatarStageOverridesByStage(source.light || {}, 'light', options),
    };
  }

  // Legacy shape support: treat as dark-scheme stage map.
  return {
    dark: sanitizeAvatarStageOverridesByStage(source, 'dark', options),
    light: {},
  };
}

function buildResolvedAvatarStageDefaultsByStage(overridesByScheme, colorScheme = 'dark') {
  const scheme = normalizeAvatarDefaultScheme(colorScheme);
  const resolved = {};
  const stageOverridesByScheme = overridesByScheme?.[scheme] || {};

  AVATAR_STAGE_DEFAULT_KEYS.forEach((stageKey) => {
    const canonicalStage = getCanonicalAvatarStageDefaultTransforms(stageKey, scheme);
    const stageOverrides = stageOverridesByScheme[stageKey] || {};
    resolved[stageKey] = sanitizeAvatarDefaultStageTransforms(stageOverrides, canonicalStage);
  });

  return resolved;
}

function buildAvatarDefaultsState(overridesByScheme = EMPTY_AVATAR_DEFAULTS_BY_SCHEME) {
  const normalizedOverridesByScheme = sanitizeAvatarOverridesByScheme(overridesByScheme);
  return {
    overridesByScheme: normalizedOverridesByScheme,
    defaultsByStage: buildResolvedAvatarStageDefaultsByStage(normalizedOverridesByScheme, 'dark'),
    defaultsByStageLight: buildResolvedAvatarStageDefaultsByStage(normalizedOverridesByScheme, 'light'),
  };
}

function sanitizePersistedAvatarStageDefaultsState(persistedState, version = 0) {
  const source = persistedState && typeof persistedState === 'object' ? persistedState : {};
  const persistedOverrides =
    source.overridesByScheme && typeof source.overridesByScheme === 'object'
      ? source.overridesByScheme
      : source.defaultsByStage && typeof source.defaultsByStage === 'object'
        ? { dark: source.defaultsByStage }
        : source;

  const stripDarkLegacyX = version < AVATAR_STAGE_DEFAULTS_PERSIST_VERSION;
  return sanitizeAvatarOverridesByScheme(persistedOverrides, { stripDarkLegacyX });
}

export const useAvatarStageDefaultsStore = create(
  persist((set, get) => ({
    ...buildAvatarDefaultsState(),

    getResolvedStageDefault: (stageKey, colorScheme = 'dark') => {
      const normalizedStage = normalizeStageKey(stageKey);
      const scheme = normalizeAvatarDefaultScheme(colorScheme);
      const state = get();
      const byScheme = scheme === 'light' ? state.defaultsByStageLight : state.defaultsByStage;
      return cloneResolvedAvatarStageDefault(
        normalizedStage,
        scheme,
        byScheme[normalizedStage] || byScheme.seedling
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

    ensureStageDefault: (stageKey) => {
      const normalizedStage = normalizeStageKey(stageKey);
      const state = get();
      if (state.defaultsByStage?.[normalizedStage]) return;

      set((current) => {
        const currentOverrides = current.overridesByScheme || EMPTY_AVATAR_DEFAULTS_BY_SCHEME;
        const nextOverrides = {
          ...currentOverrides,
          dark: {
            ...(currentOverrides.dark || {}),
            [normalizedStage]: currentOverrides.dark?.[normalizedStage] || {},
          },
        };
        return {
          ...current,
          ...buildAvatarDefaultsState(nextOverrides),
        };
      });
    },

    setStageDefault: (stageKey, stageTransforms, colorScheme = 'dark') =>
      set((state) => {
        const normalizedStage = normalizeStageKey(stageKey);
        const scheme = normalizeAvatarDefaultScheme(colorScheme);
        const canonicalStage = getCanonicalAvatarStageDefaultTransforms(normalizedStage, scheme);
        const nextStage = sanitizeAvatarDefaultStageTransforms(stageTransforms, canonicalStage);
        const nextStageOverrides = {};

        AVATAR_STAGE_DEFAULT_LAYER_IDS.forEach((layerId) => {
          const canonicalLayer = canonicalStage[layerId] || AVATAR_STAGE_DEFAULT_LAYER;
          const nextLayer = nextStage[layerId] || canonicalLayer;
          const layerPatch = {};

          Object.keys(nextLayer).forEach((key) => {
            if (nextLayer[key] !== canonicalLayer[key]) {
              layerPatch[key] = nextLayer[key];
            }
          });

          if (Object.keys(layerPatch).length) {
            nextStageOverrides[layerId] = layerPatch;
          }
        });

        const currentOverrides = state.overridesByScheme || EMPTY_AVATAR_DEFAULTS_BY_SCHEME;
        const nextSchemeOverrides = {
          ...(currentOverrides[scheme] || {}),
          [normalizedStage]: nextStageOverrides,
        };

        if (!Object.keys(nextStageOverrides).length) {
          delete nextSchemeOverrides[normalizedStage];
        }

        const nextOverrides = {
          ...currentOverrides,
          [scheme]: nextSchemeOverrides,
        };

        return {
          ...state,
          ...buildAvatarDefaultsState(nextOverrides),
        };
      }),

    replaceAllStageDefaults: (defaultsByStage, colorScheme = 'dark') =>
      set((state) => ({
        ...state,
        ...buildAvatarDefaultsState({
          ...(state.overridesByScheme || EMPTY_AVATAR_DEFAULTS_BY_SCHEME),
          [normalizeAvatarDefaultScheme(colorScheme)]: sanitizeAvatarStageOverridesByStage(
            defaultsByStage,
            colorScheme
          ),
        }),
      })),

    replaceAllSchemeOverrides: (overridesByScheme) =>
      set((state) => ({
        ...state,
        ...buildAvatarDefaultsState(overridesByScheme),
      })),
  }), {
    name: AVATAR_STAGE_DEFAULTS_PERSIST_KEY,
    version: AVATAR_STAGE_DEFAULTS_PERSIST_VERSION,
    partialize: (state) => ({
      overridesByScheme: state.overridesByScheme,
    }),
    migrate: () => ({
      overridesByScheme: { dark: {}, light: {} },
    }),
    merge: (persisted, current) => {
      const persistedOverrides = sanitizePersistedAvatarStageDefaultsState(
        persisted,
        AVATAR_STAGE_DEFAULTS_PERSIST_VERSION
      );
      const currentOverrides = current?.overridesByScheme || EMPTY_AVATAR_DEFAULTS_BY_SCHEME;
      return {
        ...current,
        ...buildAvatarDefaultsState({
          dark: {
            ...(currentOverrides.dark || {}),
            ...(persistedOverrides.dark || {}),
          },
          light: {
            ...(currentOverrides.light || {}),
            ...(persistedOverrides.light || {}),
          },
        }),
      };
    },
  })
);

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
