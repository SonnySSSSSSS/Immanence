// Explicit allowlist of persisted client storage keys that comprise "core user state".
// This list is derived from a repo audit of:
// - zustand persist() `name:` values
// - direct localStorage usage
//
// Keep this list small and intentional (no wildcard prefixes).
export const OFFLINE_FIRST_USER_STATE_KEYS = Object.freeze([
  // Progress + session history (zustand persist)
  'immanenceOS.progress',

  // Stage/progression aggregates (direct localStorage)
  'immanence_mandala_v1',

  // User settings/preferences (zustand persist + localStorage)
  'immanence-settings',
  'immanence-user-mode',

  // Practice preferences + legacy session list (direct localStorage)
  'immanence_practice_prefs_v2',
  'immanence_sessions_v1',

  // Navigation/path/curriculum progress (zustand persist)
  'immanenceOS.navigationState',
  'immanenceOS.path',
  'immanenceOS.curriculum',
]);

export const OFFLINE_FIRST_USER_STATE_KEYS_SET = new Set(OFFLINE_FIRST_USER_STATE_KEYS);

