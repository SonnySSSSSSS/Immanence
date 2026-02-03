// src/state/sessionOverrideStore.js
// Ephemeral (non-persisted) session override + lock state for path/curriculum-launched sessions.
//
// Goal:
// - Allow paths to launch practices with param overrides (including global-risk settings like photic)
// - Optionally lock those settings so curriculum-launched sessions can't be altered
// - Never pollute persisted user defaults (practiceStore/settingsStore) unless the user explicitly changes settings in free practice

import { create } from 'zustand';

function normalizeLocks(locks) {
  if (!locks) return [];
  if (Array.isArray(locks)) return locks.filter(Boolean);
  // Support the structured shape:
  // { practiceParams?: string[], settings?: string[], tempoSync?: string[], awarenessScene?: string[] }
  const out = [];
  for (const v of Object.values(locks)) {
    if (Array.isArray(v)) out.push(...v.filter(Boolean));
  }
  return out;
}

function setDeep(obj, path, value) {
  if (!path) return obj;
  const parts = String(path).split('.').filter(Boolean);
  if (parts.length === 0) return obj;

  const next = { ...(obj || {}) };
  let cur = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const prev = cur[k];
    cur[k] = prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

export const useSessionOverrideStore = create((set, get) => ({
  // When null, no active session overrides/locks are applied.
  active: false,
  source: null, // e.g. "dailySchedule"

  // Arbitrary override buckets (session-scoped).
  // Recommended shape:
  // {
  //   practiceParams?: Record<string, any>,
  //   settings?: { photic?: Record<string, any>, breathSoundEnabled?: boolean },
  //   tempoSync?: Record<string, any>,
  //   awarenessScene?: Record<string, any>,
  // }
  overrides: null,

  // Lock paths (string paths such as: "practiceParams.breath.preset", "settings.photic.colorLeft").
  locks: [],

  applyLaunchConstraints: ({ source = null, overrides = null, locks = null } = {}) =>
    set({
      active: true,
      source,
      overrides: overrides && typeof overrides === 'object' ? overrides : null,
      locks: normalizeLocks(locks),
    }),

  clearLaunchConstraints: () =>
    set({
      active: false,
      source: null,
      overrides: null,
      locks: [],
    }),

  // Lock check (exact match or prefix match).
  // If "practiceParams.breath.pattern" is locked, it also locks "practiceParams.breath.pattern.inhale".
  isLocked: (path) => {
    const p = String(path || '');
    if (!p) return false;
    const { locks } = get();
    if (!Array.isArray(locks) || locks.length === 0) return false;
    return locks.some((l) => {
      if (!l) return false;
      if (p === l) return true;
      return p.startsWith(l + '.');
    });
  },

  // Session-scoped setter: updates overrides without touching persisted stores.
  // Paths should use this to keep global defaults clean during curriculum sessions.
  setOverride: (path, value) => {
    const p = String(path || '');
    if (!p) return;
    set((state) => ({
      overrides: setDeep(state.overrides || {}, p, value),
    }));
  },
}));

