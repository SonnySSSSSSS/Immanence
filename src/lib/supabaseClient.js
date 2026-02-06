import { createClient } from '@supabase/supabase-js';

// NOTE: Multi-user sync feature is disabled.
// Set ENABLE_AUTH to true when Supabase CORS is configured.
const ENABLE_AUTH = false;

// Create a mock client that does nothing when auth is disabled
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ error: new Error('Auth disabled') }),
    signInWithPassword: () => Promise.resolve({ error: new Error('Auth disabled') }),
    signOut: () => Promise.resolve({ error: null }),
  }
});

export const supabase = ENABLE_AUTH
  ? createClient(
      'https://snyozqiselfxfifpavmj.supabase.co',
      'sb_publishable_fVQsaU3JzAhoIa2znapxBA_dlSm6quO'
    )
  : createMockClient();
