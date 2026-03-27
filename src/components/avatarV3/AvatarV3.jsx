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
import { markFirstLoginAudit } from '../../utils/firstLoginAudit.js';
import './AvatarV3.css';

const loadAvatarProbeModule = import.meta.env.DEV && import.meta.hot
  ? (() => {
      let probeModulePromise = null;
      return () => {
        probeModulePromise ??= import('../../dev/avatarHmrProbes.js');
        return probeModulePromise;
      };
    })()
  : null;

function withAvatarProbe(callback) {
  if (!loadAvatarProbeModule) return;
  loadAvatarProbeModule()
    .then((module) => callback(module))
    .catch(() => {});
}

function logAvatarHostProbe(event, detail = {}) {
  withAvatarProbe((module) => {
    module.logAvatarHmrProbe('host', 'AvatarV3', event, detail);
  });
}

function logAvatarSubstrateProbe(event, detail = {}) {
  withAvatarProbe((module) => {
    module.logAvatarHmrProbe('substrate', 'AvatarV3', event, detail);
  });
}

withAvatarProbe((module) => {
  module.logAvatarHmrProbe('derivation', 'AvatarV3', 'module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
  });
  module.logAvatarHmrProbe('host', 'AvatarV3', 'module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
  });
  module.logAvatarHmrProbe('substrate', 'AvatarV3', 'module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
    substrateKind: 'avatar-composite-dom',
  });
});

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

  useEffect(() => {
    if (avatarV3ProbeIdRef.current == null) {
      avatarV3ProbeIdRef.current = 'host-probe-pending';
      withAvatarProbe((module) => {
        const nextId = module.incrementAvatarHmrProbeCounter('host', 'avatarV3MountSeq');
        avatarV3ProbeIdRef.current = nextId ?? 'host-probe-disabled';
      });
    }
    logAvatarHostProbe('mount', {
      probeId: avatarV3ProbeIdRef.current,
      stage,
      path,
      size,
    });
    // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
    markFirstLoginAudit('avatar-v3:mount', {
      stage,
      path,
      size,
    });
    // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END
    return () => {
      logAvatarHostProbe('unmount', {
        probeId: avatarV3ProbeIdRef.current,
        stage,
        path,
        size,
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  logAvatarHmrDerivationProbe('AvatarV3', 'render-pass-through', {
    stage,
    path,
    size,
    normalizedWeights,
    dominantMode,
    ariaLabel,
  });
  logAvatarHostProbe('render-parent-props', {
    stage,
    path,
    size,
    showDetailsOnTap,
    normalizedWeights,
    dominantMode,
    hasOnTap: typeof onTap === 'function',
  });
  logAvatarSubstrateProbe('render-descriptor', {
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
