import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeStageKey } from '../config/avatarStageAssets.js';
import { getCanonicalAvatarStageDefaultTransforms } from './avatarV3Store.js';

export const DEV_PANEL_PERSIST_KEY = 'immanence-dev-panel';
export const AVATAR_COMPOSITE_LAYER_IDS = ['bg', 'stage', 'glass', 'ring'];
export const AVATAR_COMPOSITE_STAGE_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

const IS_DEV_BUILD = Boolean(import.meta?.env?.DEV);
const IS_LOCALHOST_RUNTIME =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location?.hostname || '');
const SHOULD_PERSIST_DEV_PANEL = IS_DEV_BUILD || IS_LOCALHOST_RUNTIME;

if (!SHOULD_PERSIST_DEV_PANEL && typeof window !== 'undefined') {
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

function createDefaultLayer() {
  return { ...DEFAULT_LAYER };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveScheme(colorScheme = 'dark') {
  return colorScheme === 'light' ? 'light' : 'dark';
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

function cloneStageDraft(stageKey = 'seedling', colorScheme = 'dark', stageTransforms = null) {
  const normalizedStageKey = normalizeStageId(stageKey);
  const sourceStageTransforms =
    stageTransforms && typeof stageTransforms === 'object'
      ? stageTransforms
      : getCanonicalAvatarStageDefaultTransforms(normalizedStageKey, colorScheme);
  const clonedStageDraft = {};

  AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
    clonedStageDraft[layerId] = {
      ...createDefaultLayer(),
      ...sanitizeRolePatch(layerId, sourceStageTransforms[layerId]),
    };
  });

  return clonedStageDraft;
}

function createDefaultDraftsByStage(colorScheme = 'dark') {
  const next = {};
  AVATAR_COMPOSITE_STAGE_KEYS.forEach((stageKey) => {
    next[stageKey] = cloneStageDraft(stageKey, colorScheme);
  });
  return next;
}

function createDefaultDraftsByTheme() {
  return {
    dark: createDefaultDraftsByStage('dark'),
    light: createDefaultDraftsByStage('light'),
  };
}

function sanitizeDraftsByStage(input = {}, colorScheme = 'dark') {
  const source = input && typeof input === 'object' ? input : {};
  const next = {};

  AVATAR_COMPOSITE_STAGE_KEYS.forEach((stageKey) => {
    next[stageKey] = cloneStageDraft(stageKey, colorScheme, source[stageKey]);
  });

  return next;
}

function sanitizeDraftsByTheme(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const draftSource =
    source.draftsByTheme && typeof source.draftsByTheme === 'object' ? source.draftsByTheme : source;

  return {
    dark: sanitizeDraftsByStage(draftSource.dark || source.transformsByStage, 'dark'),
    light: sanitizeDraftsByStage(draftSource.light || source.transformsByStageLight, 'light'),
  };
}

function createDefaultAvatarComposite() {
  return {
    enabled: true,
    previewDraft: false,
    showDebugOverlay: false,
    draftsByTheme: createDefaultDraftsByTheme(),
  };
}

const DEFAULT_AVATAR_COMPOSITE = Object.freeze(createDefaultAvatarComposite());

export function sanitizeAvatarComposite(input = {}) {
  const source = input && typeof input === 'object' ? input : {};

  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    previewDraft: typeof source.previewDraft === 'boolean' ? source.previewDraft : false,
    showDebugOverlay: typeof source.showDebugOverlay === 'boolean' ? source.showDebugOverlay : false,
    draftsByTheme: sanitizeDraftsByTheme(source),
  };
}

function mergeAvatarComposite(baseAvatarComposite, persistedAvatarComposite = {}) {
  const baseAvatar = baseAvatarComposite || createDefaultAvatarComposite();
  const sanitizedPersistedAvatar = sanitizeAvatarComposite(persistedAvatarComposite);

  return {
    ...baseAvatar,
    enabled:
      typeof persistedAvatarComposite?.enabled === 'boolean'
        ? persistedAvatarComposite.enabled
        : baseAvatar.enabled,
    previewDraft: false,
    showDebugOverlay:
      typeof persistedAvatarComposite?.showDebugOverlay === 'boolean'
        ? persistedAvatarComposite.showDebugOverlay
        : baseAvatar.showDebugOverlay,
    draftsByTheme: {
      dark: sanitizeDraftsByStage(sanitizedPersistedAvatar.draftsByTheme?.dark, 'dark'),
      light: sanitizeDraftsByStage(sanitizedPersistedAvatar.draftsByTheme?.light, 'light'),
    },
  };
}

function getDraftsByScheme(avatarComposite, colorScheme = 'dark') {
  const scheme = resolveScheme(colorScheme);
  return avatarComposite?.draftsByTheme?.[scheme] || createDefaultDraftsByStage(scheme);
}

function setDraftsByScheme(avatarComposite, colorScheme, nextDraftsByStage) {
  const scheme = resolveScheme(colorScheme);
  const currentDraftsByTheme = avatarComposite?.draftsByTheme || createDefaultDraftsByTheme();

  return {
    ...avatarComposite,
    draftsByTheme: {
      dark: currentDraftsByTheme.dark,
      light: currentDraftsByTheme.light,
      [scheme]: sanitizeDraftsByStage(nextDraftsByStage, scheme),
    },
  };
}

