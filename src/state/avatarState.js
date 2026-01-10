// src/state/avatarState.js
// Canonical AvatarState derived model
// Aggregates mandala snapshot data into a single coherent state for avatar components

import { getMandalaState } from './mandalaStore.js';

/**
 * Clamp a number to the range [0, 1]
 */
export const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Derive a canonical AvatarState from mandala snapshot and current context.
 * 
 * @param {Object} params
 * @param {string} params.mode - Avatar display mode ('hub', 'practice', etc.)
 * @param {Object} params.breathPattern - Current breath pattern (if any)
 * @param {Object} params.snapshot - Optional pre-loaded snapshot (otherwise fetches from store)
 * @returns {Object} AvatarState with coherence, stageIndex, phase, metrics, etc.
 */
export function deriveAvatarState({ mode, breathPattern, snapshot = null }) {
  // Load snapshot from store if not provided
  const mandalaSnapshot = snapshot || getMandalaState();

  // Phase: user's developmental stage (not session state)
  // Comes from persisted snapshot, defaults to "foundation"
  const phase = mandalaSnapshot?.stage || 'foundation';

  // Metrics: raw values from snapshot
  const avgAccuracy = mandalaSnapshot?.avgAccuracy || 0;
  const weeklyConsistency = mandalaSnapshot?.weeklyConsistency || 0;
  const totalSessions = mandalaSnapshot?.totalSessions || 0;
  const weeklyPracticeLog = mandalaSnapshot?.weeklyPracticeLog || [false, false, false, false, false, false, false];

  // Transient signals: live resonance from current practice
  const focus = mandalaSnapshot?.transient?.focus || 0;
  const clarity = mandalaSnapshot?.transient?.clarity || 0;
  const distortion = mandalaSnapshot?.transient?.distortion || 0;

  // Coherence: deterministic heuristic (no LLM)
  // Formula:
  //   base = 0.55*avgAccuracy + 0.45*weeklyConsistency
  //   signal = 0.5*(focus + clarity)
  //   penalty = distortion
  //   coherenceRaw = 0.55*base + 0.45*signal - 0.25*penalty
  //   coherence = clamp01(coherenceRaw)
  const base = 0.55 * avgAccuracy + 0.45 * weeklyConsistency;
  const signal = 0.5 * (focus + clarity);
  const penalty = distortion;
  const coherenceRaw = 0.55 * base + 0.45 * signal - 0.25 * penalty;
  const coherence = clamp01(coherenceRaw);

  // StageIndex: map coherence to 0..4
  // [0.00–0.15) = 0 SEEDLING
  // [0.15–0.35) = 1 EMBER
  // [0.35–0.55) = 2 FLAME
  // [0.55–0.80) = 3 BEACON
  // [0.80–1.00] = 4 STELLAR
  let stageIndex = 0;
  if (coherence >= 0.80) stageIndex = 4;
  else if (coherence >= 0.55) stageIndex = 3;
  else if (coherence >= 0.35) stageIndex = 2;
  else if (coherence >= 0.15) stageIndex = 1;
  else stageIndex = 0;

  const STAGE_NAMES = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];
  const stageName = STAGE_NAMES[stageIndex];

  // Labels: human-readable derived values
  const accuracyPct = Math.round(avgAccuracy * 100);
  const consistencyPct = Math.round(weeklyConsistency * 100);

  // Accuracy label (loose/mixed/tight)
  let accLabel = 'loose';
  if (avgAccuracy >= 0.75) accLabel = 'tight';
  else if (avgAccuracy >= 0.45) accLabel = 'mixed';

  // Weekly label (sporadic/warming/steady)
  let wkLabel = 'sporadic';
  if (weeklyConsistency >= 0.75) wkLabel = 'steady';
  else if (weeklyConsistency >= 0.40) wkLabel = 'warming';

  return {
    mode,
    phase,
    metrics: {
      avgAccuracy,
      weeklyConsistency,
      totalSessions,
      weeklyPracticeLog,
    },
    transient: {
      focus,
      clarity,
      distortion,
    },
    coherence,
    stageIndex,
    stage: stageName,
    labels: {
      accuracyPct,
      consistencyPct,
      accLabel,
      wkLabel,
    },
    breathPattern: breathPattern || null,
  };
}

/**
 * React hook version of deriveAvatarState (optional convenience wrapper)
 * Note: This does NOT use Zustand; it's just a helper that calls deriveAvatarState
 * 
 * @param {Object} params - Same as deriveAvatarState
 * @returns {Object} AvatarState
 */
export function useAvatarState({ mode, breathPattern }) {
  // In a real implementation, you might want to use useSyncExternalStore
  // or a Zustand store. For now, this is a simple wrapper.
  return deriveAvatarState({ mode, breathPattern });
}
