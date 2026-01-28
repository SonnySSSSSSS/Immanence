// src/state/practiceStore.js
// Persistent storage for practice preferences and session history

const STORAGE_KEY = "immanence_sessions_v1";
const PREFERENCES_KEY = "immanence_practice_prefs_v2"; // Incremented version for keyed structure

// Global/Shared settings (not per-practice)
const GLOBAL_DEFAULTS = {
  practiceId: "breath", // Default practice
  duration: 10,
};

// Initial settings for each practice
const PER_PRACTICE_DEFAULTS = {
  breath: {
    preset: "Box",
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  },
  ritual: {
    activeRitualId: null,
  },
  circuit: {
    activeCircuitId: null,
  },
  cognitive_vipassana: {
    variant: 'thought-labeling',
    vipassanaTheme: "dawnSky",
    vipassanaElement: "bird",
    sensoryType: 'bodyScan'
  },
  somatic_vipassana: {
    sensoryType: 'bodyScan'
  },
  sound: {
    soundType: "Binaural",
    volume: 0.5,
    binauralPresetId: 'Alpha - Flow 10Hz',
    isochronicPresetId: 'Deep Focus',
    // Entrainment target (beat/pulse). UI calls this “Exact Frequency (Hz)”.
    exactHz: 10,
    // Advanced FX (Isochronic only). Stored as 0..1 wet values.
    reverbWet: 0,
    chorusWet: 0,
    carrierFrequency: 200,
  },
  visualization: {
    geometry: "enso",
    fadeInDuration: 2.5,
    displayDuration: 10,
    fadeOutDuration: 2.5,
    voidDuration: 10,
    audioEnabled: true,
  },
  cymatics: {
    frequencySet: 'solfeggio',
    selectedFrequencyIndex: 4, // 528Hz index 4 in solfeggio
    driftEnabled: false,
    audioEnabled: true,
    fadeInDuration: 2.5,
    displayDuration: 10,
    fadeOutDuration: 2.5,
    voidDuration: 10,
  },
  photic: {},
  integration: {},
  awareness: {
    activeMode: "insight"
  },
  resonance: {
    activeMode: "aural"
  },
  perception: {
    activeMode: "visualization"
  },
  feeling: {
    intent: 'compassion',
    promptText: 'Hold the feeling; when it fades, return.',
  },
};

export const DEFAULT_PREFERENCES = {
  ...GLOBAL_DEFAULTS,
  practiceParams: { ...PER_PRACTICE_DEFAULTS }
};

// Map legacy labels and old practice IDs to new combined IDs
const LEGACY_MAP = {
  "Breath & Stillness": "breath",
  "Ritual": "integration",
  "Circuit": "circuit",
  "Insight Meditation": "awareness",
  "Body Scan": "awareness",
  "Sound": "resonance",
  "Visualization": "perception",
  "Cymatics": "resonance",
  "Photic": "perception",
  // Direct ID mappings for old practice IDs
  "ritual": "integration",
  "insight": "awareness",
  "bodyscan": "awareness",
  "cognitive_vipassana": "awareness",
  "somatic_vipassana": "awareness",
  "sound": "resonance",
  "visualization": "perception",
  "cymatics": "resonance",
  "photic": "perception"
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
    if (!raw) {
      // Try to migrate from v1 if available
      const legacyRaw = window.localStorage.getItem("immanence_practice_prefs_v1");
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        const practiceId = LEGACY_MAP[legacy.practice] || "breath";
        const migrated = {
          ...DEFAULT_PREFERENCES,
          practiceId,
          duration: legacy.duration || 10,
        };
        // Partially fill practiceParams with legacy data
        if (practiceId === 'breath') {
          migrated.practiceParams.breath = {
            preset: legacy.preset || "Box",
            pattern: legacy.pattern || { inhale: 4, hold1: 4, exhale: 4, hold2: 4 }
          };
        }
        return migrated;
      }
      return DEFAULT_PREFERENCES;
    }
    const stored = JSON.parse(raw);
    // Map old practice IDs to new consolidated ones
    const normalizedPracticeId = LEGACY_MAP[stored.practiceId] || stored.practiceId;
    // Deep merge to ensure defaults exist for new practices/parameters
    return {
      ...DEFAULT_PREFERENCES,
      ...stored,
      practiceId: normalizedPracticeId,
      practiceParams: {
        ...DEFAULT_PREFERENCES.practiceParams,
        ...(stored.practiceParams || {}),
        sound: {
          ...DEFAULT_PREFERENCES.practiceParams.sound,
          ...(stored.practiceParams?.sound || {}),
        },
      }
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    console.warn("Failed to save practice preferences");
  }
}
