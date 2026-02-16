import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_USER_MODE = 'explorer';
const VALID_USER_MODES = new Set(['student', 'explorer']);

export const useUserModeStore = create(
  persist(
    (set) => ({
      userMode: DEFAULT_USER_MODE,
      hasChosenUserMode: false,

      setUserMode: (mode) => {
        const normalizedMode = VALID_USER_MODES.has(mode) ? mode : DEFAULT_USER_MODE;
        set({
          userMode: normalizedMode,
          hasChosenUserMode: true,
        });
      },

      resetUserMode: () => {
        set({
          userMode: DEFAULT_USER_MODE,
          hasChosenUserMode: false,
        });
      },
    }),
    {
      name: 'immanence-user-mode',
    }
  )
);
