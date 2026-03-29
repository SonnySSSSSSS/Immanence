import { normalizeRuntimeFailure } from "./runtimeFailure";

function normalizeDiagnosticCause(cause) {
  if (cause instanceof Error) {
    return {
      name: cause.name || "Error",
      message: cause.message || "Unknown error",
    };
  }

  if (!cause) {
    return null;
  }

  return {
    name: "Error",
    message: String(cause),
  };
}

export function createDiagnostic(errorLike, {
  category,
  source,
  code,
  message,
  details,
} = {}) {
  const failure = normalizeRuntimeFailure(errorLike, {
    category,
    code,
    message,
    details,
  });

  return {
    category: failure.category || "runtime",
    source: source || "unknown",
    code: failure.code || "runtime_error",
    message: failure.message || "Unknown runtime failure",
    details: failure.details,
    cause: failure.cause,
  };
}

export function getDiagnosticLogPayload(diagnostic) {
  return {
    category: diagnostic.category,
    source: diagnostic.source,
    code: diagnostic.code,
    message: diagnostic.message,
    details: diagnostic.details || null,
    cause: normalizeDiagnosticCause(diagnostic.cause),
  };
}

export function getDiagnosticErrorContext(diagnostic, context = {}) {
  return {
    source: diagnostic.source,
    category: diagnostic.category,
    code: diagnostic.code,
    message: diagnostic.message,
    details: diagnostic.details || null,
    ...context,
  };
}

export function emitDiagnostic({ logger, reportDiagnostic, diagnostic, level = "error", context = {} }) {
  const logPayload = getDiagnosticLogPayload(diagnostic);

  if (logger && typeof logger[level] === "function") {
    logger[level]("diagnostic", logPayload);
  }

  if (typeof reportDiagnostic === "function") {
    reportDiagnostic(diagnostic, context);
  }
}