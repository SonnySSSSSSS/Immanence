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
} from "./config/runtimeEnv";
import { installGlobalErrorHandlers, reportDiagnostic } from "./utils/errorReporter.js";
import { createDiagnostic, emitDiagnostic } from "./utils/diagnostics.js";
import { createLogger } from "./utils/logger.js";
import { publishRuntimeCheck } from "./utils/runtimeChecks";
import "./immanence.css";
import "./index.css";

const logger = createLogger("main");

const loadAvatarProbeModule = import.meta.env.DEV && import.meta.hot
  ? (() => {
      let probeModulePromise = null;
      return () => {
        probeModulePromise ??= import("./dev/avatarHmrProbes.js");
        return probeModulePromise;
      };
    })()
  : null;

function withAvatarProbe(callback) {
  if (!loadAvatarProbeModule) return;
  loadAvatarProbeModule()
    .then((module) => callback(module))
    .catch(() => {});
}

withAvatarProbe((module) => {
  const evalOrder = module.incrementAvatarHmrProbeCounter("owner", "mainEvalSeq");
  module.logAvatarHmrProbe("owner", "main", "module-eval", {
    evalOrder,
    hasExistingRoot: typeof window !== "undefined" ? Boolean(window._root) : null,
    hasHotData: Boolean(import.meta.hot?.data),
  });
});

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
    let mountOrder = null;
    withAvatarProbe((module) => {
      mountOrder = module.incrementAvatarHmrProbeCounter("owner", "mainMountSeq");
      module.logAvatarHmrProbe("owner", "main", "root-mount", { mountOrder });
    });
    return () => {
      withAvatarProbe((module) => {
        module.logAvatarHmrProbe("owner", "main", "root-unmount", { mountOrder });
      });
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
withAvatarProbe((module) => {
  module.logAvatarHmrProbe("owner", "main", "root-render-request", {
    reusingExistingRoot,
  });
});
if (!window._root) {
  window._root = ReactDOM.createRoot(container);
}
window._root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
