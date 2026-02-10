import React, { useMemo, useState } from 'react';
import { AvatarComposite } from './AvatarComposite.jsx';
import { AvatarDetailModal } from './AvatarDetailModal.jsx';
import {
  STAGE_LABELS,
  MODE_LABELS,
  getDominantMode,
  normalizeModeWeights,
} from './constants.js';
import './AvatarV3.css';

export function AvatarV3({
  stage,
  modeWeights,
  isPracticing: _isPracticing = false,
  lastStageChange: _lastStageChange,
  lastModeChange: _lastModeChange,
  lastSessionComplete: _lastSessionComplete,
  path = null,
  size = 'hearth',
  onTap,
  showDetailsOnTap = true,
}) {
  const normalizedWeights = useMemo(() => normalizeModeWeights(modeWeights), [modeWeights]);
  const dominantMode = useMemo(() => getDominantMode(normalizedWeights), [normalizedWeights]);
  const [detailOpen, setDetailOpen] = useState(false);

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
  const sizeClass = size === 'sanctuary' ? 'avatar-v3--sanctuary' : 'avatar-v3--hearth';

  return (
    <>
      <div
        className={`avatar-v3 ${sizeClass}`}
        role="img"
        aria-label={ariaLabel}
        onClick={handleTap}
      >
        <AvatarComposite stage={stage} path={path} />
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
