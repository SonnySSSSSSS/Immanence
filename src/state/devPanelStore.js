import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeStageKey } from '../config/avatarStageAssets.js';

export const DEV_PANEL_PERSIST_KEY = 'immanence-dev-panel';
export const AVATAR_COMPOSITE_LAYER_IDS = ['bg', 'stage', 'glass', 'ring'];
export const AVATAR_COMPOSITE_STAGE_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

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

function createDefaultStageTransforms() {
  const transforms = {};
  AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
    transforms[layerId] = createDefaultLayer();
  });
  return transforms;
}

function createDefaultAvatarComposite() {
  return {
    enabled: true,
    showDebugOverlay: false,
    transformsByStage: {
      seedling: createDefaultStageTransforms(),
    },
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
    next.seedling = sanitizeStageTransforms();
  }

  return next;
}

export function sanitizeAvatarComposite(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  let transformsByStageSource =
    source.transformsByStage && typeof source.transformsByStage === 'object'
      ? source.transformsByStage
      : null;

  if (!transformsByStageSource && source.layers && typeof source.layers === 'object') {
    transformsByStageSource = { seedling: source.layers };
  }

  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    showDebugOverlay: typeof source.showDebugOverlay === 'boolean' ? source.showDebugOverlay : false,
    transformsByStage: sanitizeTransformsByStage(transformsByStageSource || {}),
  };
}

function getRawRoleTransform(avatarComposite, stageKey, roleKey) {
  return avatarComposite?.transformsByStage?.[stageKey]?.[roleKey];
}

export function resolveRoleTransform(avatarComposite, stageKey, roleKey) {
  const normalizedRole = normalizeLayerId(roleKey);
  if (!normalizedRole) return createDefaultLayer();

  const normalizedStage = normalizeStageId(stageKey);

  const fromStage = getRawRoleTransform(avatarComposite, normalizedStage, normalizedRole);
  if (fromStage && typeof fromStage === 'object') {
    return {
      ...createDefaultLayer(),
      ...sanitizeRolePatch(normalizedRole, fromStage),
    };
  }

  const fromSeedling = getRawRoleTransform(avatarComposite, 'seedling', normalizedRole);
  if (fromSeedling && typeof fromSeedling === 'object') {
    return {
      ...createDefaultLayer(),
      ...sanitizeRolePatch(normalizedRole, fromSeedling),
    };
  }

  return createDefaultLayer();
}

function createResolvedStageTransforms(avatarComposite, stageKey) {
  const normalizedStage = normalizeStageId(stageKey);
  const next = {};
  AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
    next[layerId] = resolveRoleTransform(avatarComposite, normalizedStage, layerId);
  });
  return next;
}

function updateRoleTransform(state, stageKey, layerId, patch) {
  const normalizedLayerId = normalizeLayerId(layerId);
  if (!normalizedLayerId) return state;
  const normalizedStageKey = normalizeStageId(stageKey);
  const sanitizedPatch = sanitizeRolePatch(normalizedLayerId, patch);
  const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();
  const existingStage = avatarComposite.transformsByStage?.[normalizedStageKey];
  const baseStage = existingStage
    ? sanitizeStageTransforms(existingStage)
    : createResolvedStageTransforms(avatarComposite, normalizedStageKey);

  return {
    ...state,
    avatarComposite: {
      ...avatarComposite,
      transformsByStage: {
        ...avatarComposite.transformsByStage,
        [normalizedStageKey]: {
          ...baseStage,
          [normalizedLayerId]: {
            ...baseStage[normalizedLayerId],
            ...sanitizedPatch,
          },
        },
      },
    },
  };
}

function setWholeStageTransforms(state, stageKey, stageTransforms) {
  const normalizedStageKey = normalizeStageId(stageKey);
  const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();
  return {
    ...state,
    avatarComposite: {
      ...avatarComposite,
      transformsByStage: {
        ...avatarComposite.transformsByStage,
        [normalizedStageKey]: sanitizeStageTransforms(stageTransforms),
      },
    },
  };
}

function parseStageTransformsPayload(raw) {
  if (typeof raw !== 'string') return { ok: false, error: 'Invalid input type' };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Invalid JSON shape' };
    }

    const hasRoleKeys = AVATAR_COMPOSITE_LAYER_IDS.some((layerId) =>
      Object.prototype.hasOwnProperty.call(parsed, layerId)
    );
    if (hasRoleKeys) {
      return { ok: true, transforms: parsed };
    }

    if (parsed.transforms && typeof parsed.transforms === 'object') {
      return { ok: true, transforms: parsed.transforms };
    }

    if (parsed.layers && typeof parsed.layers === 'object') {
      return { ok: true, transforms: parsed.layers };
    }

    return { ok: false, error: 'No avatar composite transform payload found' };
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
}

export function migrateDevPanelState(persistedState, version) {
  if (!persistedState) return persistedState;

  if (version >= 2) {
    if (!persistedState.avatarComposite) return persistedState;
    return {
      ...persistedState,
      avatarComposite: sanitizeAvatarComposite(persistedState.avatarComposite),
    };
  }

  const persistedAvatar = persistedState.avatarComposite || {};
  const migratedAvatar = sanitizeAvatarComposite({
    enabled: persistedAvatar.enabled,
    showDebugOverlay: persistedAvatar.showDebugOverlay,
    transformsByStage: persistedAvatar.transformsByStage,
    layers: persistedAvatar.layers,
  });

  return {
    ...persistedState,
    avatarComposite: migratedAvatar,
  };
}

