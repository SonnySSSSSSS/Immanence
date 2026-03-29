export const RuntimeFailureCode = Object.freeze({
  RUNTIME_CONFIG_MISSING: "runtime_config_missing",
  AUTH_DISABLED: "auth_disabled",
  AUTH_SESSION_RESTORE_FAILED: "auth_session_restore_failed",
  AUTH_INIT_FAILED: "auth_init_failed",
  AUTH_REQUEST_FAILED: "auth_request_failed",
});

function normalizeCause(errorLike) {
  if (errorLike instanceof Error) return errorLike;
  if (typeof errorLike === "string") return new Error(errorLike);

  try {
    return new Error(JSON.stringify(errorLike));
  } catch {
    return new Error("Unknown runtime failure");
  }
}

export function normalizeRuntimeFailure(errorLike, defaults = {}) {
  const causeError = normalizeCause(errorLike);
  const {
    code = "runtime_error",
    category = "runtime",
    message,
    details = undefined,
  } = defaults;

  return {
    code,
    category,
    message: message || causeError.message || "Unknown runtime failure",
    cause: causeError,
    details,
  };
}

export function createRuntimeFailure(errorLike, defaults = {}) {
  const failure = normalizeRuntimeFailure(errorLike, defaults);
  const error = new Error(failure.message, { cause: failure.cause });
  error.name = "RuntimeFailure";
  error.code = failure.code;
  error.category = failure.category;
  if (failure.details !== undefined) {
    error.details = failure.details;
  }

  return error;
}

export function toFailureResult(errorLike, defaults = {}, extra = {}) {
  const failure = normalizeRuntimeFailure(errorLike, defaults);
  return {
    success: false,
    error: failure.code,
    category: failure.category,
    message: failure.message,
    ...extra,
  };
}
