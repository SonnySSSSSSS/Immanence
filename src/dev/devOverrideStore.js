import { create } from "zustand";
import { persist } from "zustand/middleware";

const VALID_STAGES = new Set(["Seedling", "Ember", "Flame", "Beacon", "Stellar"]);

const sanitizeStage = (value) => (VALID_STAGES.has(value) ? value : "Seedling");

export const useDevOverrideStore = create(
  persist(
    (set, get) => ({
      playgroundActive: false,
      stage: "Seedling",
      // Retired: path preview overrides (kept for compatibility; always null)
      avatarPath: null,
      snapshot: null,

      activatePlayground: (initialSnapshot = null) =>
        set({
          playgroundActive: true,
          snapshot: initialSnapshot ?? get().snapshot,
        }),
      deactivatePlayground: () =>
        set({
          playgroundActive: false,
          snapshot: null,
        }),
      setStage: (stage) => set({ stage: sanitizeStage(stage) }),
      setAvatarPath: () => set({ avatarPath: null }),
      captureSnapshot: (snapshot) => set({ snapshot: snapshot ?? null }),
      restoreSnapshot: () => {
        const snapshot = get().snapshot;
        if (!snapshot) return null;
        set({
          stage: sanitizeStage(snapshot.previewStage),
          avatarPath: null,
        });
        return snapshot;
      },
    }),
    {
      name: "immanence-dev-overrides-v1",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState && typeof persistedState === 'object' ? persistedState : {};
        return {
          ...state,
          stage: sanitizeStage(state.stage),
          avatarPath: null,
        };
      },
      partialize: (state) => ({
        stage: state.stage,
      }),
    }
  )
);
