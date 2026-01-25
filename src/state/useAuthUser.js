import { useEffect, useState } from "react";

let currentUser = null;
const listeners = new Set();

export function setAuthUser(user) {
  currentUser = user ?? null;
  listeners.forEach((listener) => listener(currentUser));
}

export function useAuthUser() {
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
    const handleChange = (nextUser) => setUser(nextUser);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return user ?? null;
}

export function getDisplayName(user) {
  if (!user) return "";
  const metaName = user.user_metadata?.username;
  if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
  const email = user.email || "";
  const prefix = email.includes("@") ? email.split("@")[0] : email;
  return prefix || "there";
}
