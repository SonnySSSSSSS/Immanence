export function quantizePatternToMusicStrict(pattern, bpm) {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    return pattern;
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const songBeatSec = 60 / bpm;
  const k = clamp(Math.round(bpm / 60), 1, 4);
  const gridSec = k * songBeatSec;

  const quantizePhase = (duration) => {
    const n = Math.max(1, Math.floor(duration / gridSec));
    return n * gridSec;
  };

  return {
    inhale: quantizePhase(pattern.inhale),
    hold1: quantizePhase(pattern.hold1),
    exhale: quantizePhase(pattern.exhale),
    hold2: quantizePhase(pattern.hold2),
  };
}
