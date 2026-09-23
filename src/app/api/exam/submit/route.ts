import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findExam, paperFor, totalMarks } from '@/content/exams'
import { gradeEssays, PASS_THRESHOLD, scoreEssay } from '@/lib/homework-grader'
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
 * Gaps are marked by the MODEL, alongside the written answers.
 *
 * They used to be word-matched locally, and it was too harsh to ship: a student
 * who wrote «الحاسب الشخصي» for «الحواسب الشخصية» — the singular of the right
 * answer — was marked wrong and lost two marks. So was «الهاتف الذكي» for
 * «الهواتف الذكية», and «الكمبيوتر الشخصي». Arabic broken plurals do not share
 * a prefix with their singular, so no amount of stem matching rescues that;
 * only something that reads meaning can.
 *
 * They ride in the SAME single call as the essays — one request marks the whole
 * paper — and are told apart by an id offset. Local matching stays as the
 * fallback for when the model is unreachable, where it is still much better
 * than nothing.
 */
const BLANK_ID_OFFSET = 1000

/** The instruction a gap needs and an essay does not. */
function blankPrompt(index: number): string {
  return `الفراغ رقم ${index + 1} في فقرة «أكمل ما يلي» — المطلوب مصطلح واحد. المفرد والجمع سواء، وأي مرادف صحيح يُقبل.`
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

  const found = findExam(claims.slug)
  if (!found) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })
  // The form comes from the PASS, like the phone — never from the request —
  // so a paper is always marked against the key of the paper that was sat.
  const exam = paperFor(found, claims.form)

  /**
   * ── ONE SITTING, CHECKED AGAIN ────────────────────────────────────────────
   *
   * /api/exam/start refuses a second sitting, but the pass it issued lives for
   * three hours — long enough to be replayed against this endpoint after a
   * result has been recorded. So the rule is enforced here too, on the phone
   * INSIDE the pass rather than anything the browser sent.
   *
   * The same `attemptKey` arriving twice is NOT a second sitting: that is one
   * attempt sent twice — a double tap, a retried request — and the upsert below
   * is built to stay idempotent for exactly that case.
   *
   * ⚠️ A database that cannot answer does NOT block the student here, unlike
   * the gate. They have already written the paper, and refusing to mark it
   * would cost them work they have done. The unique index on
   * (exam_slug, phone) is what actually guarantees one row; this check is here
   * to give a clear answer instead of a failed save.
   *
   * Placed before marking so a replay never spends a grading call.
   */
  try {
    const { data } = await getSupabaseAdmin()
      .from('exam_submissions')
      .select('attempt_key')
      .eq('exam_slug', exam.slug)
      .eq('phone', claims.phone)
      .limit(1)
      .maybeSingle()

    if (data && data.attempt_key !== attemptKey) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'already_sat',
          message: 'إنت امتحنت الامتحان ده قبل كده. الامتحان بيتحل مرة واحدة بس.',
        },
        { status: 409 },
      )
    }
  } catch {
    // Unknown — mark the paper anyway and let the index be the backstop.
  }

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

  // ── Gaps and written answers, marked together in one call ────────────────
  const graded = await gradeEssays([
    ...exam.blanks.answers.map((model, i) => ({
      n: BLANK_ID_OFFSET + i,
      q: blankPrompt(i),
      model,
      student: (blanks[String(i)] || '').trim(),
    })),
    ...exam.essay.map((q) => ({
      n: q.id,
      q: q.q,
      model: q.model,
      rubric: q.rubric,
      student: (essay[String(q.id)] || '').trim(),
    })),
  ])

  const blanksDetail = exam.blanks.answers.map((model, i) => {
    const student = (blanks[String(i)] || '').trim()
    const r = graded.results.find((x) => x.n === BLANK_ID_OFFSET + i)
    return {
      id: i,
      type: 'blank' as const,
      answer: model,
      match: r?.match ?? 0,
      // A gap is all-or-nothing: the printed key says two marks per gap with no
      // partial credit, and half a term is not a thing.
      correct: Boolean(student) && (r?.match ?? 0) >= PASS_THRESHOLD,
    }
  })
  const blanksScore = blanksDetail.filter((d) => d.correct).length * exam.blanks.marksPerBlank

  const essayDetail = exam.essay.map((q) => {
    const r = graded.results.find((x) => x.n === q.id)
    /**
     * Partial credit, because this question is worth two marks for two ideas.
     * A student who names the number of states but not superposition has half
     * the answer, and the printed key says "درجة لكل شقّ" — marking it zero
     * would be harsher than the paper it came from.
     */
    const match = r?.match ?? 0
    const earned = scoreEssay(q.marks, match)
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
          ...blanksDetail.map(({ id, type, match, correct }) => ({ id, type, match, correct })),
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
