const STAGE_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

export const AVATAR_STAGE_ASSETS = {
  seedling: {
    wallpaper: '/bg/bg-seedling-bottom.webp',
    background: '/assets/avatar/background.webp',
    runeRing: '/assets/avatar/rune ring.webp',
    glassRing: '/assets/avatar/glass ring.webp',
    plantForeground: '/assets/avatar/seedling.webp',
  },
  ember: {
    wallpaper: '/bg/bg-ember-bottom.webp',
    background: '/assets/avatar/ember background.webp',
    runeRing: '/assets/avatar/ember rune ring.webp',
    glassRing: '/assets/avatar/ember glass ring.webp',
    plantForeground: '/assets/avatar/ember.webp',
  },
  flame: {
    wallpaper: '/bg/bg-flame-bottom.webp',
    background: '/assets/avatar/flame background.webp',
    runeRing: '/assets/avatar/flame rune ring.webp',
    glassRing: '/assets/avatar/flame glass ring.webp',
    plantForeground: '/assets/avatar/flame.webp',
  },
  beacon: {
    wallpaper: '/bg/bg-beacon-bottom.webp',
    background: '/assets/avatar/beacon background.webp',
    runeRing: '/assets/avatar/beacon rune ring.webp',
    glassRing: '/assets/avatar/beacon glass ring.webp',
    plantForeground: '/assets/avatar/beacon.webp',
  },
  stellar: {
    wallpaper: '/bg/bg-stellar-bottom.webp',
    background: '/assets/avatar/stellar background.webp',
    runeRing: '/assets/avatar/stellar rune ring.webp',
    glassRing: '/assets/avatar/stellar glass ring.webp',
    plantForeground: '/assets/avatar/stellar.webp',
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
