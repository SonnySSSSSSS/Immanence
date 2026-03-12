// src/data/breathPhasesMeta.js
// Canonical breath benchmark phase definitions — single source of truth for phase
// keys, display labels, and benchmark-time stop-condition hints.
//
// NAMING NOTE — two naming conventions exist in this codebase:
//
//   Data-layer names (used here and in breathPresets, breathBenchmarkStore):
//     inhale | hold1 | exhale | hold2
//
//   Ring/render-layer names (used in BreathingRing and ring renderer props):
//     inhale | holdTop | exhale | holdBottom
//
// The sole translation boundary between these two conventions is
// useBreathSessionState.js. Any phaseInstructions metadata declared
// in the data layer must use data-layer names (inhale, hold1, exhale, hold2).

export const BENCHMARK_PHASES = [
  {
    key: 'inhale',
    label: 'Inhale',
    hint: 'Breathe in until you reach your comfortable limit.',
  },
  {
    key: 'hold1',
    label: 'Hold In',
    hint: 'Hold with lungs full while staying relaxed.',
  },
  {
    key: 'exhale',
    label: 'Exhale',
    hint: 'Release slowly until empty.',
  },
  {
    key: 'hold2',
    label: 'Hold Out',
    hint: 'Pause empty without strain.',
  },
];
