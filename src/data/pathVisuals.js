// src/data/pathVisuals.js
// Visual parameters for path-driven avatar deformation.
// Stage controls color; path controls geometry, breath, and intensity only.

export const PATH_VISUALS = {
  Yantra: {
    sigils: {
      seedling: 'sigil_yantra_seedling.svg',
      ember: 'sigil_yantra_ember.svg',
      flame: 'sigil_yantra_flame.svg',
      beacon: 'sigil_yantra_beacon.svg',
      stellar: 'sigil_yantra_stellar.svg',
    },
    breathMin: 0.97,
    breathMax: 1.02,
    breathDuration: 20,
    bloomOpacity: 0.35,
    bloomBreathSpeed: 0.5,
    glowBlur: 6,
    glowOpacity: 0.75,
    vignetteOpacity: 0.9,
    lensIntensity: 0.18,
  },
  Kaya: {
    sigils: {
      seedling: 'sigil_kaya_seedling.svg',
      ember: 'sigil_kaya_ember.svg',
      flame: 'sigil_kaya_flame.svg',
      beacon: 'sigil_kaya_beacon.svg',
      stellar: 'sigil_kaya_stellar.svg',
    },
    breathMin: 0.88,
    breathMax: 1.08,
    breathDuration: 22,
    bloomOpacity: 0.5,
    bloomBreathSpeed: 0.5,
    glowBlur: 20,
    glowOpacity: 0.9,
    vignetteOpacity: 0.6,
    lensIntensity: 0.28,
  },
  Chitra: {
    sigils: {
      seedling: 'sigil_chitra_seedling.svg',
      ember: 'sigil_chitra_ember.svg',
      flame: 'sigil_chitra_flame.svg',
      beacon: 'sigil_chitra_beacon.svg',
      stellar: 'sigil_chitra_stellar.svg',
    },
    breathMin: 0.95,
    breathMax: 1.04,
    breathDuration: 16,
    bloomOpacity: 0.65,
    bloomBreathSpeed: 0.9,
    glowBlur: 16,
    glowOpacity: 1.0,
    vignetteOpacity: 0.5,
    lensIntensity: 0.4,
  },
  Nada: {
    sigils: {
      seedling: 'sigil_nada_seedling.svg',
      ember: 'sigil_nada_ember.svg',
      flame: 'sigil_nada_flame.svg',
      beacon: 'sigil_nada_beacon.svg',
      stellar: 'sigil_nada_stellar.svg',
    },
    breathMin: 0.92,
    breathMax: 1.06,
    breathDuration: 12,
    bloomOpacity: 0.45,
    bloomBreathSpeed: 1.4,
    glowBlur: 12,
    glowOpacity: 0.85,
    vignetteOpacity: 0.7,
    lensIntensity: 0.3,
  },
};

const getStageKey = (stage) => {
  if (!stage || typeof stage !== 'string') return 'seedling';
  const normalized = stage.trim().toLowerCase();
  return normalized || 'seedling';
};

export const getPathVisuals = (pathId, stage) => {
  if (!pathId) return null;
  const visuals = PATH_VISUALS[pathId];
  if (!visuals) return null;
  const stageKey = getStageKey(stage);
  const sigil = visuals.sigils?.[stageKey] || visuals.sigil || null;
  return { ...visuals, sigil };
};
