import { NextResponse } from 'next/server'
import { audit, requireAdmin } from '@/lib/auth'
import { getUnitExamStore } from '@/lib/unit-exam-store'
import { UNIT_EXAM } from '@/content/unit-exam'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Everything the marking needs, admin only.
 *
 *   ?format=json → every attempt with all its answers (original option
 *                  indices — the per-student shuffle is undone already) and its
 *                  event counts. This is what the marking script reads.
 *   ?format=csv  → one row per student for a quick look in Excel.
 *
 * Attempts whose time ran out without a hand-in are marked `timeout` here.
 */
export async function GET(req: Request) {
  let user
  try {
    user = await requireAdmin()
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const store = getUnitExamStore()
  const attempts = await store.listAttempts(UNIT_EXAM.slug)
  const events = await store.eventCounts(UNIT_EXAM.slug)
  const now = Date.now()

  const full = []
  for (const a of attempts) {
    const answers = await store.getAnswers(a.id)
    const reason = a.end_reason ?? (now > Date.parse(a.ends_at) ? 'timeout' : null)
    full.push({ ...a, end_reason: reason, events: events[a.id] ?? {}, answers })
  }
  await audit(user, 'export', { after: { what: 'unit-exam', attempts: attempts.length } })

  const format = new URL(req.url).searchParams.get('format')
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')

  if (format === 'csv') {
    const head = ['name', 'phone', 'type', 'consent', 'started_at', 'ends_at', 'submitted_at', 'end_reason', 'answers', 'leave', 'copy_paste', 'receipt', 'net_hash']
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = full.map((a) =>
      [a.full_name, a.phone, a.student_type, a.contact_consent, a.started_at, a.ends_at, a.submitted_at, a.end_reason,
        a.answers.length, a.events.leave ?? 0, (a.events.copy ?? 0) + (a.events.paste ?? 0) + (a.events.shortcut ?? 0),
        a.receipt_code, a.net_hash].map(cell).join(','),
    )
    // BOM so Excel opens the Arabic names correctly.
    return new NextResponse('﻿' + [head.join(','), ...lines].join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="unit-1-exam-${stamp}.csv"`,
      },
    })
  }

  return new NextResponse(JSON.stringify({ slug: UNIT_EXAM.slug, exported_at: new Date().toISOString(), attempts: full }, null, 1), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="unit-1-exam-${stamp}.json"`,
    },
  })
}
