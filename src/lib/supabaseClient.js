import { createClient } from '@supabase/supabase-js';
import { assertAuthRuntimeEnvConfigured, getAuthRuntimeMode, runtimeEnv } from '../config/runtimeEnv.js';
import { createLogger } from '../utils/logger.js';
import { reportDiagnostic } from '../utils/errorReporter.js';
import { createDiagnostic, emitDiagnostic } from '../utils/diagnostics.js';
import { RuntimeFailureCode, createRuntimeFailure } from '../utils/runtimeFailure.js';

const logger = createLogger('supabaseClient');
const authRuntimeMode = getAuthRuntimeMode();

function createAuthDisabledError() {
  return createRuntimeFailure(null, {
    code: RuntimeFailureCode.AUTH_DISABLED,
    category: 'auth',
    message: 'Auth is disabled by runtime configuration.',
  });
}

// Create a mock client that does nothing when auth is disabled
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ error: createAuthDisabledError() }),
    signInWithPassword: () => Promise.resolve({ error: createAuthDisabledError() }),
    signOut: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: createAuthDisabledError() }),
  }
});

if (authRuntimeMode.enabled) {
  assertAuthRuntimeEnvConfigured();
}

// Pre-emptively remove an expired stored Supabase session before the client
// boots so the SDK never attempts to refresh a token it cannot renew. This
// prevents the 400 / "Invalid Refresh Token" error that fires on first boot
// when the user has a stale token in localStorage.
function purgeExpiredStoredSession(supabaseUrl) {
  if (typeof window === 'undefined') return;
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const expiresAt = parsed?.expires_at;
    // expires_at is a Unix timestamp in seconds
    if (typeof expiresAt === 'number' && Date.now() / 1000 > expiresAt) {
      window.localStorage.removeItem(storageKey);
      logger.info('Purged expired Supabase session from storage before client init.');
    }
  } catch {
    // Ignore JSON parse errors, storage access failures (private browsing), etc.
  }
}

function createSupabaseClient() {
  if (!authRuntimeMode.enabled) {
    return createMockClient();
  }

  purgeExpiredStoredSession(runtimeEnv.supabaseUrl);

  try {
    return createClient(runtimeEnv.supabaseUrl, runtimeEnv.supabaseAnonKey);
  } catch (error) {
    const diagnostic = createDiagnostic(error, {
      source: 'supabase-client-init',
      code: RuntimeFailureCode.AUTH_INIT_FAILED,
      category: 'auth',
      message: 'Failed to initialize Supabase auth client.',
    });
    emitDiagnostic({
      logger,
      reportDiagnostic,
      diagnostic,
      level: 'error',
    });
    throw diagnostic.cause;
  }
}

export const supabase = createSupabaseClient();

// For revoked-but-not-yet-expired tokens the SDK will still attempt a refresh,
// get a 401/400, internally call _removeSession(), and emit SIGNED_OUT. Once
// that fires we call signOut({ scope: 'local' }) to guarantee any residual
// local state is cleared and no further auto-refresh retries are queued.
if (authRuntimeMode.enabled) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  });
}
