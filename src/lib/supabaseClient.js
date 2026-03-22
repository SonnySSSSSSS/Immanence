import { createClient } from '@supabase/supabase-js';
import { assertAuthRuntimeEnvConfigured, runtimeEnv } from '../config/runtimeEnv.js';

const ENABLE_AUTH = runtimeEnv.enableAuth;

// Create a mock client that does nothing when auth is disabled
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ error: new Error('Auth disabled') }),
    signInWithPassword: () => Promise.resolve({ error: new Error('Auth disabled') }),
    signOut: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: new Error('Auth disabled') }),
  }
});

if (ENABLE_AUTH) {
  assertAuthRuntimeEnvConfigured();
}

export const supabase = ENABLE_AUTH
  ? createClient(
      runtimeEnv.supabaseUrl,
      runtimeEnv.supabaseAnonKey
    )
  : createMockClient();
