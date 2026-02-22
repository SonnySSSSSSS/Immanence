const IS_DEV = Boolean(typeof import.meta !== "undefined" && import.meta?.env?.DEV);
const PREFIX = "[StabilityRunner]";

function isShortcut(event, digit) {
  const key = String(event?.key || "").toLowerCase();
  const code = String(event?.code || "");
  if (!event?.ctrlKey || !event?.shiftKey) return false;
  if (digit === 9) {
    return key === "9" || key === "(" || code === "Digit9" || code === "Numpad9";
  }
  return key === "0" || key === ")" || code === "Digit0" || code === "Numpad0";
}

function getDiagnostics() {
  const canvasCount = typeof document !== "undefined" ? document.querySelectorAll("canvas").length : 0;
  return {
    canvasCount,
    practiceActive: Boolean(typeof window !== "undefined" && window.__IMMANENCE_PRACTICE_ACTIVE__),
    lastGuardViolation: typeof window !== "undefined" ? window.__CANVAS_GUARD_LAST_VIOLATION__ || null : null,
    rendererSnapshot: typeof window !== "undefined" ? window.__CANVAS_GUARD_RENDERER_SNAPSHOT__ || null : null,
  };
}

export function installStabilityStressRunner(hooks = {}) {
  if (!IS_DEV) return () => {};
  if (typeof window === "undefined") return () => {};

  let running = false;
  let aborted = false;

  const sleep = (ms) => new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

  const runStep = async (name, count, cadenceMs, hook) => {
    if (typeof hook !== "function") {
      console.info(`${PREFIX} skipped: no hook (${name})`);
      return;
    }

    for (let i = 0; i < count; i += 1) {
      if (aborted) return;
      try {
        hook();
      } catch (error) {
        console.warn(`${PREFIX} ${name} failed`, error);
        return;
      }
      await sleep(cadenceMs);
    }
  };

  const runSingle = async (name, hook) => {
    if (typeof hook !== "function") {
      console.info(`${PREFIX} skipped: no hook (${name})`);
      return;
    }
    try {
      hook();
    } catch (error) {
      console.warn(`${PREFIX} ${name} failed`, error);
    }
  };

  const runStress = async () => {
    if (running) {
      console.info(`${PREFIX} already running`);
      return;
    }

    running = true;
    try {
      await runSingle("startPractice", hooks.startPractice);
      await runStep("toggleDevPanel", 10, 500, hooks.toggleDevPanel);
      await runStep("switchRingPreset", 10, 500, hooks.switchRingPreset);
      await runStep("simulateResizePulse", 20, 150, hooks.simulateResizePulse);
      await runSingle("endPractice", hooks.endPractice);
      console.info(`${PREFIX} done`);
    } finally {
      running = false;
    }
  };

  const dumpDiagnostics = () => {
    const diagnostics = getDiagnostics();
    console.info(`${PREFIX} dump`, diagnostics);
    return diagnostics;
  };

  const onKeyDown = (event) => {
    if (isShortcut(event, 9)) {
      event.preventDefault();
      runStress();
      return;
    }

    if (isShortcut(event, 0)) {
      event.preventDefault();
      dumpDiagnostics();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.__PROBE6_RUN_STRESS__ = runStress;
  window.__PROBE6_DUMP__ = dumpDiagnostics;

  return () => {
    aborted = true;
    window.removeEventListener("keydown", onKeyDown);
    if (window.__PROBE6_RUN_STRESS__ === runStress) delete window.__PROBE6_RUN_STRESS__;
    if (window.__PROBE6_DUMP__ === dumpDiagnostics) delete window.__PROBE6_DUMP__;
  };
}
