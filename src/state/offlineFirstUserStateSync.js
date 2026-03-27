import { captureUserStateBundle, applyUserStateBundle } from './offlineFirstUserStateSnapshot.js';
import { getFirstLoginAuditNow, markFirstLoginAudit, sanitizeFirstLoginAuditUserId } from '../utils/firstLoginAudit.js';

const DEVICE_ID_KEY = 'immanence-device-id';
const OUTBOX_KEY = 'immanence-sync-outbox-v1';
const LAST_ENQUEUED_HASH_KEY = 'immanence-sync-last-enqueued-hash-v1';
const LAST_PUSHED_HASH_KEY = 'immanence-sync-last-pushed-hash-v1';
const LAST_APPLIED_REMOTE_AT_KEY = 'immanence-sync-last-applied-remote-at-v1';

function normalizeUserId(userId) {
  if (typeof userId !== 'string') return null;
  const trimmed = userId.trim();
  return trimmed || null;
}

function buildScopedSyncStorageKeys(userId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) return null;

  return {
    outbox: `${OUTBOX_KEY}.${normalizedUserId}`,
    lastEnqueuedHash: `${LAST_ENQUEUED_HASH_KEY}.${normalizedUserId}`,
    lastPushedHash: `${LAST_PUSHED_HASH_KEY}.${normalizedUserId}`,
    lastAppliedRemoteAt: `${LAST_APPLIED_REMOTE_AT_KEY}.${normalizedUserId}`,
  };
}

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

function stampProgressBundleOwner(bundle, userId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!bundle || typeof bundle !== 'object' || !normalizedUserId) return bundle;

  const progressEntry = bundle?.keys?.['immanenceOS.progress'];
  if (!progressEntry || typeof progressEntry !== 'object') return bundle;

  const parsed = progressEntry.parseOk && progressEntry.parsed && typeof progressEntry.parsed === 'object'
    ? progressEntry.parsed
    : null;
  if (!parsed) return bundle;
  if (normalizeUserId(parsed.ownerUserId)) return bundle;

  const nextParsed = {
    ...parsed,
    ownerUserId: normalizedUserId,
  };

  return {
    ...bundle,
    keys: {
      ...(bundle.keys || {}),
      'immanenceOS.progress': {
        ...progressEntry,
        raw: JSON.stringify(nextParsed),
        parsed: nextParsed,
        parseOk: true,
      },
    },
  };
}

function readOutbox(storageKeys) {
  return readJsonFromLocalStorage(storageKeys?.outbox, []);
}

function writeOutbox(storageKeys, outbox) {
  writeJsonToLocalStorage(storageKeys?.outbox, Array.isArray(outbox) ? outbox : []);
}

