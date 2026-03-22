import React from 'react';
import './AvatarComposite.css';
import { useDevPanelStore } from '../../state/devPanelStore.js';
import { useAvatarStageDefaultsStore } from '../../state/avatarV3Store.js';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
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
const GLOBE_CLIP_OFFSET_BY_SCHEME = {
  light: { x: 4, y: 4 },
  dark: { x: 2, y: 2 },
};

function handleLayerImageError(event) {
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

// PROBE:AVATAR_LAYER_OWNER:START
const AVATAR_LAYER_OWNER_PROBE = Object.freeze({
  targetScheme: 'light',
  targetStage: 'ember',
  fallbackStage: 'beacon',
  dimOpacity: 0.12,
});

function isAvatarLayerOwnerProbeMode(value) {
  return ['all', 'wrapper', 'globe', 'bg', 'stage', 'glass', 'ring'].includes(value);
}

function readAvatarLayerOwnerProbeMode() {
  if (typeof window === 'undefined') return 'all';

  const fromGlobal = window.__IMMANENCE_AVATAR_LAYER_OWNER_PROBE_MODE__;
  if (isAvatarLayerOwnerProbeMode(fromGlobal)) {
    return fromGlobal;
  }

  try {
    const fromStorage = window.localStorage?.getItem?.('immanence.avatarLayerOwnerProbe.mode');
    if (isAvatarLayerOwnerProbeMode(fromStorage)) {
      return fromStorage;
    }
  } catch {
    // ignore storage failures in privacy mode
  }

  return 'all';
}

function resolveProbeLayerOpacity(layerId, isolationMode) {
  if (isolationMode === 'all') return 1;
  return isolationMode === layerId ? 1 : AVATAR_LAYER_OWNER_PROBE.dimOpacity;
}

function resolveProbeOverlayOpacity(layerId, isolationMode) {
  if (isolationMode === 'all') return 0.95;
  return isolationMode === layerId ? 0.95 : 0.22;
}

function createProbeBoundsStyle({
  color,
  opacity,
  zIndex = 12,
  borderRadius = '0px',
  label,
  transform = undefined,
}) {
  return {
    position: 'absolute',
    inset: 0,
    transform,
    borderRadius,
    outline: `1px solid ${color}`,
    boxShadow: `inset 0 0 0 1px ${color}, 0 0 10px ${color}`,
    opacity,
    pointerEvents: 'none',
    zIndex,
    ['--probe-label']: `"${label}"`,
  };
}

function createProbeCrosshairWrapStyle(opacity, zIndex = 13) {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '18px',
    height: '18px',
    transform: 'translate(-50%, -50%)',
    opacity,
    pointerEvents: 'none',
    zIndex,
  };
}

function createProbeCrosshairLineStyle(color, axis) {
  return axis === 'horizontal'
    ? {
      position: 'absolute',
      left: 0,
      top: '50%',
      width: '100%',
      height: '1px',
      transform: 'translateY(-50%)',
      background: color,
      boxShadow: `0 0 8px ${color}`,
    }
    : {
      position: 'absolute',
      left: '50%',
      top: 0,
      width: '1px',
      height: '100%',
      transform: 'translateX(-50%)',
      background: color,
      boxShadow: `0 0 8px ${color}`,
    };
}

function createProbeCenterDotStyle(color) {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '4px',
    height: '4px',
    transform: 'translate(-50%, -50%)',
    borderRadius: '9999px',
    background: color,
    boxShadow: `0 0 8px ${color}`,
  };
}

function createProbeLabelStyle(color, opacity) {
  return {
    position: 'absolute',
    left: '4px',
    top: '4px',
    padding: '1px 4px',
    borderRadius: '9999px',
    background: 'rgba(0, 0, 0, 0.72)',
    color,
    fontSize: '8px',
    lineHeight: 1.2,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity,
    pointerEvents: 'none',
    zIndex: 14,
  };
}
// PROBE:AVATAR_LAYER_OWNER:END

