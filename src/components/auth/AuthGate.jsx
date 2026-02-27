import React, { useEffect, useState } from "react";
import { SUPABASE_ANON_KEY_PREFIX_FOR_PROBE, SUPABASE_URL_FOR_PROBE } from "../../lib/supabaseClient";
// NOTE: Multi-user sync feature is disabled until Supabase CORS is configured.
// To enable, set ENABLE_AUTH to true and configure Supabase allowed origins.
const ENABLE_AUTH = true;

// Lazy import to avoid Supabase initialization when auth is disabled
const getSupabase = () => import("../../lib/supabaseClient").then(m => m.supabase);
const getSetAuthUser = () => import("../../state/useAuthUser").then(m => m.setAuthUser);

export default function AuthGate({ children, onAuthChange }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(ENABLE_AUTH);

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [dnsStatus, setDnsStatus] = useState("PENDING");
  const [dnsErrorText, setDnsErrorText] = useState("");
  const [dnsAttempts, setDnsAttempts] = useState(0);
  const [dnsLastAttemptAt, setDnsLastAttemptAt] = useState(0);
  const [dnsNow, setDnsNow] = useState(Date.now());

  useEffect(() => {
    // Skip auth initialization when disabled
    if (!ENABLE_AUTH) {
      onAuthChange?.("INITIAL_SESSION", null);
      return;
    }

    let mounted = true;

    Promise.all([getSupabase(), getSetAuthUser()]).then(([supabase, setAuthUser]) => {
      supabase.auth.getSession().then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error("[AuthGate] getSession error", error);
        const nextSession = data?.session ?? null;
        setSession(nextSession);
        setAuthUser(nextSession?.user ?? null);
        onAuthChange?.("INITIAL_SESSION", nextSession);
        setLoading(false);
      });

      const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
        const nextSession = newSession ?? null;
        setSession(nextSession);
        setAuthUser(nextSession?.user ?? null);
        onAuthChange?.(event, nextSession);
      });

      return () => {
        mounted = false;
        sub?.subscription?.unsubscribe?.();
      };
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      if (!email || !password) {
        setErr("Email and password are required.");
        return;
      }

      const supabase = await getSupabase();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If email confirmations are ON, session may be null. Still show a message.
        setErr("Account created. If confirmation is required, check your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e2) {
      setErr(e2?.message || "Auth error");
    }
  }

  const probeBanner = ENABLE_AUTH ? (
    // PROBE:AUTH_ENABLEMENT:START
    <div
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 99999,
        padding: "12px 16px",
        background: "#ffeb3b",
        color: "#000000",
        border: "3px solid #000000",
        borderRadius: 8,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: 0.5,
        boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
      }}
    >
      AUTH ENABLED: TRUE (PROBE)
    </div>
    // PROBE:AUTH_ENABLEMENT:END
  ) : null;

  // PROBE:SUPABASE_DNS:START
  useEffect(() => {
    if (!ENABLE_AUTH) return;
    let cancelled = false;
    let retryTimer = null;
    const clockTimer = setInterval(() => {
      setDnsNow(Date.now());
    }, 1000);

    const runProbe = () => {
      if (cancelled) return;
      setDnsAttempts((n) => n + 1);
      setDnsLastAttemptAt(Date.now());
      fetch(`${SUPABASE_URL_FOR_PROBE}/auth/v1/signup`, { method: "POST", mode: "no-cors" })
        .then(() => {
          if (cancelled) return;
          setDnsStatus("PASS");
          setDnsErrorText("");
        })
        .catch((e) => {
          if (cancelled) return;
          setDnsStatus("FAIL");
          setDnsErrorText(`${e?.name || "Error"}: ${e?.message || "Failed to fetch"}`);
          retryTimer = setTimeout(runProbe, 2000);
        });
    };

    runProbe();

    return () => {
      cancelled = true;
      clearInterval(clockTimer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const dnsLastAttemptMsAgo = dnsLastAttemptAt > 0
    ? Math.max(0, Math.round(dnsNow - dnsLastAttemptAt))
    : 0;

  const dnsProbePanel = ENABLE_AUTH ? (
    <div
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 99999,
        padding: "12px 14px",
        background: "#111111",
        color: "#ffffff",
        border: "2px solid #00e5ff",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1.4,
        boxShadow: "0 6px 16px rgba(0,0,0,0.55)",
        maxWidth: "min(92vw, 760px)",
        wordBreak: "break-word",
      }}
    >
      <div>SUPABASE_URL: {SUPABASE_URL_FOR_PROBE}</div>
      <div>ANON_KEY_PREFIX: {SUPABASE_ANON_KEY_PREFIX_FOR_PROBE}...</div>
      <div>DNS_PROBE: {dnsStatus}</div>
      <div>DNS_ATTEMPTS: {dnsAttempts}</div>
      <div>DNS_LAST_ATTEMPT_MS_AGO: {dnsLastAttemptMsAgo}</div>
      {dnsStatus === "FAIL" ? <div>DNS_ERROR: {dnsErrorText}</div> : null}
    </div>
  ) : null;
  // PROBE:SUPABASE_DNS:END

  if (loading) return <>{probeBanner}{dnsProbePanel}</>;

  // When auth is disabled, just render children
  if (!ENABLE_AUTH) {
    return <>{children}</>;
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        {probeBanner}
        {dnsProbePanel}
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
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "inherit" }}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "inherit" }}
            />
            <button
              type="submit"
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
      {probeBanner}
      {dnsProbePanel}
      {children}
    </>
  );
}
