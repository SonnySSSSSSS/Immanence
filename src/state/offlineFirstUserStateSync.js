import { captureUserStateBundle, applyUserStateBundle } from './offlineFirstUserStateSnapshot.js';

const DEVICE_ID_KEY = 'immanence-device-id';
const OUTBOX_KEY = 'immanence-sync-outbox-v1';
const LAST_ENQUEUED_HASH_KEY = 'immanence-sync-last-enqueued-hash-v1';
const LAST_PUSHED_HASH_KEY = 'immanence-sync-last-pushed-hash-v1';
const LAST_APPLIED_REMOTE_AT_KEY = 'immanence-sync-last-applied-remote-at-v1';

function isBrowser() {
  return typeof window !== 'undefined' && !!window?.localStorage;
}

function getNowIso() {
  return new Date().toISOString();
}

function getOrCreateDeviceId() {
  if (!isBrowser()) return 'unknown-device';

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
  } catch {
    // ignore
  }

  const next =
    (globalThis.crypto?.randomUUID?.() ?? null) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    window.localStorage.setItem(DEVICE_ID_KEY, next);
  } catch {
    // ignore
  }

  return next;
}

function readJsonFromLocalStorage(key, fallback) {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonToLocalStorage(key, value) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function readTextFromLocalStorage(key) {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeTextToLocalStorage(key, value) {
  if (!isBrowser()) return;
  try {
    if (typeof value === 'string') window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function stableStringify(value) {
  const seen = new WeakSet();

  const encode = (v) => {
    if (v === null) return 'null';
    const t = typeof v;
    if (t === 'string') return JSON.stringify(v);
    if (t === 'number') return Number.isFinite(v) ? String(v) : JSON.stringify(null);
    if (t === 'boolean') return v ? 'true' : 'false';
    if (t === 'undefined') return 'null';
    if (t === 'bigint') return JSON.stringify(String(v));
    if (t === 'function' || t === 'symbol') return 'null';

    if (Array.isArray(v)) {
      return `[${v.map(encode).join(',')}]`;
    }

    if (t === 'object') {
      if (seen.has(v)) return JSON.stringify('[Circular]');
      seen.add(v);
      const keys = Object.keys(v).sort();
      const parts = keys.map((k) => `${JSON.stringify(k)}:${encode(v[k])}`);
      return `{${parts.join(',')}}`;
    }

    return JSON.stringify(null);
  };

  return encode(value);
}

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function computeBundleContentHash(bundle, keys) {
  const allowlistedKeys = Array.isArray(keys) ? keys : [];
  const entries = [];
  for (const key of allowlistedKeys) {
    const entry = bundle?.keys?.[key];
    const raw = entry && typeof entry === 'object' ? entry.raw : null;
    const derived =
      typeof raw === 'string'
        ? raw
        : (entry?.parseOk ? stableStringify(entry?.parsed ?? null) : null);
    entries.push([key, derived]);
  }

  const payload = {
    schema: bundle?.schema ?? null,
    keys: entries,
  };

  return djb2Hash(stableStringify(payload));
}

function readOutbox() {
  return readJsonFromLocalStorage(OUTBOX_KEY, []);
}

function writeOutbox(outbox) {
  writeJsonToLocalStorage(OUTBOX_KEY, Array.isArray(outbox) ? outbox : []);
}

function appendOutboxIntent(intent) {
  const outbox = readOutbox();
  outbox.push(intent);
  writeOutbox(outbox);
}

async function bestEffortRehydrateAfterApply() {
  const results = await Promise.allSettled([
    import('./progressStore.js'),
    import('./settingsStore.js'),
    import('./navigationStore.js'),
    import('./pathStore.js'),
    import('./curriculumStore.js'),
    import('./userModeStore.js'),
  ]);

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    const mod = r.value;
    for (const v of Object.values(mod)) {
      const rehydrate = v?.persist?.rehydrate;
      if (typeof rehydrate === 'function') {
        try {
          // Zustand persist rehydrate() may be async depending on storage.
          await rehydrate();
        } catch {
          // ignore
        }
      }
    }
  }

  try {
    const mandala = await import('./mandalaStore.js');
    if (typeof mandala?.syncFromProgressStore === 'function') {
      mandala.syncFromProgressStore();
    }
  } catch {
    // ignore
  }
}

function parseIsoToMs(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function isTabVisible() {
  if (typeof document === 'undefined') return true;
  return !document.hidden;
}

function canAttemptNetwork() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

export function initOfflineFirstUserStateSync({ supabase, keys, debug = false }) {
  if (!supabase) return () => {};
  if (typeof window === 'undefined') return () => {};

  const deviceId = getOrCreateDeviceId();
  const logOnce = new Set();

  const logDebug = (...args) => {
    if (!debug) return;
    console.log('[userStateSync]', ...args);
  };

  const logDebugOnce = (key, ...args) => {
    if (!debug) return;
    if (logOnce.has(key)) return;
    logOnce.add(key);
    logDebug(...args);
  };

  let stopped = false;
  let timerId = null;
  let inFlight = false;

  const ensureBaselineHashes = () => {
    const bundle = captureUserStateBundle(keys);
    const currentHash = computeBundleContentHash(bundle, keys);

    const lastPushedHash = readTextFromLocalStorage(LAST_PUSHED_HASH_KEY);
    if (!lastPushedHash) writeTextToLocalStorage(LAST_PUSHED_HASH_KEY, currentHash);

    const lastEnqueuedHash = readTextFromLocalStorage(LAST_ENQUEUED_HASH_KEY);
    if (!lastEnqueuedHash) writeTextToLocalStorage(LAST_ENQUEUED_HASH_KEY, currentHash);
  };

  const enqueueIfChanged = () => {
    const bundle = captureUserStateBundle(keys);
    const currentHash = computeBundleContentHash(bundle, keys);

    const lastEnqueuedHash = readTextFromLocalStorage(LAST_ENQUEUED_HASH_KEY);
    const lastPushedHash = readTextFromLocalStorage(LAST_PUSHED_HASH_KEY);

    if (currentHash === lastEnqueuedHash || currentHash === lastPushedHash) {
      return { bundle, currentHash, enqueued: false };
    }

    const intent = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: 'UPSERT_DOC',
      doc_key: 'progress_bundle_v1',
      bundle,
      capturedAt: bundle.capturedAt,
      device_id: deviceId,
    };

    appendOutboxIntent(intent);
    writeTextToLocalStorage(LAST_ENQUEUED_HASH_KEY, currentHash);
    logDebug('enqueued', { hash: currentHash, outboxSize: readOutbox().length });

    return { bundle, currentHash, enqueued: true };
  };

  const pushOutbox = async (userId) => {
    if (!canAttemptNetwork()) return;
    const outbox = readOutbox();
    if (!Array.isArray(outbox) || outbox.length === 0) return;

    let index = 0;
    while (!stopped && index < outbox.length) {
      const intent = outbox[index];
      if (!intent || intent.type !== 'UPSERT_DOC') {
        index += 1;
        continue;
      }

      const row = {
        user_id: userId,
        doc_key: intent.doc_key,
        doc: intent.bundle,
        updated_at: getNowIso(),
        updated_by_device: intent.device_id,
      };

      let result;
      try {
        result = await supabase
          .from('user_documents')
          .upsert(row, { onConflict: 'user_id,doc_key' });
      } catch (e) {
        result = { error: e };
      }

      if (result?.error) {
        // Most common MVP failure: table missing / RLS misconfigured / no auth.
        logDebugOnce(
          'supabase_push_error',
          'push failed (local-only mode continues)',
          result.error
        );
        return;
      }

      const pushedHash = computeBundleContentHash(intent.bundle, keys);
      writeTextToLocalStorage(LAST_PUSHED_HASH_KEY, pushedHash);
      writeTextToLocalStorage(LAST_ENQUEUED_HASH_KEY, pushedHash);

      // Remove acked intent and continue.
      outbox.splice(index, 1);
      writeOutbox(outbox);
      logDebug('pushed', { hash: pushedHash, remaining: outbox.length });
    }
  };

  const pullAndApplyIfSafe = async (userId) => {
    if (!canAttemptNetwork()) return;

    let query = supabase
      .from('user_documents')
      .select('doc')
      .eq('doc_key', 'progress_bundle_v1');

    let result;
    try {
      result = await (typeof query.maybeSingle === 'function' ? query.maybeSingle() : query.single());
    } catch (e) {
      result = { error: e };
    }

    if (result?.error) {
      // PGRST116 is "Results contain 0 rows" for .single(); treat as empty.
      const code = result.error?.code || result.error?.details || '';
      if (String(code).includes('PGRST116')) return;

      logDebugOnce(
        'supabase_pull_error',
        'pull failed (local-only mode continues)',
        result.error
      );
      return;
    }

    const remoteBundle = result?.data?.doc ?? null;
    if (!remoteBundle || remoteBundle.schema !== 'progress_bundle_v1') return;

    const remoteCapturedAtMs = parseIsoToMs(remoteBundle.capturedAt);
    if (!remoteCapturedAtMs) return;

    const lastAppliedRemoteAtMs = parseIsoToMs(readTextFromLocalStorage(LAST_APPLIED_REMOTE_AT_KEY)) ?? 0;
    if (remoteCapturedAtMs <= lastAppliedRemoteAtMs) return;

    // Conservative overwrite rule: only apply remote if local hasn't changed since last "synced" baseline.
    const localBundle = captureUserStateBundle(keys);
    const localHash = computeBundleContentHash(localBundle, keys);
    const lastPushedHash = readTextFromLocalStorage(LAST_PUSHED_HASH_KEY);
    if (!lastPushedHash || localHash !== lastPushedHash) {
      logDebug('skip apply (local diverged)', { localHash, lastPushedHash });
      return;
    }

    applyUserStateBundle(remoteBundle, keys);
    await bestEffortRehydrateAfterApply();

    const appliedHash = computeBundleContentHash(remoteBundle, keys);
    writeTextToLocalStorage(LAST_APPLIED_REMOTE_AT_KEY, remoteBundle.capturedAt);
    writeTextToLocalStorage(LAST_PUSHED_HASH_KEY, appliedHash);
    writeTextToLocalStorage(LAST_ENQUEUED_HASH_KEY, appliedHash);

    logDebug('applied remote', { capturedAt: remoteBundle.capturedAt, hash: appliedHash, userId });
  };

  // tick() is the single auth-check bottleneck for all Supabase DB calls.
  // It independently re-validates the session via supabase.auth.getSession() on every
  // cycle — it does NOT rely on the AuthGate session state. supabase.from('user_documents')
  // is only reached when userId is non-null (guarded at the if (!userId) return below).
  // If the stored JWT is invalid or synthetic (e.g. smoke-test injection), the upsert/select
  // network calls will fail with a 401/403 from Supabase; those errors are caught per-call
  // and logged only in debug mode — local-only mode continues without interruption.
  // On sign-out, App.jsx stopUserStateSync() clears this interval before any further tick.
  const tick = async () => {
    if (stopped) return;
    if (!isTabVisible()) return;
    if (inFlight) return;
    inFlight = true;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return;
      const session = data?.session ?? null;
      const userId = session?.user?.id ?? null;
      if (!userId) return;

      // Change detection always writes locally first; enqueue intent for later push.
      enqueueIfChanged();

      // Push local intents (retry-safe due to (user_id, doc_key) PK upsert).
      await pushOutbox(userId);

      // Pull remote state, but only apply when safe (offline-first).
      await pullAndApplyIfSafe(userId);
    } finally {
      inFlight = false;
    }
  };

  ensureBaselineHashes();

  // Kick once immediately (best-effort) then poll.
  tick();
  timerId = window.setInterval(tick, 3000);

  const onOnline = () => tick();
  const onVisibility = () => {
    if (isTabVisible()) tick();
  };

  try {
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);
  } catch {
    // ignore
  }

  logDebug('started', { deviceId, userIdKey: 'auth.uid()', keysCount: Array.isArray(keys) ? keys.length : 0 });

  return () => {
    stopped = true;
    try {
      if (timerId) window.clearInterval(timerId);
    } catch {
      // ignore
    }
    try {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    } catch {
      // ignore
    }
    logDebug('stopped');
  };
}
