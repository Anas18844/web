import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Receives the answers of a private one-off form (migration 013) and stores
 * them, one row per send. The form must exist and still be open. Sending again
 * adds a new row; whoever reads the answers takes the latest per respondent.
 */
const MAX_BYTES = 1_000_000

const Body = z.object({
  form: z.string().regex(/^[a-z0-9-]{8,64}$/),
  respondent: z.string().trim().min(1).max(200),
  payload: z.object({ answers: z.array(z.unknown()).max(1000) }).passthrough(),
})

const fail = (reason: string, status = 400) => NextResponse.json({ ok: false, reason }, { status })

export async function POST(req: Request) {
  const raw = await req.text().catch(() => '')
  if (!raw || raw.length > MAX_BYTES) return fail('bad_request')

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return fail('bad_request')
  }
  const parsed = Body.safeParse(json)
  if (!parsed.success) return fail('bad_request')
  const { form, respondent, payload } = parsed.data

  const db = getSupabaseAdmin()
  const page = await db.from('private_pages').select('expires_at').eq('slug', form).maybeSingle()
  if (page.error) return fail('server', 500)
  if (!page.data) return fail('not_found', 404)
  if (page.data.expires_at && new Date(page.data.expires_at) < new Date()) return fail('closed', 410)

  const { error } = await db.from('form_responses').insert({ form, respondent, payload })
  if (error) return fail('server', 500)

  return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
