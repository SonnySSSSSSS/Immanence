import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// Custom storage for Zustand that uses IndexedDB (via idb-keyval)
const storage = {
    getItem: async (name) => {
        return (await get(name)) || null;
    },
    setItem: async (name, value) => {
        await set(name, value);
    },
    removeItem: async (name) => {
        await del(name);
    },
};

export const useSigilStore = create(
    persist(
        (set) => ({
            sigils: [],

            addSigil: (pathData, intention = '') => {
                const newSigil = {
                    id: crypto.randomUUID?.() || Date.now().toString(),
                    pathData,
                    intention,
                    timestamp: new Date().toISOString()
                };

                set((state) => ({
                    sigils: [newSigil, ...state.sigils]
                }));
            },

            removeSigil: (id) => {
                set((state) => ({
                    sigils: state.sigils.filter((s) => s.id !== id)
                }));
            },

            clearSigils: () => {
                set({ sigils: [] });
            }
        }),
        {
            name: 'immanenceOS.sigils',
            storage: createJSONStorage(() => storage)
        }
    )
);
