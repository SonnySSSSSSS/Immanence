import React, { useEffect, useRef, useState } from "react";
import { getAuthRuntimeMode, runtimeEnv } from "../../config/runtimeEnv.js";
import { reportDiagnostic } from "../../utils/errorReporter.js";
import { createDiagnostic, emitDiagnostic } from "../../utils/diagnostics.js";
import { createLogger } from "../../utils/logger.js";
import { RuntimeFailureCode, normalizeRuntimeFailure } from "../../utils/runtimeFailure.js";
import { createAuthVerification, publishRuntimeCheck } from "../../utils/runtimeChecks.js";
import { setAuthUser } from "../../state/useAuthUser.js";
import {
  beginFirstLoginAuditAttempt,
  endFirstLoginAuditAttempt,
  markFirstLoginAudit,
  sanitizeFirstLoginAuditEmail,
  sanitizeFirstLoginAuditUserId,
} from "../../utils/firstLoginAudit.js";

const logger = createLogger("AuthGate");

// Module-level lock — serializes concurrent Supabase auth init calls.
// React StrictMode double-invokes useEffect; without this the two concurrent
// supabase.auth.getSession() calls fight over navigator.locks and the loser
// emits an unhandled AbortError that triggers Vite's dev error overlay.
let _supabaseInitLocked = false;
const _supabaseInitWaiters = [];

// Lazy import to avoid Supabase initialization when auth is disabled
const getSupabase = () => import("../../lib/supabaseClient").then(m => m.supabase);

