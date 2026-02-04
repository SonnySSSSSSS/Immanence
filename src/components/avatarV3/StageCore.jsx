import React, { useEffect, useState } from 'react';
import { STAGE_ASSETS } from './constants.js';

export function StageCore({ stage, previousStage, transitionActive }) {
  const stageKey = stage || 'seedling';
  const prevKey = previousStage || stageKey;
  const currentSrc = `${import.meta.env.BASE_URL}${STAGE_ASSETS[stageKey]}`;
  const previousSrc = `${import.meta.env.BASE_URL}${STAGE_ASSETS[prevKey]}`;
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!transitionActive) {
      setFadeOut(false);
      return;
    }
    const id = requestAnimationFrame(() => setFadeOut(true));
    return () => cancelAnimationFrame(id);
  }, [transitionActive, previousStage, stage]);

  return (
    <div className="avatar-v3__layer">
      {transitionActive && previousStage && previousStage !== stage && (
        <div
          className="avatar-v3__stage-layer"
          style={{ opacity: fadeOut ? 0 : 1 }}
        >
          <img className="avatar-v3__stage" src={previousSrc} alt="" />
        </div>
      )}
      <div
        className="avatar-v3__stage-layer"
        style={{ opacity: 1 }}
      >
        <img className="avatar-v3__stage" src={currentSrc} alt="" />
      </div>
    </div>
  );
}
