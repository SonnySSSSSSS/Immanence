const IS_DEV = Boolean(typeof import.meta !== "undefined" && import.meta?.env?.DEV);
const PROBE6_FIRST_LOSS_KEY = "__PROBE6_FIRST_WEBGL_LOSS__";

const diagnosticsState = {
  mountCount: 0,
  unmountCount: 0,
  contextLossCount: 0,
  contextRestoreCount: 0,
  lastViolation: null,
  lastSnapshot: null,
  lastRendererSnapshot: null,
};

const rendererMetaByCanvas = new WeakMap();
const rendererListenerByCanvas = new WeakMap();
const cachedCanvasTypeByCanvas = new WeakMap();

function asString(value, fallback = "-") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function getFirstClassName(el) {
  if (!(el instanceof Element)) return "-";
  const raw = typeof el.className === "string" ? el.className.trim() : "";
  if (!raw) return "-";
  return raw.split(/\s+/)[0] || "-";
}

function describeNode(el) {
  if (!(el instanceof Element)) return "-";
  const tag = asString(String(el.tagName || "").toUpperCase(), "UNKNOWN");
  const idPart = el.id ? `#${el.id}` : "";
  const classPart = (() => {
    const firstClass = getFirstClassName(el);
    return firstClass !== "-" ? `.${firstClass}` : "";
  })();
  return `${tag}${idPart}${classPart}`;
}

function getOwnerHint(canvasEl, ownerHintByCanvas) {
  const cached = ownerHintByCanvas.get(canvasEl);
  if (cached) return cached;
  const nodes = [];
  let node = canvasEl;
  for (let i = 0; i < 4 && node instanceof Element; i += 1) {
    nodes.push(node);
    node = node.parentElement;
  }
  const hint = nodes.reverse().map(describeNode).join(" > ") || "-";
  ownerHintByCanvas.set(canvasEl, hint);
  return hint;
}

function getCanvasType(canvasEl, typeByCanvas) {
  const cached = typeByCanvas.get(canvasEl) || cachedCanvasTypeByCanvas.get(canvasEl);
  if (cached) return cached;

  const datasetType = asString(canvasEl?.dataset?.probeType, "");
  if (datasetType) {
    typeByCanvas.set(canvasEl, datasetType);
    cachedCanvasTypeByCanvas.set(canvasEl, datasetType);
    return datasetType;
  }

  const directType = asString(canvasEl?.__probeType, "");
  if (directType) {
    typeByCanvas.set(canvasEl, directType);
    cachedCanvasTypeByCanvas.set(canvasEl, directType);
    return directType;
  }

  const metaType = asString(rendererMetaByCanvas.get(canvasEl)?.type, "");
  if (metaType) {
    typeByCanvas.set(canvasEl, metaType);
    cachedCanvasTypeByCanvas.set(canvasEl, metaType);
    return metaType;
  }

  typeByCanvas.set(canvasEl, "unknown");
  cachedCanvasTypeByCanvas.set(canvasEl, "unknown");
  return "unknown";
}

function getCssSize(canvasEl) {
  const rect = canvasEl?.getBoundingClientRect?.();
  if (!rect) return { width: 0, height: 0 };
  return {
    width: Math.round(rect.width || 0),
    height: Math.round(rect.height || 0),
  };
}

function compactCanvasLine(meta) {
  return `#${meta.index} ${meta.type} css=${meta.cssWidth}x${meta.cssHeight} back=${meta.backingWidth}x${meta.backingHeight} owner=${meta.owner}`;
}

function buildCompactSnapshotText(snapshot) {
  const lines = Array.isArray(snapshot?.canvases) ? snapshot.canvases.map(compactCanvasLine) : [];
  return lines.length ? lines.join(" | ") : "none";
}

