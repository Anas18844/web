'use client'

import Link from 'next/link'
import type { PublicExam } from '@/content/exams'
import { toArabicDigits } from '@/lib/arabic'

const ar = (n: number) => toArabicDigits(n)

export type ExamMarked = {
  score: {
    mcq: number
    mcqTotal: number
    trueFalse: number
    trueFalseTotal: number
    blanks: number
    blanksTotal: number
    essay: number
    essayTotal: number
    total: number
    marks: number
    passed: boolean
  }
  mcq: { id: number; chosen: number | null; answer: number; correct: boolean }[]
  trueFalse: { id: number; chosen: boolean | null; answer: boolean; correct: boolean }[]
  blanks: { id: number; answer: string; correct: boolean }[]
  essay: {
    id: number
    match: number
    note: string
    model: string
    rubric: string
    marks: number
    earned: number
  }[]
  grader: { source: 'gemini' | 'local'; error: string | null }
  saved: boolean
}

/**
 * The result card.
 *
 * It shows the mark, then every question the student got wrong WITH the right
 * answer — because a score with no corrections teaches nothing, and this exam
 * is meant to be revised from.
 *
 * It also states plainly whether the mark was recorded and how the written
 * answers were marked. A student comparing with a friend deserves to know if
 * one of them was marked by word matching.
 */
export function ExamResult({
  exam,
  marked,
  name,
}: {
  exam: PublicExam
  marked: ExamMarked
  name: string
}) {
  const { score } = marked
  const pct = Math.round((score.total / score.marks) * 100)

  const wrongMcq = marked.mcq.filter((d) => !d.correct)
  const wrongTf = marked.trueFalse.filter((d) => !d.correct)
  const wrongBlanks = marked.blanks.filter((d) => !d.correct)
  const partialEssay = marked.essay.filter((d) => d.earned < d.marks)

  return (
    <div className="mx-auto max-w-3xl">
      <div
        className={`rounded border p-6 text-center sm:p-8 ${
          score.passed ? 'border-gold/50 bg-gold/[0.09]' : 'border-navy-line bg-navy-soft/40'
        }`}
      >
        <p className="font-mono text-5xl font-extrabold text-gold">
          {ar(score.total)}
          <span className="text-2xl text-ink-faint"> / {ar(score.marks)}</span>
        </p>
        <p className="mt-2 text-lg font-extrabold text-ink">
          {score.passed ? 'ناجح 🎉' : 'محتاج مراجعة'}
        </p>
        <p className="mt-1 text-sm text-ink-faint">
          {ar(pct)}٪{name ? ` · ${name}` : ''}
        </p>

        <p className="mt-4 text-xs text-ink-faint">
          {marked.saved
            ? '✓ درجتك اتسجّلت باسمك'
            : '⚠️ الدرجة ماتسجّلتش — صوّر الشاشة وابعتها للمستر'}
        </p>
      </div>

      {/* ── Section by section ──────────────────────────────────────────── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Row label="اختيار من متعدد" got={score.mcq} of={score.mcqTotal} />
        <Row label="صح وخطأ" got={score.trueFalse} of={score.trueFalseTotal} />
        <Row label="أكمل" got={score.blanks} of={score.blanksTotal} />
        <Row label="مقالي" got={score.essay} of={score.essayTotal} />
      </div>

      {marked.grader.source === 'local' && (
        <p className="mt-4 rounded border border-gold/40 bg-gold/[0.07] px-4 py-3 text-xs leading-relaxed text-ink-muted">
          الفراغات والسؤال المقالي اتصحّحوا بمطابقة الكلمات مش بالذكاء الاصطناعي،
          والمطابقة دي بتبقى قاسية مع المرادفات — «الحاسب الشخصي» مثلاً ممكن
          تتحسب غلط مقابل «الحواسب الشخصية». لو شايف إن إجابتك صح، صوّر الشاشة
          وابعتها للمستر.
        </p>
      )}

      {/* ── What went wrong ─────────────────────────────────────────────── */}
      {wrongMcq.length + wrongTf.length + wrongBlanks.length + partialEssay.length === 0 ? (
        <p className="mt-6 rounded border border-gold/40 bg-gold/[0.07] p-5 text-center font-bold text-ink">
          إجابة كاملة من غير أي غلطة 👏
        </p>
      ) : (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-extrabold text-ink">اللي غلط فيه</h2>
          <ul className="grid gap-3">
            {wrongMcq.map((d) => {
              const q = exam.mcq.find((x) => x.id === d.id)
              return (
                <Wrong key={`m${d.id}`} label={`سؤال ${ar(d.id)}`}>
                  الإجابة الصحيحة: <b className="text-ink">{q?.options[d.answer]}</b>
                </Wrong>
              )
            })}

            {wrongTf.map((d) => (
              <Wrong key={`t${d.id}`} label={`صح وخطأ — عبارة ${ar(d.id)}`}>
                الإجابة الصحيحة: <b className="text-ink">{d.answer ? '○ صح' : '× خطأ'}</b>
              </Wrong>
            ))}

            {wrongBlanks.map((d) => (
              <Wrong key={`b${d.id}`} label={`الفراغ رقم ${ar(d.id + 1)}`}>
                الإجابة الصحيحة: <b className="text-ink">{d.answer}</b>
              </Wrong>
            ))}

            {partialEssay.map((d) => (
              <Wrong
                key={`e${d.id}`}
                label={`سؤال ${ar(d.id)} — ${ar(d.earned)} من ${ar(d.marks)}`}
              >
                <span className="block">
                  الإجابة النموذجية: <b className="text-ink">{d.model}</b>
                </span>
                <span className="mt-1 block text-ink-faint">{d.rubric}</span>
                {d.note && <span className="mt-1 block text-ink-faint">{d.note}</span>}
              </Wrong>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/exam"
          className="min-h-[3rem] rounded border border-navy-line px-6 py-3 text-sm font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
        >
          كل الامتحانات
        </Link>
        {/*
          Week N examines lecture N, so the summary slug is the exam's with the
          word swapped. This used to hardcode `week-1` → `lecture-1`, which sent
          every exam after the first to a summary that does not exist — the link
          looked fine and 404'd.
        */}
        <Link
          href={`/summary/${exam.slug.replace('week-', 'lecture-')}`}
          className="min-h-[3rem] rounded border border-navy-line px-6 py-3 text-sm font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
        >
          راجع الملخص
        </Link>
      </div>
    </div>
  )
}

function Row({ label, got, of }: { label: string; got: number; of: number }) {
  return (
    <div className="rounded border border-navy-line bg-navy-soft/30 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-ink">{label}</span>
        <span className="font-mono text-sm font-extrabold text-gold">
          {ar(got)} / {ar(of)}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-navy-line/50">
        <div
          className="h-full rounded-sm bg-gold"
          style={{ width: `${of > 0 ? (got / of) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

function Wrong({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="rounded border border-navy-line bg-navy-soft/30 p-4">
      <p className="text-xs font-bold text-gold">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{children}</p>
    </li>
  )
}
