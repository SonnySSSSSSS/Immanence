import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_USER_MODE = 'explorer';
const VALID_USER_MODES = new Set(['student', 'explorer']);
const EMPTY_USER_MODE_MAP = Object.freeze({});

function publishUserModeProbe(label, payload) {
  const snapshot = {
    label,
    ...payload,
    timestamp: new Date().toISOString(),
  };
  console.log(label, snapshot);
  if (typeof window !== 'undefined') {
    window.__IMMANENCE_USER_MODE_PROBE__ = snapshot;
  }
}

function normalizeUserId(userId) {
  if (typeof userId !== 'string') return null;
  const trimmed = userId.trim();
  return trimmed || null;
}

function getResolvedModeState(modeByUserId, userId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    return {
      activeUserId: null,
      userMode: DEFAULT_USER_MODE,
      hasChosenUserMode: false,
    };
  }

  const storedMode = modeByUserId?.[normalizedUserId];
  return {
    activeUserId: normalizedUserId,
    userMode: VALID_USER_MODES.has(storedMode) ? storedMode : DEFAULT_USER_MODE,
    hasChosenUserMode: VALID_USER_MODES.has(storedMode),
  };
}

function sanitizeModeByUserId(modeByUserId) {
  if (!modeByUserId || typeof modeByUserId !== 'object') return EMPTY_USER_MODE_MAP;

  return Object.fromEntries(
    Object.entries(modeByUserId).filter(([, value]) => VALID_USER_MODES.has(value))
  );
}

export const useUserModeStore = create(
  persist(
    (set) => ({
      activeUserId: null,
      userMode: DEFAULT_USER_MODE,
      hasChosenUserMode: false,
      modeByUserId: EMPTY_USER_MODE_MAP,

      setActiveUserId: (userId) => {
        set((state) => {
          const resolvedState = getResolvedModeState(state.modeByUserId, userId);
          publishUserModeProbe('[PROBE:user-mode-resolve-store]', {
            requestedUserId: userId ?? null,
            resolvedUserId: resolvedState.activeUserId,
            resolvedMode: resolvedState.userMode,
            resolvedHasChosenUserMode: resolvedState.hasChosenUserMode,
            modeByUserId: state.modeByUserId,
          });
          return resolvedState;
        });
      },

      setUserMode: (mode) => {
        const normalizedMode = VALID_USER_MODES.has(mode) ? mode : DEFAULT_USER_MODE;
        set((state) => {
          const activeUserId = normalizeUserId(state.activeUserId);
          if (!activeUserId) {
            const nextState = {
              userMode: normalizedMode,
              hasChosenUserMode: false,
            };
            publishUserModeProbe('[PROBE:user-mode-write]', {
              activeUserId,
              selectedMode: normalizedMode,
              wroteMode: false,
              reason: 'missing-active-user-id',
              modeByUserId: state.modeByUserId,
              nextState,
            });
            return nextState;
          }

          const nextModeByUserId = {
            ...state.modeByUserId,
            [activeUserId]: normalizedMode,
          };
          const nextState = {
            userMode: normalizedMode,
            hasChosenUserMode: true,
            modeByUserId: nextModeByUserId,
          };
          publishUserModeProbe('[PROBE:user-mode-write]', {
            activeUserId,
            selectedMode: normalizedMode,
            wroteMode: true,
            modeByUserId: nextModeByUserId,
            nextState,
          });
          return nextState;
        });
      },

      resetUserMode: () => {
        set((state) => {
          const activeUserId = normalizeUserId(state.activeUserId);
          if (!activeUserId) {
            const nextState = {
              userMode: DEFAULT_USER_MODE,
              hasChosenUserMode: false,
            };
            publishUserModeProbe('[PROBE:user-mode-reset]', {
              activeUserId,
              resetApplied: false,
              reason: 'missing-active-user-id',
              modeByUserId: state.modeByUserId,
              nextState,
            });
            return nextState;
          }

          const nextModeByUserId = { ...state.modeByUserId };
          delete nextModeByUserId[activeUserId];

          const nextState = {
            userMode: DEFAULT_USER_MODE,
            hasChosenUserMode: false,
            modeByUserId: nextModeByUserId,
          };
          publishUserModeProbe('[PROBE:user-mode-reset]', {
            activeUserId,
            resetApplied: true,
            modeByUserId: nextModeByUserId,
            nextState,
          });
          return nextState;
        });
      },
    }),
    {
      name: 'immanence-user-mode',
      version: 2,
      partialize: (state) => ({
        modeByUserId: state.modeByUserId,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        modeByUserId: sanitizeModeByUserId(persistedState?.modeByUserId),
      }),
    }
  )
);
