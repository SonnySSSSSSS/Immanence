import { useEffect, useMemo, useRef, useState } from 'react';
import { useProgressStore } from './progressStore.js';
import { getDateKey, getWeekStart } from '../utils/dateUtils.js';

const MODE_WINDOW_DAYS = 42;
const CADENCE_WINDOW_WEEKS = 26;
const MIN_QUALIFYING_MINUTES = 3;
const MIN_SESSIONS_PER_WEEK = 3;

// ═══════════════════════════════════════════════════════════════════════════
// STAGE COMPUTATION — PLACEHOLDER LOGIC
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ WARNING: This is structural scaffolding, NOT final logic.
//
// Final implementation MUST enforce:
//   1. Cadence-based consistency (e.g., "3+ sessions/week for N weeks")
//   2. Foundation criteria per session (minimum duration, completion)
//   3. Regression when cadence drops below threshold
//
// Current logic uses simplified cadence + duration filters.
// DO NOT ship to production without rigorous prerequisite definitions.
//
// ═══════════════════════════════════════════════════════════════════════════
const STAGE_PREREQUISITES = {
  seedling: { minQualifyingSessions: 0, minCadenceWeeks: 0 },
  ember: { minQualifyingSessions: 7, minCadenceWeeks: 2 },
  flame: { minQualifyingSessions: 30, minCadenceWeeks: 4 },
  beacon: { minQualifyingSessions: 90, minCadenceWeeks: 12 },
  stellar: { minQualifyingSessions: 180, minCadenceWeeks: 26 },
};

const BREATH_PRESET_TO_MODE = {
  box: 'haptic',
  '4-7-8': 'haptic',
  kumbhaka: 'ritual',
  relax: 'haptic',
  energy: 'haptic',
  resonance: 'sonic',
  humming: 'sonic',
  toning: 'sonic',
  pranayama: 'ritual',
  'nadi shodhana': 'ritual',
  kapalabhati: 'ritual',
};

const PRACTICE_ID_TO_MODE = {
  photic: 'photic',
  visualization: 'photic',
  perception: 'photic',

  sound: 'sonic',
  cymatics: 'sonic',
  resonance: 'sonic',

  ritual: 'ritual',
  integration: 'ritual',
  circuit: 'ritual',
  'circuit-training': 'ritual',

  somatic_vipassana: 'haptic',
  cognitive_vipassana: 'haptic',
  feeling: 'haptic',
  awareness: 'haptic',
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const normalizeWeights = (weights) => {
  const photic = clamp01(weights.photic || 0);
  const haptic = clamp01(weights.haptic || 0);
  const sonic = clamp01(weights.sonic || 0);
  const ritual = clamp01(weights.ritual || 0);
  const total = photic + haptic + sonic + ritual;
  if (!total) {
    return { photic: 0.25, haptic: 0.25, sonic: 0.25, ritual: 0.25 };
  }
  return {
    photic: photic / total,
    haptic: haptic / total,
    sonic: sonic / total,
    ritual: ritual / total,
  };
};

const resolveSessionTimestamp = (session) => {
  const raw =
    session?.endedAt ||
    session?.startedAt ||
    session?.date ||
    (session?.dateKey ? `${session.dateKey}T00:00:00` : null);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveSessionDurationMinutes = (session) => {
  if (typeof session?.durationSec === 'number') {
    return session.durationSec / 60;
  }
  if (typeof session?.duration === 'number') {
    return session.duration;
  }
  if (typeof session?.durationMinutes === 'number') {
    return session.durationMinutes;
  }
  return 0;
};

const resolveBreathMode = (session) => {
  const preset =
    session?.configSnapshot?.breathPreset ||
    session?.metadata?.breathPreset ||
    session?.metadata?.subType ||
    null;
  if (typeof preset !== 'string') return 'haptic';
  const key = preset.trim().toLowerCase();
  return BREATH_PRESET_TO_MODE[key] || 'haptic';
};

const resolveModeFromSession = (session) => {
  const practiceId = session?.practiceId ? String(session.practiceId).toLowerCase() : '';
  const domain = session?.domain ? String(session.domain).toLowerCase() : '';

  if (practiceId.includes('breath') || domain === 'breathwork') {
    return resolveBreathMode(session);
  }

  if (PRACTICE_ID_TO_MODE[practiceId]) {
    return PRACTICE_ID_TO_MODE[practiceId];
  }

  if (domain === 'visualization') return 'photic';
  if (domain === 'sound') return 'sonic';
  if (domain === 'ritual') return 'ritual';

  return 'haptic';
};

const normalizeSessions = (sessionsV2 = [], legacySessions = []) => {
  const normalizedV2 = sessionsV2.map((session) => ({
    id: session.id,
    practiceId: session.practiceId || null,
    practiceMode: session.practiceMode || null,
    configSnapshot: session.configSnapshot || {},
    completion: session.completion || null,
    durationMinutes: resolveSessionDurationMinutes(session),
    timestamp: resolveSessionTimestamp(session),
    domain: session.domain || null,
    metadata: session.metadata || null,
  }));

  const normalizedLegacy = legacySessions.map((session) => ({
    id: session.id || null,
    practiceId: session.practiceId || null,
    practiceMode: session.practiceMode || null,
    configSnapshot: session.configSnapshot || {},
    completion: session.completion || null,
    durationMinutes: resolveSessionDurationMinutes(session),
    timestamp: resolveSessionTimestamp(session),
    domain: session.domain || null,
    metadata: session.metadata || null,
  }));

  return [...normalizedV2, ...normalizedLegacy].filter((session) => session.timestamp);
};

const computeCadenceWeeks = (sessions) => {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - CADENCE_WINDOW_WEEKS * 7);

  const weeklyCounts = new Map();

  sessions.forEach((session) => {
    const date = session.timestamp;
    if (!date || date < windowStart) return;
    const weekStart = getWeekStart(date);
    const weekKey = getDateKey(weekStart);
    weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) || 0) + 1);
  });

  let cadenceWeeks = 0;
  weeklyCounts.forEach((count) => {
    if (count >= MIN_SESSIONS_PER_WEEK) cadenceWeeks += 1;
  });

  return cadenceWeeks;
};

