import { NextResponse } from 'next/server'
import {
  leadRecoverySchema,
  leadStep1Schema,
  leadStep2Schema,
} from '@/lib/validation'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Same phone submitting twice inside this window = one lead, not two. */
const DEDUPE_WINDOW_MINUTES = 10

/**
 * How long a step-one row stays open for completion. Long enough for a student
 * who gets interrupted, short enough that a stale id is worthless tomorrow.
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

  // A recovery submission carries the step-two answers too. It is the same
  // endpoint on purpose: one URL for "save this student", however much of them
  // we happen to have.
  if (body && typeof body === 'object' && 'heardFrom' in body) {
    return recover(body)
  }

  const parsed = leadStep1Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const lead = parsed.data

  /**
   * The honeypot, and ONLY the honeypot.
   *
   * There used to be a second filter here that rejected anything submitted
   * within 2s of the form mounting. It was removed in August 2026 because it
   * was hurting real students and catching no bots: a browser that autofills
   * name and phone reaches "كمّل" in well under two seconds, and a scripted
   * post simply omits the optional timing field. A trap a human can walk into
   * is not a trap, it is a hole.
   *
   * The reply still uses a success shape so a bot learns nothing.
   */
  if (lead.company) {
    return NextResponse.json({ ok: true, id: crypto.randomUUID() })
  }

  const suspiciouslyFast = typeof lead.elapsed === 'number' && lead.elapsed < 1200

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
      return NextResponse.json({ ok: true, id: existing[0].id, deduped: true })
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
    void notifyAutomation({ id: data.id, stage: 'partial', suspiciouslyFast, ...lead })

    return NextResponse.json({ ok: true, id: data.id })
  } catch (error) {
    console.error('[lead] step 1 insert failed', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

/**
 * STEP TWO — enrich the lead the student already gave us.
 *
 * Identified by id AND phone: the update only touches a row whose phone
 * already matches what the browser is sending. That needs no shared secret,
 * so there is nothing that can drift between the two requests — which is what
 * the signed-token version got wrong, and what students saw as a red box.
 *
 * Every outcome that is not a database failure answers 200. If the row cannot
 * be found we say so in the body rather than the status, because the client's
 * correct response is to re-send the whole lead, not to alarm the student.
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
    console.error('[lead] step 2 payload rejected', parsed.error.issues.map((i) => i.path.join('.')))
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const lead = parsed.data

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
      // The proof of ownership: you can only complete a row whose phone you
      // already know, and the id is only ever handed to the browser that
      // created it.
      .eq('phone', lead.phone)
      // Only ever an OPEN row. Without this, re-submitting step two — a
      // double-tap, a back button — would rewrite answers that are already in.
      .eq('stage', 'partial')
      .gte('created_at', since)
      .select('id, name, phone, grade, intent, page_context')
      .maybeSingle()

    if (error) throw error

    if (!data) {
      /**
       * Nothing open matched. Two very different reasons, and the client needs
       * to tell them apart: if this lead is already finished we are done, but
       * if the row genuinely cannot be found the client must re-send it.
       */
      const { data: done } = await supabase
        .from('leads')
        .select('id')
        .eq('id', lead.id)
        .eq('phone', lead.phone)
        .eq('stage', 'complete')
        .maybeSingle()

      if (done) return NextResponse.json({ ok: true, matched: false, already: true })

      console.warn('[lead] step 2 found no open row', lead.id)
      return NextResponse.json({ ok: true, matched: false })
    }

    void notifyAutomation({ ...data, stage: 'complete', ...lead })

    return NextResponse.json({ ok: true, matched: true })
  } catch (error) {
    console.error('[lead] step 2 update failed', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

/**
 * The recovery path: a whole lead in one request.
 *
 * Reached when step two could not attach to its row. It completes the open
 * row for that phone if one exists, and inserts a finished lead if not — so
 * the student's answers land either way and the follow-up team never has to
 * know which route they took.
 */
async function recover(body: unknown) {
  const parsed = leadRecoverySchema.safeParse(body)
  if (!parsed.success) {
    console.error('[lead] recovery payload rejected', parsed.error.issues.map((i) => i.path.join('.')))
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const lead = parsed.data
  if (lead.company) return NextResponse.json({ ok: true })

  const fields = {
    name: lead.name,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    grade: lead.grade,
    attendance: lead.attendance,
    branch: lead.branch ?? null,
    heard_from: lead.heardFrom,
    note: lead.note || null,
    intent: lead.intent,
    stage: 'complete',
    completed_at: new Date().toISOString(),
    page_context: lead.pageContext || null,
    source: lead.utm?.utm_source || lead.utm?.referrer || null,
    utm: lead.utm && Object.keys(lead.utm).length ? lead.utm : null,
  }

  try {
    const supabase = getSupabaseAdmin()
    const since = new Date(Date.now() - COMPLETION_WINDOW_MINUTES * 60_000).toISOString()

    // Already finished within the window: a re-send, not a recovery. Writing
    // anything here would either duplicate the student or overwrite answers
    // that are already correct.
    const { data: finished } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', lead.phone)
      .eq('stage', 'complete')
      .gte('created_at', since)
      .limit(1)

    if (finished && finished.length > 0) {
      return NextResponse.json({ ok: true, recovered: 'already' })
    }

    // Prefer completing the row step one already made, so recovery does not
    // leave the team two records for one student.
    const { data: open } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', lead.phone)
      .eq('stage', 'partial')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)

    if (open && open.length > 0) {
      const { error } = await supabase.from('leads').update(fields).eq('id', open[0].id)
      if (error) throw error
      console.warn('[lead] recovered by completing the open row', open[0].id)
      void notifyAutomation({ id: open[0].id, stage: 'complete', recovered: true, ...lead })
      return NextResponse.json({ ok: true, recovered: 'updated' })
    }

    const { data, error } = await supabase.from('leads').insert(fields).select('id').single()
    if (error) throw error
    console.warn('[lead] recovered by inserting a complete row', data.id)
    void notifyAutomation({ id: data.id, stage: 'complete', recovered: true, ...lead })
    return NextResponse.json({ ok: true, recovered: 'inserted' })
  } catch (error) {
    console.error('[lead] recovery failed', error)
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
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    if (!res.ok) console.error('[lead] webhook returned', res.status)
  } catch (error) {
    console.error('[lead] webhook failed', error)
  }
}
