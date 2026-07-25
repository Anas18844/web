import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client.
 *
 * Writes happen exclusively on the server with the service role key
 * (roadmap §6): the browser never touches the database, and RLS is left with
 * no public policies at all — so leads can never be read from the client.
 */
let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase environment variables are missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).')
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