const computeStage = ({ qualifyingSessions, cadenceWeeks }) => {
  const stages = ['stellar', 'beacon', 'flame', 'ember', 'seedling'];
  for (const stage of stages) {
    const req = STAGE_PREREQUISITES[stage];
    if (qualifyingSessions >= req.minQualifyingSessions && cadenceWeeks >= req.minCadenceWeeks) {
      return stage;
    }
  }
  return 'seedling';
};

const computeModeWeights = (sessions) => {
  const cutoff = Date.now() - MODE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const counts = { photic: 0, haptic: 0, sonic: 0, ritual: 0 };

  sessions.forEach((session) => {
    const timestamp = session.timestamp?.getTime?.() || 0;
    if (!timestamp || timestamp < cutoff) return;

    const mode = resolveModeFromSession(session);
    const duration = Math.max(1, session.durationMinutes || 1);
    counts[mode] += duration;
  });

  return normalizeWeights(counts);
};

const getLatestCompletionTimestamp = (sessions) => {
  const completed = sessions
    .filter((session) => session.completion === 'completed')
    .map((session) => session.timestamp?.getTime?.() || 0)
    .filter(Boolean)
    .sort((a, b) => a - b);

  return completed.length ? completed[completed.length - 1] : null;
};

const isQualifyingSession = (session) => {
  const durationOk = (session.durationMinutes || 0) >= MIN_QUALIFYING_MINUTES;
  const completed = session.completion ? session.completion === 'completed' : true;
  return durationOk && completed;
};

export function useAvatarV3State() {
  const sessionsV2 = useProgressStore((s) => s.sessionsV2 || []);
  const legacySessions = useProgressStore((s) => s.sessions || []);

  const sessions = useMemo(
    () => normalizeSessions(sessionsV2, legacySessions),
    [sessionsV2, legacySessions]
  );

  const qualifyingSessions = useMemo(
    () => sessions.filter(isQualifyingSession).length,
    [sessions]
  );

  const cadenceWeeks = useMemo(() => computeCadenceWeeks(sessions), [sessions]);
  const stage = useMemo(
    () => computeStage({ qualifyingSessions, cadenceWeeks }),
    [qualifyingSessions, cadenceWeeks]
  );

  const modeWeights = useMemo(() => computeModeWeights(sessions), [sessions]);

  const [lastStageChange, setLastStageChange] = useState(null);
  const [lastModeChange, setLastModeChange] = useState(null);
  const [lastSessionComplete, setLastSessionComplete] = useState(null);

  const stageRef = useRef(stage);
  const weightsRef = useRef(modeWeights);
  const completionRef = useRef(null);

  useEffect(() => {
    if (stageRef.current !== stage) {
      stageRef.current = stage;
      setLastStageChange(Date.now());
    }
  }, [stage]);

  useEffect(() => {
    const weightsChanged = Object.keys(modeWeights).some(
      (key) => Math.abs(modeWeights[key] - (weightsRef.current?.[key] ?? 0)) > 0.001
    );
    if (weightsChanged) {
      weightsRef.current = modeWeights;
      setLastModeChange(Date.now());
    }
  }, [modeWeights]);

  useEffect(() => {
    const latestCompletion = getLatestCompletionTimestamp(sessions);
    if (latestCompletion && completionRef.current !== latestCompletion) {
      completionRef.current = latestCompletion;
      setLastSessionComplete(latestCompletion);
    }
  }, [sessions]);

  return {
    stage,
    modeWeights,
    qualifyingSessions,
    cadenceWeeks,
    lastStageChange,
    lastModeChange,
    lastSessionComplete,
  };
}
