import React, { useLayoutEffect, useRef } from 'react';
import './AvatarComposite.css';
import { useDevPanelStore } from '../../state/devPanelStore.js';
import {
  getAvatarStageDefaultProbeSnapshot,
  logAvatarHmrDerivationProbe,
  useAvatarStageDefaultsStore,
} from '../../state/avatarV3Store.js';
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

// PROBE:avatar-hmr-owner:START
const AVATAR_COMPOSITE_HMR_OWNER_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

function getAvatarCompositeHmrOwnerProbeContext() {
  if (!AVATAR_COMPOSITE_HMR_OWNER_PROBE_ENABLED || typeof window === 'undefined') return null;
  const probe = window.__avatarHmrOwnerProbe__ ?? {
    eventSeq: 0,
    renderSeq: 0,
    mainEvalSeq: 0,
    mainMountSeq: 0,
  };
  window.__avatarHmrOwnerProbe__ = probe;
  return probe;
}

function logAvatarCompositeHmrOwnerProbe(event, detail = {}) {
  const probe = getAvatarCompositeHmrOwnerProbeContext();
  if (!probe) return;
  probe.eventSeq += 1;
  console.info('[PROBE:avatar-hmr-owner]', {
    seq: probe.eventSeq,
    source: 'AvatarComposite',
    event,
    timestamp: new Date().toISOString(),
    detail,
  });
}
// PROBE:avatar-hmr-owner:END

// PROBE:avatar-hmr-derivation:START
const AVATAR_COMPOSITE_HMR_DERIVATION_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

if (AVATAR_COMPOSITE_HMR_DERIVATION_PROBE_ENABLED) {
  logAvatarHmrDerivationProbe('AvatarComposite', 'module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
  });
}
// PROBE:avatar-hmr-derivation:END

// PROBE:avatar-hmr-host:START
const AVATAR_COMPOSITE_HMR_HOST_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

function getAvatarCompositeHmrHostProbeContext() {
  if (!AVATAR_COMPOSITE_HMR_HOST_PROBE_ENABLED || typeof window === 'undefined') return null;
  const probe = window.__avatarHmrHostProbe__ ?? {
    eventSeq: 0,
    appMountSeq: 0,
    sectionViewMountSeq: 0,
    homeHubMountSeq: 0,
    avatarV3MountSeq: 0,
  };
  window.__avatarHmrHostProbe__ = probe;
  return probe;
}

function logAvatarCompositeHmrHostProbe(event, detail = {}) {
  const probe = getAvatarCompositeHmrHostProbeContext();
  if (!probe) return;
  probe.eventSeq += 1;
  console.info('[PROBE:avatar-hmr-host]', {
    seq: probe.eventSeq,
    source: 'AvatarComposite',
    event,
    timestamp: new Date().toISOString(),
    detail,
  });
}

if (AVATAR_COMPOSITE_HMR_HOST_PROBE_ENABLED) {
  logAvatarCompositeHmrHostProbe('module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
  });
}
// PROBE:avatar-hmr-host:END

// PROBE:avatar-hmr-substrate:START
const AVATAR_COMPOSITE_HMR_SUBSTRATE_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

function getAvatarCompositeHmrSubstrateProbeContext() {
  if (!AVATAR_COMPOSITE_HMR_SUBSTRATE_PROBE_ENABLED || typeof window === 'undefined') return null;
  const probe = window.__avatarHmrSubstrateProbe__ ?? {
    eventSeq: 0,
    mountSeq: 0,
    nextElementId: 0,
    elementIds: new WeakMap(),
    lastDescriptorSignature: null,
    lastInstanceSignature: null,
  };
  probe.elementIds = probe.elementIds ?? new WeakMap();
  window.__avatarHmrSubstrateProbe__ = probe;
  return probe;
}

function logAvatarCompositeHmrSubstrateProbe(event, detail = {}) {
  const probe = getAvatarCompositeHmrSubstrateProbeContext();
  if (!probe) return;
  probe.eventSeq += 1;
  console.info('[PROBE:avatar-hmr-substrate]', {
    seq: probe.eventSeq,
    source: 'AvatarComposite',
    event,
    timestamp: new Date().toISOString(),
    detail,
  });
}

function getAvatarCompositeProbeElementId(node, label) {
  const probe = getAvatarCompositeHmrSubstrateProbeContext();
  if (!probe || !node) return null;
  if (!probe.elementIds.has(node)) {
    probe.nextElementId += 1;
    probe.elementIds.set(node, `${label}-${probe.nextElementId}`);
  }
  return probe.elementIds.get(node);
}

if (AVATAR_COMPOSITE_HMR_SUBSTRATE_PROBE_ENABLED) {
  logAvatarCompositeHmrSubstrateProbe('module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
    substrateKind: 'dom-layer-stack',
    expectedLayerCount: 4,
  });
}
// PROBE:avatar-hmr-substrate:END

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


