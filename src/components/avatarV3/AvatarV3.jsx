import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AvatarV3Container } from './AvatarV3Container.jsx';
import { ModeBlendField } from './ModeBlendField.jsx';
import { StageCore } from './StageCore.jsx';
import { LensHighlight } from './LensHighlight.jsx';
import { AvatarDetailModal } from './AvatarDetailModal.jsx';
import {
  ANIMATION_DEFAULTS,
  STAGE_LABELS,
  MODE_LABELS,
  getDominantMode,
  normalizeModeWeights,
} from './constants.js';
import './AvatarV3.css';

export function AvatarV3({
  stage,
  modeWeights,
  isPracticing = false,
  lastStageChange: _lastStageChange,
  lastModeChange: _lastModeChange,
  lastSessionComplete,
  size = 'hearth',
  onTap,
  showDetailsOnTap = true,
}) {
  const normalizedWeights = useMemo(() => normalizeModeWeights(modeWeights), [modeWeights]);
  const dominantMode = useMemo(() => getDominantMode(normalizedWeights), [normalizedWeights]);
  const [detailOpen, setDetailOpen] = useState(false);

  const [stageTransition, setStageTransition] = useState({
    from: stage,
    to: stage,
    active: false,
    key: 0,
  });

  const baseBreathDuration = useMemo(() => 14 + Math.random() * 4, []);
  const baseDriftDuration = useMemo(() => 60 + Math.random() * 60, []);
  const baseLensDuration = useMemo(() => 45 + Math.random() * 45, []);

  const breathDuration = isPracticing ? baseBreathDuration * 1.05 : baseBreathDuration;
  const driftDuration = isPracticing ? baseDriftDuration * 1.25 : baseDriftDuration;
  const lensDuration = baseLensDuration;

  const breathMin = isPracticing ? 0.93 : ANIMATION_DEFAULTS.breathMin;
  const breathMax = ANIMATION_DEFAULTS.breathMax;

  const prevPracticingRef = useRef(isPracticing);
  const [settleActive, setSettleActive] = useState(false);

  useEffect(() => {
    if (stage && stage !== stageTransition.to) {
      setStageTransition((prev) => ({
        from: prev.to || stage,
        to: stage,
        active: true,
        key: prev.key + 1,
      }));
      const timeout = setTimeout(() => {
        setStageTransition((prev) => ({ ...prev, active: false }));
      }, ANIMATION_DEFAULTS.stageTransitionMs);
      return () => clearTimeout(timeout);
    }
  }, [stage, stageTransition.to]);

  useEffect(() => {
    if (prevPracticingRef.current && !isPracticing) {
      setSettleActive(true);
      const timeout = setTimeout(() => setSettleActive(false), ANIMATION_DEFAULTS.settleMs);
      prevPracticingRef.current = isPracticing;
      return () => clearTimeout(timeout);
    }
    prevPracticingRef.current = isPracticing;
  }, [isPracticing]);

  useEffect(() => {
    if (!lastSessionComplete) return undefined;
    setSettleActive(true);
    const timeout = setTimeout(() => setSettleActive(false), ANIMATION_DEFAULTS.settleMs);
    return () => clearTimeout(timeout);
  }, [lastSessionComplete]);

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

  return (
    <>
      <AvatarV3Container
        size={size}
        isPracticing={isPracticing}
        breathDuration={breathDuration}
        breathMin={breathMin}
        breathMax={breathMax}
        driftDuration={driftDuration}
        lensDuration={lensDuration}
        settleActive={settleActive}
        ariaLabel={ariaLabel}
        onTap={handleTap}
      >
        <ModeBlendField modeWeights={normalizedWeights} />
        <div className="avatar-v3__layer avatar-v3__core-bed" />
        <StageCore
          stage={stageTransition.to || stage}
          previousStage={stageTransition.from}
          transitionActive={stageTransition.active}
        />
        <div className="avatar-v3__layer avatar-v3__vignette" />
        <div className="avatar-v3__layer avatar-v3__sigil">
          <img
            src={`${import.meta.env.BASE_URL}assets/avatar/sigil_flower.svg`}
            alt=""
            className="avatar-v3__sigil-image"
          />
        </div>
        <LensHighlight />
        <div className="avatar-v3__layer avatar-v3__glass">
          <img
            src={`${import.meta.env.BASE_URL}assets/avatar/glass_rim.svg`}
            alt=""
            className="avatar-v3__glass-image"
          />
        </div>
        <div className="avatar-v3__layer avatar-v3__grain" />
        <div className="avatar-v3__layer avatar-v3__frame" />
        {stageTransition.active && (
          <div key={stageTransition.key} className="avatar-v3__layer avatar-v3__ripple" />
        )}
      </AvatarV3Container>
      <AvatarDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        stage={stage}
        modeWeights={normalizedWeights}
      />
    </>
  );
}
