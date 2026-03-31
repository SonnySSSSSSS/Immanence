import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'immanence.dev.eigengrau.tuning.v1';

const DEFAULT_STAGE_TUNING = Object.freeze({
  intensity: 1,
  onsetMul: 1,
  dwellMul: 1,
  fadeMul: 1,
  edgeBlur: 0,
  frequencyMul: 1,
  branchStrength: 1,
  branchDarkness: 1,
  iridescenceAmp: 1,
  coherence: 1,
});

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeStagePatch(patch) {
  const src = patch && typeof patch === 'object' ? patch : {};
  return {
    intensity: clamp(src.intensity, 0.5, 1.8, 1),
    onsetMul: clamp(src.onsetMul, 0.5, 2.4, 1),
    dwellMul: clamp(src.dwellMul, 0.5, 2.5, 1),
    fadeMul: clamp(src.fadeMul, 0.4, 2.5, 1),
    edgeBlur: clamp(src.edgeBlur, -2, 6, 0),
    frequencyMul: clamp(src.frequencyMul, 0.35, 2.2, 1),
    branchStrength: clamp(src.branchStrength, 0.25, 2.4, 1),
    branchDarkness: clamp(src.branchDarkness, 0.25, 2.4, 1),
    iridescenceAmp: clamp(src.iridescenceAmp, 0.2, 2, 1),
    coherence: clamp(src.coherence, 0.3, 1.8, 1),
  };
}

function defaultStageMap() {
  return {
    1: { ...DEFAULT_STAGE_TUNING },
    2: { ...DEFAULT_STAGE_TUNING },
    3: { ...DEFAULT_STAGE_TUNING },
  };
}

export const useEigengrauDevTuningStore = create(
  persist(
    (set) => ({
      panelOpen: false,
      targetStage: 1,
      forcedCadenceEnabled: false,
      stageTuning: defaultStageMap(),

      setPanelOpen: (open) => set({ panelOpen: !!open }),

      setTargetStage: (stage) => {
        const n = Number(stage);
        const safe = Number.isFinite(n) ? Math.max(1, Math.min(3, Math.round(n))) : 1;
        set({ targetStage: safe });
      },

      setForcedCadenceEnabled: (enabled) => set({ forcedCadenceEnabled: !!enabled }),

      patchStageTuning: (stage, patch) => {
        const n = Number(stage);
        const safe = Number.isFinite(n) ? Math.max(1, Math.min(3, Math.round(n))) : 1;
        set((state) => {
          const prev = state.stageTuning?.[safe] || DEFAULT_STAGE_TUNING;
          const nextPatch = normalizeStagePatch({ ...prev, ...(patch || {}) });
          return {
            stageTuning: {
              ...(state.stageTuning || {}),
              [safe]: nextPatch,
            },
          };
        });
      },

      resetStageTuning: (stage) => {
        const n = Number(stage);
        const safe = Number.isFinite(n) ? Math.max(1, Math.min(3, Math.round(n))) : 1;
        set((state) => ({
          stageTuning: {
            ...(state.stageTuning || {}),
            [safe]: { ...DEFAULT_STAGE_TUNING },
          },
        }));
      },

      resetAllEigengrauTuning: () => set({ stageTuning: defaultStageMap() }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        targetStage: state.targetStage,
        forcedCadenceEnabled: !!state.forcedCadenceEnabled,
        stageTuning: state.stageTuning,
      }),
      merge: (persisted, current) => {
        const fromDisk = persisted && typeof persisted === 'object' ? persisted : {};
        const stageTuning = {
          ...defaultStageMap(),
          ...(fromDisk.stageTuning || {}),
        };
        return {
          ...current,
          ...fromDisk,
          stageTuning: {
            1: normalizeStagePatch(stageTuning[1]),
            2: normalizeStagePatch(stageTuning[2]),
            3: normalizeStagePatch(stageTuning[3]),
          },
          forcedCadenceEnabled: !!fromDisk.forcedCadenceEnabled,
          targetStage: Number.isFinite(Number(fromDisk.targetStage))
            ? Math.max(1, Math.min(3, Math.round(Number(fromDisk.targetStage))))
            : current.targetStage,
        };
      },
    }
  )
);
