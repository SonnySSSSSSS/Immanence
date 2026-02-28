import { OFFLINE_FIRST_USER_STATE_KEYS_SET } from './offlineFirstUserStateKeys.js';

function safeJsonParse(raw) {
  if (typeof raw !== 'string') return { parsed: null, parseOk: false };
  try {
    return { parsed: JSON.parse(raw), parseOk: true };
  } catch {
    return { parsed: null, parseOk: false };
  }
}

export function captureUserStateBundle(keys) {
  const allowlistedKeys = Array.isArray(keys) ? keys : [];
  const capturedAt = new Date().toISOString();
  const bundleKeys = {};

  if (typeof window === 'undefined' || !window?.localStorage) {
    return { schema: 'progress_bundle_v1', capturedAt, keys: bundleKeys };
  }

  for (const key of allowlistedKeys) {
    if (!OFFLINE_FIRST_USER_STATE_KEYS_SET.has(key)) continue;

    let raw = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      raw = null;
    }

    const { parsed, parseOk } = safeJsonParse(raw);
    bundleKeys[key] = { raw, parsed: parseOk ? parsed : null, parseOk };
  }

  return {
    schema: 'progress_bundle_v1',
    capturedAt,
    keys: bundleKeys,
  };
}

export function applyUserStateBundle(bundle, keys) {
  const allowlistedKeys = Array.isArray(keys) ? keys : [];
  const allowlistedSet = new Set(allowlistedKeys.filter((k) => OFFLINE_FIRST_USER_STATE_KEYS_SET.has(k)));

  if (typeof window === 'undefined' || !window?.localStorage) return;
  if (!bundle || typeof bundle !== 'object') return;
  if (bundle.schema !== 'progress_bundle_v1') return;

  const entries = bundle.keys && typeof bundle.keys === 'object' ? bundle.keys : {};
  for (const [key, entry] of Object.entries(entries)) {
    if (!allowlistedSet.has(key)) continue;
    if (!entry || typeof entry !== 'object') continue;

    try {
      if (typeof entry.raw === 'string') {
        window.localStorage.setItem(key, entry.raw);
      } else if (entry.parseOk) {
        window.localStorage.setItem(key, JSON.stringify(entry.parsed ?? null));
      }
    } catch {
      // Ignore storage write errors (private mode, quotas, blocked storage).
    }
  }
}

