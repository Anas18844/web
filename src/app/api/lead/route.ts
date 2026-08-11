import { NextResponse } from 'next/server'
import { leadStep1Schema, leadStep2Schema } from '@/lib/validation'
import { signLeadId, verifyLeadToken } from '@/lib/lead-token'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Same phone submitting twice inside this window = one lead, not two. */
const DEDUPE_WINDOW_MINUTES = 10

/**
 * How long a step-one row stays open for completion. Long enough for a student
 * who gets interrupted, short enough that a leaked token is worthless tomorrow.
 */
const COMPLETION_WINDOW_MINUTES = 180

/**
 * STEP ONE — save the lead.
 *
 * This fires the moment the student gives us a name, a number and a year. The
 * row is written before we ask anything else, because a lead we can phone is
 * worth more than a complete form we never received. Everything after this is
 * enrichment (see PATCH).
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parsed = leadStep1Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const lead = parsed.data

  // Bot filters. Both respond with a success shape so bots learn nothing —
  // including a syntactically valid id/token pair, so the trap stays invisible.
  if (lead.company || (typeof lead.elapsed === 'number' && lead.elapsed < 2000)) {
    return NextResponse.json({ ok: true, id: crypto.randomUUID(), token: 'x'.repeat(43) })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Idempotency: a double-tap or a refresh continues the SAME row rather
    // than opening a second one the team would have to merge by hand.
    const since = new Date(Date.now() - DEDUPE_WINDOW_MINUTES * 60_000).toISOString()
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', lead.phone)
      .gte('created_at', since)
      .limit(1)

    if (existing && existing.length > 0) {
      const id = existing[0].id
      return NextResponse.json({ ok: true, id, token: signLeadId(id), deduped: true })
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: lead.name,
        phone: lead.phone,
        grade: lead.grade,
        intent: lead.intent,
        stage: 'partial',
        page_context: lead.pageContext || null,
        source: lead.utm?.utm_source || lead.utm?.referrer || null,
        utm: lead.utm && Object.keys(lead.utm).length ? lead.utm : null,
      })
      .select('id')
      .single()

    if (error) throw error

    // Fire-and-forget: automation must never be able to fail a capture.
    void notifyAutomation({ id: data.id, stage: 'partial', ...lead })

    return NextResponse.json({ ok: true, id: data.id, token: signLeadId(data.id) })
  } catch (error) {
    console.error('[lead] step 1 insert failed', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

/**
 * STEP TWO — enrich the lead the student already gave us.
 *
 * Three things have to hold before a row is touched: the signature matches the
 * id, the row is still awaiting completion, and it is recent. Without all
 * three, an id on its own would be enough to overwrite somebody else's answers.
 */
export async function PATCH(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parsed = leadStep2Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const lead = parsed.data

  if (!verifyLeadToken(lead.id, lead.token)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const since = new Date(Date.now() - COMPLETION_WINDOW_MINUTES * 60_000).toISOString()

    const { data, error } = await supabase
      .from('leads')
      .update({
        whatsapp: lead.whatsapp,
        attendance: lead.attendance,
        branch: lead.branch ?? null,
        heard_from: lead.heardFrom,
        note: lead.note || null,
        stage: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', lead.id)
      .eq('stage', 'partial')
      .gte('created_at', since)
      .select('id, name, phone, grade, intent, page_context')
      .maybeSingle()

    if (error) throw error

    // Nothing matched: already completed, or older than the window. Both are
    // fine outcomes for the student — their data is saved either way — so we
    // answer success rather than showing an error over a lead we already have.
    if (!data) return NextResponse.json({ ok: true, already: true })

    void notifyAutomation({ ...data, stage: 'complete', ...lead })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[lead] step 2 update failed', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

/**
 * Hands the lead to the n8n/Frappe pipeline that sends the WhatsApp
 * confirmation. Deliberately not awaited for its result: if the webhook is
 * down we still keep the lead and log the failure for manual follow-up.
 *
 * Fires TWICE per student — once at `stage: 'partial'` so the team can act on
 * a phone number immediately, and again at `stage: 'complete'` with the full
 * picture. The automation should key on `id` and treat the second call as an
 * update, not a new lead.
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
      // The signature never leaves the server — it is a capability, not data.
      body: JSON.stringify({ ...payload, token: undefined }),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    if (!res.ok) console.error('[lead] webhook returned', res.status)
  } catch (error) {
    console.error('[lead] webhook failed', error)
  }
}
