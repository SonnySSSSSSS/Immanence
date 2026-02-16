import test from 'node:test';
import assert from 'node:assert/strict';

import { getStageAssets } from '../src/config/avatarStageAssets.js';

const EXPECTED = {
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

test('getStageAssets returns expected stage mappings', () => {
  assert.deepEqual(getStageAssets('seedling'), EXPECTED.seedling);
  assert.deepEqual(getStageAssets('ember'), EXPECTED.ember);
  assert.deepEqual(getStageAssets('flame'), EXPECTED.flame);
  assert.deepEqual(getStageAssets('beacon'), EXPECTED.beacon);
  assert.deepEqual(getStageAssets('stellar'), EXPECTED.stellar);
});

test('getStageAssets is case-insensitive', () => {
  assert.deepEqual(getStageAssets('Flame'), EXPECTED.flame);
  assert.deepEqual(getStageAssets('STELLAR'), EXPECTED.stellar);
});

test('getStageAssets falls back to seedling', () => {
  assert.deepEqual(getStageAssets('unknown-stage'), EXPECTED.seedling);
  assert.deepEqual(getStageAssets(null), EXPECTED.seedling);
  assert.deepEqual(getStageAssets(undefined), EXPECTED.seedling);
});