export function AvatarComposite({ stage, size }) {
  const normalizedStage = normalizeStageKey(stage);
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const devPanelGateEnabled = getDevPanelProdGate();
  const avatarCompositeDevState = useDevPanelStore((s) => s.avatarComposite);
  const getAvatarCompositeStageDraft = useDevPanelStore((s) => s.getAvatarCompositeStageDraft);
  const getResolvedStageDefault = useAvatarStageDefaultsStore((s) => s.getResolvedStageDefault);
  const stageAssets = getStageAssets(normalizedStage, colorScheme);

  const backgroundSrc = resolvePublicAssetUrl(stageAssets.background);
  const stageSrc = resolvePublicAssetUrl(stageAssets.plantForeground);
  const glassSrc = resolvePublicAssetUrl(stageAssets.glassRing);
  const ringSrc = resolvePublicAssetUrl(stageAssets.runeRing);
  const compositeSizeStyle = resolveSizeStyle(size);
  const globeClipOffset = GLOBE_CLIP_OFFSET_BY_SCHEME[colorScheme] || GLOBE_CLIP_OFFSET_BY_SCHEME.light;
  const globeClipStyle = {
    transform: `translate(${globeClipOffset.x}px, ${globeClipOffset.y}px)`,
  };
  const useDraftTransforms = Boolean(
    avatarCompositeDevState?.enabled && avatarCompositeDevState?.previewDraft
  );
  const showDebugOverlay = Boolean(
    devPanelGateEnabled && avatarCompositeDevState?.showDebugOverlay
  );

  const resolvedDefaults = getResolvedStageDefault(normalizedStage, colorScheme);
  const baseLayers = useDraftTransforms
    ? getAvatarCompositeStageDraft(normalizedStage, colorScheme)
    : resolvedDefaults;

  const mergedLayers = mergeLayers(baseLayers);
  const effectiveLayers = {};
  LAYER_IDS.forEach((layerId) => {
    effectiveLayers[layerId] = resolveEffectiveLayer(layerId, mergedLayers);
  });

  const bgStyle = getDevStyleForLayer('bg', effectiveLayers.bg);
  const stageStyle = getDevStyleForLayer('stage', effectiveLayers.stage);
  const glassStyle = getDevStyleForLayer('glass', effectiveLayers.glass);
  const ringStyle = getDevStyleForLayer('ring', effectiveLayers.ring);

  // PROBE:AVATAR_LAYER_OWNER:START
  const probeEnabled = showDebugOverlay;
  const probeMode = probeEnabled ? readAvatarLayerOwnerProbeMode() : 'all';
  const isCanonicalProbeCase =
    probeEnabled
    && colorScheme === AVATAR_LAYER_OWNER_PROBE.targetScheme
    && normalizedStage === AVATAR_LAYER_OWNER_PROBE.targetStage;
  const isFallbackProbeCase =
    probeEnabled
    && colorScheme === AVATAR_LAYER_OWNER_PROBE.targetScheme
    && normalizedStage === AVATAR_LAYER_OWNER_PROBE.fallbackStage;
  const probeCaseLabel = isCanonicalProbeCase
    ? 'canonical'
    : isFallbackProbeCase
      ? 'fallback'
      : 'inactive';
  const probeActive = probeEnabled && (isCanonicalProbeCase || isFallbackProbeCase);
  const probeBgStyle = probeActive
    ? { ...bgStyle, opacity: bgStyle.opacity * resolveProbeLayerOpacity('bg', probeMode) }
    : bgStyle;
  const probeStageStyle = probeActive
    ? { ...stageStyle, opacity: stageStyle.opacity * resolveProbeLayerOpacity('stage', probeMode) }
    : stageStyle;
  const probeGlassStyle = probeActive
    ? { ...glassStyle, opacity: glassStyle.opacity * resolveProbeLayerOpacity('glass', probeMode) }
    : glassStyle;
  const probeRingStyle = probeActive
    ? { ...ringStyle, opacity: ringStyle.opacity * resolveProbeLayerOpacity('ring', probeMode) }
    : ringStyle;
  const wrapperOverlayOpacity = resolveProbeOverlayOpacity('wrapper', probeMode);
  const globeOverlayOpacity = resolveProbeOverlayOpacity('globe', probeMode);
  const bgOverlayOpacity = resolveProbeOverlayOpacity('bg', probeMode);
  const stageOverlayOpacity = resolveProbeOverlayOpacity('stage', probeMode);
  const glassOverlayOpacity = resolveProbeOverlayOpacity('glass', probeMode);
  const ringOverlayOpacity = resolveProbeOverlayOpacity('ring', probeMode);
  // PROBE:AVATAR_LAYER_OWNER:END

  return (
    <div
      className={`avatar-composite ${showDebugOverlay ? 'avatar-composite--debug' : ''}`}
      data-testid="avatar-composite-root"
      style={compositeSizeStyle}
    >
      {probeActive && (
        <>
          <div style={createProbeBoundsStyle({
            color: 'rgba(236, 72, 153, 0.98)',
            opacity: wrapperOverlayOpacity,
            zIndex: 10,
            label: 'wrapper',
          })} />
          <div style={createProbeCrosshairWrapStyle(wrapperOverlayOpacity, 11)}>
            <div style={createProbeCrosshairLineStyle('rgba(236, 72, 153, 0.98)', 'horizontal')} />
            <div style={createProbeCrosshairLineStyle('rgba(236, 72, 153, 0.98)', 'vertical')} />
            <div style={createProbeCenterDotStyle('rgba(236, 72, 153, 0.98)')} />
          </div>
          <div style={createProbeLabelStyle('rgba(236, 72, 153, 0.98)', wrapperOverlayOpacity)}>
            wrapper
          </div>
        </>
      )}
      <div className="avatar-composite__globe-clip" style={globeClipStyle}>
        <img
          className="avatar-composite__layer avatar-composite__layer--bg"
          src={backgroundSrc}
          alt=""
          draggable="false"
          style={probeBgStyle}
          onError={handleLayerImageError}
        />
        <img
          className="avatar-composite__layer avatar-composite__layer--stage"
          src={stageSrc}
          alt=""
          draggable="false"
          style={probeStageStyle}
          onError={handleLayerImageError}
        />
        <img
          className="avatar-composite__layer avatar-composite__layer--glass"
          src={glassSrc}
          alt=""
          draggable="false"
          style={probeGlassStyle}
          onError={handleLayerImageError}
        />
        {probeActive && (
          <>
            <div style={createProbeBoundsStyle({
              color: 'rgba(34, 211, 238, 0.98)',
              opacity: globeOverlayOpacity,
              zIndex: 11,
              borderRadius: '9999px',
              label: 'globe',
            })} />
            <div style={createProbeCrosshairWrapStyle(globeOverlayOpacity, 12)}>
              <div style={createProbeCrosshairLineStyle('rgba(34, 211, 238, 0.98)', 'horizontal')} />
              <div style={createProbeCrosshairLineStyle('rgba(34, 211, 238, 0.98)', 'vertical')} />
              <div style={createProbeCenterDotStyle('rgba(34, 211, 238, 0.98)')} />
            </div>
            <div style={createProbeLabelStyle('rgba(34, 211, 238, 0.98)', globeOverlayOpacity)}>
              globe
            </div>
            <div style={createProbeBoundsStyle({
              color: 'rgba(59, 130, 246, 0.98)',
              opacity: bgOverlayOpacity,
              zIndex: 13,
              borderRadius: '9999px',
              label: 'bg',
              transform: probeBgStyle.transform,
            })}>
              <div style={createProbeCrosshairWrapStyle(bgOverlayOpacity)}>
                <div style={createProbeCrosshairLineStyle('rgba(59, 130, 246, 0.98)', 'horizontal')} />
                <div style={createProbeCrosshairLineStyle('rgba(59, 130, 246, 0.98)', 'vertical')} />
                <div style={createProbeCenterDotStyle('rgba(59, 130, 246, 0.98)')} />
              </div>
              <div style={createProbeLabelStyle('rgba(59, 130, 246, 0.98)', bgOverlayOpacity)}>
                bg
              </div>
            </div>
            <div style={createProbeBoundsStyle({
              color: 'rgba(34, 197, 94, 0.98)',
              opacity: stageOverlayOpacity,
              zIndex: 14,
              borderRadius: '9999px',
              label: 'stage',
              transform: probeStageStyle.transform,
            })}>
              <div style={createProbeCrosshairWrapStyle(stageOverlayOpacity)}>
                <div style={createProbeCrosshairLineStyle('rgba(34, 197, 94, 0.98)', 'horizontal')} />
                <div style={createProbeCrosshairLineStyle('rgba(34, 197, 94, 0.98)', 'vertical')} />
                <div style={createProbeCenterDotStyle('rgba(34, 197, 94, 0.98)')} />
              </div>
              <div style={createProbeLabelStyle('rgba(34, 197, 94, 0.98)', stageOverlayOpacity)}>
                stage
              </div>
            </div>
            <div style={createProbeBoundsStyle({
              color: 'rgba(255, 255, 255, 0.98)',
              opacity: glassOverlayOpacity,
              zIndex: 15,
              borderRadius: '9999px',
              label: 'glass',
              transform: probeGlassStyle.transform,
            })}>
              <div style={createProbeCrosshairWrapStyle(glassOverlayOpacity)}>
                <div style={createProbeCrosshairLineStyle('rgba(255, 255, 255, 0.98)', 'horizontal')} />
                <div style={createProbeCrosshairLineStyle('rgba(255, 255, 255, 0.98)', 'vertical')} />
                <div style={createProbeCenterDotStyle('rgba(255, 255, 255, 0.98)')} />
              </div>
              <div style={createProbeLabelStyle('rgba(255, 255, 255, 0.98)', glassOverlayOpacity)}>
                glass
              </div>
            </div>
          </>
        )}
      </div>
      <div className="avatar-composite__ring-spin">
        <img
          className="avatar-composite__ring"
          src={ringSrc}
          alt=""
          draggable="false"
          style={probeRingStyle}
          onError={handleLayerImageError}
        />
        {probeActive && (
          <div style={createProbeBoundsStyle({
            color: 'rgba(255, 179, 71, 0.98)',
            opacity: ringOverlayOpacity,
            zIndex: 16,
            borderRadius: '9999px',
            label: 'ring',
            transform: probeRingStyle.transform,
          })}>
            <div style={createProbeCrosshairWrapStyle(ringOverlayOpacity)}>
              <div style={createProbeCrosshairLineStyle('rgba(255, 179, 71, 0.98)', 'horizontal')} />
              <div style={createProbeCrosshairLineStyle('rgba(255, 179, 71, 0.98)', 'vertical')} />
              <div style={createProbeCenterDotStyle('rgba(255, 179, 71, 0.98)')} />
            </div>
            <div style={createProbeLabelStyle('rgba(255, 179, 71, 0.98)', ringOverlayOpacity)}>
              ring
            </div>
          </div>
        )}
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
            probe case:{probeCaseLabel} mode:{probeMode}
          </div>
          <div className="avatar-composite__debug-line">
            probe canonical:{AVATAR_LAYER_OWNER_PROBE.targetScheme}/{AVATAR_LAYER_OWNER_PROBE.targetStage} fallback:{AVATAR_LAYER_OWNER_PROBE.targetScheme}/{AVATAR_LAYER_OWNER_PROBE.fallbackStage}
          </div>
          <div className="avatar-composite__debug-line">
            probe dim opacity:{AVATAR_LAYER_OWNER_PROBE.dimOpacity.toFixed(2)}
          </div>
          <div className="avatar-composite__debug-line">
            stage key:{normalizedStage} scheme:{colorScheme}
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
