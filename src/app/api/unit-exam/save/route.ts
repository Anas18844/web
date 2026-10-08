import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUnitExamStore } from '@/lib/unit-exam-store'
import { netHash, readPass } from '@/lib/unit-exam-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Saves changed answers — called a couple of seconds after the student stops
 * typing, and retried from the device's queue whenever the network fails.
 *
 * Each answer carries `rev`, which the device increases on every edit. The
 * store keeps a row only if its rev is newer, so a retry that arrives late can
 * never overwrite something the student wrote after it.
 *
 * Closed means closed: after `ends_at` (+ one minute for the network) or after
 * the hand-in, nothing is written.
 */
const GRACE_MS = 60_000
const QUESTION_ID = /^(me-\d{2}|bonus|draft)$/

const Body = z.object({
  token: z.string().max(2000),
  changes: z
    .array(
      z.object({
        id: z.string().regex(QUESTION_ID),
        value: z.unknown(),
        rev: z.number().int().min(1).max(1_000_000),
        flagged: z.boolean(),
      }),
    )
    .max(60),
})

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 })

  const pass = readPass(parsed.data.token)
  if (!pass) return NextResponse.json({ ok: false, reason: 'bad_pass' }, { status: 401 })

  const store = getUnitExamStore()
  const attempt = await store.getAttempt(pass.aid)
  if (!attempt) return NextResponse.json({ ok: false, reason: 'bad_pass' }, { status: 401 })

  const now = Date.now()
  if (attempt.submitted_at || now > Date.parse(attempt.ends_at) + GRACE_MS) {
    return NextResponse.json({ ok: false, reason: 'closed', serverNow: now }, { status: 409 })
  }

  for (const c of parsed.data.changes) {
    if (JSON.stringify(c.value ?? null).length > 6000) {
      return NextResponse.json({ ok: false, reason: 'too_long' }, { status: 413 })
    }
  }

  const kept = await store.saveAnswers(
    attempt.id,
    parsed.data.changes.map((c) => ({
      question_id: c.id,
      value: (c.value ?? null) as never,
      rev: c.rev,
      flagged: c.flagged,
    })),
  )

  const net = netHash(req)
  await store.updateAttempt(attempt.id, { last_seen_at: new Date(now).toISOString() })
  if (net && attempt.net_hash && net !== attempt.net_hash) {
    await store.addEvent(attempt.id, 'net_change', net)
    await store.updateAttempt(attempt.id, { net_hash: net })
  }

  return NextResponse.json({
    ok: true,
    // Everything sent is now stored or already superseded on the server.
    saved: parsed.data.changes.map((c) => ({ id: c.id, rev: c.rev })),
    written: kept.length,
    serverNow: now,
    endsAt: Date.parse(attempt.ends_at),
  })
}
