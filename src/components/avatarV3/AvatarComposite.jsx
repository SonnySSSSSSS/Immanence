import React, { useEffect, useMemo } from 'react';
import './AvatarComposite.css';
import { useDevPanelStore } from '../../state/devPanelStore.js';
import { useAvatarPresetStore } from '../../state/avatarPresetStore.js';
import { DEFAULT_AVATAR_PRESETS } from './avatarDefaultPresets.js';
import { getDevPanelProdGate } from '../../lib/devPanelGate.js';
import { getStageAssets, normalizeStageKey } from '../../config/avatarStageAssets.js';

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
const BASE_TRANSFORM_BY_LAYER = {
  bg: { opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0 },
  stage: { opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0 },
  glass: { opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0 },
  ring: { opacity: 1, scale: 1, rotateDeg: 0, x: 0, y: 0 },
};

function handleLayerImageError(event) {
  // eslint-disable-next-line no-console
  console.error('AvatarComposite failed to load:', event?.target?.src);
}

function normalizeKey(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function sanitizeLayer(layer) {
  const source = layer && typeof layer === 'object' ? layer : {};
  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : DEFAULT_LAYER.enabled,
    opacity: typeof source.opacity === 'number' ? source.opacity : DEFAULT_LAYER.opacity,
    scale: typeof source.scale === 'number' ? source.scale : DEFAULT_LAYER.scale,
    rotateDeg: typeof source.rotateDeg === 'number' ? source.rotateDeg : DEFAULT_LAYER.rotateDeg,
    x: typeof source.x === 'number' ? source.x : DEFAULT_LAYER.x,
    y: typeof source.y === 'number' ? source.y : DEFAULT_LAYER.y,
    linkTo: typeof source.linkTo === 'string' ? normalizeKey(source.linkTo) : null,
    linkOpacity: typeof source.linkOpacity === 'boolean' ? source.linkOpacity : DEFAULT_LAYER.linkOpacity,
  };
}

function mergeLayers(rawLayers) {
  const merged = {};
  LAYER_IDS.forEach((layerId) => {
    merged[layerId] = sanitizeLayer(rawLayers?.[layerId]);
  });
  return merged;
}

function resolveEffectiveLayer(layerId, layers, stack = new Set()) {
  const layer = layers[layerId] || DEFAULT_LAYER;
  const linkTarget = normalizeKey(layer.linkTo);
  if (!linkTarget || linkTarget === layerId || !layers[linkTarget]) {
    return layer;
  }
  if (stack.has(layerId)) {
    return layer;
  }

  stack.add(layerId);
  const master = resolveEffectiveLayer(linkTarget, layers, stack);
  stack.delete(layerId);

  return {
    ...layer,
    scale: master.scale,
    rotateDeg: master.rotateDeg,
    x: master.x,
    y: master.y,
    opacity: layer.linkOpacity ? master.opacity : layer.opacity,
  };
}

function getDevStyleForLayer(layerId, layer) {
  const base = BASE_TRANSFORM_BY_LAYER[layerId] || BASE_TRANSFORM_BY_LAYER.bg;
  const opacity = layer.enabled ? base.opacity * layer.opacity : 0;
  const x = base.x + layer.x;
  const y = base.y + layer.y;
  const rotateDeg = base.rotateDeg + layer.rotateDeg;
  const scale = base.scale * layer.scale;

  return {
    opacity,
    transform: `translate(${x}px, ${y}px) rotate(${rotateDeg}deg) scale(${scale})`,
    transformOrigin: 'center center',
  };
}

function resolveSizeStyle(size) {
  if (typeof size === 'number' && Number.isFinite(size)) {
    return { width: `${size}px`, height: `${size}px` };
  }
  if (typeof size === 'string') {
    const trimmed = size.trim();
    if (trimmed && /\d/.test(trimmed)) {
      return { width: trimmed, height: trimmed };
    }
  }
  return { width: '100%', height: '100%' };
}

function resolvePublicAssetUrl(publicPath) {
  const base = import.meta.env.BASE_URL || '/';
  const baseUrl = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = String(publicPath || '').replace(/^\/+/, '');
  return `${baseUrl}${encodeURI(normalizedPath)}`;
}

function getLastPathSegment(publicPath) {
  const value = String(publicPath || '');
  const normalized = value.replace(/\/+$/, '');
  const index = normalized.lastIndexOf('/');
  return index === -1 ? normalized : normalized.slice(index + 1);
}

