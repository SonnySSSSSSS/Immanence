// src/data/stillnessIntensityMeta.js
// Canonical stillness focus-intensity level definitions.
//
// Single source of truth for all intensity-level text across:
//   - StillnessRingSession.jsx  → uses .copy  (short phrase shown in ring overlay)
//   - BreathPracticeCard.jsx    → uses .label (word shown in collapsed summary)
//                                 uses .prompt (sentence shown in pre-session card)
//
// SEMANTIC NOTE: focusIntensity describes attentional effort during stillness
// focus/rest intervals — how sharply the user is asked to concentrate.
// It is NOT related to breath speed, breath smoothness, or respiratory pacing.
// Breath-phase style/quality is a separate concept; see phaseInstructions in uiStore.

export const STILLNESS_INTENSITY_META = {
  light: {
    label: 'Light',
    copy: 'Conversation focus',
    prompt: 'Hold the kind of focus you would use in a normal conversation.',
  },
  medium: {
    label: 'Medium',
    copy: 'Remember a spoken list',
    prompt: 'Hold the focus you would use to remember a spoken list.',
  },
  heavy: {
    label: 'Heavy',
    copy: 'Hear a whisper',
    prompt: 'Hold the focus you would use to catch a whisper.',
  },
};
