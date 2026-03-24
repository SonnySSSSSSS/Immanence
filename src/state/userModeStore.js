import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_USER_MODE = 'explorer';
const VALID_USER_MODES = new Set(['student', 'explorer']);
const EMPTY_USER_MODE_MAP = Object.freeze({});
const EMPTY_CHOOSER_COMPLETION_MAP = Object.freeze({});

const VALID_ACCESS_POSTURES = new Set(['guided', 'full']);
const DEFAULT_ACCESS_POSTURE = 'guided';
const EMPTY_ACCESS_POSTURE_MAP = Object.freeze({});

function isValidAccessPosture(posture) {
  return VALID_ACCESS_POSTURES.has(posture);
}

function postureToUserMode(posture) {
  return posture === 'full' ? 'explorer' : 'student';
}

function userModeToPosture(mode) {
  return mode === 'explorer' ? 'full' : 'guided';
}

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

function hasValidStoredMode(mode) {
  return VALID_USER_MODES.has(mode);
}

function getResolvedModeState(modeByUserId, hasCompletedAccessChoiceByUserId, accessPostureByUserId, userId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    return {
      activeUserId: null,
      userMode: DEFAULT_USER_MODE,
      hasChosenUserMode: false,
      accessPosture: DEFAULT_ACCESS_POSTURE,
    };
  }

  const storedMode = modeByUserId?.[normalizedUserId];
  const storedCompletion = hasCompletedAccessChoiceByUserId?.[normalizedUserId];
  const storedPosture = accessPostureByUserId?.[normalizedUserId];

  const resolvedPosture = isValidAccessPosture(storedPosture)
    ? storedPosture
    : (hasValidStoredMode(storedMode) ? userModeToPosture(storedMode) : DEFAULT_ACCESS_POSTURE);

  return {
    activeUserId: normalizedUserId,
    userMode: postureToUserMode(resolvedPosture),
    hasChosenUserMode: typeof storedCompletion === 'boolean'
      ? storedCompletion
      : (hasValidStoredMode(storedMode) || isValidAccessPosture(storedPosture)),
    accessPosture: resolvedPosture,
  };
}

function sanitizeModeByUserId(modeByUserId) {
  if (!modeByUserId || typeof modeByUserId !== 'object') return EMPTY_USER_MODE_MAP;

  return Object.fromEntries(
    Object.entries(modeByUserId).filter(([, value]) => hasValidStoredMode(value))
  );
}

function sanitizeChooserCompletionByUserId(hasCompletedAccessChoiceByUserId) {
  if (!hasCompletedAccessChoiceByUserId || typeof hasCompletedAccessChoiceByUserId !== 'object') {
    return EMPTY_CHOOSER_COMPLETION_MAP;
  }

  return Object.fromEntries(
    Object.entries(hasCompletedAccessChoiceByUserId).filter(([, value]) => typeof value === 'boolean')
  );
}

function sanitizeAccessPostureByUserId(accessPostureByUserId) {
  if (!accessPostureByUserId || typeof accessPostureByUserId !== 'object') return EMPTY_ACCESS_POSTURE_MAP;
  return Object.fromEntries(
    Object.entries(accessPostureByUserId).filter(([, value]) => isValidAccessPosture(value))
  );
}

