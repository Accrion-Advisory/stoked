import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — SERVER ONLY. Bypasses RLS. Used by the
 * /api/signals route to read group members' push subscriptions and fan out
 * notifications without ever exposing those keys to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
