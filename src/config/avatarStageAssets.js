const STAGE_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

export const AVATAR_STAGE_ASSETS = {
  seedling: {
    wallpaper: '/bg/bg-seedling-bottom.png',
    background: '/assets/avatar/background.png',
    runeRing: '/assets/avatar/rune ring.png',
    glassRing: '/assets/avatar/glass ring.png',
    plantForeground: '/assets/avatar/seedling.png',
  },
  ember: {
    wallpaper: '/bg/bg-ember-bottom.png',
    background: '/assets/avatar/ember background.png',
    runeRing: '/assets/avatar/ember rune ring.png',
    glassRing: '/assets/avatar/ember glass ring.png',
    plantForeground: '/assets/avatar/ember.png',
  },
  flame: {
    wallpaper: '/bg/bg-flame-bottom.png',
    background: '/assets/avatar/flame background.png',
    runeRing: '/assets/avatar/flame rune ring.png',
    glassRing: '/assets/avatar/flame glass ring.png',
    plantForeground: '/assets/avatar/flame.png',
  },
  beacon: {
    wallpaper: '/bg/bg-beacon-bottom.png',
    background: '/assets/avatar/beacon background.png',
    runeRing: '/assets/avatar/beacon rune ring.png',
    glassRing: '/assets/avatar/beacon glass ring.png',
    plantForeground: '/assets/avatar/beacon.png',
  },
  stellar: {
    wallpaper: '/bg/bg-stellar-bottom.png',
    background: '/assets/avatar/stellar background.png',
    runeRing: '/assets/avatar/stellar rune ring.png',
    glassRing: '/assets/avatar/stellar glass ring.png',
    plantForeground: '/assets/avatar/stellar.png',
  },
};

export function normalizeStageKey(stage) {
  if (typeof stage !== 'string') return 'seedling';
  const normalized = stage.trim().toLowerCase();
  return STAGE_KEYS.includes(normalized) ? normalized : 'seedling';
}

export function getStageAssets(stage) {
  const stageKey = normalizeStageKey(stage);
  return AVATAR_STAGE_ASSETS[stageKey] || AVATAR_STAGE_ASSETS.seedling;
}
