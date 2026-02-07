import React, { useEffect, useState } from "react";
// NOTE: Multi-user sync feature is disabled until Supabase CORS is configured.
// To enable, set ENABLE_AUTH to true and configure Supabase allowed origins.
const ENABLE_AUTH = false;

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

  if (loading) return null;

  // When auth is disabled, just render children
  if (!ENABLE_AUTH) {
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
      {children}
    </>
  );
}
