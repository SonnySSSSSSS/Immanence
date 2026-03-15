import { useEffect, useMemo, useState } from "react";
import { getSessionThreePhaseIndex } from "./useBreathSessionState.js";

function normalizePositiveInt(value, fallback = 0, minimum = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(minimum, Math.round(n));
}

export function useStillnessIntervalSessionState({
  isRunning,
  isPaused,
  sessionStartTime,
  totalDurationSec,
  focusSec,
  restSec,
  postDelaySec = 0,
  pendingFinish = false,
  tickMs = 200,
}) {
  const [nowMs, setNowMs] = useState(() => performance.now());

  useEffect(() => {
    if (!isRunning || isPaused || !Number.isFinite(sessionStartTime)) {
      return undefined;
    }

    const update = () => setNowMs(performance.now());
    update();

    const id = setInterval(update, Math.max(100, tickMs));
    return () => clearInterval(id);
  }, [isRunning, isPaused, sessionStartTime, tickMs]);

  return useMemo(() => {
    const safeTotalSec = normalizePositiveInt(totalDurationSec, 0, 1);
    const safeFocusSec = 30;
    const safeRestSec = 15;
    const safePostDelaySec = normalizePositiveInt(postDelaySec, 0, 0);
    const cycleSec = safeFocusSec + safeRestSec;
    const boundaryEpsilonSec = 0.001;
    const focusPhaseLabels = ["light focus", "medium focus", "heavy focus"];

    const elapsedSecRaw = (!isRunning || !Number.isFinite(sessionStartTime))
      ? 0
      : Math.max(0, (nowMs - sessionStartTime) / 1000);
    const expired = isRunning && elapsedSecRaw >= safeTotalSec;

    let cycleBoundarySec = safeTotalSec;
    if (pendingFinish && cycleSec > 0) {
      const cycleIndex = Math.floor(safeTotalSec / cycleSec);
      const cycleOffsetSec = safeTotalSec - (cycleIndex * cycleSec);
      const atCycleBoundary = cycleOffsetSec <= boundaryEpsilonSec || Math.abs(cycleOffsetSec - cycleSec) <= boundaryEpsilonSec;
      if (!atCycleBoundary) {
        cycleBoundarySec = (cycleIndex * cycleSec) + cycleSec;
      }
    }

    const decompressionStartSec = pendingFinish ? cycleBoundarySec : null;
    const pendingBoundarySec = pendingFinish ? cycleBoundarySec + safePostDelaySec : safeTotalSec;
    const effectiveEndSec = pendingFinish ? pendingBoundarySec : safeTotalSec;
    const elapsedSec = Math.min(elapsedSecRaw, effectiveEndSec);
    const pendingBoundaryReached = pendingFinish && elapsedSecRaw >= pendingBoundarySec;
    const decompressionActive = Boolean(
      pendingFinish
      && safePostDelaySec > 0
      && decompressionStartSec !== null
      && elapsedSecRaw >= decompressionStartSec
      && elapsedSecRaw < pendingBoundarySec
    );
    const totalRemainingSec = Math.max(0, Math.ceil(effectiveEndSec - Math.min(elapsedSecRaw, effectiveEndSec)));
    const displayElapsedSec = pendingBoundaryReached
      ? Math.max(0, pendingBoundarySec - boundaryEpsilonSec)
      : elapsedSec;

    let segmentType;
    let segmentDurationSec;
    let segmentElapsedSec;
    let segmentRemainingSec;
    let segmentIndex;
    let nextSegmentType;
    let completedCycles;
    let completedFocusIntervals;

    if (decompressionActive || (pendingFinish && pendingBoundaryReached && safePostDelaySec > 0)) {
      segmentType = "decompression";
      segmentDurationSec = safePostDelaySec;
      segmentElapsedSec = Math.min(
        safePostDelaySec,
        Math.max(0, elapsedSecRaw - cycleBoundarySec)
      );
      segmentRemainingSec = Math.max(0, Math.ceil(segmentDurationSec - segmentElapsedSec));
      completedCycles = Math.floor(cycleBoundarySec / cycleSec);
      completedFocusIntervals = completedCycles;
      segmentIndex = completedCycles * 2;
      nextSegmentType = "complete";
    } else {
      const cyclePositionSec = cycleSec > 0 ? (displayElapsedSec % cycleSec) : 0;
      segmentType = cyclePositionSec < safeFocusSec ? "focus" : "rest";
      segmentDurationSec = segmentType === "focus" ? safeFocusSec : safeRestSec;
      segmentElapsedSec = segmentType === "focus"
        ? cyclePositionSec
        : Math.max(0, cyclePositionSec - safeFocusSec);
      segmentRemainingSec = Math.max(0, Math.ceil(segmentDurationSec - segmentElapsedSec));
      completedCycles = Math.floor(displayElapsedSec / cycleSec);
      completedFocusIntervals = completedCycles + (cyclePositionSec >= safeFocusSec ? 1 : 0);
      segmentIndex = (completedCycles * 2) + (segmentType === "focus" ? 0 : 1);
      nextSegmentType = segmentType === "focus" ? "rest" : "focus";
    }

    const normalizedSessionProgress = safeTotalSec > 0
      ? Math.min(1, Math.min(displayElapsedSec, safeTotalSec) / safeTotalSec)
      : 0;
    const focusPhaseIndex = getSessionThreePhaseIndex(normalizedSessionProgress);
    const focusPhaseLabel = focusPhaseLabels[focusPhaseIndex] || focusPhaseLabels[1];

    return {
      isComplete: pendingFinish ? pendingBoundaryReached : expired,
      expired,
      elapsedSec,
      totalRemainingSec,
      segmentType,
      nextSegmentType,
      segmentDurationSec,
      segmentElapsedSec,
      segmentRemainingSec,
      segmentIndex,
      completedFocusIntervals,
      focusPhaseIndex,
      focusPhaseLabel,
      decompressionActive,
      completionBoundaryKind: safePostDelaySec > 0 ? "decompression-end" : "cycle-end",
      pendingBoundaryReached,
      pendingBoundarySec,
    };
  }, [isRunning, nowMs, pendingFinish, postDelaySec, sessionStartTime, totalDurationSec]);
}
