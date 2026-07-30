import { NextResponse } from 'next/server'
import { leadSchema } from '@/lib/validation'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Same WhatsApp number submitting twice inside this window = one lead. */
const DEDUPE_WINDOW_MINUTES = 10

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const lead = parsed.data

  // Bot filters. Both respond with a success shape so bots learn nothing.
  if (lead.company) return NextResponse.json({ ok: true })
  if (typeof lead.elapsed === 'number' && lead.elapsed < 2000) {
    return NextResponse.json({ ok: true })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Idempotency: a repeated submission is treated as success, not a duplicate row.
    const since = new Date(Date.now() - DEDUPE_WINDOW_MINUTES * 60_000).toISOString()
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('whatsapp', lead.whatsapp)
      .gte('created_at', since)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, deduped: true })
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: lead.name,
        phone: lead.phone,
        whatsapp: lead.whatsapp,
        grade: lead.grade,
        attendance: lead.attendance,
        branch: lead.branch ?? null,
        heard_from: lead.heardFrom,
        intent: lead.intent,
        note: lead.note || null,
        page_context: lead.pageContext || null,
        source: lead.utm?.utm_source || lead.utm?.referrer || null,
        utm: lead.utm && Object.keys(lead.utm).length ? lead.utm : null,
      })
      .select('id')
      .single()

    if (error) throw error

    // Fire-and-forget: automation must never be able to fail a capture.
    void notifyAutomation({ id: data.id, ...lead })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[lead] insert failed', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

/**
 * Hands the lead to the n8n/Frappe pipeline that sends the WhatsApp
 * confirmation. Deliberately not awaited for its result: if the webhook is
 * down we still keep the lead and log the failure for manual follow-up.
 */
async function notifyAutomation(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL
  if (!url) return

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LEAD_WEBHOOK_SECRET
          ? { 'X-Webhook-Secret': process.env.LEAD_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    if (!res.ok) console.error('[lead] webhook returned', res.status)
  } catch (error) {
    console.error('[lead] webhook failed', error)
  }
}
