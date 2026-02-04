export const STAGES = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

export const STAGE_LABELS = {
  seedling: 'Seedling',
  ember: 'Ember',
  flame: 'Flame',
  beacon: 'Beacon',
  stellar: 'Stellar',
};

export const STAGE_MEANINGS = {
  seedling: 'Foundation proven.',
  ember: 'Mind obedience established.',
  flame: 'Subtle layer begins.',
  beacon: 'Deep subtle control stabilized.',
  stellar: 'Integrated coherence sustained.',
};

export const STAGE_ASSETS = {
  seedling: 'seedling_cloudiest.png',
  ember: 'ember_cloudiest.png',
  flame: 'flame_cloudiest.png',
  beacon: 'beacon_cloudiest.png',
  stellar: 'stellar_cloudiest.png',
};

export const MODE_LABELS = {
  photic: 'Photic',
  haptic: 'Haptic',
  sonic: 'Sonic',
  ritual: 'Ritual',
};

export const MODE_COLORS = {
  photic: 'rgba(110, 200, 255, 0.55)',
  haptic: 'rgba(180, 140, 90, 0.55)',
  sonic: 'rgba(120, 140, 255, 0.55)',
  ritual: 'rgba(200, 170, 255, 0.55)',
};

export const DEFAULT_MODE_WEIGHTS = {
  photic: 0.25,
  haptic: 0.25,
  sonic: 0.25,
  ritual: 0.25,
};

export const ANIMATION_DEFAULTS = {
  breathSeconds: 16,
  breathMin: 0.94,
  breathMax: 1.0,
  driftSeconds: 90,
  lensSeconds: 70,
  modeTransitionMs: 15000,
  stageTransitionMs: 1500,
  settleMs: 2000,
};

export const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const normalizeModeWeights = (weights) => {
  if (!weights || typeof weights !== 'object') return { ...DEFAULT_MODE_WEIGHTS };
  const photic = clamp01(Number(weights.photic ?? 0));
  const haptic = clamp01(Number(weights.haptic ?? 0));
  const sonic = clamp01(Number(weights.sonic ?? 0));
  const ritual = clamp01(Number(weights.ritual ?? 0));
  const total = photic + haptic + sonic + ritual;
  if (!total) return { ...DEFAULT_MODE_WEIGHTS };
  return {
    photic: photic / total,
    haptic: haptic / total,
    sonic: sonic / total,
    ritual: ritual / total,
  };
};

export const getDominantMode = (weights) => {
  const normalized = normalizeModeWeights(weights);
  return Object.keys(normalized).reduce((best, key) => (
    normalized[key] > normalized[best] ? key : best
  ), 'photic');
};
