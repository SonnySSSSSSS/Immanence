import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAuthUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return user;
}

export function getDisplayName(user) {
  if (!user) return "";
  const metaName = user.user_metadata?.username;
  if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
  const email = user.email || "";
  const prefix = email.includes("@") ? email.split("@")[0] : email;
  return prefix || "there";
}
