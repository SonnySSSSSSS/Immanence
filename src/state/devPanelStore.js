import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeStageKey } from '../config/avatarStageAssets.js';
import { getCanonicalAvatarStageDefaultTransforms, useAvatarStageDefaultsStore, avatarWatchpointLockStage } from './avatarV3Store.js';

export const DEV_PANEL_PERSIST_KEY = 'immanence-dev-panel';
export const AVATAR_COMPOSITE_LAYER_IDS = ['bg', 'stage', 'glass', 'ring'];
export const AVATAR_COMPOSITE_STAGE_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

const IS_DEV_BUILD = Boolean(import.meta?.env?.DEV);
const IS_LOCALHOST_RUNTIME =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location?.hostname || '');
const SHOULD_PERSIST_DEV_PANEL = IS_DEV_BUILD || IS_LOCALHOST_RUNTIME;

const loadAvatarProbeModule = IS_DEV_BUILD && import.meta.hot
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

function logDevPanelHmrOwnerProbe(event, detail = {}) {
  withAvatarProbe((module) => {
    module.logAvatarHmrProbe('owner', 'devPanelStore', event, detail);
  });
}

logDevPanelHmrOwnerProbe('module-eval', {
  persistEnabled: SHOULD_PERSIST_DEV_PANEL,
  persistStoragePresent:
    typeof window !== 'undefined' ? window.localStorage?.getItem?.(DEV_PANEL_PERSIST_KEY) != null : null,
});

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

function createDefaultAvatarComposite() {
  return {
    enabled: true,
    previewDraft: false,
    showDebugOverlay: false,
    workingCopy: null,
  };
}

const DEFAULT_AVATAR_COMPOSITE = Object.freeze(createDefaultAvatarComposite());

export function sanitizeAvatarComposite(input = {}) {
  const source = input && typeof input === 'object' ? input : {};

  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    previewDraft: typeof source.previewDraft === 'boolean' ? source.previewDraft : false,
    showDebugOverlay: typeof source.showDebugOverlay === 'boolean' ? source.showDebugOverlay : false,
    workingCopy: null,
  };
}

function mergeAvatarComposite(baseAvatarComposite, persistedAvatarComposite = {}) {
  const baseAvatar = baseAvatarComposite || createDefaultAvatarComposite();
  const baseWorkingCopyPresent = baseAvatar?.workingCopy != null;
  const persistedWorkingCopyPresent = persistedAvatarComposite?.workingCopy != null;
  const mergedAvatar = {
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
    workingCopy: null,
  };

  if (baseWorkingCopyPresent || persistedWorkingCopyPresent) {
    logDevPanelHmrOwnerProbe('merge-working-copy-reset', {
      baseWorkingCopyPresent,
      persistedWorkingCopyPresent,
      mergedWorkingCopyPresent: mergedAvatar.workingCopy != null,
    });
  }

  return mergedAvatar;
}

function createWorkingCopy(stageKey, colorScheme = 'dark', stageTransforms = null) {
  const normalizedStageKey = normalizeStageId(stageKey);
  const scheme = resolveScheme(colorScheme);
  return {
    colorScheme: scheme,
    stageKey: normalizedStageKey,
    stageDraft: cloneStageDraft(normalizedStageKey, scheme, stageTransforms),
  };
}

function getCommittedStageDraftSnapshot(stageKey, colorScheme = 'dark') {
  return cloneStageDraft(
    stageKey,
    colorScheme,
    useAvatarStageDefaultsStore.getState().getResolvedStageDefault(stageKey, colorScheme)
  );
}

function isWorkingCopyMatch(workingCopy, stageKey, colorScheme = 'dark') {
  if (!workingCopy || typeof workingCopy !== 'object') return false;
  const normalizedStageKey = normalizeStageId(stageKey);
  const scheme = resolveScheme(colorScheme);
  return workingCopy.stageKey === normalizedStageKey && workingCopy.colorScheme === scheme;
}

function getWorkingCopySnapshot(avatarComposite, stageKey, colorScheme = 'dark') {
  if (isWorkingCopyMatch(avatarComposite?.workingCopy, stageKey, colorScheme)) {
    return cloneStageDraft(stageKey, colorScheme, avatarComposite.workingCopy.stageDraft);
  }
  return getCommittedStageDraftSnapshot(stageKey, colorScheme);
}

function setWorkingCopy(avatarComposite, stageKey, colorScheme = 'dark', stageTransforms = null) {
  return {
    ...(avatarComposite || createDefaultAvatarComposite()),
    workingCopy: createWorkingCopy(stageKey, colorScheme, stageTransforms),
  };
}

