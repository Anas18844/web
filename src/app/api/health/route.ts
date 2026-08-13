import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One URL that answers "why is the form failing?" in a single request:
 *
 *   https://<site>/api/health
 *
 * Added after a debugging session where the failing layer could not be told
 * apart from the outside: the form showed one generic message whether the
 * cause was a missing variable, a rejected key, or a schema that had drifted.
 * This turns that into a ten-second check.
 *
 * It reports which environment variables are present, the SHAPE of the key
 * (not the key), which project the URL points at, whether reads work, and
 * whether WRITES work — the last one matters most, because a stale key or a
 * revoked grant can read happily and still refuse every insert, which is
 * exactly the failure this endpoint was built to catch.
 *
 * No secret is ever returned: only booleans, lengths, and a prefix.
 */
/**
 * Reads the role out of a legacy Supabase JWT without verifying it — this is
 * a diagnostic, not an authorisation check. Returns null for the current
 * `sb_secret_` format, which carries no readable payload.
 *
 * Worth surfacing because pasting the `anon` key where the `service_role` key
 * belongs is the single easiest configuration mistake to make, and it fails
 * in the most confusing possible way: reads succeed, writes are silently
 * refused by row-level security.
 */
function readJwtRole(key: string): string | null {
  if (!key.startsWith('eyJ')) return null
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString())
    const role = typeof payload.role === 'string' ? payload.role : null
    return role === 'anon' ? 'anon — WRONG KEY, this one cannot write' : role
  } catch {
    return null
  }
}

export async function GET() {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  const env = {
    SUPABASE_URL: Boolean(url),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(key),
    /** Which Supabase project this deployment actually talks to. */
    projectRef: url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? null,
    /**
     * `sb_secret_…` is the current format; `eyJ…` is the legacy JWT, which
     * still works on projects that have not disabled legacy keys.
     *
     * The format is NOT what decides whether things work — the `write` probe
     * below is. What actually matters is the ROLE inside the key: an `anon`
     * key reads happily and is refused by row-level security on every insert,
     * which looks exactly like a broken database from the outside.
     */
    keyFormat: key.startsWith('sb_secret_')
      ? 'current (sb_secret_)'
      : key.startsWith('eyJ')
        ? 'legacy JWT'
        : key
          ? 'unrecognised'
          : 'missing',
    keyRole: readJwtRole(key),
    keyLength: key.length || null,
  }

  let read = 'skipped'
  let write = 'skipped'
  let latencyMs: number | null = null

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = getSupabaseAdmin()
    const started = Date.now()

    try {
      const { error } = await supabase.from('leads').select('id', { head: true }).limit(1)
      read = error ? `error: ${error.message}` : 'ok'
    } catch (error) {
      read = `error: ${error instanceof Error ? error.message : String(error)}`
    }

    /**
     * The real test. Inserts a row, reads back its id, and deletes it — so a
     * health check never leaves anything behind for the follow-up team to
     * wonder about.
     */
    try {
      const probe = {
        name: 'فحص تلقائي للنظام',
        phone: '01000000000',
        grade: 'first_sec',
        intent: 'curriculum',
        stage: 'partial',
        page_context: '__healthcheck__',
      }
      const { data, error } = await supabase.from('leads').insert(probe).select('id').single()

      if (error) {
        write = `error: ${error.message}${error.hint ? ' | hint: ' + error.hint : ''}`
      } else {
        write = 'ok'
        await supabase.from('leads').delete().eq('id', data.id)
      }
    } catch (error) {
      write = `error: ${error instanceof Error ? error.message : String(error)}`
    }

    latencyMs = Date.now() - started
  }

  const ok = env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && read === 'ok' && write === 'ok'

  return NextResponse.json(
    { ok, env, read, write, latencyMs, time: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  )
}
