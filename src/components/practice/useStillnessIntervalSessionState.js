import { useEffect, useMemo, useState } from "react";

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
    const safeFocusSec = normalizePositiveInt(focusSec, 45, 1);
    const safeRestSec = normalizePositiveInt(restSec, 15, 1);
    const cycleSec = safeFocusSec + safeRestSec;
    const boundaryEpsilonSec = 0.001;

    const elapsedSecRaw = (!isRunning || !Number.isFinite(sessionStartTime))
      ? 0
      : Math.max(0, (nowMs - sessionStartTime) / 1000);
    const totalRemainingSec = Math.max(0, Math.ceil(safeTotalSec - Math.min(elapsedSecRaw, safeTotalSec)));
    const expired = isRunning && elapsedSecRaw >= safeTotalSec;

    let pendingBoundarySec = safeTotalSec;
    if (pendingFinish && cycleSec > 0) {
      const cycleIndex = Math.floor(safeTotalSec / cycleSec);
      const cycleOffsetSec = safeTotalSec - (cycleIndex * cycleSec);
      const atCycleBoundary = cycleOffsetSec <= boundaryEpsilonSec || Math.abs(cycleOffsetSec - cycleSec) <= boundaryEpsilonSec;
      const atFocusBoundary = Math.abs(cycleOffsetSec - safeFocusSec) <= boundaryEpsilonSec;

      if (!atCycleBoundary && !atFocusBoundary) {
        pendingBoundarySec = cycleOffsetSec < safeFocusSec
          ? (cycleIndex * cycleSec) + safeFocusSec
          : (cycleIndex * cycleSec) + cycleSec;
      }
    }

    const effectiveEndSec = pendingFinish ? pendingBoundarySec : safeTotalSec;
    const elapsedSec = Math.min(elapsedSecRaw, effectiveEndSec);
    const pendingBoundaryReached = pendingFinish && elapsedSecRaw >= pendingBoundarySec;
    const displayElapsedSec = pendingBoundaryReached
      ? Math.max(0, pendingBoundarySec - boundaryEpsilonSec)
      : elapsedSec;

    const cyclePositionSec = cycleSec > 0 ? (displayElapsedSec % cycleSec) : 0;
    const segmentType = cyclePositionSec < safeFocusSec ? "focus" : "rest";
    const segmentDurationSec = segmentType === "focus" ? safeFocusSec : safeRestSec;
    const segmentElapsedSec = segmentType === "focus"
      ? cyclePositionSec
      : Math.max(0, cyclePositionSec - safeFocusSec);
    const segmentRemainingSec = Math.max(0, Math.ceil(segmentDurationSec - segmentElapsedSec));

    const completedCycles = Math.floor(displayElapsedSec / cycleSec);
    const completedFocusIntervals = completedCycles + (cyclePositionSec >= safeFocusSec ? 1 : 0);
    const segmentIndex = (completedCycles * 2) + (segmentType === "focus" ? 0 : 1);
    const nextSegmentType = segmentType === "focus" ? "rest" : "focus";

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
      pendingBoundaryReached,
      pendingBoundarySec,
    };
  }, [focusSec, isRunning, nowMs, pendingFinish, restSec, sessionStartTime, totalDurationSec]);
}
