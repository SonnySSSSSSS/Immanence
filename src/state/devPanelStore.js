import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeStageKey } from '../config/avatarStageAssets.js';
import { getCanonicalAvatarStageDefaultTransforms } from './avatarV3Store.js';

export const DEV_PANEL_PERSIST_KEY = 'immanence-dev-panel';
export const AVATAR_COMPOSITE_LAYER_IDS = ['bg', 'stage', 'glass', 'ring'];
export const AVATAR_COMPOSITE_STAGE_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

const IS_DEV_BUILD = Boolean(import.meta?.env?.DEV);

// Production safety: devpanel tuning must not be able to "stick" across deploys via localStorage.
// Remove any stale persisted state so shipped defaults are always authoritative.
if (!IS_DEV_BUILD && typeof window !== 'undefined') {
  try {
    window.localStorage?.removeItem?.(DEV_PANEL_PERSIST_KEY);
  } catch {
    // Ignore storage failures (privacy mode, denied access, etc.)
  }
}

const DEFAULT_LAYER = Object.freeze({
  enabled: true,
  opacity: 1,
  scale: 1,
  rotateDeg: 0,
  x: 0,
  y: 0,
  linkTo: null,
  linkOpacity: false,
});

const DEFAULT_ROLE_RESET = {
  enabled: true,
  opacity: 1,
  scale: 1,
  rotateDeg: 0,
  x: 0,
  y: 0,
  linkTo: null,
  linkOpacity: false,
};

function createDefaultLayer() {
  return { ...DEFAULT_LAYER };
}

function createDefaultStageTransforms(stageKey = 'seedling', colorScheme = 'dark') {
  const normalizedStageKey = normalizeStageId(stageKey);
  return sanitizeStageTransforms(getCanonicalAvatarStageDefaultTransforms(normalizedStageKey, colorScheme));
}

function createDefaultTransformsByStage(colorScheme = 'dark') {
  const next = {};
  AVATAR_COMPOSITE_STAGE_KEYS.forEach((stageKey) => {
    next[stageKey] = createDefaultStageTransforms(stageKey, colorScheme);
  });
  return next;
}

function createDefaultAvatarComposite() {
  return {
    enabled: true,
    previewDraft: false,
    showDebugOverlay: false,
    transformsByStage: createDefaultTransformsByStage('dark'),
    transformsByStageLight: createDefaultTransformsByStage('light'),
  };
}

const DEFAULT_AVATAR_COMPOSITE = Object.freeze(createDefaultAvatarComposite());

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLayerId(layerId) {
  if (typeof layerId !== 'string') return null;
  const normalized = layerId.trim().toLowerCase();
  return AVATAR_COMPOSITE_LAYER_IDS.includes(normalized) ? normalized : null;
}

function normalizeStageId(stageKey) {
  const normalized = normalizeStageKey(stageKey);
  return AVATAR_COMPOSITE_STAGE_KEYS.includes(normalized) ? normalized : 'seedling';
}

function normalizeLinkTarget(layerId, linkTo) {
  const normalizedLayerId = normalizeLayerId(layerId);
  const normalizedTarget = normalizeLayerId(linkTo);
  if (!normalizedLayerId || !normalizedTarget || normalizedLayerId === normalizedTarget) return null;
  return normalizedTarget;
}

function sanitizeRolePatch(layerId, patch = {}) {
  const next = {};
  if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled;
  if (typeof patch.opacity === 'number' && Number.isFinite(patch.opacity)) next.opacity = clamp(patch.opacity, 0, 1);
  if (typeof patch.scale === 'number' && Number.isFinite(patch.scale)) next.scale = clamp(patch.scale, 0.5, 2);
  if (typeof patch.rotateDeg === 'number' && Number.isFinite(patch.rotateDeg)) next.rotateDeg = clamp(patch.rotateDeg, -180, 180);
  if (typeof patch.x === 'number' && Number.isFinite(patch.x)) next.x = clamp(patch.x, -100, 100);
  if (typeof patch.y === 'number' && Number.isFinite(patch.y)) next.y = clamp(patch.y, -100, 100);
  if (Object.prototype.hasOwnProperty.call(patch, 'linkTo')) next.linkTo = normalizeLinkTarget(layerId, patch.linkTo);
  if (typeof patch.linkOpacity === 'boolean') next.linkOpacity = patch.linkOpacity;
  return next;
}

