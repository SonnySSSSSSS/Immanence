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
    glass: { enabled: true, opacity: 0.23, scale: 1.6, rotateDeg: 0, x: -4, y: 11, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.58, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
  },
  flame: {
    bg: { enabled: true, opacity: 1, scale: 1.74, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 2, y: 17, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.24, scale: 1.73, rotateDeg: 0, x: 3, y: 9, linkTo: null, linkOpacity: false },
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
    stage: { enabled: true, opacity: 1, scale: 1.15, rotateDeg: 0, x: 3, y: 10, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.13, scale: 1.5, rotateDeg: 0, x: 0, y: 7, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1.6, rotateDeg: 0, x: 0, y: 4, linkTo: null, linkOpacity: false },
  },
};

// Light-mode presets — neutral baseline, tune via DevPanel in light mode.
const LIGHT_STAGE_PRESETS = {
  seedling: {
    bg: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.25, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
  },
  ember: {
    bg: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.23, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
  },
  flame: {
    bg: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.24, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
  },
  beacon: {
    bg: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.23, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
  },
  stellar: {
    bg: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    stage: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    glass: { enabled: true, opacity: 0.13, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
    ring: { enabled: true, opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0, linkTo: null, linkOpacity: false },
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