function discardWorkingCopy(avatarComposite, stageKey = null, colorScheme = 'dark') {
  if (!avatarComposite?.workingCopy) return avatarComposite || createDefaultAvatarComposite();
  if (stageKey == null) {
    return {
      ...(avatarComposite || createDefaultAvatarComposite()),
      workingCopy: null,
    };
  }
  if (!isWorkingCopyMatch(avatarComposite.workingCopy, stageKey, colorScheme)) {
    return avatarComposite;
  }
  return {
    ...(avatarComposite || createDefaultAvatarComposite()),
    workingCopy: null,
  };
}

function replaceWorkingStageDraft(state, stageKey, stageTransforms, colorScheme = 'dark') {
  const avatarComposite = state.avatarComposite || createDefaultAvatarComposite();

  return {
    ...state,
    avatarComposite: setWorkingCopy(avatarComposite, stageKey, colorScheme, stageTransforms),
  };
}

function writeWorkingStageValue(state, stageKey, layerId, field, value, colorScheme = 'dark') {
  const normalizedLayerId = normalizeLayerId(layerId);
  if (!normalizedLayerId) return state;

  const normalizedStageKey = normalizeStageId(stageKey);
  const sanitizedPatch = sanitizeRolePatch(normalizedLayerId, { [field]: value });
  if (!Object.keys(sanitizedPatch).length) return state;

  const currentStageDraft = getWorkingCopySnapshot(state.avatarComposite, normalizedStageKey, colorScheme);
  const nextStageDraft = {
    ...currentStageDraft,
    [normalizedLayerId]: {
      ...currentStageDraft[normalizedLayerId],
      ...sanitizedPatch,
    },
  };

  return replaceWorkingStageDraft(state, normalizedStageKey, nextStageDraft, colorScheme);
}

