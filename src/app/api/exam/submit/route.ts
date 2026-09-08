import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findExam, totalMarks } from '@/content/exams'
import { gradeEssays, localMatch, PASS_THRESHOLD } from '@/lib/homework-grader'
import { getSupabaseAdmin, resolveConfig } from '@/lib/supabase'
import { deriveSecret, verifyPayload } from '@/lib/session-crypto'
import type { ExamPass } from '../start/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Marking calls an external model and may retry — see homework-grader. */
export const maxDuration = 60

/**
 * Marks an exam and records it.
 *
 * ⚠️ Accepts nothing without a valid PASS from /api/exam/start. The pass is
 * signed server-side and carries the phone that cleared the homework gate, so
 * this endpoint never has to trust — or even read — a phone number sent by the
 * browser. Posting here directly without doing the homework is not a hole to
 * be closed later; it does not open.
 *
 * Every section is marked here, against a key the browser has never held.
 */

const schema = z.object({
  pass: z.string().min(20).max(2000),
  attemptKey: z.string().min(8).max(120),
  name: z.string().trim().max(120).optional(),
  mcq: z.record(z.string(), z.number().int().min(0).max(10)),
  trueFalse: z.record(z.string(), z.boolean()),
  blanks: z.record(z.string(), z.string().max(200)),
  essay: z.record(z.string(), z.string().max(1500)),
})

/**
 * A gap is right if it carries the model answer's meaning.
 *
 * Reuses the homework's Arabic normalisation and word matching rather than
 * comparing strings: a student who writes «الحواسب الشخصيه» without the hamza,
 * or «الحاسبات الشخصية», has answered correctly and would fail an equality
 * check. The threshold is the same one essays use, so "correct" means the same
 * thing across the paper.
 */
function blankIsCorrect(student: string, model: string): boolean {
  return localMatch(student, model) >= PASS_THRESHOLD
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'BAD_INPUT' }, { status: 400 })

  const { pass, attemptKey, name, mcq, trueFalse, blanks, essay } = parsed.data

  // ── The pass, not the request, says who this is ───────────────────────────
  const secret = deriveSecret(process.env.DASHBOARD_SESSION_SECRET, resolveConfig().key)
  const claims = verifyPayload<ExamPass>(pass, secret)
  if (!claims) {
    return NextResponse.json(
      { ok: false, reason: 'expired', message: 'الجلسة انتهت. ابدأ الامتحان من الأول.' },
      { status: 401 },
    )
  }

  const exam = findExam(claims.slug)
  if (!exam) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })

  // ── Multiple choice ───────────────────────────────────────────────────────
  const mcqDetail = exam.mcq.map((q) => {
    const chosen = mcq[String(q.id)]
    return {
      id: q.id,
      type: 'mcq' as const,
      chosen: typeof chosen === 'number' ? chosen : null,
      answer: q.answer,
      correct: chosen === q.answer,
    }
  })
  const mcqScore = mcqDetail.filter((d) => d.correct).length

  // ── ○ / × ─────────────────────────────────────────────────────────────────
  const tfDetail = exam.trueFalse.map((q) => {
    const chosen = trueFalse[String(q.id)]
    return {
      id: q.id,
      type: 'truefalse' as const,
      chosen: typeof chosen === 'boolean' ? chosen : null,
      answer: q.answer,
      correct: chosen === q.answer,
    }
  })
  const tfScore = tfDetail.filter((d) => d.correct).length

  // ── Gaps ──────────────────────────────────────────────────────────────────
  const blanksDetail = exam.blanks.answers.map((model, i) => {
    const student = (blanks[String(i)] || '').trim()
    return {
      id: i,
      type: 'blank' as const,
      answer: model,
      correct: Boolean(student) && blankIsCorrect(student, model),
    }
  })
  const blanksScore = blanksDetail.filter((d) => d.correct).length * exam.blanks.marksPerBlank

  // ── Written answers, marked on meaning ────────────────────────────────────
  const graded = await gradeEssays(
    exam.essay.map((q) => ({
      n: q.id,
      q: q.q,
      model: q.model,
      student: (essay[String(q.id)] || '').trim(),
    })),
  )

  const essayDetail = exam.essay.map((q) => {
    const r = graded.results.find((x) => x.n === q.id)
    /**
     * Partial credit, because this question is worth two marks for two ideas.
     * A student who names the number of states but not superposition has half
     * the answer, and the printed key says "درجة لكل شقّ" — marking it zero
     * would be harsher than the paper it came from.
     */
    const match = r?.match ?? 0
    const earned = match >= PASS_THRESHOLD ? q.marks : match >= 35 ? Math.floor(q.marks / 2) : 0
    return {
      id: q.id,
      type: 'essay' as const,
      match,
      note: r?.note ?? '',
      model: q.model,
      rubric: q.rubric,
      marks: q.marks,
      earned,
      correct: earned === q.marks,
    }
  })
  const essayScore = essayDetail.reduce((t, d) => t + d.earned, 0)

  const total = mcqScore + tfScore + blanksScore + essayScore
  const marks = totalMarks(exam)
  const passed = total >= exam.passMark

  // ── Record it. The phone comes from the PASS, never from the request ──────
  let saved = false
  try {
    const { error } = await getSupabaseAdmin().from('exam_submissions').upsert(
      {
        exam_slug: exam.slug,
        grade: exam.grade,
        student_name: name || claims.name || null,
        phone: claims.phone,
        lead_id: claims.leadId,
        homework_id: claims.homeworkId,
        mcq_score: mcqScore,
        mcq_total: exam.mcq.length,
        truefalse_score: tfScore,
        truefalse_total: exam.trueFalse.length,
        blanks_score: blanksScore,
        blanks_total: exam.blanks.marks,
        essay_score: essayScore,
        essay_total: exam.essay.reduce((t, e) => t + e.marks, 0),
        total_score: total,
        total_marks: marks,
        passed,
        detail: [
          ...mcqDetail.map(({ id, type, correct }) => ({ id, type, correct })),
          ...tfDetail.map(({ id, type, correct }) => ({ id, type, correct })),
          ...blanksDetail.map(({ id, type, correct }) => ({ id, type, correct })),
          ...essayDetail.map(({ id, type, match, earned, marks: m }) => ({
            id,
            type,
            match,
            earned,
            marks: m,
          })),
        ],
        grader_source: graded.source,
        attempt_key: attemptKey,
      },
      { onConflict: 'attempt_key' },
    )
    saved = !error
  } catch {
    // The student finished the paper and it is already marked. A database
    // that will not take the row must not cost them their result.
    saved = false
  }

  return NextResponse.json({
    ok: true,
    score: {
      mcq: mcqScore,
      mcqTotal: exam.mcq.length,
      trueFalse: tfScore,
      trueFalseTotal: exam.trueFalse.length,
      blanks: blanksScore,
      blanksTotal: exam.blanks.marks,
      essay: essayScore,
      essayTotal: exam.essay.reduce((t, e) => t + e.marks, 0),
      total,
      marks,
      passed,
    },
    // Returned only now, after the student has committed to their answers.
    mcq: mcqDetail,
    trueFalse: tfDetail,
    blanks: blanksDetail,
    essay: essayDetail,
    grader: { source: graded.source, error: graded.error },
    saved,
  })
}
