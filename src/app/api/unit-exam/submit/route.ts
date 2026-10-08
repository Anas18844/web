import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUnitExamStore } from '@/lib/unit-exam-store'
import { answersHash, netHash, readPass, receiptCode } from '@/lib/unit-exam-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The hand-in. Nothing is marked: the attempt is closed, a receipt code is
 * issued for the student to keep, and a fingerprint of the stored answers is
 * written so any later change to them would show.
 *
 * The device saves its last changes BEFORE calling this, so what is closed is
 * what the student saw. Calling it twice returns the same receipt.
 */
const Body = z.object({ token: z.string().max(2000) })

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const pass = readPass(parsed.data.token)
  if (!pass) return NextResponse.json({ ok: false, reason: 'bad_pass' }, { status: 401 })

  const store = getUnitExamStore()
  const attempt = await store.getAttempt(pass.aid)
  if (!attempt) return NextResponse.json({ ok: false, reason: 'bad_pass' }, { status: 401 })

  if (attempt.submitted_at && attempt.receipt_code) {
    return NextResponse.json({ ok: true, receipt: attempt.receipt_code, at: attempt.submitted_at })
  }

  const answers = await store.getAnswers(attempt.id)
  const now = new Date()
  const timedOut = now.getTime() > Date.parse(attempt.ends_at) + 60_000
  const receipt = receiptCode()

  await store.updateAttempt(attempt.id, {
    submitted_at: now.toISOString(),
    end_reason: timedOut ? 'timeout' : 'submitted',
    receipt_code: receipt,
    final_hash: answersHash(answers),
  })
  await store.addEvent(attempt.id, 'submit', netHash(req), { answers: answers.length })

  return NextResponse.json({ ok: true, receipt, at: now.toISOString() })
}