export default function AuthGate({ children, onAuthChange }) {
  const authRuntimeMode = getAuthRuntimeMode();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(authRuntimeMode.enabled);
  const authDisabledReportedRef = useRef(false);

  // Stable ref so the auth subscription effect never re-runs just because
  // the parent's handleAuthChange callback was recreated between renders.
  // Without this, each sign-out cycle recreates the Supabase subscription,
  // which fires SIGNED_OUT immediately on the new subscription, causing a loop.
  const onAuthChangeRef = useRef(onAuthChange);
  onAuthChangeRef.current = onAuthChange;

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [namePromptValue, setNamePromptValue] = useState("");
  const [namePromptErr, setNamePromptErr] = useState("");
  const authSurfaceAuditRef = useRef(null);

  useEffect(() => {
    // Skip auth initialization when disabled
    if (!authRuntimeMode.enabled) {
      if (!authDisabledReportedRef.current) {
        emitDiagnostic({
          logger,
          reportDiagnostic,
          diagnostic: createDiagnostic(null, {
            source: "auth-disabled-mode",
            code: RuntimeFailureCode.AUTH_DISABLED,
            category: "auth",
            message: "Auth is disabled by runtime configuration.",
          }),
          level: "warn",
        });
        authDisabledReportedRef.current = true;
      }
      publishRuntimeCheck(
        "auth",
        createAuthVerification({
          runtimeEnv,
          phase: "disabled",
          event: "INITIAL_SESSION",
          session: null,
          failure: {
            code: RuntimeFailureCode.AUTH_DISABLED,
            category: "auth",
            message: "Auth is disabled by runtime configuration.",
          },
        })
      );
      onAuthChangeRef.current?.("INITIAL_SESSION", null);
      return;
    }

    publishRuntimeCheck(
      "auth",
      createAuthVerification({
        runtimeEnv,
        phase: "initializing",
      })
    );

    const handleAuthFailure = (errorLike, code, message, source) => {
      const failure = normalizeRuntimeFailure(errorLike, {
        code,
        category: "auth",
        message,
      });
      emitDiagnostic({
        logger,
        reportDiagnostic,
        diagnostic: createDiagnostic(failure.cause, {
          source,
          code: failure.code,
          category: failure.category,
          message: failure.message,
          details: failure.details,
        }),
        level: "error",
      });
      setErr(failure.message);
      return failure;
    };

    let mounted = true;
    let unsubscribe = null;

    const init = async () => {
      // Queue behind any in-flight init (StrictMode double-invoke serialization).
      if (_supabaseInitLocked) {
        await new Promise(r => _supabaseInitWaiters.push(r));
        if (!mounted) return;
      }
      _supabaseInitLocked = true;
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          const failure = handleAuthFailure(
            error,
            RuntimeFailureCode.AUTH_SESSION_RESTORE_FAILED,
            "Failed to restore auth session.",
            "auth-session-restore"
          );
          publishRuntimeCheck(
            "auth",
            createAuthVerification({
              runtimeEnv,
              event: "INITIAL_SESSION",
              session: data?.session ?? null,
              failure,
            })
          );
        }
        const nextSession = data?.session ?? null;
        setSession(nextSession);
        setAuthUser(nextSession?.user ?? null);
        onAuthChangeRef.current?.("INITIAL_SESSION", nextSession);
        setLoading(false);
        if (!error) {
          publishRuntimeCheck(
            "auth",
            createAuthVerification({
              runtimeEnv,
              event: "INITIAL_SESSION",
              session: nextSession,
            })
          );
        }

        const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
          // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
          markFirstLoginAudit('authgate:on-auth-state-change', {
            event,
            hasSession: Boolean(newSession),
            userId: sanitizeFirstLoginAuditUserId(newSession?.user?.id ?? null),
          });
          // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END

          // The subscription lifecycle is already owned by unsubscribe() in cleanup.
          // Guarding on the effect-local mounted flag drops real SIGNED_OUT events
          // after StrictMode tears down the first effect pass.
          const nextAuthSession = newSession ?? null;
          setSession(nextAuthSession);
          setAuthUser(nextAuthSession?.user ?? null);
          publishRuntimeCheck(
            "auth",
            createAuthVerification({
              runtimeEnv,
              event,
              session: nextAuthSession,
            })
          );
          onAuthChangeRef.current?.(event, nextAuthSession);
        });
        unsubscribe = () => sub?.subscription?.unsubscribe?.();
      } catch (error) {
        if (!mounted) return;
        const failure = handleAuthFailure(
          error,
          RuntimeFailureCode.AUTH_INIT_FAILED,
          "Failed to initialize auth runtime.",
          "auth-init"
        );
        publishRuntimeCheck(
          "auth",
          createAuthVerification({
            runtimeEnv,
            event: "INITIAL_SESSION",
            session: null,
            failure,
          })
        );
        setLoading(false);
      } finally {
        _supabaseInitLocked = false;
        _supabaseInitWaiters.splice(0).forEach(r => r());
      }
    };

    init();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [authRuntimeMode.enabled]);

  useEffect(() => {
    if (mode !== "signup") setNameErr("");
  }, [mode]);

  // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
  useEffect(() => {
    if (loading) return;

    const userId = sanitizeFirstLoginAuditUserId(session?.user?.id ?? null);
    const nextKey = `${userId || "anon"}:${session ? "authed" : "signed-out"}`;
    if (authSurfaceAuditRef.current === nextKey) return;
    authSurfaceAuditRef.current = nextKey;

    markFirstLoginAudit('authgate:surface-resolved', {
      hasSession: Boolean(session),
      userId,
    });
  }, [loading, session]);
  // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END

  // PROBE:ACCOUNT_NAME:START
  const getDisplayNameFromUser = (user) => {
    const meta = user?.user_metadata || {};
    const rawName = meta?.name ?? meta?.full_name ?? null;
    const parsedName = typeof rawName === 'string' ? rawName.trim() : '';
    return parsedName || null;
  };

  const getNamePromptLatchKey = (userId) => `immanenceOS.accountNamePrompt.v1.${userId || 'unknown'}`;

  useEffect(() => {
    const user = session?.user ?? null;
    const userId = user?.id ?? null;
    if (!userId) return;

    const existingName = getDisplayNameFromUser(user);
    if (existingName) return;

    let latched = false;
    try {
      const key = getNamePromptLatchKey(userId);
      latched = window?.localStorage?.getItem(key) === '1';
    } catch {
      latched = false;
    }

    if (latched) return;

    setNamePromptValue("");
    setNamePromptErr("");
    setNamePromptOpen(true);
  }, [session?.user]);

  const handleNamePromptNotNow = () => {
    const userId = session?.user?.id ?? null;
    if (userId) {
      try {
        window?.localStorage?.setItem(getNamePromptLatchKey(userId), '1');
      } catch {
        // ignore
      }
    }
    setNamePromptOpen(false);
  };

  const handleNamePromptSave = async () => {
    setNamePromptErr("");
    const trimmed = String(namePromptValue || '').trim();
    if (!trimmed) {
      setNamePromptErr("Please enter a name (or choose Not now).");
      return;
    }

    const userId = session?.user?.id ?? null;
    if (!userId) return;

    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.auth.updateUser({ data: { name: trimmed, full_name: trimmed } });
      if (error) throw error;

      try {
        window?.localStorage?.setItem(getNamePromptLatchKey(userId), '1');
      } catch {
        // ignore
      }

      const nextUser = data?.user ?? null;
      if (nextUser) {
        setAuthUser(nextUser);
        onAuthChange?.("USER_UPDATED", { ...session, user: nextUser });
      }

      setNamePromptOpen(false);
    } catch (e) {
      setNamePromptErr(e?.message || "Failed to save name.");
    }
  };
  // PROBE:ACCOUNT_NAME:END

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setNameErr("");

    // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
    let attemptId = null;
    if (mode === "signin") {
      attemptId = beginFirstLoginAuditAttempt({
        surface: "AuthGate",
        mode,
        email: sanitizeFirstLoginAuditEmail(email),
      });
      markFirstLoginAudit('authgate:submit', {
        mode,
        email: sanitizeFirstLoginAuditEmail(email),
      }, attemptId);
    }
    // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END

    try {
      if (!email || !password) {
        setErr("Email and password are required.");
        // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
        if (attemptId) {
          endFirstLoginAuditAttempt('blocked', { reason: 'missing-email-or-password' }, attemptId);
        }
        // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END
        return;
      }

      const supabase = await getSupabase();
      if (mode === "signup") {
        const trimmed = String(name || '').trim();
        if (trimmed.length < 2) {
          setNameErr(trimmed.length === 0 ? "Name is required." : "Name must be at least 2 characters.");
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name: trimmed, full_name: trimmed } } });
        if (error) throw error;
        // If email confirmations are ON, session may be null. Still show a message.
        setErr("Account created. If confirmation is required, check your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
        markFirstLoginAudit('authgate:sign-in-request-resolved', {
          email: sanitizeFirstLoginAuditEmail(email),
        }, attemptId);
        // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END
      }
    } catch (e2) {
      setErr(e2?.message || "Auth error");
      // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
      if (attemptId) {
        markFirstLoginAudit('authgate:request-failed', {
          mode,
          email: sanitizeFirstLoginAuditEmail(email),
          message: e2?.message || "Auth error",
        }, attemptId);
        endFirstLoginAuditAttempt('failed', {
          message: e2?.message || "Auth error",
        }, attemptId);
      }
      // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.15)",
        borderTopColor: "rgba(255,255,255,0.55)",
        animation: "authgate-spin 0.75s linear infinite",
      }} />
      <style>{`@keyframes authgate-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // When auth is disabled, just render children
  if (!authRuntimeMode.enabled) {
    return <>{children}</>;
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: 360, maxWidth: "90vw", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Immanence OS</div>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              style={{ fontSize: 12, opacity: 0.9, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </div>

          <div style={{ fontSize: 18, marginBottom: 12 }}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
            {mode === "signup" ? (
              <>
                <label className="sr-only" htmlFor="auth-signup-name">Name</label>
                <input
                  id="auth-signup-name"
                  value={name}
                  onChange={(e) => {
                    const next = e.target.value;
                    setName(next);
                    if (nameErr) {
                      const trimmed = String(next || "").trim();
                      if (trimmed.length >= 2) setNameErr("");
                    }
                  }}
                  placeholder="Name"
                  autoComplete="name"
                  required
                  style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "inherit" }}
                />
                {nameErr ? <div style={{ fontSize: 12, opacity: 0.9 }}>{nameErr}</div> : null}
              </>
            ) : null}
            <label className="sr-only" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "inherit" }}
            />
            <label className="sr-only" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "inherit" }}
            />
            <button
              type="submit"
              disabled={mode === "signup" && String(name || "").trim().length < 2}
              style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", cursor: "pointer" }}
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
            {err ? <div style={{ fontSize: 12, opacity: 0.9 }}>{err}</div> : null}
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {namePromptOpen ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          style={{ padding: 24 }}
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={handleNamePromptNotNow}
            aria-label="Dismiss dialog"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: 'none', padding: 0 }}
          />
          <div
            className="relative z-10"
            style={{ width: 420, maxWidth: "92vw", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, marginBottom: 10, opacity: 0.95 }}>
              What should we call you?
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
              This becomes your account label across devices.
            </div>
            <label className="sr-only" htmlFor="auth-name-prompt">Name</label>
            <input
              id="auth-name-prompt"
              value={namePromptValue}
              onChange={(e) => setNamePromptValue(e.target.value)}
              placeholder="Name"
              autoComplete="name"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "inherit", marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleNamePromptNotNow}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", cursor: "pointer", fontSize: 12 }}
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleNamePromptSave}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", cursor: "pointer", fontSize: 12 }}
              >
                Save
              </button>
            </div>
            {namePromptErr ? <div style={{ fontSize: 12, opacity: 0.9, marginTop: 10 }}>{namePromptErr}</div> : null}
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
