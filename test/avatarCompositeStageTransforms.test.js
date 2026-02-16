import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeStageKey } from '../src/config/avatarStageAssets.js';
import { migrateDevPanelState, resolveRoleTransform } from '../src/state/devPanelStore.js';

test('migration seeds legacy global avatarComposite.layers into seedling stage', () => {
  const legacyState = {
    avatarComposite: {
      enabled: true,
      showDebugOverlay: true,
      layers: {
        bg: { x: 10, y: -3, scale: 1.2 },
        stage: { opacity: 0.75, rotateDeg: 22 },
        glass: { linkTo: 'bg', linkOpacity: true },
        ring: { enabled: false, rotateDeg: 90 },
      },
    },
  };

  const migrated = migrateDevPanelState(legacyState, 1);
  const seedling = migrated.avatarComposite.transformsByStage.seedling;

  assert.equal(seedling.bg.x, 10);
  assert.equal(seedling.bg.y, -3);
  assert.equal(seedling.bg.scale, 1.2);
  assert.equal(seedling.stage.opacity, 0.75);
  assert.equal(seedling.stage.rotateDeg, 22);
  assert.equal(seedling.glass.linkTo, 'bg');
  assert.equal(seedling.glass.linkOpacity, true);
  assert.equal(seedling.ring.enabled, false);
  assert.equal(seedling.ring.rotateDeg, 90);
});

test('resolveRoleTransform prefers stage-specific transform', () => {
  const avatarComposite = {
    transformsByStage: {
      seedling: {
        bg: { x: 4, y: 0, scale: 1, rotateDeg: 0, opacity: 1, enabled: true, linkTo: null, linkOpacity: false },
        stage: { x: 0, y: 0, scale: 1, rotateDeg: 0, opacity: 1, enabled: true, linkTo: null, linkOpacity: false },
        glass: { x: 3, y: 0, scale: 1.1, rotateDeg: 0, opacity: 1, enabled: true, linkTo: null, linkOpacity: false },
        ring: { x: 0, y: 0, scale: 1, rotateDeg: 0, opacity: 1, enabled: true, linkTo: null, linkOpacity: false },
      },
      beacon: {
        glass: { x: 40, scale: 1.5, rotateDeg: 15 },
      },
    },
  };

  const resolved = resolveRoleTransform(avatarComposite, 'beacon', 'glass');
  assert.equal(resolved.x, 40);
  assert.equal(resolved.scale, 1.5);
  assert.equal(resolved.rotateDeg, 15);
});

test('resolveRoleTransform falls back to seedling when stage-specific transform missing', () => {
  const avatarComposite = {
    transformsByStage: {
      seedling: {
        bg: { x: 12, y: 2, scale: 1.3, rotateDeg: 5, opacity: 0.9, enabled: true, linkTo: null, linkOpacity: false },
        stage: { x: 0, y: 0, scale: 1, rotateDeg: 0, opacity: 1, enabled: true, linkTo: null, linkOpacity: false },
        glass: { x: 7, y: 0, scale: 1.2, rotateDeg: 0, opacity: 1, enabled: true, linkTo: null, linkOpacity: false },
        ring: { x: 0, y: 0, scale: 1, rotateDeg: 0, opacity: 1, enabled: true, linkTo: null, linkOpacity: false },
      },
    },
  };

  const resolved = resolveRoleTransform(avatarComposite, 'flame', 'bg');
  assert.equal(resolved.x, 12);
  assert.equal(resolved.scale, 1.3);
  assert.equal(resolved.rotateDeg, 5);
  assert.equal(resolved.opacity, 0.9);
});

test('normalizeStageKey handles case-insensitive stage values', () => {
  assert.equal(normalizeStageKey('Beacon'), 'beacon');
  assert.equal(normalizeStageKey('STELLAR'), 'stellar');
});
