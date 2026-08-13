import { NextResponse } from 'next/server'
import { getSupabaseAdmin, resolveConfig } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One URL that answers "why is the form failing?" in a single request:
 *
 *   https://<site>/api/health
 *
 * Built after a debugging session where the failing layer could not be told
 * apart from the outside: the form showed one generic message whether the
 * cause was a missing variable, a wrong key, or a schema that had drifted.
 *
 * It reports which variable NAMES the deployment can actually see, the role
 * inside the key, and — the part that matters most — whether a real INSERT
 * succeeds. A key with the wrong role reads perfectly and is refused by
 * row-level security on every write, which from the outside is indisput-
 * ably "the site is not saving anything" with no clue as to why.
 *
 * No secret is ever returned: names, roles, lengths and booleans only.
 */

/**
 * Reads the role out of a legacy Supabase JWT without verifying it — a
 * diagnostic, not an authorisation check. Returns null for the current
 * `sb_secret_` format, which carries no readable payload.
 *
 * Surfaced because pasting the `anon` key where `service_role` belongs is the
 * easiest mistake to make and the most confusing to debug.
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

export async function GET(request: Request) {
  const config = resolveConfig()

  /**
   * Detail is gated. Unauthenticated callers get a yes/no on the database and
   * nothing else — because the full report names every SUPABASE variable the
   * deployment can see, and the write probe inserts a real row on every hit.
   * Left open, this endpoint is both a map of the configuration and a free
   * write amplifier against the production table.
   *
   * Set HEALTH_TOKEN in the deployment and call /api/health?key=<token> for
   * the full diagnosis.
   */
  const token = process.env.HEALTH_TOKEN
  const provided = new URL(request.url).searchParams.get('key')
  const detailed = Boolean(token && provided && provided === token)

  if (!detailed) {
    let reachable = false
    try {
      if (config.key) {
        const { error } = await getSupabaseAdmin().from('leads').select('id', { head: true }).limit(1)
        reachable = !error
      }
    } catch {
      reachable = false
    }
    return NextResponse.json(
      {
        ok: reachable,
        database: reachable ? 'ok' : 'unreachable',
        detail: token ? 'add ?key=… for the full report' : 'set HEALTH_TOKEN to enable details',
        time: new Date().toISOString(),
      },
      { status: reachable ? 200 : 503 },
    )
  }

  const env = {
    /** Which variable supplied each value — "built-in default" means none did. */
    urlFrom: config.urlFrom,
    keyFrom: config.keyFrom,
    projectRef: config.url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? null,
    keyFormat: !config.key
      ? 'missing'
      : config.key.startsWith('sb_secret_')
        ? 'current (sb_secret_)'
        : config.key.startsWith('eyJ')
          ? 'legacy JWT'
          : 'unrecognised',
    keyRole: config.key ? readJwtRole(config.key) : null,
    keyLength: config.key?.length ?? null,
    /**
     * Every SUPABASE-ish variable the deployment can see. If this is empty,
     * nothing was set. If it lists a name that is not the one being read, the
     * variable exists under the wrong name — which looks identical from the
     * form's side and is invisible without this line.
     */
    namesPresent: config.namesPresent,
  }

  let read = 'skipped'
  let write = 'skipped'
  let latencyMs: number | null = null

  if (config.key) {
    const supabase = getSupabaseAdmin()
    const started = Date.now()

    try {
      const { error } = await supabase.from('leads').select('id', { head: true }).limit(1)
      read = error ? `error: ${error.message}` : 'ok'
    } catch (error) {
      read = `error: ${error instanceof Error ? error.message : String(error)}`
    }

    /**
     * The real test. Inserts a row, reads back its id, then deletes it — so a
     * health check never leaves anything behind for the follow-up team to
     * wonder about.
     */
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: 'فحص تلقائي للنظام',
          phone: '01000000000',
          grade: 'first_sec',
          intent: 'curriculum',
          stage: 'partial',
          page_context: '__healthcheck__',
        })
        .select('id')
        .single()

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

  const ok = read === 'ok' && write === 'ok'

  return NextResponse.json(
    { ok, env, read, write, latencyMs, time: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  )
}
