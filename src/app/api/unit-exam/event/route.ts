import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUnitExamStore } from '@/lib/unit-exam-store'
import { netHash, readPass } from '@/lib/unit-exam-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * What happened during the attempt: leaving the page, blocked copy or paste,
 * going offline. Recorded for the review after the exam — never used to take
 * marks automatically, because a notification or a phone call looks the same.
 */
const Body = z.object({
  token: z.string().max(2000),
  type: z.enum(['leave', 'copy', 'paste', 'shortcut', 'offline', 'online', 'time_up']),
  detail: z.record(z.union([z.string().max(80), z.number()])).optional(),
})

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const pass = readPass(parsed.data.token)
  if (!pass) return NextResponse.json({ ok: false }, { status: 401 })

  await getUnitExamStore().addEvent(pass.aid, parsed.data.type, netHash(req), parsed.data.detail)
  return NextResponse.json({ ok: true })
}
