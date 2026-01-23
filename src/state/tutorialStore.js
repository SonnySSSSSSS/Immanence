// src/state/tutorialStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTutorialStore = create(
  persist(
    (set, get) => ({
      // Active tutorial state
      isOpen: false,
      tutorialId: null,
      stepIndex: 0,
      
      // Completed tutorials tracking
      completedTutorials: new Set(),
      
      // Actions
      openTutorial: (tutorialId) => {
        set({
          isOpen: true,
          tutorialId,
          stepIndex: 0,
        });
      },
      
      closeTutorial: () => {
        set({
          isOpen: false,
          tutorialId: null,
          stepIndex: 0,
        });
      },
      
      nextStep: () => {
        set((state) => ({
          stepIndex: state.stepIndex + 1,
        }));
      },
      
      prevStep: () => {
        set((state) => ({
          stepIndex: Math.max(0, state.stepIndex - 1),
        }));
      },
      
      markCompleted: (tutorialId) => {
        set((state) => {
          const newCompleted = new Set(state.completedTutorials);
          newCompleted.add(tutorialId);
          return { completedTutorials: newCompleted };
        });
      },
      
      isCompleted: (tutorialId) => {
        return get().completedTutorials.has(tutorialId);
      },
    }),
    {
      name: 'immanence.tutorial',
      partialize: (state) => ({
        completedTutorials: Array.from(state.completedTutorials),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.completedTutorials)) {
          state.completedTutorials = new Set(state.completedTutorials);
        }
      },
    }
  )
);