function createSnapshot({ canvases, appMarker, view, practiceActive, source, typeByCanvas, ownerHintByCanvas }) {
  const rows = canvases.map((canvasEl, idx) => {
    const cssSize = getCssSize(canvasEl);
    const owner = getOwnerHint(canvasEl, ownerHintByCanvas);
    const type = getCanvasType(canvasEl, typeByCanvas);
    return {
      index: idx + 1,
      id: asString(canvasEl.id),
      className: getFirstClassName(canvasEl),
      owner,
      type,
      cssWidth: cssSize.width,
      cssHeight: cssSize.height,
      backingWidth: Number(canvasEl.width) || 0,
      backingHeight: Number(canvasEl.height) || 0,
    };
  });

  return {
    ts: new Date().toISOString(),
    source: asString(source, "scan"),
    appMarker: asString(appMarker),
    view: asString(view),
    practiceActive: Boolean(practiceActive),
    canvasCount: rows.length,
    canvases: rows,
  };
}

function updateProbeDiagnostics() {
  if (typeof window === "undefined") return;
  window.__PROBE2_CANVAS_COUNTS__ = {
    mountCount: diagnosticsState.mountCount,
    unmountCount: diagnosticsState.unmountCount,
  };

  const prior = window.__PROBE3_DIAGNOSTICS__ && typeof window.__PROBE3_DIAGNOSTICS__ === "object"
    ? window.__PROBE3_DIAGNOSTICS__
    : {};

  window.__PROBE3_DIAGNOSTICS__ = {
    ...prior,
    contextLossCount: diagnosticsState.contextLossCount,
    contextRestoreCount: diagnosticsState.contextRestoreCount,
    mountCount: diagnosticsState.mountCount,
    unmountCount: diagnosticsState.unmountCount,
    lastGuardViolation: diagnosticsState.lastViolation,
    lastRendererSnapshot: diagnosticsState.lastRendererSnapshot,
  };

  window.__CANVAS_GUARD_LAST_VIOLATION__ = diagnosticsState.lastViolation;
  window.__CANVAS_GUARD_LAST_SNAPSHOT__ = diagnosticsState.lastSnapshot;
  window.__CANVAS_GUARD_RENDERER_SNAPSHOT__ = diagnosticsState.lastRendererSnapshot;
}

function ensureFirstLossLoaded() {
  if (typeof window === "undefined") return;
  if (typeof window.__FIRST_WEBGL_LOSS__ !== "undefined" && window.__FIRST_WEBGL_LOSS__ !== null) return;
  try {
    const raw = window.sessionStorage?.getItem(PROBE6_FIRST_LOSS_KEY);
    window.__FIRST_WEBGL_LOSS__ = raw ? JSON.parse(raw) : null;
  } catch {
    window.__FIRST_WEBGL_LOSS__ = null;
  }
}

