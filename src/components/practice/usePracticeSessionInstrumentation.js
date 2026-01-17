import { useEffect, useMemo, useCallback } from "react";
import { useSessionInstrumentation } from "../../hooks/useSessionInstrumentation.js";
import { recordPracticeSession } from "../../services/sessionRecorder.js";
import { logCircuitCompletion } from "../../services/circuitManager.js";

export function usePracticeSessionInstrumentation() {
  useEffect(() => {
    console.log("[PracticeSection] mounted");
    return () => console.log("[PracticeSection] unmounted");
  }, []);

  const instrumentation = useSessionInstrumentation();

  const startSession = useCallback(
    (domain, ritualCategory, sensoryOverride) => {
      instrumentation.startSession(domain, ritualCategory, sensoryOverride);
    },
    [instrumentation]
  );

  const endSession = useCallback(
    (exitType) => instrumentation.endSession(exitType),
    [instrumentation]
  );

  const recordAliveSignal = useCallback(
    () => instrumentation.recordAliveSignal(),
    [instrumentation]
  );

  const recordSession = useCallback(
    (args) => recordPracticeSession(args),
    []
  );

  const logCircuitCompletionEvent = useCallback(
    (type, exercises) => logCircuitCompletion(type, exercises),
    []
  );

  return useMemo(
    () => ({
      startSession,
      endSession,
      recordAliveSignal,
      recordSession,
      logCircuitCompletionEvent,
    }),
    [
      startSession,
      endSession,
      recordAliveSignal,
      recordSession,
      logCircuitCompletionEvent,
    ]
  );
}
