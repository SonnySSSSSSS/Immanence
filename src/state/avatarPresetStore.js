import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeStageKey } from '../config/avatarStageAssets.js';
import { DEFAULT_AVATAR_PRESETS } from '../components/avatarV3/avatarDefaultPresets.js';

export const AVATAR_PRESET_PERSIST_KEY = 'immanence-avatar-presets';
export const AVATAR_PRESET_STAGE_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];
export const AVATAR_PRESET_LAYER_IDS = ['bg', 'stage', 'glass', 'ring'];

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLayerId(layerId) {
  if (typeof layerId !== 'string') return null;
  const normalized = layerId.trim().toLowerCase();
  return AVATAR_PRESET_LAYER_IDS.includes(normalized) ? normalized : null;
}

function sanitizeRolePatch(layerId, patch = {}) {
  const next = {};
  if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled;
  if (typeof patch.opacity === 'number' && Number.isFinite(patch.opacity)) next.opacity = clamp(patch.opacity, 0, 1);
  if (typeof patch.scale === 'number' && Number.isFinite(patch.scale)) next.scale = clamp(patch.scale, 0.5, 2);
  if (typeof patch.rotateDeg === 'number' && Number.isFinite(patch.rotateDeg)) next.rotateDeg = clamp(patch.rotateDeg, -180, 180);
  if (typeof patch.x === 'number' && Number.isFinite(patch.x)) next.x = clamp(patch.x, -100, 100);
  if (typeof patch.y === 'number' && Number.isFinite(patch.y)) next.y = clamp(patch.y, -100, 100);

  if (Object.prototype.hasOwnProperty.call(patch, 'linkTo')) {
    const normalizedTarget = normalizeLayerId(patch.linkTo);
    next.linkTo = normalizedTarget && normalizedTarget !== layerId ? normalizedTarget : null;
  }

  if (typeof patch.linkOpacity === 'boolean') next.linkOpacity = patch.linkOpacity;
  return next;
}

function sanitizeStageTransforms(stageTransforms = {}) {
  const source = stageTransforms && typeof stageTransforms === 'object' ? stageTransforms : {};
  const sanitized = {};
  AVATAR_PRESET_LAYER_IDS.forEach((layerId) => {
    sanitized[layerId] = {
      ...DEFAULT_LAYER,
      ...sanitizeRolePatch(layerId, source[layerId]),
    };
  });
  return sanitized;
}

function sanitizePresetsByStage(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const next = {};

  Object.entries(source).forEach(([rawStage, stageTransforms]) => {
    const stageKey = normalizeStageKey(rawStage);
    next[stageKey] = sanitizeStageTransforms(stageTransforms);
  });

  return next;
}

function getDefaultStagePreset(stageKey) {
  const normalizedStage = normalizeStageKey(stageKey);
  const preset = DEFAULT_AVATAR_PRESETS[normalizedStage] || DEFAULT_AVATAR_PRESETS.seedling || {};
  return sanitizeStageTransforms(preset);
}

export const useAvatarPresetStore = create(
  persist(
    (set, get) => ({
      presetsByStage: sanitizePresetsByStage(DEFAULT_AVATAR_PRESETS),

      ensureStagePreset: (stageKey) => {
        const normalizedStage = normalizeStageKey(stageKey);
        const state = get();
        if (state.presetsByStage?.[normalizedStage]) return;

        set((current) => ({
          ...current,
          presetsByStage: {
            ...current.presetsByStage,
            [normalizedStage]: getDefaultStagePreset(normalizedStage),
          },
        }));
      },

      setStagePreset: (stageKey, transforms) =>
        set((state) => {
          const normalizedStage = normalizeStageKey(stageKey);
          return {
            ...state,
            presetsByStage: {
              ...state.presetsByStage,
              [normalizedStage]: sanitizeStageTransforms(transforms),
            },
          };
        }),
    }),
    {
      name: AVATAR_PRESET_PERSIST_KEY,
      version: 1,
      partialize: (state) => ({
        presetsByStage: sanitizePresetsByStage(state.presetsByStage),
      }),
      merge: (persisted, current) => {
        const persistedPresets = sanitizePresetsByStage(persisted?.presetsByStage || {});
        const defaults = sanitizePresetsByStage(DEFAULT_AVATAR_PRESETS);
        return {
          ...current,
          presetsByStage: {
            ...defaults,
            ...persistedPresets,
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        AVATAR_PRESET_STAGE_KEYS.forEach((stageKey) => {
          if (!state.presetsByStage?.[stageKey]) {
            state.setStagePreset(stageKey, getDefaultStagePreset(stageKey));
          }
        });
      },
    }
  )
);
