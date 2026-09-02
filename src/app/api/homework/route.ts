import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findHomework, ESSAY_MARK, totalMarks } from '@/content/homework'
import { gradeEssays } from '@/lib/homework-grader'
import { getSupabaseAdmin } from '@/lib/supabase'
import { EG_MOBILE, normalizePhone } from '@/lib/phone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Marks a homework paper and records the result.
 *
 * ⚠️ ALL marking happens here, on the server, and that is the point.
 *
 * The standalone version marked the multiple choice in the browser, which
 * meant the correct answers had to be in the browser too — its own README
 * flagged that as the first thing to fix. Here the student sends only what
 * they chose; the answer key never leaves this process until after they have
 * committed to their answers.
 *
 * Recording the score is deliberately OPTIONAL. A student following along on
 * YouTube who has not booked can sit the paper and get marked without leaving
 * a phone number — their attempt is still evidence the material is being used.
 * Only a submission carrying a phone is attached to a student.
 */

const submissionSchema = z.object({
  slug: z.string().min(1).max(80),
  /** Client-generated, so a double-tap on submit cannot write two attempts. */
  attemptKey: z.string().min(8).max(120),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  mcq: z.record(z.string(), z.number().int().min(0).max(20)),
  essay: z.record(z.string(), z.string().max(400)),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 })
  }

  const parsed = submissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'BAD_INPUT' }, { status: 400 })
  }

  const { slug, attemptKey, name, phone, mcq, essay } = parsed.data
  const hw = findHomework(slug)
  if (!hw) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })

  // ── Multiple choice: marked here, against the key the browser never had ───
  const mcqDetail = hw.mcq.map((q) => {
    const chosen = mcq[String(q.id)]
    const correct = chosen === q.answer
    return {
      id: q.id,
      type: 'mcq' as const,
      axis: q.axis,
      level: q.level,
      chosen: typeof chosen === 'number' ? chosen : null,
      answer: q.answer,
      correct,
    }
  })
  const mcqScore = mcqDetail.filter((d) => d.correct).length

  // ── Essays: one call for all of them, always returns a mark ───────────────
  const graded = await gradeEssays(
    hw.essay.map((q) => ({
      n: q.id,
      q: q.q,
      model: q.model,
      student: (essay[String(q.id)] || '').trim(),
    })),
  )

  const essayDetail = hw.essay.map((q) => {
    const r = graded.results.find((x) => x.n === q.id)
    return {
      id: q.id,
      type: 'essay' as const,
      axis: q.axis,
      model: q.model,
      match: r?.match ?? 0,
      note: r?.note ?? '',
      correct: Boolean(r?.correct),
    }
  })
  const essayScore = essayDetail.filter((d) => d.correct).length * ESSAY_MARK

  const total = mcqScore + essayScore
  const marks = totalMarks(hw)
  const passed = total >= hw.passMark

  // ── Record it, if the student asked us to ────────────────────────────────
  const normalisedPhone = phone ? normalizePhone(phone) : ''
  const hasPhone = Boolean(normalisedPhone) && EG_MOBILE.test(normalisedPhone)

  let saved = false
  let matchedStudent = false

  if (hasPhone) {
    try {
      const supabase = getSupabaseAdmin()

      // Attach to the booking if there is one. No match is not an error — it
      // means "sat the paper, no booking on this number", which is exactly the
      // list the team wants to ring.
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', normalisedPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      matchedStudent = Boolean(lead?.id)

      const { error } = await supabase.from('homework_submissions').upsert(
        {
          homework_slug: hw.slug,
          grade: hw.grade,
          student_name: name || null,
          phone: normalisedPhone,
          lead_id: lead?.id ?? null,
          mcq_score: mcqScore,
          mcq_total: hw.mcq.length,
          essay_score: essayScore,
          essay_total: hw.essay.length * ESSAY_MARK,
          total_score: total,
          total_marks: marks,
          passed,
          // Only what a teacher needs to see a pattern. No student text: a
          // free-text essay answer can contain anything, and none of it is
          // needed to know which question a class got wrong.
          detail: [
            ...mcqDetail.map(({ id, type, axis, level, correct }) => ({ id, type, axis, level, correct })),
            ...essayDetail.map(({ id, type, axis, match, correct }) => ({ id, type, axis, match, correct })),
          ],
          grader_source: graded.source,
          attempt_key: attemptKey,
        },
        { onConflict: 'attempt_key' },
      )

      saved = !error
    } catch {
      // A database that will not take the row must not cost the student their
      // result — they finished the paper, and the marking is already done.
      saved = false
    }
  }

  return NextResponse.json({
    ok: true,
    score: { mcq: mcqScore, mcqTotal: hw.mcq.length, essay: essayScore, essayTotal: hw.essay.length * ESSAY_MARK, total, marks, passed },
    // Returned only NOW, after the student has committed to their answers.
    mcq: mcqDetail.map(({ id, chosen, answer, correct, axis, level }) => ({ id, chosen, answer, correct, axis, level })),
    essay: essayDetail,
    grader: { source: graded.source, error: graded.error },
    recorded: { requested: hasPhone, saved, matchedStudent },
  })
}
