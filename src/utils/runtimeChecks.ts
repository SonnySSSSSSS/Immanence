import { RuntimeFailureCode, normalizeRuntimeFailure } from "./runtimeFailure.js";

export const RUNTIME_CHECKS_KEY = "__IMMANENCE_RUNTIME_CHECKS__";
export const RUNTIME_CHECKS_EVENT = "immanence:runtime-checks-updated";

interface Failure {
  code: string;
  category: string;
  message: string;
  details?: unknown;
  cause: Error;
}

interface RuntimeChecksTarget {
  version: number;
  updatedAt: string | null;
  [key: string]: any;
}

interface RuntimeChecksSnapshot {
  version: number;
  updatedAt: string | null;
  startup: any;
  auth: any;
  llm: any;
}

interface AuthModeCheck {
  enabled: boolean;
  mode: 'enabled' | 'disabled';
}

interface StartupRuntimeCheck {
  ok: boolean;
  phase: 'valid' | 'invalid';
  authMode: 'enabled' | 'disabled';
  authEnabled: boolean;
  missingEnvNames: string[];
}

interface AuthVerification {
  mode: 'enabled' | 'disabled';
  enabled: boolean;
  phase: string;
  event: any;
  hasSession: boolean;
  userId: string | null;
  failureCode: string | null;
  message: string | null;
  details: unknown;
}

const AUTH_PHASE_BY_CODE = Object.freeze({
  [RuntimeFailureCode.AUTH_DISABLED]: "disabled",
  [RuntimeFailureCode.AUTH_INIT_FAILED]: "init_failed",
  [RuntimeFailureCode.AUTH_SESSION_RESTORE_FAILED]: "session_restore_failed",
});

function normalizeVerificationFailure(
  failureLike: unknown,
  defaults: Partial<Failure> = {}
): Failure {
  if (
    failureLike &&
    typeof failureLike === "object" &&
    !(failureLike instanceof Error) &&
    (typeof (failureLike as any).code === "string" || typeof (failureLike as any).error === "string")
  ) {
    const code = (failureLike as any).code || (failureLike as any).error || defaults.code || "runtime_error";
    const message = (failureLike as any).message || defaults.message || "Unknown runtime failure";

    return {
      code,
      category: (failureLike as any).category || defaults.category || "runtime",
      message,
      details: (failureLike as any).details ?? defaults.details,
      cause: (failureLike as any).cause instanceof Error ? (failureLike as any).cause : new Error(message),
    };
  }

  return normalizeRuntimeFailure(failureLike, defaults);
}

function getRuntimeChecksTarget(): RuntimeChecksTarget | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = (window as any)[RUNTIME_CHECKS_KEY];
  if (existing && typeof existing === "object") {
    return existing as RuntimeChecksTarget;
  }

  const nextTarget: RuntimeChecksTarget = { version: 1, updatedAt: null };
  (window as any)[RUNTIME_CHECKS_KEY] = nextTarget;
  return nextTarget;
}

export function readRuntimeChecksSnapshot(): RuntimeChecksSnapshot {
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

export function publishRuntimeCheck(name: string, payload: any): any {
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

export function getAuthModeCheck(runtimeEnv: any): AuthModeCheck {
  const enabled = Boolean(runtimeEnv?.enableAuth);
  return {
    enabled,
    mode: enabled ? "enabled" : "disabled",
  };
}

export function getStartupRuntimeCheck(
  runtimeEnv: any,
  missingAuthEnvNames: string[] = []
): StartupRuntimeCheck {
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

interface AuthVerificationOptions {
  runtimeEnv?: any;
  phase?: string;
  event?: any;
  session?: any;
  failure?: unknown;
}

export function createAuthVerification({
  runtimeEnv,
  phase = "ready",
  event = null,
  session = null,
  failure = null,
}: AuthVerificationOptions = {}): AuthVerification {
  const authMode = getAuthModeCheck(runtimeEnv);
  const normalizedFailure = failure ? normalizeVerificationFailure(failure) : null;
  const resolvedPhase = !authMode.enabled
    ? "disabled"
    : normalizedFailure
      ? (AUTH_PHASE_BY_CODE as any)[normalizedFailure.code] || "failed"
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
