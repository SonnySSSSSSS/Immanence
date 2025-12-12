// src/icons/iconStore.js
// Zustand store for icon style preference

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const ICON_STYLES = {
    LINE: 'line',
    FILLED: 'filled',
    GLOW: 'glow'
};

export const useIconStore = create(
    persist(
        (set) => ({
            style: ICON_STYLES.LINE,

            setStyle: (style) => set({ style }),

            cycleStyle: () => set((state) => {
                const styles = Object.values(ICON_STYLES);
                const currentIndex = styles.indexOf(state.style);
                const nextIndex = (currentIndex + 1) % styles.length;
                return { style: styles[nextIndex] };
            })
        }),
        {
            name: 'immanenceOS.iconStyle',
            version: 1
        }
    )
);
