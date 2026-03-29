import { RuntimeFailureCode, normalizeRuntimeFailure } from "./runtimeFailure.js";

export const RUNTIME_CHECKS_KEY = "__IMMANENCE_RUNTIME_CHECKS__";
export const RUNTIME_CHECKS_EVENT = "immanence:runtime-checks-updated";

const AUTH_PHASE_BY_CODE = Object.freeze({
  [RuntimeFailureCode.AUTH_DISABLED]: "disabled",
  [RuntimeFailureCode.AUTH_INIT_FAILED]: "init_failed",
  [RuntimeFailureCode.AUTH_SESSION_RESTORE_FAILED]: "session_restore_failed",
});

function normalizeVerificationFailure(failureLike, defaults = {}) {
  if (
    failureLike &&
    typeof failureLike === "object" &&
    !(failureLike instanceof Error) &&
    (typeof failureLike.code === "string" || typeof failureLike.error === "string")
  ) {
    const code = failureLike.code || failureLike.error || defaults.code || "runtime_error";
    const message = failureLike.message || defaults.message || "Unknown runtime failure";

    return {
      code,
      category: failureLike.category || defaults.category || "runtime",
      message,
      details: failureLike.details ?? defaults.details,
      cause: failureLike.cause instanceof Error ? failureLike.cause : new Error(message),
    };
  }

  return normalizeRuntimeFailure(failureLike, defaults);
}

function getRuntimeChecksTarget() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window[RUNTIME_CHECKS_KEY];
  if (existing && typeof existing === "object") {
    return existing;
  }

  const nextTarget = { version: 1, updatedAt: null };
  window[RUNTIME_CHECKS_KEY] = nextTarget;
  return nextTarget;
}

export function readRuntimeChecksSnapshot() {
  if (typeof window === "undefined") {
    return {
      version: 1,
      updatedAt: null,
      startup: null,
      auth: null,
      llm: null,
    };
  }

  const source = getRuntimeChecksTarget();

  return {
    version: source?.version ?? 1,
    updatedAt: source?.updatedAt ?? null,
    startup: source?.startup ?? null,
    auth: source?.auth ?? null,
    llm: source?.llm ?? null,
  };
}

export function publishRuntimeCheck(name, payload) {
  const target = getRuntimeChecksTarget();
  if (!target) {
    return payload;
  }

  const recordedAt = new Date().toISOString();
  target[name] = {
    ...payload,
    recordedAt,
  };
  target.updatedAt = recordedAt;

  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(RUNTIME_CHECKS_EVENT, {
      detail: {
        name,
        recordedAt,
      },
    }));
  }

  return target[name];
}

export function getAuthModeCheck(runtimeEnv) {
  const enabled = Boolean(runtimeEnv?.enableAuth);
  return {
    enabled,
    mode: enabled ? "enabled" : "disabled",
  };
}

export function getStartupRuntimeCheck(runtimeEnv, missingAuthEnvNames = []) {
  const authMode = getAuthModeCheck(runtimeEnv);
  const missingEnvNames = [...missingAuthEnvNames];

  return {
    ok: missingEnvNames.length === 0,
    phase: missingEnvNames.length === 0 ? "valid" : "invalid",
    authMode: authMode.mode,
    authEnabled: authMode.enabled,
    missingEnvNames,
  };
}

export function createAuthVerification({ runtimeEnv, phase = "ready", event = null, session = null, failure = null } = {}) {
  const authMode = getAuthModeCheck(runtimeEnv);
  const normalizedFailure = failure ? normalizeVerificationFailure(failure) : null;
  const resolvedPhase = !authMode.enabled
    ? "disabled"
    : normalizedFailure
      ? AUTH_PHASE_BY_CODE[normalizedFailure.code] || "failed"
      : phase;

  return {
    mode: authMode.mode,
    enabled: authMode.enabled,
    phase: resolvedPhase,
    event,
    hasSession: Boolean(session),
    userId: session?.user?.id ?? null,
    failureCode: normalizedFailure?.code ?? null,
    message: normalizedFailure?.message ?? null,
    details: normalizedFailure?.details ?? null,
  };
}
