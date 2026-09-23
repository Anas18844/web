'use client'

import { useMemo, useRef, useState } from 'react'
import type { PublicExam } from '@/content/exams'
import { events } from '@/lib/analytics'
import { toArabicDigits } from '@/lib/arabic'
import { ExamResult, type ExamMarked } from './ExamResult'

const ar = (n: number) => toArabicDigits(n)
const LETTERS = ['أ', 'ب', 'ج', 'د'] as const

/**
 * The paper.
 *
 * It follows the printed exam deliberately — four numbered sections, the mark
 * badge on each heading, the ○/× table, the gap-fill paragraph read as prose.
 * A student who has practised on paper should recognise this at a glance;
 * inventing a new layout would make the digital version a second thing to
 * learn rather than the same thing, marked instantly.
 *
 * What is NOT copied is the fixed A4 geometry. Two rigid pages is a print
 * constraint, and reproducing it on a phone would mean pinch-zooming through
 * an exam.
 */
export function ExamPaper({
  exam,
  pass,
  studentName,
}: {
  exam: PublicExam
  pass: string
  studentName: string | null
}) {
  const [name, setName] = useState(studentName ?? '')
  const [mcq, setMcq] = useState<Record<number, number>>({})
  const [trueFalse, setTrueFalse] = useState<Record<number, boolean>>({})
  const [blanks, setBlanks] = useState<Record<number, string>>({})
  const [essay, setEssay] = useState<Record<number, string>>({})

  const [sending, setSending] = useState(false)
  const [marked, setMarked] = useState<ExamMarked | null>(null)
  const [error, setError] = useState<string | null>(null)

  const attemptKey = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `exam-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  const answered = useMemo(() => {
    const gaps = Object.values(blanks).filter((v) => v.trim()).length
    const essays = Object.values(essay).filter((v) => v.trim()).length
    return Object.keys(mcq).length + Object.keys(trueFalse).length + gaps + essays
  }, [mcq, trueFalse, blanks, essay])

  const totalQuestions =
    exam.mcq.length + exam.trueFalse.length + exam.blanks.gaps + exam.essay.length

  async function submit() {
    if (sending) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pass,
          attemptKey: attemptKey.current,
          name: name.trim() || undefined,
          mcq: Object.fromEntries(Object.entries(mcq)),
          trueFalse: Object.fromEntries(Object.entries(trueFalse)),
          blanks: Object.fromEntries(Object.entries(blanks)),
          essay: Object.fromEntries(Object.entries(essay)),
        }),
      })

      const data = await res.json()
      if (!data.ok) {
        setError(data.message ?? 'حصلت مشكلة وإحنا بنصحّح. جرّب تاني.')
        return
      }

      events.examSubmitted(exam.slug)
      setMarked(data as ExamMarked)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('مش قادرين نوصل للسيرفر. اتأكد إن النت شغّال وجرّب تاني.')
    } finally {
      setSending(false)
    }
  }

  if (marked) return <ExamResult exam={exam} marked={marked} name={name} />

  return (
    <div className="mx-auto max-w-3xl pb-28">
      {/* ── The paper's header ──────────────────────────────────────────── */}
      <header className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gold">
              {exam.week}
              {/* Printed on the header like the paper copy, so a student comparing
                  notes with a friend knows they did not sit the same paper. */}
              {exam.form && ` · النموذج (${exam.form})`}
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-ink sm:text-2xl">{exam.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{exam.lesson}</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-gold text-gold">
            <span className="font-mono text-xl font-extrabold leading-none">
              {ar(exam.totalMarks)}
            </span>
            <span className="mt-0.5 text-[0.6rem]">درجة</span>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="exam-name" className="mb-2 block text-sm font-bold text-ink">
            اسم الطالب
          </label>
          <input
            id="exam-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اكتب اسمك…"
            className="w-full min-h-[2.75rem] rounded border border-navy-line bg-navy px-4 py-2.5 text-base text-ink placeholder:text-ink-faint/70 focus:border-gold focus:outline-none"
          />
        </div>
      </header>

      {/* ── 1 · Multiple choice ─────────────────────────────────────────── */}
      <Section n={1} title="اختر الإجابة الصحيحة" marks={exam.mcq.length}>
        <ol className="grid gap-4">
          {exam.mcq.map((q) => (
            <li key={q.id} className="card p-5">
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-gold/15 font-mono text-sm font-extrabold text-gold">
                  {ar(q.id)}
                </span>
                <p className="text-body leading-relaxed text-ink">
                  <Emphasised text={q.q} words={q.emphasis} />
                </p>
              </div>

              <div className="mt-4 grid gap-2">
                {q.options.map((option, i) => {
                  const id = `mcq-${q.id}-${i}`
                  const chosen = mcq[q.id] === i
                  return (
                    <label
                      key={id}
                      htmlFor={id}
                      className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors duration-150 ${
                        chosen
                          ? 'border-gold bg-gold/10'
                          : 'border-navy-line hover:border-gold/40 hover:bg-navy-soft/40'
                      }`}
                    >
                      <input
                        id={id}
                        type="radio"
                        name={`mcq-${q.id}`}
                        checked={chosen}
                        onChange={() => setMcq((p) => ({ ...p, [q.id]: i }))}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border text-xs font-extrabold ${
                          chosen
                            ? 'border-gold bg-gold text-navy'
                            : 'border-navy-line text-ink-faint'
                        }`}
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="text-sm leading-relaxed text-ink-muted">{option}</span>
                    </label>
                  )
                })}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── 2 · ○ / × ───────────────────────────────────────────────────── */}
      <Section
        n={2}
        title="ضع ○ أمام العبارة الصحيحة و × أمام الخاطئة"
        marks={exam.trueFalse.length}
      >
        <ul className="grid gap-3">
          {exam.trueFalse.map((q) => (
            <li
              key={q.id}
              className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:flex-nowrap"
            >
              <p className="text-body leading-relaxed text-ink">{q.statement}</p>
              <div className="flex shrink-0 gap-2">
                {([true, false] as const).map((value) => {
                  const chosen = trueFalse[q.id] === value
                  return (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setTrueFalse((p) => ({ ...p, [q.id]: value }))}
                      aria-pressed={chosen}
                      aria-label={value ? 'صح' : 'خطأ'}
                      className={`flex h-11 w-11 items-center justify-center rounded border text-lg font-extrabold transition-colors duration-150 ${
                        chosen
                          ? 'border-gold bg-gold text-navy'
                          : 'border-navy-line text-ink-faint hover:border-gold/50 hover:text-gold'
                      }`}
                    >
                      {value ? '○' : '×'}
                    </button>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── 3 · Gaps and written answers ────────────────────────────────── */}
      <Section
        n={3}
        title="أجب عمّا يلي"
        marks={exam.blanks.marks + exam.essay.reduce((t, e) => t + e.marks, 0)}
      >
        <div className="card p-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-gold/15 font-mono text-sm font-extrabold text-gold">
              {ar(exam.blanks.id)}
            </span>
            <p className="font-extrabold text-ink">{exam.blanks.title}:</p>
            <span className="rounded-sm bg-navy-line/60 px-2 py-0.5 text-xs font-bold text-ink-faint">
              {ar(exam.blanks.marks)} درجات
            </span>
          </div>

          {/*
            The paragraph reads as prose with the gaps inline, exactly as it does
            on paper. Splitting it into "question 9a, 9b, 9c" would lose the
            sentence, and the sentence is what tells the student which word fits.
          */}
          <p className="mt-4 text-body leading-loose text-ink-muted">
            {exam.blanks.segments.map((segment, i) => (
              <span key={i}>
                {segment}{' '}
                {i < exam.blanks.gaps && (
                  <input
                    aria-label={`الفراغ رقم ${i + 1}`}
                    value={blanks[i] ?? ''}
                    onChange={(e) => setBlanks((p) => ({ ...p, [i]: e.target.value }))}
                    className="mx-1 inline-block w-40 border-0 border-b-2 border-dashed border-gold/60 bg-transparent px-2 py-0.5 text-center font-bold text-gold focus:border-solid focus:outline-none"
                  />
                )}{' '}
              </span>
            ))}
          </p>
        </div>

        {exam.essay.map((q) => (
          <div key={q.id} className="card mt-4 p-5">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-gold/15 font-mono text-sm font-extrabold text-gold">
                {ar(q.id)}
              </span>
              <div className="min-w-0">
                <p className="text-body leading-relaxed text-ink">{q.q}</p>
                <span className="mt-2 inline-block rounded-sm bg-navy-line/60 px-2 py-0.5 text-xs font-bold text-ink-faint">
                  {q.marks === 2 ? 'درجتان' : `${ar(q.marks)} درجات`}
                </span>
              </div>
            </div>
            <textarea
              rows={3}
              value={essay[q.id] ?? ''}
              onChange={(e) => setEssay((p) => ({ ...p, [q.id]: e.target.value }))}
              placeholder="اكتب إجابتك…"
              className="mt-4 w-full resize-y rounded border border-navy-line bg-navy px-4 py-3 text-base leading-relaxed text-ink placeholder:text-ink-faint/70 focus:border-gold focus:outline-none"
            />
          </div>
        ))}
      </Section>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
        >
          {error}
        </p>
      )}

      {/* ── The submit bar ──────────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-line bg-navy-deep/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-sm text-ink-muted">
            <span className="font-mono font-extrabold text-ink">
              {ar(answered)}/{ar(totalQuestions)}
            </span>{' '}
            اتحلّت
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={sending}
            className="shine min-h-[3rem] rounded bg-gold px-8 text-base font-extrabold text-navy transition-[background-color,opacity] duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
          >
            {sending ? 'بنصحّح…' : 'سلّم الامتحان'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Renders the paper's own emphasis — «مصدر قلق», «يتعارض» — as bold. */
function Emphasised({ text, words }: { text: string; words?: readonly string[] }) {
  if (!words?.length) return <>{text}</>

  let parts: (string | React.ReactElement)[] = [text]
  for (const word of words) {
    parts = parts.flatMap((part, i) => {
      if (typeof part !== 'string') return [part]
      const at = part.indexOf(word)
      if (at < 0) return [part]
      return [
        part.slice(0, at),
        <b key={`${word}-${i}`} className="text-gold">
          {word}
        </b>,
        part.slice(at + word.length),
      ]
    })
  }
  return <>{parts}</>
}

function Section({
  n,
  title,
  marks,
  children,
}: {
  n: number
  title: string
  marks: number
  children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <header className="mb-4 flex flex-wrap items-center gap-3 border-b border-navy-line pb-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gold font-mono text-sm font-extrabold text-navy">
          {ar(n)}
        </span>
        <h2 className="flex-1 text-base font-extrabold text-ink">{title}</h2>
        <span className="rounded-sm bg-navy-line/60 px-2.5 py-1 text-xs font-bold text-ink-faint">
          {ar(marks)} درجات
        </span>
      </header>
      {children}
    </section>
  )
}
