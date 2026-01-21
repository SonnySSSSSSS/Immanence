import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("[AuthGate] getSession error", error);
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      if (!email || !password) {
        setErr("Email and password are required.");
        return;
      }

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

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) return null;

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
      <button
        type="button"
        onClick={handleSignOut}
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.35)",
          cursor: "pointer",
          fontSize: 12,
        }}
        aria-label="Sign out"
      >
        Sign out
      </button>
    </>
  );
}
