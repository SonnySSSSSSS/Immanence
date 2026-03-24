// PROBE:avatar-scheme-isolation:START
// avatarStageAssets.js is ASSET-ONLY. It maps stage+scheme to image asset paths.
// It does not hold, build, or merge avatar transform/layer state.
// It is not a contamination owner for the light/dark scheme isolation bug.
// The light/dark asset tables (DARK_STAGE_ASSETS, LIGHT_STAGE_ASSETS) are
// plain data objects with no shared references and no state-bearing logic.
// PROBE:avatar-scheme-isolation:END

const STAGE_KEYS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

const DARK_STAGE_ASSETS = {
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

const LIGHT_STAGE_ASSETS = {
  seedling: {
    wallpaper: '/bg/seedling_light_clouds.webp',
    background: '/assets/avatar/light background.webp',
    runeRing: '/assets/avatar/light rune ring.webp',
    glassRing: '/assets/avatar/glass ring.webp',
    plantForeground: '/assets/avatar/light seedling.webp',
  },
  ember: {
    wallpaper: '/bg/ember_light_clouds.webp',
    background: '/assets/avatar/light ember background.webp',
    runeRing: '/assets/avatar/light ember rune ring.webp',
    glassRing: '/assets/avatar/ember glass ring.webp',
    plantForeground: '/assets/avatar/light ember.webp',
  },
  flame: {
    wallpaper: '/bg/flame_light_clouds.webp',
    background: '/assets/avatar/light flame background.webp',
    runeRing: '/assets/avatar/light flame rune ring.webp',
    glassRing: '/assets/avatar/flame glass ring.webp',
    plantForeground: '/assets/avatar/light flame.webp',
  },
  beacon: {
    wallpaper: '/bg/beacon_light_clouds.webp',
    background: '/assets/avatar/light beacon background.webp',
    runeRing: '/assets/avatar/light beacon rune ring.webp',
    glassRing: '/assets/avatar/beacon glass ring.webp',
    plantForeground: '/assets/avatar/light beacon.webp',
  },
  stellar: {
    wallpaper: '/bg/stellar_light_clouds.webp',
    background: '/assets/avatar/light stellar background.webp',
    runeRing: '/assets/avatar/light stellar rune ring.webp',
    glassRing: '/assets/avatar/stellar glass ring.webp',
    plantForeground: '/assets/avatar/light stellar.webp',
  },
};

// Keep AVATAR_STAGE_ASSETS as the canonical dark table for backward compat
export const AVATAR_STAGE_ASSETS = DARK_STAGE_ASSETS;

export function normalizeStageKey(stage) {
  if (typeof stage !== 'string') return 'seedling';
  const normalized = stage.trim().toLowerCase();
  return STAGE_KEYS.includes(normalized) ? normalized : 'seedling';
}

export function getStageAssets(stage, colorScheme = 'dark') {
  const stageKey = normalizeStageKey(stage);
  const table = colorScheme === 'light' ? LIGHT_STAGE_ASSETS : DARK_STAGE_ASSETS;
  return table[stageKey] || table.seedling;
}
