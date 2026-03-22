import { createLogger } from "./logger.js";

const errorLogger = createLogger("errorReporter");

function normalizeError(errorLike) {
  if (errorLike instanceof Error) {
    return errorLike;
  }

  if (typeof errorLike === "string") {
    return new Error(errorLike);
  }

  try {
    return new Error(JSON.stringify(errorLike));
  } catch {
    return new Error("Unknown error");
  }
}

export function reportError(errorLike, context = {}) {
  const error = normalizeError(errorLike);
  const payload = {
    code: error.code || null,
    category: error.category || null,
    message: error.message,
    stack: error.stack || null,
    details: error.details || null,
    context,
    timestamp: new Date().toISOString(),
  };

  errorLogger.error("captured", payload);

  if (typeof window !== "undefined") {
    window.__IMMANENCE_LAST_ERROR__ = payload;
  }

  return payload;
}

let globalHandlersInstalled = false;

export function installGlobalErrorHandlers() {
  if (typeof window === "undefined" || globalHandlersInstalled) {
    return () => {};
  }

  const onError = (event) => {
    reportError(event.error || event.message, {
      source: "window.error",
      filename: event.filename || null,
      lineno: event.lineno || null,
      colno: event.colno || null,
    });
  };

  const onUnhandledRejection = (event) => {
    reportError(event.reason, {
      source: "window.unhandledrejection",
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  globalHandlersInstalled = true;

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    globalHandlersInstalled = false;
  };
}