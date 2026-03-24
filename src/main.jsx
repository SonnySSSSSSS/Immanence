/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { TracePage } from "./pages/TracePage.jsx";
import { Playground } from "./dev/Playground.jsx";
import {
  getStartupRuntimeVerification,
  runtimeEnv,
  validateStartupRuntimeEnv,
} from "./config/runtimeEnv.js";
import { installGlobalErrorHandlers, reportDiagnostic } from "./utils/errorReporter.js";
import { createDiagnostic, emitDiagnostic } from "./utils/diagnostics.js";
import { createLogger } from "./utils/logger.js";
import { publishRuntimeCheck } from "./utils/runtimeChecks.js";
import "./immanence.css";
import "./index.css";

const logger = createLogger("main");

// PROBE:avatar-hmr-owner:START
const MAIN_HMR_OWNER_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

function getMainHmrOwnerProbeContext() {
  if (!MAIN_HMR_OWNER_PROBE_ENABLED || typeof window === "undefined") return null;
  const probe = window.__avatarHmrOwnerProbe__ ?? {
    eventSeq: 0,
    renderSeq: 0,
    mainEvalSeq: 0,
    mainMountSeq: 0,
  };
  window.__avatarHmrOwnerProbe__ = probe;
  return probe;
}

function logMainHmrOwnerProbe(event, detail = {}) {
  const probe = getMainHmrOwnerProbeContext();
  if (!probe) return;
  probe.eventSeq += 1;
  console.info("[PROBE:avatar-hmr-owner]", {
    seq: probe.eventSeq,
    source: "main",
    event,
    timestamp: new Date().toISOString(),
    detail,
  });
}

const mainProbe = getMainHmrOwnerProbeContext();
if (mainProbe) {
  mainProbe.mainEvalSeq += 1;
  logMainHmrOwnerProbe("module-eval", {
    evalOrder: mainProbe.mainEvalSeq,
    hasExistingRoot: typeof window !== "undefined" ? Boolean(window._root) : null,
    hasHotData: Boolean(import.meta.hot?.data),
  });
}
// PROBE:avatar-hmr-owner:END

installGlobalErrorHandlers();

const startupRuntimeVerification = getStartupRuntimeVerification();

try {
  validateStartupRuntimeEnv();
  publishRuntimeCheck("startup", startupRuntimeVerification);
} catch (error) {
  publishRuntimeCheck("startup", {
    ...startupRuntimeVerification,
    ok: false,
    phase: "invalid",
    failureCode: error?.code || null,
    message: error?.message || null,
    details: error?.details || null,
  });
  emitDiagnostic({
    logger,
    reportDiagnostic,
    diagnostic: createDiagnostic(error, {
      source: "startup-validation",
      category: "startup",
      code: error?.code,
      message: error?.message,
      details: error?.details,
    }),
    level: "error",
  });
  throw error;
}

// DEV: ensure no stale SW/caches (Edge commonly keeps old PWA assets)
if (runtimeEnv.isDev && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch((error) => {
      logger.warn("service worker cleanup failed", error);
    });

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => keys.forEach((k) => caches.delete(k)))
      .catch((error) => {
        logger.warn("cache cleanup failed", error);
      });
  }
}

// Simple path-based routing (no React Router needed)
const getRoute = () => {
  const path = window.location.pathname;
  if (runtimeEnv.isDev && path === "/__playground") {
    return "playground";
  }
  // Handle both /Immanence/trace and /trace
  if (path.endsWith('/trace') || path.endsWith('/trace/')) {
    return 'trace';
  }
  return 'app';
};

const RootComponent = () => {
  React.useEffect(() => {
    const probe = getMainHmrOwnerProbeContext();
    if (!probe) return undefined;
    probe.mainMountSeq += 1;
    const mountOrder = probe.mainMountSeq;
    logMainHmrOwnerProbe("root-mount", { mountOrder });
    return () => {
      logMainHmrOwnerProbe("root-unmount", { mountOrder });
    };
  }, []);

  const route = getRoute();

  if (route === 'trace') {
    return <TracePage />;
  }
  if (route === "playground") {
    return <Playground />;
  }

  return <App />;
};

const container = document.getElementById("root");
const reusingExistingRoot = Boolean(window._root);
logMainHmrOwnerProbe("root-render-request", {
  reusingExistingRoot,
});
if (!window._root) {
  window._root = ReactDOM.createRoot(container);
}
window._root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
