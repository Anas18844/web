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
export async function GET() {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  const env = {
    SUPABASE_URL: Boolean(url),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(key),
    /** Which Supabase project this deployment actually talks to. */
    projectRef: url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? null,
    /**
     * `sb_secret_…` is the current key format; `eyJ…` is the legacy JWT.
     * A deployment still holding a legacy key after the project stopped
     * accepting them fails on every write while looking perfectly configured.
     */
    keyFormat: key.startsWith('sb_secret_')
      ? 'current (sb_secret_)'
      : key.startsWith('eyJ')
        ? 'LEGACY JWT — likely revoked'
        : key
          ? 'unrecognised'
          : 'missing',
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
