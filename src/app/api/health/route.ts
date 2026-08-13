import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One URL that answers "why is the form failing?" in a single request:
 *
 *   curl http://localhost:3000/api/health
 *
 * It reports whether the environment variables are present, whether the
 * database answers, and how fast — without exposing a single secret. Added
 * after a debugging session where the failing layer could not be told apart
 * from the outside; this makes that distinction a ten-second check instead
 * of an afternoon.
 */
export async function GET() {
  const env = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }

  let database = 'unreachable'
  let latencyMs: number | null = null

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const started = Date.now()
      const { error } = await getSupabaseAdmin()
        .from('leads')
        .select('id', { head: true, count: 'exact' })
        .limit(1)
      latencyMs = Date.now() - started
      database = error ? `error: ${error.message}` : 'ok'
    } catch (error) {
      database = `error: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  const ok = env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && database === 'ok'

  return NextResponse.json(
    { ok, env, database, latencyMs, time: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  )
}
