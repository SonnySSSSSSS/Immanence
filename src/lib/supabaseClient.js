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

function createSupabaseClient() {
  if (!authRuntimeMode.enabled) {
    return createMockClient();
  }

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
