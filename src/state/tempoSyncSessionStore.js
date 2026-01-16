import { create } from 'zustand';

/**
 * tempoSyncSessionStore - Runtime state for tempo-synced breath practice sessions
 *
 * Manages:
 * - 3-phase cap schedule (50% → 75% → 90% ramping)
 * - Beat counting per segment
 * - Effective phase durations (scaled by cap)
 */

const SEGMENT_CAPS = [0.5, 0.75, 0.9]; // Phase 1, 2, 3

export const useTempoSyncSessionStore = create((set, get) => ({
  // Session active state
  isActive: false,

  // Segment state
  segmentIndex: 0,           // 0, 1, or 2
  segmentCap: 0.5,           // Current cap multiplier
  segmentElapsedSec: 0,      // Elapsed time in current segment
  segmentDurationSec: 0,     // Duration of each segment (songDuration / 3)

  // Beat counting
  segmentBeatCount: 0,       // X - beats detected in current segment
  segmentBeatTotal: 0,       // Y - expected beats for segment

  // Phase durations
  maxPhaseDurations: {       // User's configured max values
    inhale: 4,
    exhale: 4,
    holdIn: 4,
    holdOut: 4,
  },
  effectivePhaseDurations: { // Scaled by cap
    inhale: 2,
    exhale: 2,
    holdIn: 2,
    holdOut: 2,
  },

  // Song info (cached from tempoAudioStore)
  songDurationSec: null,

  // Actions
  startSession: (songDurationSec, maxDurations, bpm) => {
    const segmentDurationSec = songDurationSec / 3;
    const segmentBeatTotal = Math.max(1, Math.round(segmentDurationSec * (bpm / 60)));
    const cap = SEGMENT_CAPS[0];

    set({
      isActive: true,
      songDurationSec,
      segmentIndex: 0,
      segmentCap: cap,
      segmentElapsedSec: 0,
      segmentDurationSec,
      segmentBeatCount: 0,
      segmentBeatTotal,
      maxPhaseDurations: { ...maxDurations },
      effectivePhaseDurations: {
        inhale: maxDurations.inhale * cap,
        exhale: maxDurations.exhale * cap,
        holdIn: maxDurations.holdIn * cap,
        holdOut: maxDurations.holdOut * cap,
      },
    });
  },

  endSession: () => {
    set({
      isActive: false,
      segmentIndex: 0,
      segmentCap: 0.5,
      segmentElapsedSec: 0,
      segmentDurationSec: 0,
      segmentBeatCount: 0,
      segmentBeatTotal: 0,
      songDurationSec: null,
    });
  },

  // Update elapsed time and potentially advance segment
  updateElapsed: (totalElapsedSec, bpm) => {
    const { isActive, songDurationSec, segmentDurationSec, segmentIndex, maxPhaseDurations } = get();
    if (!isActive || !songDurationSec || segmentDurationSec <= 0) return;

    // Determine which segment we're in
    const newSegmentIndex = Math.min(2, Math.floor(totalElapsedSec / segmentDurationSec));
    const segmentElapsedSec = totalElapsedSec - (newSegmentIndex * segmentDurationSec);

    // Only update state if segment changed
    if (newSegmentIndex !== segmentIndex) {
      const cap = SEGMENT_CAPS[newSegmentIndex];
      const segmentBeatTotal = Math.max(1, Math.round(segmentDurationSec * (bpm / 60)));

      set({
        segmentIndex: newSegmentIndex,
        segmentCap: cap,
        segmentElapsedSec,
        segmentBeatCount: 0, // Reset beat count for new segment
        segmentBeatTotal,
        effectivePhaseDurations: {
          inhale: maxPhaseDurations.inhale * cap,
          exhale: maxPhaseDurations.exhale * cap,
          holdIn: maxPhaseDurations.holdIn * cap,
          holdOut: maxPhaseDurations.holdOut * cap,
        },
      });
    } else {
      set({ segmentElapsedSec });
    }
  },

  // Called on each detected beat
  incrementBeatCount: () => {
    const { isActive } = get();
    if (!isActive) return;
    set(state => ({ segmentBeatCount: state.segmentBeatCount + 1 }));
  },

  // Update max durations (when user changes settings)
  setMaxPhaseDurations: (maxDurations) => {
    const { segmentCap, isActive } = get();
    set({
      maxPhaseDurations: { ...maxDurations },
      effectivePhaseDurations: isActive ? {
        inhale: maxDurations.inhale * segmentCap,
        exhale: maxDurations.exhale * segmentCap,
        holdIn: maxDurations.holdIn * segmentCap,
        holdOut: maxDurations.holdOut * segmentCap,
      } : { ...maxDurations },
    });
  },

  // Recalculate beat total when BPM changes
  updateBpmDerived: (bpm) => {
    const { isActive, segmentDurationSec } = get();
    if (!isActive || segmentDurationSec <= 0) return;
    const segmentBeatTotal = Math.max(1, Math.round(segmentDurationSec * (bpm / 60)));
    set({ segmentBeatTotal });
  },
}));
