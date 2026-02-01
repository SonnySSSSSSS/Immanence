import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAwarenessSceneStore = create(
  persist(
    (set) => ({
      selectedScene: 'forest',
      setSelectedScene: (scene) => set({ selectedScene: scene }),
      sakshiVersion: 1, // 1 = ParallaxForest (scenic), 2 = SakshiVisual (wooden panel)
      setSakshiVersion: (version) => set({ sakshiVersion: version }),
    }),
    {
      name: 'immanence-awareness-scene',
    }
  )
);
