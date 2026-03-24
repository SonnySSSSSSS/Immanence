const STAGE_PRESETS = {
  seedling: {
    bg: { enabled: true, opacity: 1, scale: 1.86, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1.49, rotateDeg: 0, x: 0, y: 9, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.25, scale: 1.6, rotateDeg: 0, x: 0, y: 6, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.72, rotateDeg: 0, x: 0, y: 8, linkTo: null, linkOpacity: false },
  },
  ember: {
    bg: { enabled: true, opacity: 1, scale: 1.53, rotateDeg: 0, x: 0, y: 8, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 9, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.23, scale: 1.6, rotateDeg: 0, x: 0, y: 11, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.58, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
  },
  flame: {
    bg: { enabled: true, opacity: 1, scale: 1.74, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 17, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.24, scale: 1.73, rotateDeg: 0, x: 0, y: 9, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.46, rotateDeg: 0, x: 0, y: 10, linkTo: null, linkOpacity: false },
  },
  beacon: {
    bg: { enabled: true, opacity: 1, scale: 1.66, rotateDeg: 0, x: 0, y: 8, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1.3, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.23, scale: 1.53, rotateDeg: 0, x: 0, y: 7, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.54, rotateDeg: 0, x: 0, y: 7, linkTo: null, linkOpacity: false },
  },
  stellar: {
    bg: { enabled: true, opacity: 1, scale: 1.57, rotateDeg: 0, x: 0, y: 13, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1.15, rotateDeg: 0, x: 0, y: 10, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.13, scale: 1.5, rotateDeg: 0, x: 0, y: 7, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.6, rotateDeg: 0, x: 0, y: 4, linkTo: null, linkOpacity: false },
  },
};

// Light-mode presets — mirrors dark values as starting baseline.
const LIGHT_STAGE_PRESETS = {
  seedling: {
    bg: { enabled: true, opacity: 1, scale: 1.86, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1.49, rotateDeg: 0, x: 0, y: 9, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.25, scale: 1.6, rotateDeg: 0, x: 0, y: 6, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.72, rotateDeg: 0, x: 0, y: 8, linkTo: null, linkOpacity: false },
  },
  ember: {
    bg: { enabled: true, opacity: 1, scale: 1.53, rotateDeg: 0, x: 0, y: 8, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 9, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.23, scale: 1.6, rotateDeg: 0, x: 0, y: 11, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.58, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
  },
  flame: {
    bg: { enabled: true, opacity: 1, scale: 1.74, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 17, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.24, scale: 1.73, rotateDeg: 0, x: 0, y: 9, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.46, rotateDeg: 0, x: 0, y: 10, linkTo: null, linkOpacity: false },
  },
  beacon: {
    bg: { enabled: true, opacity: 1, scale: 1.66, rotateDeg: 0, x: 0, y: 8, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1.3, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.23, scale: 1.53, rotateDeg: 0, x: 0, y: 7, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.54, rotateDeg: 0, x: 0, y: 7, linkTo: null, linkOpacity: false },
  },
  stellar: {
    bg: { enabled: true, opacity: 1, scale: 1.57, rotateDeg: 0, x: 0, y: 13, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1.15, rotateDeg: 0, x: 0, y: 10, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.13, scale: 1.5, rotateDeg: 0, x: 0, y: 7, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.6, rotateDeg: 0, x: 0, y: 4, linkTo: null, linkOpacity: false },
  },
};

function freezePresets(presets) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(presets).map(([stageKey, stageLayers]) => [
        stageKey,
        Object.freeze(
          Object.fromEntries(
            Object.entries(stageLayers).map(([layerKey, layer]) => [layerKey, Object.freeze({ ...layer })])
          )
        ),
      ])
    )
  );
}

export const DEFAULT_AVATAR_PRESETS = freezePresets(STAGE_PRESETS);
export const DEFAULT_AVATAR_PRESETS_LIGHT = freezePresets(LIGHT_STAGE_PRESETS);

// PROBE:avatar-scheme-isolation:START
if (import.meta.env.DEV) {
  const topLevelShared = DEFAULT_AVATAR_PRESETS === DEFAULT_AVATAR_PRESETS_LIGHT;
  const stageShared = {};
  const layerShared = {};
  const STAGE_KEYS_CHECK = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];
  const LAYER_KEYS_CHECK = ['bg', 'stage', 'glass', 'ring'];
  STAGE_KEYS_CHECK.forEach((sk) => {
    stageShared[sk] = DEFAULT_AVATAR_PRESETS[sk] === DEFAULT_AVATAR_PRESETS_LIGHT[sk];
    layerShared[sk] = {};
    LAYER_KEYS_CHECK.forEach((lk) => {
      layerShared[sk][lk] = DEFAULT_AVATAR_PRESETS[sk]?.[lk] === DEFAULT_AVATAR_PRESETS_LIGHT[sk]?.[lk];
    });
  });
  const anyStageShared = Object.values(stageShared).some(Boolean);
  const anyLayerShared = Object.values(layerShared).some((l) => Object.values(l).some(Boolean));
  // Check if VALUES are identical even when references are separate (baseline mirror situation)
  const valuesMirror = {};
  STAGE_KEYS_CHECK.forEach((sk) => {
    valuesMirror[sk] = JSON.stringify(DEFAULT_AVATAR_PRESETS[sk]) === JSON.stringify(DEFAULT_AVATAR_PRESETS_LIGHT[sk]);
  });
  const allValuesMirror = Object.values(valuesMirror).every(Boolean);
  console.info('[PROBE:avatar-scheme-isolation] avatarDefaultPresets reference check', {
    topLevelShared,
    anyStageShared,
    anyLayerShared,
    stageShared,
    layerShared,
    allValuesMirror,
    valuesMirror,
    note: allValuesMirror
      ? 'Dark and light presets have IDENTICAL VALUES \u2014 both schemes start at the same canonical defaults. ' +
        'This is intentional (baseline mirror) but means fresh state LOOKS contaminated when it is not.'
      : 'Dark and light presets have different values \u2014 canonical defaults diverge between schemes.',
  });
  if (topLevelShared || anyStageShared || anyLayerShared) {
    console.error(
      '[PROBE:avatar-scheme-isolation] CONTAMINATION: dark and light preset objects share references. ' +
      'This would cause scheme contamination at canonical default level.'
    );
  }
}
// PROBE:avatar-scheme-isolation:END