function sanitizeStageTransforms(stageTransforms = {}) {
  const source = stageTransforms && typeof stageTransforms === 'object' ? stageTransforms : {};
  const sanitized = {};
  AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
    sanitized[layerId] = {
      ...createDefaultLayer(),
      ...sanitizeRolePatch(layerId, source[layerId]),
    };
  });
  return sanitized;
}

function sanitizeTransformsByStage(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const next = {};

  Object.entries(source).forEach(([rawStage, stageTransforms]) => {
    const stageKey = normalizeStageId(rawStage);
    next[stageKey] = sanitizeStageTransforms(stageTransforms);
  });

  if (!next.seedling) {
    next.seedling = createDefaultStageTransforms('seedling');
  }

  return next;
}

export function sanitizeAvatarComposite(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  let transformsByStageSource =
    source.transformsByStage && typeof source.transformsByStage === 'object'
      ? source.transformsByStage
      : null;
  let transformsByStageLightSource =
    source.transformsByStageLight && typeof source.transformsByStageLight === 'object'
      ? source.transformsByStageLight
      : null;

  if (!transformsByStageSource && source.layers && typeof source.layers === 'object') {
    transformsByStageSource = { seedling: source.layers };
  }

  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    previewDraft: typeof source.previewDraft === 'boolean' ? source.previewDraft : false,
    showDebugOverlay: typeof source.showDebugOverlay === 'boolean' ? source.showDebugOverlay : false,
    transformsByStage: sanitizeTransformsByStage(transformsByStageSource || {}),
    transformsByStageLight: sanitizeTransformsByStage(transformsByStageLightSource || {}),
  };
}

// --- Scheme helpers ---

function resolveScheme(colorScheme) {
  return colorScheme === 'light' ? 'light' : 'dark';
}

function getTransformsByScheme(avatarComposite, colorScheme) {
  return resolveScheme(colorScheme) === 'light'
    ? avatarComposite?.transformsByStageLight
    : avatarComposite?.transformsByStage;
}

function setTransformsByScheme(avatarComposite, colorScheme, nextTransformsByStage) {
  return resolveScheme(colorScheme) === 'light'
    ? { ...avatarComposite, transformsByStageLight: nextTransformsByStage }
    : { ...avatarComposite, transformsByStage: nextTransformsByStage };
}

function getRawRoleTransform(avatarComposite, stageKey, roleKey, colorScheme = 'dark') {
  return getTransformsByScheme(avatarComposite, colorScheme)?.[stageKey]?.[roleKey];
}

export function resolveRoleTransform(avatarComposite, stageKey, roleKey, colorScheme = 'dark') {
  const normalizedRole = normalizeLayerId(roleKey);
  if (!normalizedRole) return createDefaultLayer();

  const normalizedStage = normalizeStageId(stageKey);

  const fromStage = getRawRoleTransform(avatarComposite, normalizedStage, normalizedRole, colorScheme);
  if (fromStage && typeof fromStage === 'object') {
    return {
      ...createDefaultLayer(),
      ...sanitizeRolePatch(normalizedRole, fromStage),
    };
  }

  return createDefaultLayer();
}

function createResolvedStageTransforms(avatarComposite, stageKey, colorScheme = 'dark') {
  const normalizedStage = normalizeStageId(stageKey);
  const next = {};
  AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
    next[layerId] = resolveRoleTransform(avatarComposite, normalizedStage, layerId, colorScheme);
  });
  return next;
}

function updateRoleTransform(state, stageKey, layerId, patch, colorScheme = 'dark') {
  const normalizedLayerId = normalizeLayerId(layerId);
  if (!normalizedLayerId) return state;
  const normalizedStageKey = normalizeStageId(stageKey);
  const sanitizedPatch = sanitizeRolePatch(normalizedLayerId, patch);
  const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();
  const existingByScheme = getTransformsByScheme(avatarComposite, colorScheme);
  const existingStage = existingByScheme?.[normalizedStageKey];
  const baseStage = existingStage
    ? sanitizeStageTransforms(existingStage)
    : createResolvedStageTransforms(avatarComposite, normalizedStageKey, colorScheme);

  const nextTransformsByStage = {
    ...existingByScheme,
    [normalizedStageKey]: {
      ...baseStage,
      [normalizedLayerId]: {
        ...baseStage[normalizedLayerId],
        ...sanitizedPatch,
      },
    },
  };

  return {
    ...state,
    avatarComposite: setTransformsByScheme(avatarComposite, colorScheme, nextTransformsByStage),
  };
}

