import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findExam, toPublic } from '@/content/exams'
import { findHomework } from '@/content/homework'
import { getSupabaseAdmin, resolveConfig } from '@/lib/supabase'
import { deriveSecret, signPayload } from '@/lib/session-crypto'
import { EG_MOBILE, normalizePhone } from '@/lib/phone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * THE GATE.
 *
 * A student may only sit an exam after their homework has been marked and
 * recorded. This is where that is decided, and it is decided HERE rather than
 * in the browser for the obvious reason: a check the client performs is a check
 * the client can skip.
 *
 * Two things follow from that, and both matter:
 *
 *   1. The QUESTIONS are not on the exam page. They are returned by this
 *      endpoint, only once the gate has been cleared. A student who has not
 *      done the homework cannot read the paper by viewing source.
 *   2. A signed PASS is issued alongside them. `/api/exam/submit` accepts
 *      nothing without it, so the marking endpoint cannot be called directly
 *      to bypass this one.
 *
 * The phone is the identity because it is the only identifier this site has:
 * it is what the booking is under and what the homework was recorded against.
 */

const PASS_TTL_MS = 3 * 60 * 60 * 1000

export type ExamPass = {
  slug: string
  phone: string
  homeworkId: string | null
  leadId: string | null
  name: string | null
}

const schema = z.object({
  slug: z.string().min(1).max(80),
  phone: z.string().trim().min(6).max(30),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'BAD_INPUT' }, { status: 400 })

  const exam = findExam(parsed.data.slug)
  if (!exam) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })

  const phone = normalizePhone(parsed.data.phone)
  if (!EG_MOBILE.test(phone)) {
    return NextResponse.json(
      { ok: false, reason: 'bad_phone', message: 'اكتب رقم موبايل مصري صحيح (مثال: 01012345678)' },
      { status: 400 },
    )
  }

  /**
   * ── ONE SITTING ───────────────────────────────────────────────────────────
   *
   * A student who already has a recorded result does not get the paper again.
   * Not strictness for its own sake: they have already seen the answer to every
   * question they got wrong on the result card, so a second attempt measures
   * nothing — and the register would carry two marks for one sitting, with no
   * way to tell which was the real one.
   *
   * Checked BEFORE the homework query, so a student who sat the exam is told
   * that, rather than a homework message that does not apply to them.
   */
  let sat: {
    total_score: number
    total_marks: number
    passed: boolean
    created_at: string
  } | null = null
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('exam_submissions')
      .select('total_score, total_marks, passed, created_at')
      .eq('exam_slug', exam.slug)
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(error.message)
    sat = data
  } catch (error) {
    // Fail CLOSED, for the same reason the homework check below does: a
    // database that cannot say whether this paper has already been sat must not
    // hand it out on the assumption that it has not.
    return NextResponse.json(
      {
        ok: false,
        reason: 'unavailable',
        message: 'مش قادرين نتأكد من بياناتك دلوقتي. جرّب تاني بعد شوية.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    )
  }

  if (sat) {
    return NextResponse.json({
      ok: false,
      reason: 'already_sat',
      message: 'إنت امتحنت الامتحان ده قبل كده. الامتحان بيتحل مرة واحدة بس.',
      // The mark is shown back, so a student who returns worried about whether
      // it counted gets an answer instead of a closed door.
      result: {
        total: sat.total_score,
        marks: sat.total_marks,
        passed: sat.passed,
        at: sat.created_at,
      },
    })
  }

  const homework = findHomework(exam.requiresHomework)

  let submission: { id: string; student_name: string | null; lead_id: string | null } | null = null
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('homework_submissions')
      .select('id, student_name, lead_id')
      .eq('homework_slug', exam.requiresHomework)
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(error.message)
    submission = data
  } catch (error) {
    /**
     * A database that cannot answer must NOT quietly open the gate. This is the
     * one place in the project where failing closed is right: everywhere else a
     * fault costs us a lead, here it would let a student skip the requirement
     * the whole feature exists to enforce.
     */
    return NextResponse.json(
      {
        ok: false,
        reason: 'unavailable',
        message: 'مش قادرين نتأكد من الواجب دلوقتي. جرّب تاني بعد شوية.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    )
  }

  if (!submission) {
    return NextResponse.json({
      ok: false,
      reason: 'no_homework',
      message: 'الرقم ده مالوش واجب متسجّل. لازم تحل الواجب الأول وتسجّل درجتك برقمك.',
      homework: homework
        ? { slug: homework.slug, title: homework.title, lesson: homework.lesson }
        : null,
    })
  }

  const secret = deriveSecret(process.env.DASHBOARD_SESSION_SECRET, resolveConfig().key)
  const pass = signPayload<ExamPass>(
    {
      slug: exam.slug,
      phone,
      homeworkId: submission.id,
      leadId: submission.lead_id,
      name: submission.student_name,
    },
    secret,
    PASS_TTL_MS,
  )

  return NextResponse.json({
    ok: true,
    pass,
    name: submission.student_name,
    exam: toPublic(exam),
  })
}
