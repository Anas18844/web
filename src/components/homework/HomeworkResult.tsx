'use client'

import Link from 'next/link'
import type { PublicHomework } from '@/content/homework'
import { toArabicDigits } from '@/lib/arabic'

export type GradedResult = {
  score: {
    mcq: number
    mcqTotal: number
    essay: number
    essayTotal: number
    total: number
    marks: number
    passed: boolean
  }
  mcq: { id: number; chosen: number | null; answer: number; correct: boolean; axis: string; level: string }[]
  essay: { id: number; axis: string; model: string; match: number; note: string; correct: boolean }[]
  grader: { source: 'gemini' | 'local'; error: string | null }
  recorded: { requested: boolean; saved: boolean; matchedStudent: boolean }
}

const ar = (n: number) => toArabicDigits(n)

/**
 * The result card.
 *
 * Three things it refuses to do:
 *
 *   • Hide that a paper was NOT recorded. A student who asked for their score
 *     to count and did not get it must be told here, while they can still do
 *     something about it — not discover it from a register three weeks later.
 *   • Hide that the AI marker was down. An essay marked by word-matching is a
 *     rougher judgement, and the student is owed that context before they
 *     argue with the mark.
 *   • Round a failure up. The number is the number.
 */
export function HomeworkResult({
  homework,
  result,
  onReview,
  onRetry,
}: {
  homework: PublicHomework
  result: GradedResult
  onReview: () => void
  onRetry: () => void
}) {
  const { score, recorded, grader } = result
  const percent = Math.round((score.total / score.marks) * 100)

  const wrongMcq = result.mcq.filter((m) => !m.correct)
  const wrongEssay = result.essay.filter((e) => !e.correct)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded border border-navy-line">
        {/* ── The number ─────────────────────────────────────────────── */}
        <div
          className={`p-7 text-center ${
            score.passed ? 'bg-gold/[0.12]' : 'bg-navy-soft/60'
          }`}
        >
          <p className="font-mono text-5xl font-extrabold text-ink">
            {ar(score.total)}
            <span className="text-2xl text-ink-faint"> / {ar(score.marks)}</span>
          </p>
          <p className="mt-2 font-mono text-sm text-ink-faint">{ar(percent)}٪</p>
          <p className={`mt-3 text-lg font-extrabold ${score.passed ? 'text-gold' : 'text-ink-muted'}`}>
            {score.passed ? 'ناجح 🎉' : 'محتاج مراجعة'}
          </p>
        </div>

        <div className="grid gap-4 border-t border-navy-line p-6">
          <Line label="الاختيار من متعدد" value={score.mcq} outOf={score.mcqTotal} />
          <Line label="الأسئلة المقالية" value={score.essay} outOf={score.essayTotal} />

          {/* ── Was it recorded? ─────────────────────────────────────── */}
          {recorded.requested && recorded.saved && recorded.matchedStudent && (
            <Note tone="good">
              درجتك اتسجّلت باسمك ✓ — مستر أنس هيشوفها في كشف الواجبات.
            </Note>
          )}

          {recorded.requested && recorded.saved && !recorded.matchedStudent && (
            <Note tone="warn">
              اتسجّلت الدرجة، بس الرقم ده مش موجود عندنا كحجز. لو إنت طالب فعلاً، كلّم
              مستر أنس على الواتساب عشان يربط الرقم بحسابك.
            </Note>
          )}

          {recorded.requested && !recorded.saved && (
            <Note tone="warn">
              حصلت مشكلة وإحنا بنسجّل الدرجة. صوّر الشاشة دي وابعتها على الواتساب عشان
              تتسجّل يدوي — نتيجتك مش هتضيع.
            </Note>
          )}

          {!recorded.requested && (
            <Note tone="info">
              الدرجة دي <b>ماتسجّلتش</b> عندنا. لو إنت حاجز مع مستر أنس، حِل تاني وسجّل
              رقمك عشان تتحسبلك.
            </Note>
          )}

          {grader.source === 'local' && (
            <Note tone="warn">
              المصحّح الذكي مكانش متاح، فالمقالي اتصحّح بمطابقة الكلمات. لو شايف إن إجابة
              صح واتحسبت غلط، كلّم مستر أنس.
            </Note>
          )}
        </div>

        {/* ── What went wrong ────────────────────────────────────────── */}
        {(wrongMcq.length > 0 || wrongEssay.length > 0) && (
          <div className="border-t border-navy-line p-6">
            <h3 className="text-sm font-extrabold text-ink">اللي غلط فيه</h3>

            {wrongMcq.length > 0 && (
              <ul className="mt-3 grid gap-2">
                {wrongMcq.map((m) => {
                  const q = homework.mcq.find((x) => x.id === m.id)
                  return (
                    <li key={`m${m.id}`} className="text-sm text-ink-muted">
                      <span className="font-bold text-ink">سؤال {ar(m.id)}</span> — {m.axis}
                      <br />
                      <span className="text-gold">
                        الإجابة الصحيحة: {q?.options[m.answer]}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}

            {wrongEssay.length > 0 && (
              <ul className="mt-4 grid gap-2 border-t border-navy-line/60 pt-4">
                {wrongEssay.map((e) => (
                  <li key={`e${e.id}`} className="text-sm text-ink-muted">
                    <span className="font-bold text-ink">مقالي {ar(e.id)}</span> — {e.axis}
                    <br />
                    <span className="text-gold">الإجابة النموذجية: {e.model}</span>
                    <span className="text-ink-faint"> · تطابق {ar(e.match)}٪</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {wrongMcq.length === 0 && wrongEssay.length === 0 && (
          <div className="border-t border-navy-line p-6">
            <p className="text-sm font-bold text-gold">ممتاز — ورقة كاملة من غير أي غلطة 👏</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-navy-line p-6">
          <button
            type="button"
            onClick={onReview}
            className="min-h-[2.75rem] flex-1 rounded bg-gold px-5 text-sm font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink"
          >
            راجع ورقتي
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[2.75rem] flex-1 rounded border border-navy-line px-5 text-sm font-bold text-ink transition-colors duration-200 hover:border-gold/50 hover:text-gold"
          >
            حِل تاني
          </button>
          <Link
            href="/homework"
            className="flex min-h-[2.75rem] flex-1 items-center justify-center rounded border border-navy-line px-5 text-sm font-bold text-ink transition-colors duration-200 hover:border-gold/50 hover:text-gold"
          >
            كل الواجبات
          </Link>
        </div>
      </div>
    </div>
  )
}

function Line({ label, value, outOf }: { label: string; value: number; outOf: number }) {
  const pct = outOf > 0 ? (value / outOf) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-bold text-ink">{label}</span>
        <span className="font-mono text-ink-muted">
          {ar(value)} / {ar(outOf)}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-navy-line/50">
        <div className="h-full rounded-sm bg-gold" style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  )
}

function Note({ tone, children }: { tone: 'good' | 'warn' | 'info'; children: React.ReactNode }) {
  const styles = {
    good: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
    warn: 'border-gold/45 bg-gold/10 text-ink',
    info: 'border-navy-line bg-navy-soft/50 text-ink-muted',
  }[tone]

  return (
    <p className={`rounded border px-4 py-3 text-sm leading-relaxed ${styles}`}>{children}</p>
  )
}
