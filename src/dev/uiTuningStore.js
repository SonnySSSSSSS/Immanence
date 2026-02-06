import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_STAGE,
  DEFAULT_TOKEN_OVERRIDES,
  PLAYGROUND_PRESETS,
} from "./playgroundPresets.js";

const cloneDefaults = () => ({ ...DEFAULT_TOKEN_OVERRIDES });

export const useUiTuningStore = create(
  persist(
    (set, get) => ({
      stage: DEFAULT_STAGE,
      layoutMode: "hearth",
      showBottomLayer: true,
      selectedPreset: "default",
      tokenOverrides: cloneDefaults(),
      customPreset: null,

      setStage: (stage) => set({ stage }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      setShowBottomLayer: (showBottomLayer) => set({ showBottomLayer }),
      setToken: (key, value) =>
        set((state) => ({
          selectedPreset: state.selectedPreset === "custom" ? "custom" : "custom-draft",
          tokenOverrides: {
            ...state.tokenOverrides,
            [key]: value,
          },
        })),
      loadPreset: (presetId) => {
        if (presetId === "custom") {
          const state = get();
          if (!state.customPreset) return;
          set({
            selectedPreset: "custom",
            stage: state.customPreset.stage,
            layoutMode: state.customPreset.layoutMode || "hearth",
            showBottomLayer: state.customPreset.showBottomLayer,
            tokenOverrides: { ...state.customPreset.tokenOverrides },
          });
          return;
        }

        const preset = PLAYGROUND_PRESETS[presetId];
        if (!preset) return;
        const currentLayoutMode = get().layoutMode || "hearth";
        set({
          selectedPreset: presetId,
          stage: preset.stage,
          layoutMode: currentLayoutMode,
          tokenOverrides: { ...preset.tokenOverrides },
        });
      },
      saveCustomPreset: () =>
        set((state) => ({
          selectedPreset: "custom",
          customPreset: {
            stage: state.stage,
            layoutMode: state.layoutMode,
            showBottomLayer: state.showBottomLayer,
            tokenOverrides: { ...state.tokenOverrides },
          },
        })),
      reset: () =>
        set({
          stage: DEFAULT_STAGE,
          layoutMode: "hearth",
          showBottomLayer: true,
          selectedPreset: "default",
          tokenOverrides: cloneDefaults(),
        }),
    }),
    {
      name: "immanence-ui-playground-v1",
      version: 1,
    }
  )
);