function getStageDraftSnapshot(avatarComposite, stageKey, colorScheme = 'dark') {
  const normalizedStageKey = normalizeStageId(stageKey);
  return cloneStageDraft(
    normalizedStageKey,
    colorScheme,
    getDraftsByScheme(avatarComposite, colorScheme)[normalizedStageKey]
  );
}

function replaceStageDraft(state, stageKey, stageTransforms, colorScheme = 'dark') {
  const normalizedStageKey = normalizeStageId(stageKey);
  const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();
  const nextDraftsByStage = {
    ...getDraftsByScheme(avatarComposite, colorScheme),
    [normalizedStageKey]: cloneStageDraft(normalizedStageKey, colorScheme, stageTransforms),
  };

  return {
    ...state,
    avatarComposite: setDraftsByScheme(avatarComposite, colorScheme, nextDraftsByStage),
  };
}

function writeStageDraftValue(state, stageKey, layerId, field, value, colorScheme = 'dark') {
  const normalizedLayerId = normalizeLayerId(layerId);
  if (!normalizedLayerId) return state;

  const normalizedStageKey = normalizeStageId(stageKey);
  const sanitizedPatch = sanitizeRolePatch(normalizedLayerId, { [field]: value });
  if (!Object.keys(sanitizedPatch).length) return state;

  const currentStageDraft = getStageDraftSnapshot(state.avatarComposite, normalizedStageKey, colorScheme);
  const nextStageDraft = {
    ...currentStageDraft,
    [normalizedLayerId]: {
      ...currentStageDraft[normalizedLayerId],
      ...sanitizedPatch,
    },
  };

  return replaceStageDraft(state, normalizedStageKey, nextStageDraft, colorScheme);
}

export function migrateDevPanelState(persistedState, version) {
  if (!persistedState) return persistedState;

  const persistedAvatar = persistedState.avatarComposite || {};
  const migratedAvatar = {
    enabled: typeof persistedAvatar.enabled === 'boolean' ? persistedAvatar.enabled : true,
    previewDraft: false,
    showDebugOverlay:
      typeof persistedAvatar.showDebugOverlay === 'boolean' ? persistedAvatar.showDebugOverlay : false,
    draftsByTheme: sanitizeDraftsByTheme(version >= 5 ? persistedAvatar : persistedAvatar),
  };

  return { ...persistedState, avatarComposite: migratedAvatar };
}

const createDevPanelStoreState = (set, get) => ({
  avatarComposite: createDefaultAvatarComposite(),

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

  getAvatarCompositeStageDraft: (stageKey, colorScheme = 'dark') => {
    const state = get();
    return getStageDraftSnapshot(state.avatarComposite, stageKey, colorScheme);
  },

  writeAvatarCompositeDraftValue: (stageKey, layerId, field, value, colorScheme = 'dark') =>
    set((state) => writeStageDraftValue(state, stageKey, layerId, field, value, colorScheme)),

  replaceAvatarCompositeStageDraft: (stageKey, stageTransforms, colorScheme = 'dark') =>
    set((state) => replaceStageDraft(state, stageKey, stageTransforms, colorScheme)),

  resetAvatarCompositeStage: (stageKey, colorScheme = 'dark') =>
    set((state) =>
      replaceStageDraft(
        state,
        stageKey,
        getCanonicalAvatarStageDefaultTransforms(stageKey, colorScheme),
        colorScheme
      )
    ),

  getAvatarCompositeAllStagesJSON: (colorScheme = 'dark') => {
    const state = get();
    const transformsByStage = {};
    AVATAR_COMPOSITE_STAGE_KEYS.forEach((stageKey) => {
      transformsByStage[stageKey] = getStageDraftSnapshot(state.avatarComposite, stageKey, colorScheme);
    });
    return JSON.stringify(
      {
        transformsByStage,
      },
      null,
      2
    );
  },

  getAvatarCompositeDefaults: () => JSON.parse(JSON.stringify(DEFAULT_AVATAR_COMPOSITE)),
});

const devPanelPersistConfig = {
  name: DEV_PANEL_PERSIST_KEY,
  version: 5,
  migrate: (persistedState, version) => migrateDevPanelState(persistedState, version),
  partialize: (state) => ({
    avatarComposite: {
      enabled: Boolean(state.avatarComposite?.enabled),
      draftsByTheme: sanitizeDraftsByTheme(state.avatarComposite?.draftsByTheme),
      showDebugOverlay: Boolean(state.avatarComposite?.showDebugOverlay),
    },
  }),
  merge: (persisted, current) => {
    const migrated = migrateDevPanelState(persisted, 5);
    const persistedAvatar = migrated?.avatarComposite || {};
    const baseAvatar = current?.avatarComposite || createDefaultAvatarComposite();
    return {
      ...current,
      avatarComposite: mergeAvatarComposite(baseAvatar, persistedAvatar),
    };
  },
};

export const useDevPanelStore = create(
  SHOULD_PERSIST_DEV_PANEL ? persist(createDevPanelStoreState, devPanelPersistConfig) : createDevPanelStoreState
);
