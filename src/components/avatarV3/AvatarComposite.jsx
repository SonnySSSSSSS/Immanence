import React, { useMemo } from 'react';
import './AvatarComposite.css';
import { useDevPanelStore } from '../../state/devPanelStore.js';

const BASE_AVATAR_PATH = `${import.meta.env.BASE_URL}assets/avatar/`;

// Assets are served from `/public/assets/...`. Filenames include spaces, so we URL-encode.
function assetUrl(filename) {
  return `${BASE_AVATAR_PATH}${encodeURIComponent(filename)}`;
}

const BACKGROUND_ASSET = assetUrl('background composite.png');
const GLASS_ASSET = assetUrl('glass ring composite.png');
const DEFAULT_RING_ASSET = assetUrl('rune ring composite.png');

const STAGE_ASSETS = {
  seedling: assetUrl('seedling composite.png'),
  flame: assetUrl('flame composite.png'),
  stellar: assetUrl('stellar composite.png'),
};

const RING_BY_PATH = {};
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
  // Useful when stage-specific assets are missing (e.g. flame/stellar placeholders).
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
  if (typeof size === 'string' && size.trim() && size !== 'hearth' && size !== 'sanctuary') {
    return { width: size, height: size };
  }
  return { width: '100%', height: '100%' };
}

export function AvatarComposite({ stage, path, size }) {
  const normalizedStage = normalizeKey(stage);
  const normalizedPath = normalizeKey(path);
  const avatarCompositeDevState = useDevPanelStore((s) => s.avatarComposite);
  const isDev = import.meta.env.DEV;

  const stageSrc = STAGE_ASSETS[normalizedStage] ?? STAGE_ASSETS.seedling;
  const ringAsset = RING_BY_PATH[normalizedPath] || DEFAULT_RING_ASSET;
  const compositeSizeStyle = resolveSizeStyle(size);
  const tunerEnabled = Boolean(isDev && avatarCompositeDevState?.enabled);
  const showDebugOverlay = Boolean(tunerEnabled && avatarCompositeDevState?.showDebugOverlay);

  const effectiveLayers = useMemo(() => {
    const mergedLayers = mergeLayers(avatarCompositeDevState?.layers);
    const resolved = {};
    LAYER_IDS.forEach((layerId) => {
      resolved[layerId] = resolveEffectiveLayer(layerId, mergedLayers);
    });
    return resolved;
  }, [avatarCompositeDevState]);

  const bgStyle = tunerEnabled ? getDevStyleForLayer('bg', effectiveLayers.bg) : undefined;
  const stageStyle = tunerEnabled ? getDevStyleForLayer('stage', effectiveLayers.stage) : undefined;
  const glassStyle = tunerEnabled ? getDevStyleForLayer('glass', effectiveLayers.glass) : undefined;
  const ringStyle = tunerEnabled ? getDevStyleForLayer('ring', effectiveLayers.ring) : undefined;
  const glassBaseOpacity = typeof glassStyle?.opacity === 'number' ? glassStyle.opacity : 1;
  const glassPulseStyle = { '--avatar-composite-glass-base-opacity': glassBaseOpacity };
  const glassImageStyle = glassStyle ? { ...glassStyle, opacity: 1 } : undefined;

  return (
    <div
      className={`avatar-composite ${showDebugOverlay ? 'avatar-composite--debug' : ''}`}
      data-testid="avatar-composite-root"
      style={compositeSizeStyle}
    >
      <div className="avatar-composite__globe-clip">
        <img
          className="avatar-composite__layer avatar-composite__layer--bg"
          src={BACKGROUND_ASSET}
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
        <div className="avatar-composite__layer avatar-composite__inner-glow" />
        <div className="avatar-composite__glass-pulse" style={glassPulseStyle}>
          <img
            className="avatar-composite__layer avatar-composite__layer--glass"
            src={GLASS_ASSET}
            alt=""
            draggable="false"
            style={glassImageStyle}
            onError={handleLayerImageError}
          />
        </div>
        <div className="avatar-composite__layer avatar-composite__vignette" />
      </div>
      <div className="avatar-composite__ring-spin">
        <img
          className="avatar-composite__ring"
          src={ringAsset}
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
        </div>
      )}
    </div>
  );
}