export function AvatarComposite({ stage, size, path = null }) {
  const rootRef = useRef(null);
  const globeClipRef = useRef(null);
  const bgImageRef = useRef(null);
  const stageImageRef = useRef(null);
  const glassImageRef = useRef(null);
  const ringWrapRef = useRef(null);
  const ringImageRef = useRef(null);
  const substrateMountIdRef = useRef(null);
  const normalizedStage = normalizeStageKey(stage);
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const devPanelGateEnabled = getDevPanelProdGate();
  const avatarCompositeDevState = useDevPanelStore((s) => s.avatarComposite);
  const getAvatarCompositeStageDraft = useDevPanelStore((s) => s.getAvatarCompositeStageDraft);
  const getResolvedStageDefault = useAvatarStageDefaultsStore((s) => s.getResolvedStageDefault);
  const stageAssets = getStageAssets(normalizedStage, colorScheme);
  const storeProbeSnapshot = getAvatarStageDefaultProbeSnapshot(normalizedStage, colorScheme);

  const backgroundSrc = resolvePublicAssetUrl(stageAssets.background);
  const stageSrc = resolvePublicAssetUrl(stageAssets.plantForeground);
  const glassSrc = resolvePublicAssetUrl(stageAssets.glassRing);
  const ringSrc = resolvePublicAssetUrl(stageAssets.runeRing);
  const compositeSizeStyle = resolveSizeStyle(size);
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

  const probe = getAvatarCompositeHmrOwnerProbeContext();
  if (probe) {
    probe.renderSeq += 1;
    logAvatarCompositeHmrOwnerProbe('render', {
      renderOrder: probe.renderSeq,
      stage: normalizedStage,
      colorScheme,
      useDraftTransforms,
      showDebugOverlay,
      avatarStoreHasHydrated: useAvatarStageDefaultsStore.persist?.hasHydrated?.() ?? null,
      workingCopyPresent: avatarCompositeDevState?.workingCopy != null,
      resolvedDefaults: {
        bg: resolvedDefaults?.bg ?? null,
        stage: resolvedDefaults?.stage ?? null,
        glass: resolvedDefaults?.glass ?? null,
        ring: resolvedDefaults?.ring ?? null,
      },
      selectedBaseLayers: {
        bg: baseLayers?.bg ?? null,
        stage: baseLayers?.stage ?? null,
        glass: baseLayers?.glass ?? null,
        ring: baseLayers?.ring ?? null,
      },
    });
  }

  const bgStyle = getDevStyleForLayer('bg', effectiveLayers.bg);
  const stageStyle = getDevStyleForLayer('stage', effectiveLayers.stage);
  const glassStyle = getDevStyleForLayer('glass', effectiveLayers.glass);
  const ringStyle = getDevStyleForLayer('ring', effectiveLayers.ring);
  const substrateDescriptor = {
    stage,
    normalizedStage,
    size,
    path,
    colorScheme,
    layerCount: 4,
    assetIds: {
      backgroundSrc: getLastPathSegment(backgroundSrc),
      stageSrc: getLastPathSegment(stageSrc),
      glassSrc: getLastPathSegment(glassSrc),
      ringSrc: getLastPathSegment(ringSrc),
    },
    styleIds: {
      bgTransform: bgStyle.transform,
      stageTransform: stageStyle.transform,
      glassTransform: glassStyle.transform,
      ringTransform: ringStyle.transform,
      bgOpacity: bgStyle.opacity,
      stageOpacity: stageStyle.opacity,
      glassOpacity: glassStyle.opacity,
      ringOpacity: ringStyle.opacity,
    },
  };

  if (AVATAR_COMPOSITE_HMR_DERIVATION_PROBE_ENABLED) {
    logAvatarHmrDerivationProbe('AvatarComposite', 'render-derivation', {
      store: storeProbeSnapshot,
      configAssets: stageAssets,
      compositeInput: {
        stage,
        normalizedStage,
        colorScheme,
        size,
        useDraftTransforms,
        showDebugOverlay,
      },
      baseLayers,
      mergedLayers,
      effectiveLayers,
      finalRender: {
        backgroundSrc,
        stageSrc,
        glassSrc,
        ringSrc,
        bgStyle,
        stageStyle,
        glassStyle,
        ringStyle,
      },
    });
  }

  logAvatarCompositeHmrHostProbe('render-host-correlation', {
    parentInput: {
      stage,
      normalizedStage,
      size,
      path,
      colorScheme,
    },
    finalRender: {
      backgroundSrc: getLastPathSegment(backgroundSrc),
      stageSrc: getLastPathSegment(stageSrc),
      glassSrc: getLastPathSegment(glassSrc),
      ringSrc: getLastPathSegment(ringSrc),
      bgTransform: bgStyle.transform,
      stageTransform: stageStyle.transform,
      glassTransform: glassStyle.transform,
      ringTransform: ringStyle.transform,
    },
  });

  logAvatarCompositeHmrSubstrateProbe('render-descriptor', {
    substrateDescriptor,
  });

  useLayoutEffect(() => {
    if (!AVATAR_COMPOSITE_HMR_SUBSTRATE_PROBE_ENABLED) return undefined;
    const probe = getAvatarCompositeHmrSubstrateProbeContext();
    if (!probe) return undefined;
    if (substrateMountIdRef.current == null) {
      probe.mountSeq += 1;
      substrateMountIdRef.current = probe.mountSeq;
    }

    const substrateInstance = {
      mountId: substrateMountIdRef.current,
      substrateKind: 'dom-layer-stack',
      rootElementId: getAvatarCompositeProbeElementId(rootRef.current, 'root'),
      globeClipElementId: getAvatarCompositeProbeElementId(globeClipRef.current, 'globe'),
      ringWrapElementId: getAvatarCompositeProbeElementId(ringWrapRef.current, 'ringWrap'),
      layerElementIds: {
        bg: getAvatarCompositeProbeElementId(bgImageRef.current, 'bg'),
        stage: getAvatarCompositeProbeElementId(stageImageRef.current, 'stage'),
        glass: getAvatarCompositeProbeElementId(glassImageRef.current, 'glass'),
        ring: getAvatarCompositeProbeElementId(ringImageRef.current, 'ring'),
      },
      childCounts: {
        rootChildren: rootRef.current?.childElementCount ?? null,
        globeClipChildren: globeClipRef.current?.childElementCount ?? null,
        ringWrapChildren: ringWrapRef.current?.childElementCount ?? null,
      },
      renderedAssets: {
        bg: getLastPathSegment(bgImageRef.current?.getAttribute('src') ?? ''),
        stage: getLastPathSegment(stageImageRef.current?.getAttribute('src') ?? ''),
        glass: getLastPathSegment(glassImageRef.current?.getAttribute('src') ?? ''),
        ring: getLastPathSegment(ringImageRef.current?.getAttribute('src') ?? ''),
      },
      renderedStyles: {
        bg: bgImageRef.current?.getAttribute('style') ?? null,
        stage: stageImageRef.current?.getAttribute('style') ?? null,
        glass: glassImageRef.current?.getAttribute('style') ?? null,
        ringWrap: ringWrapRef.current?.getAttribute('style') ?? null,
      },
    };

    const descriptorSignature = JSON.stringify(substrateDescriptor);
    const instanceSignature = JSON.stringify(substrateInstance);

    logAvatarCompositeHmrSubstrateProbe('commit-instance', {
      mountId: substrateMountIdRef.current,
      descriptorStableVsPrevious: probe.lastDescriptorSignature === descriptorSignature,
      instanceStableVsPrevious: probe.lastInstanceSignature === instanceSignature,
      substrateDescriptor,
      substrateInstance,
    });

    probe.lastDescriptorSignature = descriptorSignature;
    probe.lastInstanceSignature = instanceSignature;

    return () => {
      logAvatarCompositeHmrSubstrateProbe('unmount-instance', {
        mountId: substrateMountIdRef.current,
        rootElementId: getAvatarCompositeProbeElementId(rootRef.current, 'root'),
        layerElementIds: {
          bg: getAvatarCompositeProbeElementId(bgImageRef.current, 'bg'),
          stage: getAvatarCompositeProbeElementId(stageImageRef.current, 'stage'),
          glass: getAvatarCompositeProbeElementId(glassImageRef.current, 'glass'),
          ring: getAvatarCompositeProbeElementId(ringImageRef.current, 'ring'),
        },
      });
    };
  }, [
    substrateDescriptor,
    backgroundSrc,
    stageSrc,
    glassSrc,
    ringSrc,
    bgStyle.transform,
    stageStyle.transform,
    glassStyle.transform,
    ringStyle.transform,
  ]);

  return (
    <div
      ref={rootRef}
      className={`avatar-composite ${showDebugOverlay ? 'avatar-composite--debug' : ''}`}
      data-testid="avatar-composite-root"
      style={compositeSizeStyle}
    >
      <div ref={globeClipRef} className="avatar-composite__globe-clip">
        <img
          ref={bgImageRef}
          className="avatar-composite__layer avatar-composite__layer--bg"
          src={backgroundSrc}
          alt=""
          draggable="false"
          style={bgStyle}
          onError={handleLayerImageError}
        />
        <img
          ref={stageImageRef}
          className="avatar-composite__layer avatar-composite__layer--stage"
          src={stageSrc}
          alt=""
          draggable="false"
          style={stageStyle}
          onError={handleLayerImageError}
        />
        <img
          ref={glassImageRef}
          className="avatar-composite__layer avatar-composite__layer--glass"
          src={glassSrc}
          alt=""
          draggable="false"
          style={glassStyle}
          onError={handleLayerImageError}
        />
      </div>
      <div ref={ringWrapRef} className="avatar-composite__ring-wrap" style={ringStyle}>
        <div className="avatar-composite__ring-spin">
          <img
            ref={ringImageRef}
            className="avatar-composite__ring"
            src={ringSrc}
            alt=""
            draggable="false"
            onError={handleLayerImageError}
          />
        </div>
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
