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

    const elapsedSecRaw = (!isRunning || !Number.isFinite(sessionStartTime))
      ? 0
      : Math.max(0, (nowMs - sessionStartTime) / 1000);
    const elapsedSec = Math.min(elapsedSecRaw, safeTotalSec);
    const isComplete = isRunning && elapsedSecRaw >= safeTotalSec;

    const totalRemainingSec = Math.max(0, Math.ceil(safeTotalSec - elapsedSec));
    const cyclePositionSec = cycleSec > 0 ? (elapsedSec % cycleSec) : 0;
    const segmentType = cyclePositionSec < safeFocusSec ? "focus" : "rest";
    const segmentDurationSec = segmentType === "focus" ? safeFocusSec : safeRestSec;
    const segmentElapsedSec = segmentType === "focus"
      ? cyclePositionSec
      : Math.max(0, cyclePositionSec - safeFocusSec);
    const segmentRemainingSec = Math.max(0, Math.ceil(segmentDurationSec - segmentElapsedSec));

    const completedCycles = Math.floor(elapsedSec / cycleSec);
    const completedFocusIntervals = completedCycles + (cyclePositionSec >= safeFocusSec ? 1 : 0);
    const segmentIndex = (completedCycles * 2) + (segmentType === "focus" ? 0 : 1);
    const nextSegmentType = segmentType === "focus" ? "rest" : "focus";

    return {
      isComplete,
      elapsedSec,
      totalRemainingSec,
      segmentType,
      nextSegmentType,
      segmentDurationSec,
      segmentElapsedSec,
      segmentRemainingSec,
      segmentIndex,
      completedFocusIntervals,
    };
  }, [focusSec, isRunning, nowMs, restSec, sessionStartTime, totalDurationSec]);
}

