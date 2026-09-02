'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import type { PublicHomework } from '@/content/homework'
import { Container } from '@/components/ui/Container'
import { events } from '@/lib/analytics'
import { toArabicDigits } from '@/lib/arabic'
import { HomeworkIntro } from './HomeworkIntro'
import { HomeworkResult, type GradedResult } from './HomeworkResult'
import { SubmitDialog } from './SubmitDialog'

type Stage = 'intro' | 'paper' | 'result'

const ar = (n: number) => toArabicDigits(n)

/**
 * The exam, as a three-stage machine: intro → paper → result.
 *
 * It holds the student's answers and nothing else. It has never seen a correct
 * answer, cannot mark anything, and could not reveal a key if a student read
 * every byte of it — marking happens in `/api/homework`, and the answers come
 * back only in the response to a submitted paper.
 *
 * After marking it stays mounted with `graded` set, so "راجع ورقتي" can colour
 * the paper the student actually filled in rather than a reconstruction of it.
 */
export function HomeworkPaper({
  homework,
  summarySlug,
}: {
  homework: PublicHomework
  summarySlug?: string
}) {
  const [stage, setStage] = useState<Stage>('intro')
  const [mcq, setMcq] = useState<Record<number, number>>({})
  const [essay, setEssay] = useState<Record<number, string>>({})
  const [asking, setAsking] = useState(false)
  const [sending, setSending] = useState(false)
  const [graded, setGraded] = useState<GradedResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** Identifies this attempt across a double-tap or a retry of the request. */
  const attemptKey = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `hw-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  const totalQuestions = homework.mcq.length + homework.essay.length
  const answered =
    Object.keys(mcq).length + Object.values(essay).filter((v) => v.trim().length > 0).length

  const mcqVerdict = useMemo(() => {
    if (!graded) return new Map<number, { correct: boolean; answer: number }>()
    return new Map(graded.mcq.map((m) => [m.id, { correct: m.correct, answer: m.answer }]))
  }, [graded])

  const essayVerdict = useMemo(() => {
    if (!graded) return new Map<number, { correct: boolean; model: string; match: number }>()
    return new Map(graded.essay.map((e) => [e.id, { correct: e.correct, model: e.model, match: e.match }]))
  }, [graded])

  async function submit(identity: { name?: string; phone?: string }) {
    if (sending) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: homework.slug,
          attemptKey: attemptKey.current,
          name: identity.name,
          phone: identity.phone,
          mcq: Object.fromEntries(Object.entries(mcq).map(([k, v]) => [k, v])),
          essay,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as GradedResult & { ok: boolean }
      if (!data.ok) throw new Error('grading failed')

      setGraded(data)
      setAsking(false)
      setStage('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })

      events.homeworkSubmitted(homework.slug, homework.grade, Boolean(identity.phone))
    } catch {
      // The student did the work; the least we owe them is a straight answer
      // about why they cannot see a mark, and their paper left untouched.
      setError('حصلت مشكلة وإحنا بنصحّح. اتأكد إن النت شغّال وجرّب تاني — إجاباتك زي ما هي.')
    } finally {
      setSending(false)
    }
  }

  // ── Intro ────────────────────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <section className="py-10 sm:py-16">
        <Container width="content">
          <HomeworkIntro
            homework={homework}
            summarySlug={summarySlug}
            onStart={() => {
              setStage('paper')
              events.homeworkStarted(homework.slug, homework.grade)
            }}
          />
        </Container>
      </section>
    )
  }

  // ── Result ───────────────────────────────────────────────────────────────
  if (stage === 'result' && graded) {
    return (
      <section className="py-10 sm:py-16">
        <Container width="content">
          <HomeworkResult
            homework={homework}
            result={graded}
            onReview={() => {
              setStage('paper')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onRetry={() => {
              setMcq({})
              setEssay({})
              setGraded(null)
              attemptKey.current = `hw-${Date.now()}-${Math.random().toString(36).slice(2)}`
              setStage('paper')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </Container>
      </section>
    )
  }

  // ── The paper ────────────────────────────────────────────────────────────
  const reviewing = Boolean(graded)

  return (
    <section className="pb-32 pt-10 sm:pt-14">
      <Container width="content">
        <header className="mb-8 border-b border-navy-line pb-6">
          <p className="text-sm font-bold text-gold">{homework.lecture}</p>
          <h1 className="mt-1.5 text-title font-extrabold text-ink">{homework.title}</h1>
          <p className="mt-1.5 text-body text-ink-muted">{homework.lesson}</p>
        </header>

        {/* ── Multiple choice ──────────────────────────────────────────── */}
        <SectionHead
          badge="القسم الأول"
          title="الاختيار من متعدد"
          marks={`${ar(homework.mcq.length)} درجة`}
        />

        <ol className="grid gap-5">
          {homework.mcq.map((q, index) => {
            const verdict = mcqVerdict.get(q.id)
            return (
              <li
                key={q.id}
                className={`rounded border p-5 ${
                  reviewing && verdict
                    ? verdict.correct
                      ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                      : 'border-red-500/40 bg-red-500/[0.06]'
                    : 'border-navy-line bg-navy-soft/25'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-mono text-sm font-extrabold text-gold">
                    {ar(index + 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-relaxed text-ink">{q.q}</p>

                    {/*
                      Capped by HEIGHT, not just width. Several of these are
                      portrait scans from the textbook: constrained only by
                      width, a 732x1000 photograph is over 900px tall and
                      pushes every answer option below the fold, so the student
                      has to scroll past the picture to find out what they are
                      being asked to pick.
                    */}
                    {q.image && (
                      <Image
                        src={q.image.src}
                        alt=""
                        width={q.image.width}
                        height={q.image.height}
                        sizes="(min-width: 768px) 480px, 90vw"
                        className="mt-4 max-h-64 w-auto max-w-full rounded border border-navy-line object-contain"
                      />
                    )}

                    <div className="mt-4 grid gap-2">
                      {q.options.map((option, oi) => {
                        const chosen = mcq[q.id] === oi
                        const isAnswer = reviewing && verdict?.answer === oi
                        return (
                          <label
                            key={oi}
                            className={`flex cursor-pointer items-start gap-3 rounded border p-3 text-sm transition-colors duration-150 ${
                              isAnswer
                                ? 'border-emerald-500/60 bg-emerald-500/10'
                                : chosen
                                  ? 'border-gold bg-gold/10'
                                  : 'border-navy-line hover:border-gold/40'
                            } ${reviewing ? 'cursor-default' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`mcq-${q.id}`}
                              checked={chosen}
                              disabled={reviewing}
                              onChange={() => setMcq((p) => ({ ...p, [q.id]: oi }))}
                              className="mt-1 h-4 w-4 shrink-0 accent-[#CBA352]"
                            />
                            <span className="leading-relaxed text-ink-muted">{option}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        {/* ── Essays ───────────────────────────────────────────────────── */}
        <SectionHead
          badge="القسم الثاني"
          title="الأسئلة المقالية"
          marks={`${ar(homework.essay.length * 2)} درجة`}
          className="mt-12"
        />

        <p className="mb-5 rounded border border-navy-line bg-navy-soft/40 px-4 py-3 text-sm text-ink-muted">
          ✍️ جاوب في <b className="text-ink">{ar(homework.maxWords)} كلمات كحد أقصى</b>. المطلوب
          المصطلح أو المعنى الصحيح، مش شرح مطوّل.
        </p>

        <ol className="grid gap-5">
          {homework.essay.map((q, index) => {
            const verdict = essayVerdict.get(q.id)
            return (
              <li
                key={q.id}
                className={`rounded border p-5 ${
                  reviewing && verdict
                    ? verdict.correct
                      ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                      : 'border-red-500/40 bg-red-500/[0.06]'
                    : 'border-navy-line bg-navy-soft/25'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-mono text-sm font-extrabold text-gold">
                    {ar(index + 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-relaxed text-ink">{q.q}</p>

                    <input
                      type="text"
                      value={essay[q.id] || ''}
                      disabled={reviewing}
                      onChange={(e) => setEssay((p) => ({ ...p, [q.id]: e.target.value }))}
                      placeholder="اكتب إجابتك…"
                      className="mt-4 w-full min-h-[3rem] rounded border border-navy-line bg-navy px-4 py-3 text-base text-ink placeholder:text-ink-faint/70 transition-colors duration-200 focus:border-gold focus:outline-none disabled:opacity-70"
                    />

                    {reviewing && verdict && !verdict.correct && (
                      <p className="mt-3 text-sm text-gold">
                        الإجابة النموذجية: {verdict.model}
                        <span className="text-ink-faint"> · تطابق {ar(verdict.match)}٪</span>
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        {reviewing && (
          <button
            type="button"
            onClick={() => setStage('result')}
            className="mt-8 flex min-h-[3rem] w-full items-center justify-center rounded bg-gold px-6 text-base font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink"
          >
            رجوع للنتيجة
          </button>
        )}
      </Container>

      {/* ── The submit bar ───────────────────────────────────────────── */}
      {!reviewing && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-line bg-navy-deep/90 backdrop-blur-xl">
          <Container className="flex items-center justify-between gap-4 py-3">
            <p className="text-xs font-bold text-ink-muted sm:text-sm">
              جاوبت <span className="font-mono text-ink">{ar(answered)}</span> من{' '}
              <span className="font-mono">{ar(totalQuestions)}</span>
            </p>
            <button
              type="button"
              onClick={() => setAsking(true)}
              className="min-h-[2.75rem] shrink-0 rounded bg-gold px-6 text-sm font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink"
            >
              تسليم
            </button>
          </Container>

          {error && (
            <Container className="pb-3">
              <p role="alert" className="text-xs font-semibold text-red-300">
                {error}
              </p>
            </Container>
          )}
        </div>
      )}

      {asking && (
        <SubmitDialog
          answered={answered}
          total={totalQuestions}
          sending={sending}
          onSubmit={submit}
          onCancel={() => setAsking(false)}
        />
      )}
    </section>
  )
}

function SectionHead({
  badge,
  title,
  marks,
  className,
}: {
  badge: string
  title: string
  marks: string
  className?: string
}) {
  return (
    <header className={`mb-5 flex flex-wrap items-center gap-3 ${className ?? ''}`}>
      <span className="rounded-sm bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold">
        {badge}
      </span>
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      <span aria-hidden="true" className="h-px flex-1 bg-navy-line" />
      <span className="text-xs font-bold text-ink-faint">{marks}</span>
    </header>
  )
}
