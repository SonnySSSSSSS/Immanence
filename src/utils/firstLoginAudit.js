// PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
const FIRST_LOGIN_AUDIT_KEY = '__IMMANENCE_FIRST_LOGIN_AUDIT__';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getFirstLoginAuditNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return Number(performance.now().toFixed(2));
  }
  return Date.now();
}

function ensureFirstLoginAuditStore() {
  if (!isBrowser()) return null;

  const existing = window[FIRST_LOGIN_AUDIT_KEY];
  if (existing && typeof existing === 'object') return existing;

  const next = {
    seq: 0,
    attempts: [],
    events: [],
    currentAttemptId: null,
    lastAttemptId: 0,
  };
  window[FIRST_LOGIN_AUDIT_KEY] = next;
  return next;
}

export function sanitizeFirstLoginAuditUserId(userId) {
  if (typeof userId !== 'string' || userId.length < 10) return null;
  return `${userId.slice(0, 8)}...${userId.slice(-4)}`;
}

export function sanitizeFirstLoginAuditEmail(email) {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return null;
  return `***${trimmed.slice(atIndex)}`;
}

export function beginFirstLoginAuditAttempt(detail = {}) {
  const store = ensureFirstLoginAuditStore();
  if (!store) return null;

  store.lastAttemptId += 1;
  const attemptId = `attempt-${store.lastAttemptId}`;
  store.currentAttemptId = attemptId;
  store.attempts.push({
    attemptId,
    startedAtIso: new Date().toISOString(),
    startedAtMs: getFirstLoginAuditNow(),
    detail,
  });

  markFirstLoginAudit('attempt:start', detail, attemptId);
  return attemptId;
}

export function markFirstLoginAudit(event, detail = {}, explicitAttemptId = null) {
  const store = ensureFirstLoginAuditStore();
  if (!store) return null;

  store.seq += 1;
  const attemptId = explicitAttemptId ?? store.currentAttemptId ?? null;
  const payload = {
    seq: store.seq,
    event,
    attemptId,
    atMs: getFirstLoginAuditNow(),
    atIso: new Date().toISOString(),
    href: window.location?.href ?? null,
    detail,
  };

  store.events.push(payload);
  if (store.events.length > 600) {
    store.events.shift();
  }

  try {
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark(`first-login-audit:${event}:${store.seq}`);
    }
  } catch {
    // ignore
  }

  console.info('[PROBE:first-login-homehub-audit]', payload);
  return payload;
}

export function endFirstLoginAuditAttempt(status = 'complete', detail = {}, explicitAttemptId = null) {
  const store = ensureFirstLoginAuditStore();
  if (!store) return null;

  const attemptId = explicitAttemptId ?? store.currentAttemptId ?? null;
  const payload = markFirstLoginAudit(`attempt:${status}`, detail, attemptId);
  if (attemptId && store.currentAttemptId === attemptId) {
    store.currentAttemptId = null;
  }
  return payload;
}

export function getFirstLoginAuditSnapshot() {
  const store = ensureFirstLoginAuditStore();
  if (!store) return null;
  return {
    currentAttemptId: store.currentAttemptId,
    attempts: [...store.attempts],
    events: [...store.events],
  };
}
// PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END
