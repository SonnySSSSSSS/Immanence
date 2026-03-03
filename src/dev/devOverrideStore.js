import { create } from "zustand";
import { persist } from "zustand/middleware";

const VALID_STAGES = new Set(["Seedling", "Ember", "Flame", "Beacon", "Stellar"]);
const VALID_PATHS = new Set(["Yantra", "Kaya", "Chitra", "Nada"]);

const sanitizeStage = (value) => (VALID_STAGES.has(value) ? value : "Seedling");
const sanitizePath = (value) => (value === null || VALID_PATHS.has(value) ? value : null);

export const useDevOverrideStore = create(
  persist(
    (set, get) => ({
      playgroundActive: false,
      stage: "Seedling",
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
      setAvatarPath: (avatarPath) => set({ avatarPath: sanitizePath(avatarPath) }),
      captureSnapshot: (snapshot) => set({ snapshot: snapshot ?? null }),
      restoreSnapshot: () => {
        const snapshot = get().snapshot;
        if (!snapshot) return null;
        set({
          stage: sanitizeStage(snapshot.previewStage),
          avatarPath: sanitizePath(snapshot.previewPath ?? null),
        });
        return snapshot;
      },
    }),
    {
      name: "immanence-dev-overrides-v1",
      version: 1,
      partialize: (state) => ({
        stage: state.stage,
        avatarPath: state.avatarPath,
      }),
    }
  )
);