function appendOutboxIntent(storageKeys, intent) {
  const outbox = readOutbox(storageKeys);
  outbox.push(intent);
  writeOutbox(storageKeys, outbox);
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

// PROBE:SUPABASE_CORS:START
const SUPABASE_CORS_PROBE_DEFAULT = true;

function sanitizeProbeUserId(userId) {
  if (typeof userId !== 'string' || userId.length < 10) return null;
  return `${userId.slice(0, 8)}...${userId.slice(-4)}`;
}

function sanitizeProbeError(error) {
  if (!error) return null;
  return {
    name: error.name || null,
    message: error.message || null,
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
    status: error.status || null,
    causeMessage: error.cause?.message || null,
  };
}

function classifySupabaseSyncError(error) {
  const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : null;
  const code = String(error?.code || error?.details || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  const causeMessage = String(error?.cause?.message || '').toLowerCase();
  const combined = `${message} ${causeMessage}`;

  const looksTransportFailure =
    status == null &&
    (
      combined.includes('failed to fetch') ||
      combined.includes('networkerror') ||
      combined.includes('network request failed') ||
      combined.includes('load failed') ||
      combined.includes('err_failed') ||
      combined.includes('cors request did not succeed')
    );

  if (looksTransportFailure) {
    return {
      category: 'transport-or-browser-block',
      hint: 'Browser could not complete the request (network/proxy/VPN/extension/CORS-like transport failure).',
    };
  }

  if (status === 401 || status === 403 || code.includes('42501')) {
    return {
      category: 'auth-or-rls-policy',
      hint: 'Session token or RLS policy likely blocked the request.',
    };
  }

  if (status === 404 || code.includes('42p01')) {
    return {
      category: 'schema-or-table',
      hint: 'Expected table/view may be missing in Supabase.',
    };
  }

  if (status != null && status >= 500) {
    return {
      category: 'supabase-server',
      hint: 'Supabase returned a server error; retry later.',
    };
  }

  return {
    category: 'unknown-sync-error',
    hint: 'Check error code/message for project URL, auth, policy, and connectivity clues.',
  };
}

function buildSyncErrorDebugPayload(error) {
  const classification = classifySupabaseSyncError(error);
  return {
    ...classification,
    status: error?.status ?? null,
    code: error?.code ?? null,
    message: error?.message ?? null,
    details: error?.details ?? null,
  };
}

function emitSupabaseCorsProbe(event, payload = {}) {
  if (typeof window === 'undefined') return;
  const enabled = window.__IMMANENCE_SUPABASE_CORS_PROBE__ ?? SUPABASE_CORS_PROBE_DEFAULT;
  if (!enabled) return;

  const stamp =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? Number(performance.now().toFixed(2))
      : Date.now();

  console.log('[PROBE:SUPABASE_CORS]', {
    stamp,
    event,
    origin: window.location?.origin || null,
    path: '/rest/v1/user_documents',
    ...payload,
  });
}
// PROBE:SUPABASE_CORS:END

export function initOfflineFirstUserStateSync({
  supabase,
  keys,
  userId,
  debug = false,
  initialTickDelayMs = 0,
}) {
  if (!supabase) return () => {};
  if (typeof window === 'undefined') return () => {};

  const scopedUserId = normalizeUserId(userId);
  if (!scopedUserId) return () => {};

  const deviceId = getOrCreateDeviceId();
  const storageKeys = buildScopedSyncStorageKeys(scopedUserId);
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
  let initialTickTimerId = null;
  let inFlight = false;
  let firstTickReported = false;
  let firstTickCompleteReported = false;
  let firstPushReported = false;
  let firstPullReported = false;
  let firstApplyReported = false;

  // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
  markFirstLoginAudit('user-state-sync:init', {
    userId: sanitizeFirstLoginAuditUserId(scopedUserId),
    keyCount: Array.isArray(keys) ? keys.length : 0,
  });
  // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END

  const safeInitialTickDelayMs = Number.isFinite(initialTickDelayMs)
    ? Math.max(0, Math.floor(initialTickDelayMs))
    : 0;

  const ensureBaselineHashes = () => {
    const bundle = captureUserStateBundle(keys);
    const currentHash = computeBundleContentHash(bundle, keys);

    const lastPushedHash = readTextFromLocalStorage(storageKeys.lastPushedHash);
    if (!lastPushedHash) writeTextToLocalStorage(storageKeys.lastPushedHash, currentHash);

    const lastEnqueuedHash = readTextFromLocalStorage(storageKeys.lastEnqueuedHash);
    if (!lastEnqueuedHash) writeTextToLocalStorage(storageKeys.lastEnqueuedHash, currentHash);
  };

  const enqueueIfChanged = () => {
    const bundle = captureUserStateBundle(keys);
    const currentHash = computeBundleContentHash(bundle, keys);

    const lastEnqueuedHash = readTextFromLocalStorage(storageKeys.lastEnqueuedHash);
    const lastPushedHash = readTextFromLocalStorage(storageKeys.lastPushedHash);

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

    appendOutboxIntent(storageKeys, intent);
    writeTextToLocalStorage(storageKeys.lastEnqueuedHash, currentHash);
    logDebug('enqueued', { hash: currentHash, outboxSize: readOutbox(storageKeys).length });

    return { bundle, currentHash, enqueued: true };
  };

  const pushOutbox = async (userId) => {
    const pushStartedAt = getFirstLoginAuditNow();
    if (!canAttemptNetwork()) return;
    const outbox = readOutbox(storageKeys);
    if (!Array.isArray(outbox) || outbox.length === 0) {
      if (!firstPushReported) {
        firstPushReported = true;
        markFirstLoginAudit('user-state-sync:first-push-skip', {
          userId: sanitizeFirstLoginAuditUserId(userId),
          reason: 'empty-outbox',
          durationMs: Number((getFirstLoginAuditNow() - pushStartedAt).toFixed(2)),
        });
      }
      return;
    }

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
        emitSupabaseCorsProbe('push:start', {
          op: 'upsert',
          userId: sanitizeProbeUserId(userId),
          docKey: intent.doc_key,
        });

        result = await supabase
          .from('user_documents')
          .upsert(row, { onConflict: 'user_id,doc_key' });
      } catch (e) {
        emitSupabaseCorsProbe('push:throw', {
          op: 'upsert',
          userId: sanitizeProbeUserId(userId),
          docKey: intent.doc_key,
          error: sanitizeProbeError(e),
        });
        result = { error: e };
      }

      if (!result?.error) {
        emitSupabaseCorsProbe('push:success', {
          op: 'upsert',
          userId: sanitizeProbeUserId(userId),
          docKey: intent.doc_key,
        });
      }

      if (result?.error) {
        const errorDetails = buildSyncErrorDebugPayload(result.error);
        emitSupabaseCorsProbe('push:error', {
          op: 'upsert',
          userId: sanitizeProbeUserId(userId),
          docKey: intent.doc_key,
          classification: errorDetails.category,
          hint: errorDetails.hint,
          error: sanitizeProbeError(result.error),
        });

        // Most common MVP failure: table missing / RLS misconfigured / no auth.
        logDebugOnce(
          'supabase_push_error',
          'push failed (local-only mode continues)',
          errorDetails,
          result.error
        );
        if (!firstPushReported) {
          firstPushReported = true;
          markFirstLoginAudit('user-state-sync:first-push-error', {
            userId: sanitizeFirstLoginAuditUserId(userId),
            durationMs: Number((getFirstLoginAuditNow() - pushStartedAt).toFixed(2)),
            message: result.error?.message || 'push failed',
          });
        }
        return;
      }

      const pushedHash = computeBundleContentHash(intent.bundle, keys);
      writeTextToLocalStorage(storageKeys.lastPushedHash, pushedHash);
      writeTextToLocalStorage(storageKeys.lastEnqueuedHash, pushedHash);

      // Remove acked intent and continue.
      outbox.splice(index, 1);
      writeOutbox(storageKeys, outbox);
      logDebug('pushed', { hash: pushedHash, remaining: outbox.length });
    }

    if (!firstPushReported) {
      firstPushReported = true;
      markFirstLoginAudit('user-state-sync:first-push-complete', {
        userId: sanitizeFirstLoginAuditUserId(userId),
        durationMs: Number((getFirstLoginAuditNow() - pushStartedAt).toFixed(2)),
      });
    }
  };

  const pullAndApplyIfSafe = async (userId) => {
    const pullStartedAt = getFirstLoginAuditNow();
    if (!canAttemptNetwork()) return;

    emitSupabaseCorsProbe('pull:query:build', {
      op: 'select',
      userId: sanitizeProbeUserId(userId),
      docKey: 'progress_bundle_v1',
      select: 'doc',
    });

    let query = supabase
      .from('user_documents')
      .select('doc')
      .eq('user_id', userId)
      .eq('doc_key', 'progress_bundle_v1');

    let result;
    try {
      emitSupabaseCorsProbe('pull:start', {
        op: 'select',
        userId: sanitizeProbeUserId(userId),
        docKey: 'progress_bundle_v1',
      });

      result = await (typeof query.maybeSingle === 'function' ? query.maybeSingle() : query.single());
    } catch (e) {
      emitSupabaseCorsProbe('pull:throw', {
        op: 'select',
        userId: sanitizeProbeUserId(userId),
        docKey: 'progress_bundle_v1',
        error: sanitizeProbeError(e),
      });
      result = { error: e };
    }

    if (!result?.error) {
      emitSupabaseCorsProbe('pull:success', {
        op: 'select',
        userId: sanitizeProbeUserId(userId),
        docKey: 'progress_bundle_v1',
      });
    }

    if (result?.error) {
      const errorDetails = buildSyncErrorDebugPayload(result.error);
      emitSupabaseCorsProbe('pull:error', {
        op: 'select',
        userId: sanitizeProbeUserId(userId),
        docKey: 'progress_bundle_v1',
        classification: errorDetails.category,
        hint: errorDetails.hint,
        error: sanitizeProbeError(result.error),
      });

      // PGRST116 is "Results contain 0 rows" for .single(); treat as empty.
      const code = result.error?.code || result.error?.details || '';
      if (String(code).includes('PGRST116')) return;

      logDebugOnce(
        'supabase_pull_error',
        'pull failed (local-only mode continues)',
        errorDetails,
        result.error
      );
      if (!firstPullReported) {
        firstPullReported = true;
        markFirstLoginAudit('user-state-sync:first-pull-error', {
          userId: sanitizeFirstLoginAuditUserId(userId),
          durationMs: Number((getFirstLoginAuditNow() - pullStartedAt).toFixed(2)),
          message: result.error?.message || 'pull failed',
        });
      }
      return;
    }

    const remoteBundle = stampProgressBundleOwner(result?.data?.doc ?? null, userId);
    if (!remoteBundle || remoteBundle.schema !== 'progress_bundle_v1') {
      if (!firstPullReported) {
        firstPullReported = true;
        markFirstLoginAudit('user-state-sync:first-pull-empty', {
          userId: sanitizeFirstLoginAuditUserId(userId),
          durationMs: Number((getFirstLoginAuditNow() - pullStartedAt).toFixed(2)),
        });
      }
      return;
    }

    const remoteCapturedAtMs = parseIsoToMs(remoteBundle.capturedAt);
    if (!remoteCapturedAtMs) return;

    const lastAppliedRemoteAtMs = parseIsoToMs(readTextFromLocalStorage(storageKeys.lastAppliedRemoteAt)) ?? 0;
    if (remoteCapturedAtMs <= lastAppliedRemoteAtMs) return;

    // Conservative overwrite rule: only apply remote if local hasn't changed since last "synced" baseline.
    const localBundle = captureUserStateBundle(keys);
    const localHash = computeBundleContentHash(localBundle, keys);
    const lastPushedHash = readTextFromLocalStorage(storageKeys.lastPushedHash);
    if (!lastPushedHash || localHash !== lastPushedHash) {
      logDebug('skip apply (local diverged)', { localHash, lastPushedHash });
      if (!firstPullReported) {
        firstPullReported = true;
        markFirstLoginAudit('user-state-sync:first-pull-deferred', {
          userId: sanitizeFirstLoginAuditUserId(userId),
          durationMs: Number((getFirstLoginAuditNow() - pullStartedAt).toFixed(2)),
          reason: 'local-hash-diverged',
        });
      }
      return;
    }

    const applyStartedAt = getFirstLoginAuditNow();
    applyUserStateBundle(remoteBundle, keys);
    await bestEffortRehydrateAfterApply();
    if (!firstApplyReported) {
      firstApplyReported = true;
      markFirstLoginAudit('user-state-sync:first-remote-apply', {
        userId: sanitizeFirstLoginAuditUserId(userId),
        durationMs: Number((getFirstLoginAuditNow() - applyStartedAt).toFixed(2)),
      });
    }

    const appliedHash = computeBundleContentHash(remoteBundle, keys);
    writeTextToLocalStorage(storageKeys.lastAppliedRemoteAt, remoteBundle.capturedAt);
    writeTextToLocalStorage(storageKeys.lastPushedHash, appliedHash);
    writeTextToLocalStorage(storageKeys.lastEnqueuedHash, appliedHash);

    logDebug('applied remote', { capturedAt: remoteBundle.capturedAt, hash: appliedHash, userId });
    if (!firstPullReported) {
      firstPullReported = true;
      markFirstLoginAudit('user-state-sync:first-pull-complete', {
        userId: sanitizeFirstLoginAuditUserId(userId),
        durationMs: Number((getFirstLoginAuditNow() - pullStartedAt).toFixed(2)),
        appliedRemote: true,
      });
    }
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
    const tickStartedAt = getFirstLoginAuditNow();

    if (!firstTickReported) {
      firstTickReported = true;
      markFirstLoginAudit('user-state-sync:first-tick-start', {
        userId: sanitizeFirstLoginAuditUserId(scopedUserId),
      });
    }

    try {
      emitSupabaseCorsProbe('tick:session:start', {
        scopedUserId: sanitizeProbeUserId(scopedUserId),
      });

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        emitSupabaseCorsProbe('tick:session:error', {
          scopedUserId: sanitizeProbeUserId(scopedUserId),
          error: sanitizeProbeError(error),
        });
        return;
      }

      const session = data?.session ?? null;
      const userId = session?.user?.id ?? null;
      emitSupabaseCorsProbe('tick:session:resolved', {
        scopedUserId: sanitizeProbeUserId(scopedUserId),
        sessionUserId: sanitizeProbeUserId(userId),
      });
      if (!userId) return;
      if (userId !== scopedUserId) return;

      // Change detection always writes locally first; enqueue intent for later push.
      enqueueIfChanged();

      // Push local intents (retry-safe due to (user_id, doc_key) PK upsert).
      await pushOutbox(userId);

      // Pull remote state, but only apply when safe (offline-first).
      await pullAndApplyIfSafe(userId);
    } finally {
      inFlight = false;
      if (!firstTickCompleteReported) {
        firstTickCompleteReported = true;
        markFirstLoginAudit('user-state-sync:first-tick-complete', {
          userId: sanitizeFirstLoginAuditUserId(scopedUserId),
          durationMs: Number((getFirstLoginAuditNow() - tickStartedAt).toFixed(2)),
        });
      }
    }
  };

  ensureBaselineHashes();

  // Kick once after an optional startup delay, then continue polling.
  if (safeInitialTickDelayMs > 0) {
    markFirstLoginAudit('user-state-sync:first-tick-scheduled', {
      userId: sanitizeFirstLoginAuditUserId(scopedUserId),
      delayMs: safeInitialTickDelayMs,
    });
    initialTickTimerId = window.setTimeout(() => {
      initialTickTimerId = null;
      tick();
    }, safeInitialTickDelayMs);
  } else {
    tick();
  }
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

  logDebug('started', { deviceId, userId: scopedUserId, keysCount: Array.isArray(keys) ? keys.length : 0 });

  return () => {
    stopped = true;
    try {
      if (timerId) window.clearInterval(timerId);
    } catch {
      // ignore
    }
    try {
      if (initialTickTimerId) window.clearTimeout(initialTickTimerId);
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
