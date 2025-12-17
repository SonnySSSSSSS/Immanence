// super simple, localStorage-backed store

const STORAGE_KEY = "immanence_sessions_v1";
const PREFERENCES_KEY = "immanence_practice_prefs_v1";

// Default practice preferences
const DEFAULT_PREFERENCES = {
  practice: "Breath & Stillness",
  duration: 10,
  preset: "Box",
  pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  sensoryType: null,
  vipassanaTheme: "dawnSky",
  vipassanaElement: "bird",
  soundType: null,
  geometry: "enso",
};

// Session history functions
export function loadSessions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addSession(session) {
  const list = loadSessions();
  list.push(session);
  saveSessions(list);
}

// Preferences persistence functions
export function loadPreferences() {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const stored = JSON.parse(raw);
    // Merge with defaults to ensure all keys exist
    return { ...DEFAULT_PREFERENCES, ...stored };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage might be full or unavailable
    console.warn("Failed to save practice preferences");
  }
}

export { DEFAULT_PREFERENCES };
