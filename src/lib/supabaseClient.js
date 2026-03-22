import { createClient } from '@supabase/supabase-js';
import { assertAuthRuntimeEnvConfigured, runtimeEnv } from '../config/runtimeEnv.js';
import { RuntimeFailureCode, createRuntimeFailure } from '../utils/runtimeFailure.js';

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

if (runtimeEnv.enableAuth) {
  assertAuthRuntimeEnvConfigured();
}

export const supabase = runtimeEnv.enableAuth
  ? createClient(
      runtimeEnv.supabaseUrl,
      runtimeEnv.supabaseAnonKey
    )
  : createMockClient();