export function AvatarComposite({ stage, size }) {
  const normalizedStage = normalizeStageKey(stage);
  const devPanelGateEnabled = getDevPanelProdGate();
  const avatarCompositeDevState = useDevPanelStore((s) => s.avatarComposite);
  const getAvatarCompositeRoleTransform = useDevPanelStore((s) => s.getAvatarCompositeRoleTransform);
  const presetsByStage = useAvatarPresetStore((s) => s.presetsByStage);
  const ensureStagePreset = useAvatarPresetStore((s) => s.ensureStagePreset);
  const isDev = import.meta.env.DEV;
  const stageAssets = getStageAssets(normalizedStage);

  const backgroundSrc = resolvePublicAssetUrl(stageAssets.background);
  const stageSrc = resolvePublicAssetUrl(stageAssets.plantForeground);
  const glassSrc = resolvePublicAssetUrl(stageAssets.glassRing);
  const ringSrc = resolvePublicAssetUrl(stageAssets.runeRing);
  const compositeSizeStyle = resolveSizeStyle(size);
  // Apply persisted composite transforms in all runtimes (local + production),
  // so avatar presets do not depend on the devpanel URL gate.
  const useDevTransforms = Boolean(avatarCompositeDevState?.enabled);
  const showDebugOverlay = Boolean(
    devPanelGateEnabled && useDevTransforms && avatarCompositeDevState?.showDebugOverlay
  );

  useEffect(() => {
    ensureStagePreset(normalizedStage);
  }, [ensureStagePreset, normalizedStage]);

  // Dev-only visual probe to confirm AvatarComposite is re-rendering from store updates.
  const PROBE = isDev ? (avatarCompositeDevState?.enabled ? 'red' : 'blue') : null;

  const baseLayers = useMemo(() => {
    if (useDevTransforms) {
      const stageLayers = {};
      LAYER_IDS.forEach((layerId) => {
        stageLayers[layerId] = getAvatarCompositeRoleTransform(normalizedStage, layerId);
      });
      return stageLayers;
    }

    return (
      presetsByStage?.[normalizedStage] ||
      DEFAULT_AVATAR_PRESETS[normalizedStage] ||
      DEFAULT_AVATAR_PRESETS.seedling
    );
  }, [avatarCompositeDevState, getAvatarCompositeRoleTransform, normalizedStage, presetsByStage, useDevTransforms]);

  const effectiveLayers = useMemo(() => {
    const mergedLayers = mergeLayers(baseLayers);
    const resolved = {};
    LAYER_IDS.forEach((layerId) => {
      resolved[layerId] = resolveEffectiveLayer(layerId, mergedLayers);
    });
    return resolved;
  }, [baseLayers]);

  const bgStyle = getDevStyleForLayer('bg', effectiveLayers.bg);
  const stageStyle = getDevStyleForLayer('stage', effectiveLayers.stage);
  const glassProbeStyle = PROBE ? { border: `3px solid ${PROBE}` } : undefined;
  const glassStyle = { ...getDevStyleForLayer('glass', effectiveLayers.glass), ...glassProbeStyle };
  const ringStyle = getDevStyleForLayer('ring', effectiveLayers.ring);

  return (
    <div
      className={`avatar-composite ${showDebugOverlay ? 'avatar-composite--debug' : ''}`}
      data-testid="avatar-composite-root"
      style={compositeSizeStyle}
    >
      <div className="avatar-composite__globe-clip">
        <img
          className="avatar-composite__layer avatar-composite__layer--bg"
          src={backgroundSrc}
          alt=""
          draggable="false"
          style={bgStyle}
          onError={handleLayerImageError}
        />
        <img
          className="avatar-composite__layer avatar-composite__layer--stage"
          src={stageSrc}
          alt=""
          draggable="false"
          style={stageStyle}
          onError={handleLayerImageError}
        />
        <img
          className="avatar-composite__layer avatar-composite__layer--glass"
          src={glassSrc}
          alt=""
          draggable="false"
          style={glassStyle}
          onError={handleLayerImageError}
        />
      </div>
      <div className="avatar-composite__ring-spin">
        <img
          className="avatar-composite__ring"
          src={ringSrc}
          alt=""
          draggable="false"
          style={ringStyle}
          onError={handleLayerImageError}
        />
      </div>
      {showDebugOverlay && (
        <div className="avatar-composite__debug-readout" aria-hidden="true">
          <div className="avatar-composite__debug-line avatar-composite__debug-line--bg">
            bg o:{effectiveLayers.bg.opacity.toFixed(2)} s:{effectiveLayers.bg.scale.toFixed(2)} r:{effectiveLayers.bg.rotateDeg.toFixed(0)} x:{effectiveLayers.bg.x.toFixed(0)} y:{effectiveLayers.bg.y.toFixed(0)}
          </div>
          <div className="avatar-composite__debug-line avatar-composite__debug-line--stage">
            stage o:{effectiveLayers.stage.opacity.toFixed(2)} s:{effectiveLayers.stage.scale.toFixed(2)} r:{effectiveLayers.stage.rotateDeg.toFixed(0)} x:{effectiveLayers.stage.x.toFixed(0)} y:{effectiveLayers.stage.y.toFixed(0)}
          </div>
          <div className="avatar-composite__debug-line avatar-composite__debug-line--glass">
            glass o:{effectiveLayers.glass.opacity.toFixed(2)} s:{effectiveLayers.glass.scale.toFixed(2)} r:{effectiveLayers.glass.rotateDeg.toFixed(0)} x:{effectiveLayers.glass.x.toFixed(0)} y:{effectiveLayers.glass.y.toFixed(0)}
          </div>
          <div className="avatar-composite__debug-line avatar-composite__debug-line--ring">
            ring o:{effectiveLayers.ring.opacity.toFixed(2)} s:{effectiveLayers.ring.scale.toFixed(2)} r:{effectiveLayers.ring.rotateDeg.toFixed(0)} x:{effectiveLayers.ring.x.toFixed(0)} y:{effectiveLayers.ring.y.toFixed(0)}
          </div>
          <div className="avatar-composite__debug-line">
            stage key:{normalizedStage}
          </div>
          <div className="avatar-composite__debug-line">
            wallpaper:{getLastPathSegment(stageAssets.wallpaper)}
          </div>
          <div className="avatar-composite__debug-line">
            background:{getLastPathSegment(stageAssets.background)}
          </div>
          <div className="avatar-composite__debug-line">
            plant:{getLastPathSegment(stageAssets.plantForeground)}
          </div>
          <div className="avatar-composite__debug-line">
            glass:{getLastPathSegment(stageAssets.glassRing)}
          </div>
          <div className="avatar-composite__debug-line">
            rune:{getLastPathSegment(stageAssets.runeRing)}
          </div>
        </div>
      )}
    </div>
  );
}
