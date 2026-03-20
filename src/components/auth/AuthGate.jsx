import React, { useEffect, useState } from "react";
// NOTE: Auth is enabled for beta access. Supabase CORS must be configured for the deployment origin.
// To disable the auth gate (e.g. for smoke testing), set ENABLE_AUTH to false.
const ENABLE_AUTH = true;

// Lazy import to avoid Supabase initialization when auth is disabled
const getSupabase = () => import("../../lib/supabaseClient").then(m => m.supabase);
const getSetAuthUser = () => import("../../state/useAuthUser").then(m => m.setAuthUser);

export default function AuthGate({ children, onAuthChange }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(ENABLE_AUTH);

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [namePromptValue, setNamePromptValue] = useState("");
  const [namePromptErr, setNamePromptErr] = useState("");

  useEffect(() => {
    // Skip auth initialization when disabled
    if (!ENABLE_AUTH) {
      onAuthChange?.("INITIAL_SESSION", null);
      return;
    }

    let mounted = true;
    let unsubscribe = null;

    const init = async () => {
      try {
        const [supabase, setAuthUser] = await Promise.all([getSupabase(), getSetAuthUser()]);
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) console.error("[AuthGate] getSession error", error);
        const nextSession = data?.session ?? null;
        setSession(nextSession);
        setAuthUser(nextSession?.user ?? null);
        onAuthChange?.("INITIAL_SESSION", nextSession);
        setLoading(false);

        const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (!mounted) return;
          const nextAuthSession = newSession ?? null;
          setSession(nextAuthSession);
          setAuthUser(nextAuthSession?.user ?? null);
          onAuthChange?.(event, nextAuthSession);
        });
        unsubscribe = () => sub?.subscription?.unsubscribe?.();
      } catch (error) {
        if (!mounted) return;
        console.error("[AuthGate] init error", error);
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [onAuthChange]);

  useEffect(() => {
    if (mode !== "signup") setNameErr("");
  }, [mode]);

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
        const setAuthUser = await getSetAuthUser();
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

    try {
      if (!email || !password) {
        setErr("Email and password are required.");
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
            {mode === "signup" ? (
              <>
                <input
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
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={handleNamePromptNotNow}
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
            <input
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