function setWholeStageTransforms(state, stageKey, stageTransforms, colorScheme = 'dark') {
  const normalizedStageKey = normalizeStageId(stageKey);
  const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();
  const existingByScheme = getTransformsByScheme(avatarComposite, colorScheme);
  const nextTransformsByStage = {
    ...existingByScheme,
    [normalizedStageKey]: sanitizeStageTransforms(stageTransforms),
  };
  return {
    ...state,
    avatarComposite: setTransformsByScheme(avatarComposite, colorScheme, nextTransformsByStage),
  };
}

export function migrateDevPanelState(persistedState, version) {
  if (!persistedState) return persistedState;

  const persistedAvatar = persistedState.avatarComposite || {};
  const migratedAvatar = {
    enabled: typeof persistedAvatar.enabled === 'boolean' ? persistedAvatar.enabled : true,
    previewDraft: false,
    showDebugOverlay: typeof persistedAvatar.showDebugOverlay === 'boolean' ? persistedAvatar.showDebugOverlay : false,
  };

  if (version >= 3) {
    return { ...persistedState, avatarComposite: migratedAvatar };
  }

  if (version >= 2) {
    return { ...persistedState, avatarComposite: migratedAvatar };
  }

  return { ...persistedState, avatarComposite: migratedAvatar };
}