export const useUserModeStore = create(
  persist(
    (set) => ({
      activeUserId: null,
      userMode: DEFAULT_USER_MODE,
      hasChosenUserMode: false,
      accessPosture: DEFAULT_ACCESS_POSTURE,
      modeByUserId: EMPTY_USER_MODE_MAP,
      hasCompletedAccessChoiceByUserId: EMPTY_CHOOSER_COMPLETION_MAP,
      accessPostureByUserId: EMPTY_ACCESS_POSTURE_MAP,

      setActiveUserId: (userId) => {
        set((state) => {
          const resolvedState = getResolvedModeState(
            state.modeByUserId,
            state.hasCompletedAccessChoiceByUserId,
            state.accessPostureByUserId,
            userId
          );
          publishUserModeProbe('[PROBE:user-mode-resolve-store]', {
            requestedUserId: userId ?? null,
            resolvedUserId: resolvedState.activeUserId,
            resolvedMode: resolvedState.userMode,
            resolvedHasChosenUserMode: resolvedState.hasChosenUserMode,
            resolvedAccessPosture: resolvedState.accessPosture,
            modeByUserId: state.modeByUserId,
            hasCompletedAccessChoiceByUserId: state.hasCompletedAccessChoiceByUserId,
            accessPostureByUserId: state.accessPostureByUserId,
          });
          return resolvedState;
        });
      },

      setAccessPosture: (posture) => {
        const normalizedPosture = isValidAccessPosture(posture) ? posture : DEFAULT_ACCESS_POSTURE;
        set((state) => {
          const activeUserId = normalizeUserId(state.activeUserId);
          if (!activeUserId) {
            return {
              accessPosture: normalizedPosture,
              userMode: postureToUserMode(normalizedPosture),
            };
          }
          const nextAccessPostureByUserId = {
            ...state.accessPostureByUserId,
            [activeUserId]: normalizedPosture,
          };
          const nextModeByUserId = {
            ...state.modeByUserId,
            [activeUserId]: postureToUserMode(normalizedPosture),
          };
          const nextHasCompletedAccessChoiceByUserId = {
            ...state.hasCompletedAccessChoiceByUserId,
            [activeUserId]: true,
          };
          publishUserModeProbe('[PROBE:access-posture-write]', {
            activeUserId,
            selectedPosture: normalizedPosture,
            accessPostureByUserId: nextAccessPostureByUserId,
          });
          return {
            accessPosture: normalizedPosture,
            userMode: postureToUserMode(normalizedPosture),
            hasChosenUserMode: true,
            accessPostureByUserId: nextAccessPostureByUserId,
            modeByUserId: nextModeByUserId,
            hasCompletedAccessChoiceByUserId: nextHasCompletedAccessChoiceByUserId,
          };
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
          const nextHasCompletedAccessChoiceByUserId = {
            ...state.hasCompletedAccessChoiceByUserId,
            [activeUserId]: true,
          };
          const nextState = {
            userMode: normalizedMode,
            hasChosenUserMode: true,
            modeByUserId: nextModeByUserId,
            hasCompletedAccessChoiceByUserId: nextHasCompletedAccessChoiceByUserId,
          };
          publishUserModeProbe('[PROBE:user-mode-write]', {
            activeUserId,
            selectedMode: normalizedMode,
            wroteMode: true,
            modeByUserId: nextModeByUserId,
            hasCompletedAccessChoiceByUserId: nextHasCompletedAccessChoiceByUserId,
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
          const nextHasCompletedAccessChoiceByUserId = { ...state.hasCompletedAccessChoiceByUserId };
          const nextAccessPostureByUserId = { ...state.accessPostureByUserId };
          delete nextModeByUserId[activeUserId];
          delete nextHasCompletedAccessChoiceByUserId[activeUserId];
          delete nextAccessPostureByUserId[activeUserId];

          const nextState = {
            userMode: DEFAULT_USER_MODE,
            hasChosenUserMode: false,
            accessPosture: DEFAULT_ACCESS_POSTURE,
            modeByUserId: nextModeByUserId,
            hasCompletedAccessChoiceByUserId: nextHasCompletedAccessChoiceByUserId,
            accessPostureByUserId: nextAccessPostureByUserId,
          };
          publishUserModeProbe('[PROBE:user-mode-reset]', {
            activeUserId,
            resetApplied: true,
            modeByUserId: nextModeByUserId,
            hasCompletedAccessChoiceByUserId: nextHasCompletedAccessChoiceByUserId,
            accessPostureByUserId: nextAccessPostureByUserId,
            nextState,
          });
          return nextState;
        });
      },
    }),
    {
      name: 'immanence-user-mode',
      version: 3,
      migrate: (persistedState) => persistedState,
      partialize: (state) => ({
        modeByUserId: state.modeByUserId,
        hasCompletedAccessChoiceByUserId: state.hasCompletedAccessChoiceByUserId,
        accessPostureByUserId: state.accessPostureByUserId,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        modeByUserId: sanitizeModeByUserId(persistedState?.modeByUserId),
        hasCompletedAccessChoiceByUserId: sanitizeChooserCompletionByUserId(
          persistedState?.hasCompletedAccessChoiceByUserId
        ),
        accessPostureByUserId: sanitizeAccessPostureByUserId(persistedState?.accessPostureByUserId),
      }),
    }
  )
);
