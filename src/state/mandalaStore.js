// src/state/mandalaStore.js

const STORAGE_KEY = "immanence_mandala_v1";

const DEFAULT_STATE = {
  // long-term aggregates
  totalSessions: 0,
  totalMinutes: 0,
  avgAccuracy: 0, // 0..1

  // "how in sync am I with today's rhythm?"
  dailyAccuracy: 0,       // 0..1
  dailyCount: 0,          // how many sessions contributed today
  lastAccuracyDate: null, // "YYYY-MM-DD"

  // "how consistent am I this week?"
  weekStartDate: null,    // "YYYY-MM-DD" of Monday (or first session)
  sessionsThisWeek: 0,
  weeklyConsistency: 0,   // 0..1 mapped from sessionsThisWeek / 4

  // milestone band — very rough for now, we’ll refine later
  phase: "foundation",    // "foundation" | "emergence" | "transformation"

  // short-term / live resonance coming from the current practice
  transient: {
    focus: 0,        // 0..1 – how locked-in / directed the breath is
    clarity: 0,      // 0..1 – smoothness / stability of timing
    distortion: 0,   // 0..1 – "wobble" / noise; higher = more shaky
    lastUpdated: null,
  },
};

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getTodayKey(date) {
  // normalize to YYYY-MM-DD in local time
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStartKey(date) {
  const d = new Date(date);
  // move to Monday (or keep as first-session anchor)
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const dayStr = String(monday.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayStr}`;
}

function computePhase(totalSessions) {
  if (totalSessions < 30) return "foundation"; // roughly first month-ish
  if (totalSessions < 90) return "emergence";  // ~3 months+
  return "transformation";                     // ~6–12 months+
}

function cloneDefaultState() {
  return {
    ...DEFAULT_STATE,
    transient: { ...DEFAULT_STATE.transient },
  };
}

function loadMandalaState() {
  if (typeof window === "undefined") {
    // in case something ever runs this in a non-browser env
    return cloneDefaultState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;

  if (!parsed) {
    return cloneDefaultState();
  }

  // merge with defaults (helps when we add new fields like `transient`)
  const base = {
    ...cloneDefaultState(),
    ...parsed,
  };

  // ensure transient object exists and has all keys
  if (!base.transient) {
    base.transient = { ...DEFAULT_STATE.transient };
  } else {
    base.transient = {
      ...DEFAULT_STATE.transient,
      ...base.transient,
    };
  }

  return base;
}

function saveMandalaState(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Public: get current mandala resonance snapshot.
 * Use this in Avatar.jsx to drive visuals.
 */
export function getMandalaState() {
  return loadMandalaState();
}

/**
 * Public: reset everything (for debugging / dev).
 */
export function resetMandalaState() {
  saveMandalaState(cloneDefaultState());
}

/**
 * Map qualitative accuracy label → numeric 0..1.
 */
function accuracyLabelToValue(accuracy) {
  if (accuracy === "held") return 1;
  if (accuracy === "mostly") return 0.66;
  if (accuracy === "struggled") return 0.33;
  return 0;
}

/**
 * Map accuracy 0..1 → transient focus / clarity / distortion.
 * EXAGGERATED VERSION for tuning:
 *  - held   → very high focus/clarity, low distortion
 *  - mostly → mid–high focus/clarity, mid distortion
 *  - struggled → low focus/clarity, high distortion
 */
function accuracyValueToTransient(accuracyValue) {
  // clamp just in case
  const v = Math.max(0, Math.min(1, accuracyValue));

  // EXAGGERATED curves
  const focus = 0.1 + v * 0.9;       // 0.1 → 1.0
  const clarity = 0.05 + v * 0.95;   // 0.05 → 1.0
  const distortion = 0.9 - v * 0.8;  // 0.9 → 0.1

  return {
    focus: Math.max(0, Math.min(1, focus)),
    clarity: Math.max(0, Math.min(1, clarity)),
    distortion: Math.max(0, Math.min(1, distortion)),
  };
}


/**
 * Core entry point:
 * call this whenever a practice session is completed OR we emit a live "transient"
 * update from the breathing timer.
 *
 * @param {Object} params
 * @param {string} [params.dateISO]    - ISO timestamp of session end
 * @param {number} [params.durationMinutes]
 * @param {"held"|"mostly"|"struggled"} params.accuracy
 * @param {boolean} [params.transient] - if true, only update short-term `transient`
 * @param {number} [params.timestamp]  - ms timestamp for transient updates
 */
export function recordPracticeEffect({
  dateISO,
  durationMinutes,
  accuracy,
  transient = false,
  timestamp,
}) {
  const state = loadMandalaState();
  const accuracyValue = accuracyLabelToValue(accuracy);

  // ----- live / transient-only updates -----
  if (transient) {
    const { focus, clarity, distortion } = accuracyValueToTransient(accuracyValue);

    const nextState = {
      ...state,
      transient: {
        ...state.transient,
        focus,
        clarity,
        distortion,
        lastUpdated:
          timestamp != null
            ? timestamp
            : typeof Date !== "undefined"
            ? Date.now()
            : null,
      },
    };

    saveMandalaState(nextState);
    return nextState;
  }

  // ----- full session aggregation -----

  const nowISO = dateISO || new Date().toISOString();
  const todayKey = getTodayKey(nowISO);
  const weekStartKey = getWeekStartKey(nowISO);

  // long-term aggregates
  const newTotalSessions = state.totalSessions + 1;
  const newTotalMinutes = state.totalMinutes + (durationMinutes || 0);

  const prevAvg = state.avgAccuracy || 0;
  const newAvgAccuracy =
    (prevAvg * state.totalSessions + accuracyValue) / newTotalSessions;

  // daily accuracy aggregation
  let dailyAccuracy = state.dailyAccuracy || 0;
  let dailyCount = state.dailyCount || 0;
  let lastAccuracyDate = state.lastAccuracyDate;

  if (lastAccuracyDate === todayKey) {
    // same day: blend
    const totalCount = dailyCount + 1;
    dailyAccuracy = (dailyAccuracy * dailyCount + accuracyValue) / totalCount;
    dailyCount = totalCount;
  } else {
    // new day
    dailyAccuracy = accuracyValue;
    dailyCount = 1;
    lastAccuracyDate = todayKey;
  }

  // weekly consistency
  let weekStartDate = state.weekStartDate;
  let sessionsThisWeek = state.sessionsThisWeek || 0;

  if (weekStartDate === weekStartKey) {
    sessionsThisWeek += 1;
  } else {
    weekStartDate = weekStartKey;
    sessionsThisWeek = 1;
  }

  // Assume "consistent" week = 4 sessions; clamp to [0,1]
  const weeklyConsistency = Math.max(
    0,
    Math.min(1, sessionsThisWeek / 4)
  );

  // phase progression based on lifetime sessions
  const phase = computePhase(newTotalSessions);

  const nextState = {
    ...state,
    totalSessions: newTotalSessions,
    totalMinutes: newTotalMinutes,
    avgAccuracy: newAvgAccuracy,

    dailyAccuracy,
    dailyCount,
    lastAccuracyDate,

    weekStartDate,
    sessionsThisWeek,
    weeklyConsistency,

    phase,
  };

  saveMandalaState(nextState);
  return nextState;
}