export const useDevPanelStore = create(
  persist(
    (set, get) => ({
      avatarComposite: createDefaultAvatarComposite(),

      getAvatarCompositeRoleTransform: (stageKey, roleKey) => {
        const state = get();
        return resolveRoleTransform(state.avatarComposite, stageKey, roleKey);
      },

      setAvatarCompositeEnabled: (enabled) =>
        set((state) => ({
          ...state,
          avatarComposite: {
            ...state.avatarComposite,
            enabled: Boolean(enabled),
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

      setAvatarCompositeRoleTransform: (stageKey, roleKey, partialPatch) =>
        set((state) => updateRoleTransform(state, stageKey, roleKey, partialPatch)),

      setAvatarCompositeRoleTransformValue: (stageKey, roleKey, key, value) =>
        set((state) => updateRoleTransform(state, stageKey, roleKey, { [key]: value })),

      setAvatarCompositeRoleTransformEnabled: (stageKey, roleKey, enabled) =>
        set((state) => updateRoleTransform(state, stageKey, roleKey, { enabled: Boolean(enabled) })),

      setAvatarCompositeRoleTransformLink: (stageKey, roleKey, linkTo) =>
        set((state) => updateRoleTransform(state, stageKey, roleKey, { linkTo })),

      setAvatarCompositeRoleTransformLinkOpacity: (stageKey, roleKey, linkOpacity) =>
        set((state) => updateRoleTransform(state, stageKey, roleKey, { linkOpacity: Boolean(linkOpacity) })),

      resetAvatarCompositeStage: (stageKey) =>
        set((state) => {
          const normalizedStageKey = normalizeStageId(stageKey);
          const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();
          if (normalizedStageKey === 'seedling') {
            return setWholeStageTransforms(state, 'seedling', createDefaultStageTransforms());
          }

          const nextTransformsByStage = { ...avatarComposite.transformsByStage };
          delete nextTransformsByStage[normalizedStageKey];
          return {
            ...state,
            avatarComposite: {
              ...avatarComposite,
              transformsByStage: nextTransformsByStage,
            },
          };
        }),

      copyAvatarCompositeStage: (fromStage, toStage) =>
        set((state) => {
          const fromStageKey = normalizeStageId(fromStage);
          const toStageKey = normalizeStageId(toStage);
          const sourceTransforms = createResolvedStageTransforms(state.avatarComposite, fromStageKey);
          return setWholeStageTransforms(state, toStageKey, sourceTransforms);
        }),

      copyAvatarCompositeStageToAll: (fromStage) =>
        set((state) => {
          const fromStageKey = normalizeStageId(fromStage);
          const sourceTransforms = createResolvedStageTransforms(state.avatarComposite, fromStageKey);
          const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();
          const nextTransformsByStage = { ...avatarComposite.transformsByStage };
          AVATAR_COMPOSITE_STAGE_KEYS.forEach((stageKey) => {
            nextTransformsByStage[stageKey] = sanitizeStageTransforms(sourceTransforms);
          });
          return {
            ...state,
            avatarComposite: {
              ...avatarComposite,
              transformsByStage: nextTransformsByStage,
            },
          };
        }),

      // Compatibility wrappers (legacy callers -> seedling)
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

      getAvatarCompositeSettingsJSON: (stageKey = 'seedling') => {
        const state = get();
        const normalizedStageKey = normalizeStageId(stageKey);
        const stageTransforms = createResolvedStageTransforms(state.avatarComposite, normalizedStageKey);
        return JSON.stringify({
          stage: normalizedStageKey,
          transforms: stageTransforms,
        }, null, 2);
      },

      setAvatarCompositeSettingsJSON: (stageKeyOrRaw, maybeRaw) => {
        let stageKey = 'seedling';
        let raw = stageKeyOrRaw;

        if (typeof maybeRaw === 'string') {
          stageKey = normalizeStageId(stageKeyOrRaw);
          raw = maybeRaw;
        }

        const parsed = parseStageTransformsPayload(raw);
        if (!parsed.ok) return { ok: false, error: parsed.error };

        set((state) => setWholeStageTransforms(state, stageKey, parsed.transforms));
        return { ok: true };
      },

      getAvatarCompositeDefaults: () => JSON.parse(JSON.stringify(DEFAULT_AVATAR_COMPOSITE)),
    }),
    {
      name: DEV_PANEL_PERSIST_KEY,
      version: 2,
      migrate: (persistedState, version) => migrateDevPanelState(persistedState, version),
      partialize: (state) => ({
        avatarComposite: sanitizeAvatarComposite(state.avatarComposite),
      }),
      merge: (persisted, current) => {
        const migrated = migrateDevPanelState(persisted, 2);
        const persistedAvatar = migrated?.avatarComposite
          ? sanitizeAvatarComposite(migrated.avatarComposite)
          : createDefaultAvatarComposite();
        return {
          ...current,
          avatarComposite: persistedAvatar,
        };
      },
    }
  )
);
