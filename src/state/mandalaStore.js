// src/state/mandalaStore.js

import { useProgressStore } from "./progressStore.js";
import { getDateKey, getWeekStart } from "../utils/dateUtils.js";

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
 * Sync mandala state from progressStore.
 * Call this after app load or when sessions change.
 * This allows progressStore to be the single source of truth.
 */
export function syncFromProgressStore() {
  // useProgressStore is imported at top level
  const { sessions } = useProgressStore.getState();

  if (!sessions || sessions.length === 0) {
    return getMandalaState();
  }

  const state = loadMandalaState();
  const now = new Date();
  const todayKey = getDateKey(now);
  const weekStartKey = getDateKey(getWeekStart(now));

  // Filter breathwork sessions (the ones with accuracy data)
  const breathworkSessions = sessions.filter(s => s.domain === 'breathwork');

  // Calculate total sessions and minutes
  const totalSessions = breathworkSessions.length;
  const totalMinutes = breathworkSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Calculate average accuracy from sessions with accuracy data
  const accuracies = breathworkSessions
    .map(s => s.metadata?.accuracy)
    .filter(a => typeof a === 'number');
  const avgAccuracy = accuracies.length > 0
    ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
    : state.avgAccuracy;

  // Calculate daily accuracy
  const todaySessions = breathworkSessions.filter(s => s.dateKey === todayKey);
  const todayAccuracies = todaySessions
    .map(s => s.metadata?.accuracy)
    .filter(a => typeof a === 'number');
  const dailyAccuracy = todayAccuracies.length > 0
    ? todayAccuracies.reduce((a, b) => a + b, 0) / todayAccuracies.length
    : 0;

  // Calculate weekly consistency
  const weekSessions = breathworkSessions.filter(s => s.dateKey >= weekStartKey);
  const uniqueDays = new Set(weekSessions.map(s => s.dateKey)).size;
  const weeklyConsistency = Math.min(1, uniqueDays / 4); // 4 days = 100%

  // Weekly practice log (Mon-Sun)
  const weeklyPracticeLog = [];
  const mondayDate = new Date(weekStartKey);
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(mondayDate);
    dayDate.setDate(mondayDate.getDate() + i);
    const dayKey = getDateKey(dayDate);
    weeklyPracticeLog.push(weekSessions.some(s => s.dateKey === dayKey));
  }

  // Phase based on total sessions
  const phase = computePhase(totalSessions);

  const syncedState = {
    ...state,
    totalSessions,
    totalMinutes,
    avgAccuracy,
    dailyAccuracy,
    dailyCount: todaySessions.length,
    lastAccuracyDate: todayKey,
    weekStartDate: weekStartKey,
    sessionsThisWeek: weekSessions.length,
    weeklyConsistency,
    weeklyPracticeLog,
    phase
  };

  saveMandalaState(syncedState);
  return syncedState;
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
  const todayKey = getDateKey(nowISO);
  const weekStartKey = getDateKey(getWeekStart(nowISO));

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
