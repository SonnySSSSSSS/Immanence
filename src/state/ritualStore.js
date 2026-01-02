import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRitualStore = create(
    persist(
        (set, get) => ({
            id: null,
            startTime: null,
            currentStep: 0, // 0 means not started, 1-6 are the steps
            status: 'idle', // 'idle', 'running', 'completed'
            stepData: {},
            photoUrl: null,
            selectedMemory: null,

            // Actions
            startRitual: () => {
                set({
                    id: `ritual_${Date.now()}`,
                    startTime: new Date().toISOString(),
                    currentStep: 1,
                    status: 'running',
                    stepData: {},
                    photoUrl: null,
                    selectedMemory: null,
                });
            },

            advanceStep: () => {
                const { currentStep } = get();
                if (currentStep < 6) {
                    set({ currentStep: currentStep + 1 });
                } else if (currentStep === 6) {
                    set({ status: 'completed' });
                }
            },

            goToStep: (stepNumber) => {
                if (stepNumber >= 1 && stepNumber <= 6) {
                    set({ currentStep: stepNumber });
                }
            },

            recordStepData: (step, data) => {
                set((state) => ({
                    stepData: {
                        ...state.stepData,
                        [step]: {
                            ...state.stepData[step],
                            ...data,
                            timestamp: new Date().toISOString()
                        }
                    }
                }));
            },

            setPhotoUrl: (url) => set({ photoUrl: url }),
            setSelectedMemory: (memory) => set({ selectedMemory: memory }),

            resetRitual: () => {
                set({
                    id: null,
                    startTime: null,
                    currentStep: 0,
                    status: 'idle',
                    stepData: {},
                    photoUrl: null,
                    selectedMemory: null,
                });
            },

            completeRitual: () => {
                set({ status: 'completed' });
            }
        }),
        {
            name: 'ritual-storage',
        }
    )
);
