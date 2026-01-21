import { supabase } from './supabaseClient';

export async function testSupabase() {
  return supabase.auth.getSession();
}
