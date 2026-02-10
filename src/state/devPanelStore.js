import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEV_PANEL_PERSIST_KEY = 'immanence-dev-panel';
export const AVATAR_COMPOSITE_LAYER_IDS = ['bg', 'stage', 'glass', 'ring'];

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

function createDefaultAvatarComposite() {
  return {
    enabled: true,
    showDebugOverlay: false,
    layers: {
      bg: createDefaultLayer(),
      stage: createDefaultLayer(),
      glass: createDefaultLayer(),
      ring: createDefaultLayer(),
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

function normalizeLinkTarget(layerId, linkTo) {
  const normalizedLayerId = normalizeLayerId(layerId);
  const normalizedTarget = normalizeLayerId(linkTo);
  if (!normalizedLayerId || !normalizedTarget || normalizedLayerId === normalizedTarget) return null;
  return normalizedTarget;
}

function sanitizeLayerPatch(layerId, patch = {}) {
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

function sanitizeAvatarComposite(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const sourceLayers = source.layers && typeof source.layers === 'object' ? source.layers : {};

  const layers = {};
  AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
    layers[layerId] = {
      ...createDefaultLayer(),
      ...sanitizeLayerPatch(layerId, sourceLayers[layerId]),
    };
  });

  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    showDebugOverlay: typeof source.showDebugOverlay === 'boolean' ? source.showDebugOverlay : false,
    layers,
  };
}

function updateLayer(state, layerId, patch) {
  const normalizedLayerId = normalizeLayerId(layerId);
  if (!normalizedLayerId) return state;
  const sanitizedPatch = sanitizeLayerPatch(normalizedLayerId, patch);
  return {
    ...state,
    avatarComposite: {
      ...state.avatarComposite,
      layers: {
        ...state.avatarComposite.layers,
        [normalizedLayerId]: {
          ...state.avatarComposite.layers[normalizedLayerId],
          ...sanitizedPatch,
        },
      },
    },
  };
}

export const useDevPanelStore = create(
  persist(
    (set, get) => ({
      avatarComposite: createDefaultAvatarComposite(),

      setAvatarCompositeEnabled: (enabled) => set((state) => ({
        ...state,
        avatarComposite: {
          ...state.avatarComposite,
          enabled: Boolean(enabled),
        },
      })),

      setAvatarCompositeDebugOverlay: (showDebugOverlay) => set((state) => ({
        ...state,
        avatarComposite: {
          ...state.avatarComposite,
          showDebugOverlay: Boolean(showDebugOverlay),
        },
      })),

      setAvatarCompositeLayerEnabled: (layerId, enabled) => set((state) => (
        updateLayer(state, layerId, { enabled: Boolean(enabled) })
      )),

      setAvatarCompositeLayerValue: (layerId, key, value) => set((state) => (
        updateLayer(state, layerId, { [key]: value })
      )),

      setAvatarCompositeLayerLink: (layerId, linkTo) => set((state) => (
        updateLayer(state, layerId, { linkTo })
      )),

      setAvatarCompositeLayerLinkOpacity: (layerId, linkOpacity) => set((state) => (
        updateLayer(state, layerId, { linkOpacity: Boolean(linkOpacity) })
      )),

      resetAvatarCompositeLayer: (layerId) => {
        const normalizedLayerId = normalizeLayerId(layerId);
        if (!normalizedLayerId) return;
        set((state) => ({
          ...state,
          avatarComposite: {
            ...state.avatarComposite,
            layers: {
              ...state.avatarComposite.layers,
              [normalizedLayerId]: createDefaultLayer(),
            },
          },
        }));
      },

      resetAvatarCompositeAll: () => set((state) => ({
        ...state,
        avatarComposite: createDefaultAvatarComposite(),
      })),

      linkAllAvatarCompositeTo: (masterLayerId) => {
        const master = normalizeLayerId(masterLayerId);
        set((state) => {
          const nextLayers = { ...state.avatarComposite.layers };
          AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
            const linkTo = master && layerId !== master ? master : null;
            nextLayers[layerId] = {
              ...nextLayers[layerId],
              linkTo,
            };
          });
          return {
            ...state,
            avatarComposite: {
              ...state.avatarComposite,
              layers: nextLayers,
            },
          };
        });
      },

      getAvatarCompositeSettingsJSON: () => {
        const state = get();
        return JSON.stringify(state.avatarComposite, null, 2);
      },

      setAvatarCompositeSettingsJSON: (raw) => {
        if (typeof raw !== 'string') return { ok: false, error: 'Invalid input type' };
        try {
          const parsed = JSON.parse(raw);
          const sanitized = sanitizeAvatarComposite(parsed);
          set((state) => ({
            ...state,
            avatarComposite: sanitized,
          }));
          return { ok: true };
        } catch {
          return { ok: false, error: 'Invalid JSON' };
        }
      },

      getAvatarCompositeDefaults: () => JSON.parse(JSON.stringify(DEFAULT_AVATAR_COMPOSITE)),
    }),
    {
      name: DEV_PANEL_PERSIST_KEY,
      version: 1,
      partialize: (state) => ({
        avatarComposite: sanitizeAvatarComposite(state.avatarComposite),
      }),
      merge: (persisted, current) => {
        const persistedAvatar = persisted?.avatarComposite
          ? sanitizeAvatarComposite(persisted.avatarComposite)
          : createDefaultAvatarComposite();
        return {
          ...current,
          avatarComposite: persistedAvatar,
        };
      },
    }
  )
);
