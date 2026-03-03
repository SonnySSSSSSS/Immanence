import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_STAGE,
  PLAYGROUND_PRESETS,
} from "./playgroundPresets.js";

export const useUiTuningStore = create(
  persist(
    (set, get) => ({
      stage: DEFAULT_STAGE,
      showBottomLayer: true,
      selectedPreset: "default",
      customPreset: null,

      setStage: (stage) => set({ stage }),
      setShowBottomLayer: (showBottomLayer) => set({ showBottomLayer }),
      loadPreset: (presetId) => {
        if (presetId === "custom") {
          const state = get();
          if (!state.customPreset) return;
          set({
            selectedPreset: "custom",
            stage: state.customPreset.stage,
            showBottomLayer: state.customPreset.showBottomLayer,
          });
          return;
        }

        const preset = PLAYGROUND_PRESETS[presetId];
        if (!preset) return;
        set({
          selectedPreset: presetId,
          stage: preset.stage,
          showBottomLayer: typeof preset.showBottomLayer === "boolean" ? preset.showBottomLayer : true,
        });
      },
      saveCustomPreset: () =>
        set((state) => ({
          selectedPreset: "custom",
          customPreset: {
            stage: state.stage,
            showBottomLayer: state.showBottomLayer,
          },
        })),
      reset: () =>
        set({
          stage: DEFAULT_STAGE,
          showBottomLayer: true,
          selectedPreset: "default",
        }),
    }),
    {
      name: "immanence-ui-playground-v1",
      version: 1,
    }
  )
);
