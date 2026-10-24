import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Lets someone continue a private form (migration 013) on another device. The
 * page keeps a long random key, sends it inside every payload, and shows it to
 * its owner as a personal "continue" link. Given the form and that key, this
 * returns the latest payload saved under it, and nothing else. The key never
 * travels in a URL the server sees: the page reads it from the hash and posts it.
 */
const Body = z.object({
  form: z.string().regex(/^[a-z0-9-]{8,64}$/),
  key: z.string().regex(/^[a-z0-9]{24,64}$/),
})

const fail = (reason: string, status = 400) => NextResponse.json({ ok: false, reason }, { status })

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('bad_request')
  const { form, key } = parsed.data

  const { data, error } = await getSupabaseAdmin()
    .from('form_responses')
    .select('payload, created_at')
    .eq('form', form)
    .eq('payload->>draft_key', key)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return fail('server', 500)
  if (!data) return fail('not_found', 404)

  return NextResponse.json(
    { ok: true, payload: data.payload, saved_at: data.created_at },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