const createDevPanelStoreState = (set, get) => ({
  avatarComposite: createDefaultAvatarComposite(),

  getAvatarCompositeRoleTransform: (stageKey, roleKey, colorScheme = 'dark') => {
    const state = get();
    return resolveRoleTransform(state.avatarComposite, stageKey, roleKey, colorScheme);
  },

  setAvatarCompositeEnabled: (enabled) =>
    set((state) => ({
      ...state,
      avatarComposite: {
        ...state.avatarComposite,
        enabled: Boolean(enabled),
      },
    })),

  setAvatarCompositePreviewDraft: (previewDraft) =>
    set((state) => ({
      ...state,
      avatarComposite: {
        ...state.avatarComposite,
        previewDraft: Boolean(previewDraft),
      },
    })),

  setAvatarCompositeDebugOverlay: (showDebugOverlay) =>
    set((state) => ({
      ...state,
      avatarComposite: {
        ...state.avatarComposite,
        showDebugOverlay: Boolean(showDebugOverlay),
      },
    })),

  setAvatarCompositeRoleTransform: (stageKey, roleKey, partialPatch, colorScheme = 'dark') =>
    set((state) => updateRoleTransform(state, stageKey, roleKey, partialPatch, colorScheme)),

  setAvatarCompositeRoleTransformValue: (stageKey, roleKey, key, value, colorScheme = 'dark') =>
    set((state) => updateRoleTransform(state, stageKey, roleKey, { [key]: value }, colorScheme)),

  setAvatarCompositeRoleTransformEnabled: (stageKey, roleKey, enabled, colorScheme = 'dark') =>
    set((state) => updateRoleTransform(state, stageKey, roleKey, { enabled: Boolean(enabled) }, colorScheme)),

  setAvatarCompositeRoleTransformLink: (stageKey, roleKey, linkTo, colorScheme = 'dark') =>
    set((state) => updateRoleTransform(state, stageKey, roleKey, { linkTo }, colorScheme)),

  setAvatarCompositeRoleTransformLinkOpacity: (stageKey, roleKey, linkOpacity, colorScheme = 'dark') =>
    set((state) => updateRoleTransform(state, stageKey, roleKey, { linkOpacity: Boolean(linkOpacity) }, colorScheme)),

  hydrateAvatarCompositeDrafts: (transformsByStage, colorScheme = 'dark') =>
    set((state) => {
      const nextTransformsByStage = sanitizeTransformsByStage(transformsByStage);
      const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();
      return {
        ...state,
        avatarComposite: setTransformsByScheme(avatarComposite, colorScheme, nextTransformsByStage),
      };
    }),

  replaceAvatarCompositeStageDraft: (stageKey, stageTransforms, colorScheme = 'dark') =>
    set((state) => setWholeStageTransforms(state, stageKey, stageTransforms, colorScheme)),

  getAvatarCompositeStageDraft: (stageKey, colorScheme = 'dark') => {
    const state = get();
    const normalizedStageKey = normalizeStageId(stageKey);
    return createResolvedStageTransforms(state.avatarComposite, normalizedStageKey, colorScheme);
  },

  resetAvatarCompositeStage: (stageKey, colorScheme = 'dark') =>
    set((state) => {
      const normalizedStageKey = normalizeStageId(stageKey);
      return setWholeStageTransforms(
        state,
        normalizedStageKey,
        createDefaultStageTransforms(normalizedStageKey, colorScheme),
        colorScheme
      );
    }),

  // Compatibility wrappers (legacy callers -> seedling, dark)
  setAvatarCompositeLayerEnabled: (layerId, enabled) =>
    set((state) => updateRoleTransform(state, 'seedling', layerId, { enabled: Boolean(enabled) })),

  setAvatarCompositeLayerValue: (layerId, key, value) =>
    set((state) => updateRoleTransform(state, 'seedling', layerId, { [key]: value })),

  setAvatarCompositeLayerLink: (layerId, linkTo) =>
    set((state) => updateRoleTransform(state, 'seedling', layerId, { linkTo })),

  setAvatarCompositeLayerLinkOpacity: (layerId, linkOpacity) =>
    set((state) => updateRoleTransform(state, 'seedling', layerId, { linkOpacity: Boolean(linkOpacity) })),

  resetAvatarCompositeLayer: (layerId) =>
    set((state) => updateRoleTransform(state, 'seedling', layerId, DEFAULT_ROLE_RESET)),

  resetAvatarCompositeAll: () =>
    set((state) => ({
      ...state,
      avatarComposite: createDefaultAvatarComposite(),
    })),

  linkAllAvatarCompositeTo: (masterLayerId) =>
    set((state) => {
      const master = normalizeLayerId(masterLayerId);
      let nextState = state;
      AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
        const linkTo = master && layerId !== master ? master : null;
        nextState = updateRoleTransform(nextState, 'seedling', layerId, { linkTo });
      });
      return nextState;
    }),

  getAvatarCompositeAllStagesJSON: (colorScheme = 'dark') => {
    const state = get();
    const transformsByStage = {};
    AVATAR_COMPOSITE_STAGE_KEYS.forEach((stageKey) => {
      transformsByStage[stageKey] = createResolvedStageTransforms(state.avatarComposite, stageKey, colorScheme);
    });
    return JSON.stringify(
      {
        transformsByStage,
      },
      null,
      2
    );
  },

  getAvatarCompositeDefaultsSnippet: (colorScheme = 'dark') => {
    const state = get();
    const transformsByStage = {};
    AVATAR_COMPOSITE_STAGE_KEYS.forEach((stageKey) => {
      transformsByStage[stageKey] = createResolvedStageTransforms(state.avatarComposite, stageKey, colorScheme);
    });
    return `transformsByStage: ${JSON.stringify(transformsByStage, null, 2)},`;
  },

  getAvatarCompositeDefaults: () => JSON.parse(JSON.stringify(DEFAULT_AVATAR_COMPOSITE)),
});

const devPanelPersistConfig = {
  name: DEV_PANEL_PERSIST_KEY,
  version: 3,
  migrate: (persistedState, version) => migrateDevPanelState(persistedState, version),
  // Persist only persistent UI toggles; stage draft transforms and preview mode are ephemeral.
  partialize: (state) => ({
    avatarComposite: {
      enabled: Boolean(state.avatarComposite?.enabled),
      showDebugOverlay: Boolean(state.avatarComposite?.showDebugOverlay),
    },
  }),
  merge: (persisted, current) => {
    const migrated = migrateDevPanelState(persisted, 3);
    const persistedAvatar = migrated?.avatarComposite || {};
    const baseAvatar = current?.avatarComposite || createDefaultAvatarComposite();
    return {
      ...current,
      avatarComposite: {
        ...baseAvatar,
        enabled:
          typeof persistedAvatar.enabled === 'boolean'
            ? persistedAvatar.enabled
            : baseAvatar.enabled,
        previewDraft: false,
        showDebugOverlay:
          typeof persistedAvatar.showDebugOverlay === 'boolean'
            ? persistedAvatar.showDebugOverlay
            : baseAvatar.showDebugOverlay,
      },
    };
  },
};

export const useDevPanelStore = create(
  IS_DEV_BUILD ? persist(createDevPanelStoreState, devPanelPersistConfig) : createDevPanelStoreState
);
