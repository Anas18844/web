import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client.
 *
 * Writes happen exclusively on the server with the service role key
 * (roadmap §6): the browser never touches the database, and RLS is left with
 * no public policies at all — so leads can never be read from the client.
 *
 * CONFIGURATION IS DELIBERATELY FORGIVING. Two full days of a working form
 * saving nothing came down to environment variables that were never set, and
 * a name that has to be typed exactly right in a dashboard is a name that will
 * eventually be typed wrong. So:
 *
 *   - The project URL falls back to a hard-coded default. A Supabase project
 *     URL is NOT a secret — it ships in every browser bundle of every app that
 *     talks to Supabase from the client. Only the key is sensitive, so only
 *     the key genuinely has to be configured.
 *   - Both the URL and the key are read from any of their common names.
 *
 * The result: one variable to set instead of two, and it works under whichever
 * of the usual names it was given.
 */

/**
 * The project this site belongs to. An env var always wins — this is only the
 * floor, so a missing variable degrades to "right project" instead of "no
 * database at all". Change it here if the project ever moves.
 */
const DEFAULT_URL = 'https://rhrwuqjkqflceuddfsso.supabase.co'

const URL_KEYS = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_PROJECT_URL'] as const

const KEY_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SECRET',
  'SUPABASE_KEY',
] as const

function firstSet(names: readonly string[]): { name: string; value: string } | null {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return { name, value }
  }
  return null
}

/** Which names were actually found — surfaced by /api/health, never the values. */
export function resolveConfig() {
  const url = firstSet(URL_KEYS)
  const key = firstSet(KEY_KEYS)
  return {
    url: url?.value ?? DEFAULT_URL,
    urlFrom: url?.name ?? 'built-in default',
    key: key?.value ?? null,
    keyFrom: key?.name ?? null,
    /** Every SUPABASE-ish name present, so a typo is visible at a glance. */
    namesPresent: Object.keys(process.env).filter((n) => /SUPABASE|SB_/i.test(n)),
  }
}

let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const { url, key } = resolveConfig()

  if (!key) {
    throw new Error(
      'Supabase service key is missing. Set SUPABASE_SERVICE_ROLE_KEY in the deployment environment.',
    )
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
