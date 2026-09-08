'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { events } from '@/lib/analytics'

/**
 * What a student meets before the exam — and, if they have not done the
 * homework, instead of it.
 *
 * The phone is not a formality here. It is the identity the homework was
 * recorded against, and this screen exists so a student finds out BEFORE
 * committing twenty minutes that their result will or will not count.
 *
 * Nothing about the paper is on this page. The questions arrive from the server
 * only after the gate opens, so "view source" is not a way around the
 * requirement.
 */
export type GateResult =
  | { ok: true; pass: string; name: string | null; exam: unknown }
  | { ok: false; reason: string; message: string; homework?: { slug: string; title: string; lesson: string } | null }

export function ExamGate({
  slug,
  title,
  lesson,
  week,
  minutes,
  marks,
  homeworkSlug,
  onOpen,
}: {
  slug: string
  title: string
  lesson: string
  week: string
  minutes: number
  marks: number
  homeworkSlug: string
  onOpen: (result: { pass: string; name: string | null; exam: unknown }) => void
}) {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState<GateResult | null>(null)

  async function check(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setBlocked(null)

    try {
      const res = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, phone }),
      })
      const data = (await res.json()) as GateResult

      if (data.ok) {
        events.examStarted(slug)
        onOpen({ pass: data.pass, name: data.name, exam: data.exam })
      } else {
        events.examBlocked(slug, data.reason)
        setBlocked(data)
      }
    } catch {
      setBlocked({
        ok: false,
        reason: 'network',
        message: 'مش قادرين نتأكد دلوقتي. اتأكد إن النت شغّال وجرّب تاني.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div data-reveal className="mx-auto max-w-2xl">
      <div className="card p-6 sm:p-8">
        <span aria-hidden="true" className="trace-rule mb-5" />
        <p className="text-sm font-bold text-gold">{week}</p>
        <h1 className="mt-2 text-title font-extrabold text-ink">{title}</h1>
        <p className="mt-2 text-body text-ink-muted">{lesson}</p>

        <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-navy-line py-4 text-center">
          <Fact label="الدرجة" value={String(marks)} />
          <Fact label="الزمن" value={`${minutes} د`} />
          <Fact label="الأسئلة" value="١٠" />
        </dl>

        {/* ── The rule, stated before anything is asked ─────────────────── */}
        <div className="mt-6 rounded border border-gold/40 bg-gold/[0.07] p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-gold">
              <Icon name="shield" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-extrabold text-ink">الامتحان ده للي خلّص الواجب</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                اكتب رقم التليفون اللي سجّلت بيه درجة الواجب. لو الواجب متسجّل باسمك،
                هيفتح الامتحان على طول ودرجتك هتتسجّل.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={check} className="mt-5">
          <label htmlFor="exam-phone" className="mb-2 block text-sm font-bold text-ink">
            رقم التليفون
          </label>
          <div className="flex flex-wrap gap-3">
            <input
              id="exam-phone"
              name="phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="01xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="min-h-[3rem] flex-1 rounded border border-navy-line bg-navy px-4 py-3 text-start text-base text-ink placeholder:text-ink-faint/70 transition-[border-color,box-shadow] duration-200 focus:border-gold focus:shadow-[0_0_0_3px_rgba(203,163,82,0.14)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="shine min-h-[3rem] rounded bg-gold px-7 text-base font-extrabold text-navy transition-[background-color,opacity] duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
            >
              {busy ? 'بنتأكد…' : 'ابدأ الامتحان'}
            </button>
          </div>
        </form>

        {blocked && !blocked.ok && (
          <div
            role="alert"
            className="mt-5 rounded border border-red-500/40 bg-red-500/10 p-5"
          >
            <p className="font-bold text-red-100">{blocked.message}</p>

            {/* Not a dead end: the way to fix it is one tap away. */}
            {blocked.reason === 'no_homework' && (
              <>
                <p className="mt-2 text-sm leading-relaxed text-red-100/80">
                  لو حليت الواجب من غير ما تكتب رقمك، الدرجة مااتسجلتش — ارجع وحلّه تاني
                  وسجّل رقمك في الآخر.
                </p>
                <Link
                  href={`/homework/${homeworkSlug}`}
                  data-cta="exam_to_homework"
                  className="mt-4 inline-flex min-h-[2.75rem] w-full items-center justify-center rounded bg-gold px-5 text-sm font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink"
                >
                  روح حل الواجب الأول
                </Link>
              </>
            )}
          </div>
        )}

        <p className="mt-5 text-sm leading-relaxed text-ink-faint">
          مافيش مؤقّت بيقفل الورقة — الـ{minutes} دقيقة إرشادية عشان تتدرّب على وقت
          الامتحان الحقيقي.
        </p>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-1 font-mono text-xl font-extrabold text-ink">{value}</dd>
    </div>
  )
}
