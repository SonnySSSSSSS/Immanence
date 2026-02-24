const LAYER_IDS = ['bg', 'stage', 'glass', 'ring'];
const DEFAULT_LAYER = {
  enabled: true,
  opacity: 1,
  scale: 1,
  rotateDeg: 0,
  x: 0,
  y: 0,
  linkTo: null,
  linkOpacity: false,
};

function createDefaultStage() {
  const transforms = {};
  LAYER_IDS.forEach((layerId) => {
    transforms[layerId] = { ...DEFAULT_LAYER };
  });
  return transforms;
}

export const DEFAULT_AVATAR_PRESETS = {
  seedling: createDefaultStage(),
  ember: createDefaultStage(),
  flame: createDefaultStage(),
  beacon: createDefaultStage(),
  stellar: createDefaultStage(),
};