export function migrateDevPanelState(persistedState) {
  if (!persistedState) return persistedState;

  const persistedAvatar = persistedState.avatarComposite || {};
  const migratedAvatar = {
    enabled: typeof persistedAvatar.enabled === 'boolean' ? persistedAvatar.enabled : true,
    previewDraft: false,
    showDebugOverlay:
      typeof persistedAvatar.showDebugOverlay === 'boolean' ? persistedAvatar.showDebugOverlay : false,
    workingCopy: null,
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

  beginAvatarCompositeWorkingCopy: (stageKey, colorScheme = 'dark') =>
    set((state) => ({
      ...state,
      avatarComposite: setWorkingCopy(
        { ...state.avatarComposite, workingCopy: null },
        stageKey,
        colorScheme,
        getCommittedStageDraftSnapshot(stageKey, colorScheme)
      ),
    })),

  clearAvatarCompositeWorkingCopy: (stageKey = null, colorScheme = 'dark') =>
    set((state) => ({
      ...state,
      avatarComposite: discardWorkingCopy(state.avatarComposite, stageKey, colorScheme),
    })),

  getAvatarCompositeStageDraft: (stageKey, colorScheme = 'dark') => {
    const state = get();
    return getWorkingCopySnapshot(state.avatarComposite, stageKey, colorScheme);
  },

  commitAvatarCompositeWorkingCopy: (stageKey, colorScheme = 'dark') => {
    const normalizedStageKey = normalizeStageId(stageKey);
    const scheme = resolveScheme(colorScheme);
    const state = get();
    const wc = state.avatarComposite?.workingCopy;

    // Guard: only commit when the working copy matches the target stage.
    // Without this, a mismatched commit would read back committed data (a no-op
    // write) and silently replace the active working copy for another stage.
    if (!wc || wc.stageKey !== normalizedStageKey || wc.colorScheme !== scheme) {
      return;
    }

    // Deep-clone the draft so the committed store and working copy share no
    // references — prevents any downstream mutation from leaking across stages.
    const draftToCommit = cloneStageDraft(normalizedStageKey, scheme, wc.stageDraft);

    // Snapshot every OTHER stage's committed data BEFORE the write so we can
    // verify no cross-stage contamination occurs.
    const defaultsStore = useAvatarStageDefaultsStore.getState();
    const preCommitSnapshots = {};
    AVATAR_COMPOSITE_STAGE_KEYS.forEach((sk) => {
      if (sk !== normalizedStageKey) {
        preCommitSnapshots[sk] = defaultsStore.getResolvedStageDefault(sk, scheme);
      }
    });

    // Write the isolated draft to the committed defaults store.
    useAvatarStageDefaultsStore.getState().setStageDefault(normalizedStageKey, draftToCommit, scheme);

    // Lock the promoted stage in the watchpoint — any subsequent mutation to
    // this stage's overrides will fire a red console.error with a stack trace.
    avatarWatchpointLockStage(
      normalizedStageKey,
      scheme,
      useAvatarStageDefaultsStore.getState().snapshotsByScheme?.[scheme]?.[normalizedStageKey] ?? null,
    );

    // Verify no other stage's committed data changed.
    const postDefaultsStore = useAvatarStageDefaultsStore.getState();
    AVATAR_COMPOSITE_STAGE_KEYS.forEach((sk) => {
      if (sk === normalizedStageKey) return;
      const postSnapshot = postDefaultsStore.getResolvedStageDefault(sk, scheme);
      const pre = preCommitSnapshots[sk];
      if (!pre || !postSnapshot) return;
      AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
        const preLayer = pre[layerId] || {};
        const postLayer = postSnapshot[layerId] || {};
        Object.keys(preLayer).forEach((key) => {
          if (preLayer[key] !== postLayer[key]) {
            console.error(
              `[commitAvatarCompositeWorkingCopy] CROSS-STAGE CONTAMINATION: ` +
              `committed ${sk}.${layerId}.${key} changed from ${preLayer[key]} to ${postLayer[key]} ` +
              `while committing ${normalizedStageKey} (${scheme})`
            );
          }
        });
      });
    });

    // Update the working copy to reflect the just-committed values.
    set((current) => ({
      ...current,
      avatarComposite: setWorkingCopy(current.avatarComposite, normalizedStageKey, scheme, draftToCommit),
    }));
  },

  writeAvatarCompositeDraftValue: (stageKey, layerId, field, value, colorScheme = 'dark') =>
    set((state) => writeWorkingStageValue(state, stageKey, layerId, field, value, colorScheme)),

  replaceAvatarCompositeStageDraft: (stageKey, stageTransforms, colorScheme = 'dark') =>
    set((state) => replaceWorkingStageDraft(state, stageKey, stageTransforms, colorScheme)),

  resetAvatarCompositeStage: (stageKey, colorScheme = 'dark') =>
    set((state) =>
      replaceWorkingStageDraft(
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
      transformsByStage[stageKey] = getWorkingCopySnapshot(state.avatarComposite, stageKey, colorScheme);
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
  version: 6,
  migrate: (persistedState, version) => migrateDevPanelState(persistedState, version),
  partialize: (state) => ({
    avatarComposite: {
      enabled: Boolean(state.avatarComposite?.enabled),
      showDebugOverlay: Boolean(state.avatarComposite?.showDebugOverlay),
    },
  }),
  merge: (persisted, current) => {
    const migrated = migrateDevPanelState(persisted, 6);
    const persistedAvatar = migrated?.avatarComposite || {};
    const baseAvatar = current?.avatarComposite || createDefaultAvatarComposite();
    logDevPanelHmrOwnerProbe('persist-merge', {
      persistedEnabled: persistedAvatar?.enabled ?? null,
      persistedShowDebugOverlay: persistedAvatar?.showDebugOverlay ?? null,
      baseWorkingCopyPresent: baseAvatar?.workingCopy != null,
      persistedWorkingCopyPresent: persistedAvatar?.workingCopy != null,
    });
    return {
      ...current,
      avatarComposite: mergeAvatarComposite(baseAvatar, persistedAvatar),
    };
  },
  onRehydrateStorage: () => {
    logDevPanelHmrOwnerProbe('persist-rehydrate-start', {
      persistStoragePresent:
        typeof window !== 'undefined' ? window.localStorage?.getItem?.(DEV_PANEL_PERSIST_KEY) != null : null,
    });
    return (state) => {
      logDevPanelHmrOwnerProbe('persist-rehydrate-finish', {
        workingCopyPresent: state?.avatarComposite?.workingCopy != null,
        enabled: state?.avatarComposite?.enabled ?? null,
        previewDraft: state?.avatarComposite?.previewDraft ?? null,
        showDebugOverlay: state?.avatarComposite?.showDebugOverlay ?? null,
      });
    };
  },
};

export const useDevPanelStore = create(
  SHOULD_PERSIST_DEV_PANEL ? persist(createDevPanelStoreState, devPanelPersistConfig) : createDevPanelStoreState
);
