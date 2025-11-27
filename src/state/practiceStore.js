// super simple, localStorage-backed store

const STORAGE_KEY = "immanence_sessions_v1";

export function loadSessions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addSession(session) {
  const list = loadSessions();
  list.push(session);
  saveSessions(list);
}
