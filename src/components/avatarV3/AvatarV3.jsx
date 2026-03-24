import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AvatarComposite } from './AvatarComposite.jsx';
import { AvatarDetailModal } from './AvatarDetailModal.jsx';
import { logAvatarHmrDerivationProbe } from '../../state/avatarV3Store.js';
import {
  STAGE_LABELS,
  MODE_LABELS,
  getDominantMode,
  normalizeModeWeights,
} from './constants.js';
import './AvatarV3.css';

// PROBE:avatar-hmr-derivation:START
const AVATAR_V3_HMR_DERIVATION_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

if (AVATAR_V3_HMR_DERIVATION_PROBE_ENABLED) {
  logAvatarHmrDerivationProbe('AvatarV3', 'module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
  });
}
// PROBE:avatar-hmr-derivation:END

// PROBE:avatar-hmr-host:START
const AVATAR_V3_HMR_HOST_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

function getAvatarV3HmrHostProbeContext() {
  if (!AVATAR_V3_HMR_HOST_PROBE_ENABLED || typeof window === 'undefined') return null;
  const probe = window.__avatarHmrHostProbe__ ?? {
    eventSeq: 0,
    appMountSeq: 0,
    sectionViewMountSeq: 0,
    homeHubMountSeq: 0,
    avatarV3MountSeq: 0,
  };
  probe.avatarV3MountSeq = probe.avatarV3MountSeq ?? 0;
  window.__avatarHmrHostProbe__ = probe;
  return probe;
}

function logAvatarV3HmrHostProbe(event, detail = {}) {
  const probe = getAvatarV3HmrHostProbeContext();
  if (!probe) return;
  probe.eventSeq += 1;
  console.info('[PROBE:avatar-hmr-host]', {
    seq: probe.eventSeq,
    source: 'AvatarV3',
    event,
    timestamp: new Date().toISOString(),
    detail,
  });
}

if (AVATAR_V3_HMR_HOST_PROBE_ENABLED) {
  logAvatarV3HmrHostProbe('module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
  });
}
// PROBE:avatar-hmr-host:END

// PROBE:avatar-hmr-substrate:START
const AVATAR_V3_HMR_SUBSTRATE_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

function getAvatarV3HmrSubstrateProbeContext() {
  if (!AVATAR_V3_HMR_SUBSTRATE_PROBE_ENABLED || typeof window === 'undefined') return null;
  const probe = window.__avatarHmrSubstrateProbe__ ?? {
    eventSeq: 0,
  };
  window.__avatarHmrSubstrateProbe__ = probe;
  return probe;
}

function logAvatarV3HmrSubstrateProbe(event, detail = {}) {
  const probe = getAvatarV3HmrSubstrateProbeContext();
  if (!probe) return;
  probe.eventSeq += 1;
  console.info('[PROBE:avatar-hmr-substrate]', {
    seq: probe.eventSeq,
    source: 'AvatarV3',
    event,
    timestamp: new Date().toISOString(),
    detail,
  });
}

if (AVATAR_V3_HMR_SUBSTRATE_PROBE_ENABLED) {
  logAvatarV3HmrSubstrateProbe('module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
    substrateKind: 'avatar-composite-dom',
  });
}
// PROBE:avatar-hmr-substrate:END

export function AvatarV3({
  stage,
  modeWeights,
  path = null,
  size = 'default',
  onTap,
  showDetailsOnTap = true,
}) {
  const normalizedWeights = useMemo(() => normalizeModeWeights(modeWeights), [modeWeights]);
  const dominantMode = useMemo(() => getDominantMode(normalizedWeights), [normalizedWeights]);
  const [detailOpen, setDetailOpen] = useState(false);
  const avatarV3ProbeIdRef = useRef(null);

  if (avatarV3ProbeIdRef.current == null) {
    if (AVATAR_V3_HMR_HOST_PROBE_ENABLED) {
      const probe = getAvatarV3HmrHostProbeContext();
      probe.avatarV3MountSeq += 1;
      avatarV3ProbeIdRef.current = probe.avatarV3MountSeq;
    } else {
      avatarV3ProbeIdRef.current = 'host-probe-disabled';
    }
  }

  useEffect(() => {
    logAvatarV3HmrHostProbe('mount', {
      probeId: avatarV3ProbeIdRef.current,
      stage,
      path,
      size,
    });
    return () => {
      logAvatarV3HmrHostProbe('unmount', {
        probeId: avatarV3ProbeIdRef.current,
        stage,
        path,
        size,
      });
    };
  }, []);

  const handleTap = (event) => {
    if (onTap) {
      onTap(event);
      return;
    }
    if (showDetailsOnTap) {
      setDetailOpen(true);
    }
  };

  const ariaLabel = `${STAGE_LABELS[stage] || 'Seedling'} stage, ${MODE_LABELS[dominantMode] || 'Photic'} dominant mode`;
  // PROBE:avatar-scheme-isolation:START
  // AvatarV3 is a pass-through host: it receives stage/modeWeights and renders AvatarComposite.
  // It does NOT read or write avatar scheme-specific state directly.
  // Scheme isolation lives in AvatarComposite (reads colorScheme from useDisplayModeStore).
  // PROBE:avatar-scheme-isolation:END
  // PROBE:avatar-rotation-space:START
  // AvatarV3 applies no coordinate transforms to props before passing them to AvatarComposite.
  // stage, modeWeights, size, and path pass through unchanged — no x/y mapping, rotation
  // adjustment, or editor-vs-render space conversion exists at this level.
  // The outer <div className="avatar-v3..."> has no CSS rotation (inline-flex + drop-shadow only).
  // If axis-misaligned movement is observed, the origin is in AvatarComposite's render path
  // or in the parent host wrapping AvatarV3 — NOT in this component.
  // PROBE:avatar-rotation-space:END
  if (AVATAR_V3_HMR_DERIVATION_PROBE_ENABLED) {
    logAvatarHmrDerivationProbe('AvatarV3', 'render-pass-through', {
      stage,
      path,
      size,
      normalizedWeights,
      dominantMode,
      ariaLabel,
    });
  }
  logAvatarV3HmrHostProbe('render-parent-props', {
    probeId: avatarV3ProbeIdRef.current,
    stage,
    path,
    size,
    showDetailsOnTap,
    normalizedWeights,
    dominantMode,
    hasOnTap: typeof onTap === 'function',
  });
  logAvatarV3HmrSubstrateProbe('render-descriptor', {
    probeId: avatarV3ProbeIdRef.current,
    stage,
    path,
    size,
    dominantMode,
    normalizedWeights,
    ariaLabel,
    substrateKind: 'avatar-composite-dom',
    expectedLayerCount: 4,
  });
  return (
    <>
      <div
        className={`avatar-v3 avatar-v3--${size}`}
        role="img"
        aria-label={ariaLabel}
        onClick={handleTap}
      >
        <AvatarComposite stage={stage} size={size} path={path} />
      </div>
      <AvatarDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        stage={stage}
        modeWeights={normalizedWeights}
      />
    </>
  );
}
