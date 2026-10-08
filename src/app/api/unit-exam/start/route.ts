import { NextResponse } from 'next/server'
import { z } from 'zod'
import { UNIT_EXAM, unitExamPhase } from '@/content/unit-exam'
import { normalizePhone, EG_MOBILE } from '@/lib/phone'
import { nameError, normalizeName } from '@/lib/name'
import { normalizeArabic } from '@/lib/arabic'
import { getUnitExamStore } from '@/lib/unit-exam-store'
import { deviceSummary, issuePass, netHash, newSeed, personalize, readPass } from '@/lib/unit-exam-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Enter the unit exam, or come back to it.
 *
 * The clock is decided HERE, once: `ends_at` is written when the attempt is
 * created and never recomputed from anything the browser says. A student who
 * returns — same device with the pass, or any device with the same name and
 * number — gets the same attempt, the same paper order, the saved answers and
 * whatever time is left.
 *
 * The paper is only ever sent from this endpoint, and never with answers.
 */
const Body = z.union([
  z.object({ token: z.string().min(10).max(2000) }),
  z.object({
    name: z.string().max(120),
    phone: z.string().max(30),
    type: z.enum(['online', 'exam_only']),
    consent: z.boolean().optional(),
    accepted: z.literal(true),
  }),
])

const fail = (reason: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, reason, message }, { status })

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('bad_request', 'البيانات ناقصة. راجعها وجرّب تاني.')

  const now = Date.now()
  const phase = unitExamPhase(now)
  if (phase === 'before') return fail('not_open', 'الامتحان لسه مفتحش.', 403)
  if (phase === 'closed') return fail('closed', 'الامتحان انتهى.', 403)

  const store = getUnitExamStore()
  const net = netHash(req)
  let attempt

  if ('token' in parsed.data) {
    const pass = readPass(parsed.data.token)
    if (!pass || pass.slug !== UNIT_EXAM.slug) return fail('bad_pass', 'ادخل باسمك ورقمك تاني.', 401)
    attempt = await store.getAttempt(pass.aid)
    if (!attempt) return fail('bad_pass', 'ادخل باسمك ورقمك تاني.', 401)
    await store.addEvent(attempt.id, 'resume', net, { via: 'pass' })
  } else {
    const { name, type, consent } = parsed.data
    const nameProblem = nameError(name)
    if (nameProblem === 'empty') return fail('name', 'اكتب اسمك.')
    if (nameProblem === 'not_arabic') return fail('name', 'اكتب اسمك بالحروف العربي.')
    if (nameProblem === 'not_triple') return fail('name', 'اكتب اسمك الثلاثي: اسمك واسم والدك واسم جدك.')
    const phone = normalizePhone(parsed.data.phone)
    if (!EG_MOBILE.test(phone)) return fail('phone', 'رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.')

    const existing = await store.findAttempt(UNIT_EXAM.slug, phone)
    if (existing) {
      // Coming back on another device: the name has to match the one the
      // attempt was started with, or anyone who knows a number could take over.
      const same = (s: string) => normalizeArabic(normalizeName(s)).replace(/\s+/g, '')
      if (same(existing.full_name) !== same(name)) {
        return fail('name_mismatch', 'الرقم ده بدأ بيه امتحان باسم تاني. اكتب الاسم بالظبط زي ما كتبته أول مرة.', 409)
      }
      attempt = existing
      await store.addEvent(attempt.id, 'resume', net, { via: 'form' })
    } else {
      if (phase === 'late') return fail('late', 'وقت بداية الامتحان خلص.', 403)
      const ends = Math.min(now + UNIT_EXAM.minutes * 60_000, Date.parse(UNIT_EXAM.closesAt))
      attempt = await store.createAttempt({
        exam_slug: UNIT_EXAM.slug,
        phone,
        full_name: normalizeName(name),
        student_type: type,
        contact_consent: type === 'exam_only' ? Boolean(consent) : true,
        ends_at: new Date(ends).toISOString(),
        order_seed: newSeed(),
        net_hash: net,
        device_summary: deviceSummary(req),
      })
      await store.addEvent(attempt.id, 'start', net)
    }
  }

  const paper = await store.getPaper(UNIT_EXAM.slug)
  if (!paper) return fail('no_paper', 'الامتحان مش جاهز. كلّم المستر.', 503)

  await store.updateAttempt(attempt.id, { last_seen_at: new Date(now).toISOString() })
  const answers = await store.getAnswers(attempt.id)

  return NextResponse.json({
    ok: true,
    token: issuePass({ aid: attempt.id, phone: attempt.phone, slug: UNIT_EXAM.slug }),
    attempt: {
      id: attempt.id,
      name: attempt.full_name,
      phone: attempt.phone,
      endsAt: Date.parse(attempt.ends_at),
      submitted: Boolean(attempt.submitted_at),
      receipt: attempt.receipt_code,
    },
    serverNow: Date.now(),
    paper: personalize(paper, attempt.order_seed),
    answers: answers.map((a) => ({ id: a.question_id, value: a.value, rev: a.rev, flagged: a.flagged })),
  })
}
