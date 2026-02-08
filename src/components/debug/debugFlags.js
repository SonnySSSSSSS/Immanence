// src/components/debug/debugFlags.js
// Dev-only debug flags stored under localStorage keys `debug:<flag>`.

export const DEBUG_PREFIX = "debug:";

export function parseDebugBool(v) {
  const s = String(v ?? "").toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export function getDebugStorageValue(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage?.getItem(`${DEBUG_PREFIX}${key}`);
  } catch {
    return null;
  }
}

export function setDebugStorageValue(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(`${DEBUG_PREFIX}${key}`, String(value));
  } catch {
    // ignore
  }
}

export function getDebugUrlValue(key) {
  if (typeof window === "undefined") return null;
  const search = String(window.location.search || "").replace(/^\?/, "");
  const hash = String(window.location.hash || "");
  const hashQuery = hash.includes("?") ? hash.split("?").slice(1).join("?") : "";
  const qs = [search, hashQuery].filter(Boolean).join("&");
  if (!qs) return null;
  try {
    return new URLSearchParams(qs).get(key);
  } catch {
    return null;
  }
}

// Single read path used across the app:
// localStorage first (works in embedded shells), optional fallback to URL query/hash.
export function getDebugFlagValue(key, { allowUrl = true } = {}) {
  const fromLs = getDebugStorageValue(key);
  if (fromLs != null) return fromLs;
  if (!allowUrl) return null;
  return getDebugUrlValue(key);
}

export function isDebugFlagEnabled(key, opts) {
  return parseDebugBool(getDebugFlagValue(key, opts));
}

export function setDebugFlag(key, enabled, { reload = true } = {}) {
  setDebugStorageValue(key, enabled ? "1" : "0");
  if (reload && typeof window !== "undefined") window.location.reload();
}

export function toggleDebugFlag(key, { reload = true } = {}) {
  const cur = getDebugStorageValue(key);
  setDebugStorageValue(key, cur === "1" ? "0" : "1");
  if (reload && typeof window !== "undefined") window.location.reload();
}

export function resetAllDebugFlags({ reload = true } = {}) {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(window.localStorage || {});
    for (const k of keys) {
      if (k.startsWith(DEBUG_PREFIX)) window.localStorage.removeItem(k);
    }
    if (reload) window.location.reload();
  } catch {
    // ignore
  }
}