function saveFirstLoss(payload) {
  if (typeof window === "undefined") return;
  ensureFirstLossLoaded();
  if (window.__FIRST_WEBGL_LOSS__) return;
  const snapshot = {
    ts: new Date().toISOString(),
    source: "registerR3FRenderer:webglcontextlost",
    payload,
    rendererSnapshot: diagnosticsState.lastRendererSnapshot,
  };
  window.__FIRST_WEBGL_LOSS__ = snapshot;
  try {
    window.sessionStorage?.setItem(PROBE6_FIRST_LOSS_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage write failures.
  }
}

function installFirstLossResetter(logPrefix) {
  if (typeof window === "undefined") return () => {};
  const resetFirstLoss = () => {
    window.__FIRST_WEBGL_LOSS__ = null;
    try {
      window.sessionStorage?.removeItem(PROBE6_FIRST_LOSS_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    console.info(`${logPrefix} reset first loss`);
  };
  window.__PROBE6_RESET_FIRST_LOSS__ = resetFirstLoss;
  return () => {
    if (window.__PROBE6_RESET_FIRST_LOSS__ === resetFirstLoss) {
      delete window.__PROBE6_RESET_FIRST_LOSS__;
    }
  };
}

function throwZeroSizeInvariant(snapshot, minCssPx, logPrefix) {
  const offending = snapshot.canvases.filter(
    (canvasMeta) => canvasMeta.cssWidth < minCssPx || canvasMeta.cssHeight < minCssPx,
  );
  if (offending.length === 0) return;

  const compact = buildCompactSnapshotText(snapshot);
  const details = offending.map((entry) => `#${entry.index}:${entry.cssWidth}x${entry.cssHeight}`).join(", ");
  throw new Error(
    `${logPrefix} invariant failed: mounted canvas css < ${minCssPx}px (${details}) marker=${snapshot.appMarker} view=${snapshot.view} snapshot=${compact}`,
  );
}

export function assertNoMultipleCanvases(snapshot) {
  const count = Number(snapshot?.canvasCount) || 0;
  const max = Number(snapshot?.maxAllowed) || 1;
  if (count <= max) return;
  const compact = buildCompactSnapshotText(snapshot);
  throw new Error(
    `[CanvasGuard] invariant failed: max ${max} canvas during practice, found ${count}. marker=${snapshot?.appMarker || "-"} view=${snapshot?.view || "-"} snapshot=${compact}`,
  );
}

export function registerR3FRenderer(gl, renderer, meta = {}) {
  if (!IS_DEV) return () => {};
  if (typeof window === "undefined") return () => {};

  const resolvedRenderer = renderer && typeof renderer.getContext === "function"
    ? renderer
    : (gl && typeof gl.getContext === "function" ? gl : null);

  if (!resolvedRenderer) return () => {};

  const canvasEl = resolvedRenderer.domElement || gl?.domElement;
  if (!(canvasEl instanceof HTMLCanvasElement)) return () => {};

  const context = typeof resolvedRenderer.getContext === "function"
    ? resolvedRenderer.getContext()
    : null;

  const type = (typeof WebGL2RenderingContext !== "undefined" && context instanceof WebGL2RenderingContext)
    ? "webgl2"
    : "webgl";

  const dpr = Number(resolvedRenderer.getPixelRatio?.() || window.devicePixelRatio || 1);
  const rendererSnapshot = {
    ts: new Date().toISOString(),
    source: asString(meta?.source, "r3f"),
    route: asString(meta?.route, window.location?.pathname || "/"),
    view: asString(meta?.view, "unknown"),
    section: asString(meta?.section, "unknown"),
    appMarker: asString(meta?.appMarker, window.__IMMANENCE_APP_MARKER__),
    dpr: Number.isFinite(Number(meta?.dpr)) ? Number(meta.dpr) : Number(dpr.toFixed(2)),
    cssSize: (() => {
      const css = getCssSize(canvasEl);
      return `${css.width}x${css.height}`;
    })(),
    backingSize: `${Number(canvasEl.width) || 0}x${Number(canvasEl.height) || 0}`,
    type,
  };

  diagnosticsState.lastRendererSnapshot = rendererSnapshot;
  rendererMetaByCanvas.set(canvasEl, { ...rendererSnapshot, type, renderer: resolvedRenderer, gl: context });
  cachedCanvasTypeByCanvas.set(canvasEl, type);
  canvasEl.__probeType = type;
  try {
    canvasEl.dataset.probeType = type;
  } catch {
    // Ignore dataset write failures.
  }

  updateProbeDiagnostics();

  const existing = rendererListenerByCanvas.get(canvasEl);
  if (existing) {
    return existing.cleanup;
  }

  let loggedLoss = false;
  let loggedRestore = false;

  const onLostCapture = (event) => {
    diagnosticsState.contextLossCount += 1;
    updateProbeDiagnostics();
    try {
      event.preventDefault?.();
    } catch {
      // Ignore preventDefault failures.
    }

    if (loggedLoss) return;
    loggedLoss = true;

    const payload = {
      ...rendererSnapshot,
      event: "webglcontextlost",
      contextLost: typeof context?.isContextLost === "function" ? context.isContextLost() : null,
    };
    saveFirstLoss(payload);
    console.warn("[CanvasGuard] webglcontextlost", payload);
  };

  const onRestoreCapture = () => {
    diagnosticsState.contextRestoreCount += 1;
    updateProbeDiagnostics();

    if (loggedRestore) return;
    loggedRestore = true;
    console.info("[CanvasGuard] webglcontextrestored", {
      ...rendererSnapshot,
      event: "webglcontextrestored",
    });
  };

  canvasEl.addEventListener("webglcontextlost", onLostCapture, true);
  canvasEl.addEventListener("webglcontextrestored", onRestoreCapture, true);

  const cleanup = () => {
    canvasEl.removeEventListener("webglcontextlost", onLostCapture, true);
    canvasEl.removeEventListener("webglcontextrestored", onRestoreCapture, true);
    rendererListenerByCanvas.delete(canvasEl);
  };

  rendererListenerByCanvas.set(canvasEl, { cleanup });
  return cleanup;
}

export function installCanvasInventoryGuard(opts = {}) {
  if (!IS_DEV) return () => {};
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  const isPracticeActive = typeof opts.isPracticeActive === "function"
    ? opts.isPracticeActive
    : () => Boolean(window.__IMMANENCE_PRACTICE_ACTIVE__);
  const getAppMarker = typeof opts.getAppMarker === "function"
    ? opts.getAppMarker
    : () => asString(window.__IMMANENCE_APP_MARKER__, "unknown");
  const getView = typeof opts.getView === "function"
    ? opts.getView
    : () => "unknown";

  const maxCanvasesDuringPractice = Number.isFinite(Number(opts.maxCanvasesDuringPractice))
    ? Math.max(1, Number(opts.maxCanvasesDuringPractice))
    : 1;
  const minCssPx = Number.isFinite(Number(opts.minCssPx))
    ? Math.max(1, Number(opts.minCssPx))
    : 1;
  const logPrefix = asString(opts.logPrefix, "[CanvasGuard]");

  ensureFirstLossLoaded();
  const detachResetter = installFirstLossResetter(logPrefix);

  const knownCanvases = new Set();
  const typeByCanvas = new WeakMap();
  const ownerHintByCanvas = new WeakMap();
  const resizeObserverByCanvas = new WeakMap();

  let intervalId = null;
  let lastInventorySignature = "";
  let lastViolationSignature = "";
  let lastRecoverySignature = "";

  const syncMountCounts = () => {
    diagnosticsState.mountCount = knownCanvases.size;
    updateProbeDiagnostics();
  };

  const trackCanvas = (canvasEl) => {
    if (!(canvasEl instanceof HTMLCanvasElement)) return;
    if (knownCanvases.has(canvasEl)) return;
    knownCanvases.add(canvasEl);
    diagnosticsState.mountCount += 1;
    updateProbeDiagnostics();

    getOwnerHint(canvasEl, ownerHintByCanvas);
    getCanvasType(canvasEl, typeByCanvas);

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => {
        evaluate("resize");
      });
      observer.observe(canvasEl);
      resizeObserverByCanvas.set(canvasEl, observer);
    }
  };

  const untrackCanvas = (canvasEl) => {
    if (!(canvasEl instanceof HTMLCanvasElement)) return;
    if (!knownCanvases.delete(canvasEl)) return;

    diagnosticsState.unmountCount += 1;
    updateProbeDiagnostics();

    const observer = resizeObserverByCanvas.get(canvasEl);
    if (observer) {
      observer.disconnect();
      resizeObserverByCanvas.delete(canvasEl);
    }
  };

  const collectCanvases = (rootNode, bucket) => {
    if (!rootNode || !bucket) return;
    if (rootNode instanceof HTMLCanvasElement) bucket.add(rootNode);
    if (rootNode instanceof Element || rootNode instanceof DocumentFragment) {
      rootNode.querySelectorAll?.("canvas").forEach((canvasEl) => {
        if (canvasEl instanceof HTMLCanvasElement) bucket.add(canvasEl);
      });
    }
  };

  const resolveSnapshot = (source) => {
    const connectedCanvases = Array.from(document.querySelectorAll("canvas")).filter(
      (el) => el instanceof HTMLCanvasElement && el.isConnected,
    );

    connectedCanvases.forEach((canvasEl) => trackCanvas(canvasEl));
    Array.from(knownCanvases).forEach((canvasEl) => {
      if (!canvasEl.isConnected) untrackCanvas(canvasEl);
    });

    const snapshot = createSnapshot({
      canvases: connectedCanvases,
      appMarker: getAppMarker(),
      view: getView(),
      practiceActive: isPracticeActive(),
      source,
      typeByCanvas,
      ownerHintByCanvas,
    });

    diagnosticsState.lastSnapshot = snapshot;
    updateProbeDiagnostics();
    return snapshot;
  };

  const evaluate = (source) => {
    const snapshot = resolveSnapshot(source);
    const signature = snapshot.canvases
      .map((row) => `${row.owner}|${row.type}|${row.cssWidth}x${row.cssHeight}|${row.backingWidth}x${row.backingHeight}`)
      .join("||");

    if (signature !== lastInventorySignature) {
      lastInventorySignature = signature;
      console.info(`${logPrefix} inventory count=${snapshot.canvasCount} practice=${snapshot.practiceActive ? "active" : "idle"} marker=${snapshot.appMarker} view=${snapshot.view} source=${snapshot.source}`);
    }

    const violationBase = `${snapshot.practiceActive ? "practice" : "idle"}|${snapshot.canvasCount}|${signature}`;

    const throwOnce = (error, kind) => {
      const violationSignature = `${kind}|${violationBase}`;
      if (violationSignature === lastViolationSignature) return;
      lastViolationSignature = violationSignature;
      diagnosticsState.lastViolation = {
        ts: new Date().toISOString(),
        kind,
        message: error.message,
        marker: snapshot.appMarker,
        view: snapshot.view,
        canvasCount: snapshot.canvasCount,
        compactSnapshot: buildCompactSnapshotText(snapshot),
      };
      updateProbeDiagnostics();
      throw error;
    };

    try {
      throwZeroSizeInvariant(snapshot, minCssPx, logPrefix);
    } catch (error) {
      throwOnce(error, "zero_css");
    }

    if (snapshot.practiceActive && snapshot.canvasCount > maxCanvasesDuringPractice) {
      try {
        assertNoMultipleCanvases({
          ...snapshot,
          maxAllowed: maxCanvasesDuringPractice,
        });
      } catch (error) {
        throwOnce(error, "multi_canvas");
      }
    }

    const recoveredSignature = `${snapshot.practiceActive ? "practice" : "idle"}|${signature}`;
    if (diagnosticsState.lastViolation && recoveredSignature !== lastRecoverySignature) {
      lastRecoverySignature = recoveredSignature;
      console.info(`${logPrefix} invariants recovered marker=${snapshot.appMarker} view=${snapshot.view}`);
      diagnosticsState.lastViolation = null;
      updateProbeDiagnostics();
    }
  };

  const mutationObserver = new MutationObserver((mutations) => {
    const added = new Set();
    const removed = new Set();

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => collectCanvases(node, added));
      mutation.removedNodes.forEach((node) => collectCanvases(node, removed));
    });

    added.forEach((canvasEl) => trackCanvas(canvasEl));
    removed.forEach((canvasEl) => {
      if (!canvasEl.isConnected) untrackCanvas(canvasEl);
    });

    evaluate("mutation");
  });

  Array.from(document.querySelectorAll("canvas")).forEach((canvasEl) => trackCanvas(canvasEl));
  syncMountCounts();

  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  intervalId = window.setInterval(() => {
    evaluate("interval");
  }, 350);

  evaluate("initial");

  return () => {
    mutationObserver.disconnect();
    if (intervalId != null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }

    Array.from(knownCanvases).forEach((canvasEl) => {
      const observer = resizeObserverByCanvas.get(canvasEl);
      if (observer) observer.disconnect();
      resizeObserverByCanvas.delete(canvasEl);
    });

    knownCanvases.clear();
    detachResetter();
    diagnosticsState.lastSnapshot = null;
    updateProbeDiagnostics();
  };
}
