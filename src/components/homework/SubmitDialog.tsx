'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EG_MOBILE, normalizePhone } from '@/lib/phone'

/**
 * The choice at the end of the paper: record this, or just show me.
 *
 * Both routes lead to the same marked result — the difference is only whether
 * a name gets attached to it. Making that explicit is what stops the phone
 * field reading as a paywall on a student's own score.
 *
 * The booked student is the default and the top option, because for them the
 * cost of skipping it is real: an unrecorded paper looks, in the register, like
 * homework they never did.
 */
export function SubmitDialog({
  answered,
  total,
  sending,
  onSubmit,
  onCancel,
}: {
  answered: number
  total: number
  sending: boolean
  onSubmit: (identity: { name?: string; phone?: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const incomplete = answered < total

  function recordIt() {
    const normalised = normalizePhone(phone)
    if (!EG_MOBILE.test(normalised)) {
      setError('اكتب رقم موبايل مصري صحيح (مثال: 01012345678)')
      return
    }
    setError(null)
    onSubmit({ name: name.trim() || undefined, phone: normalised })
  }

  const field =
    'w-full min-h-[3rem] rounded border border-navy-line bg-navy px-4 py-3 text-base text-ink ' +
    'placeholder:text-ink-faint/70 transition-colors duration-200 focus:border-gold focus:outline-none'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded border border-navy-line bg-navy-deep p-6"
      >
        <h2 id="submit-title" className="text-lg font-extrabold text-ink">
          قبل ما تسلّم
        </h2>

        {incomplete && (
          <p className="mt-3 rounded border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-semibold text-ink">
            لسه فيه {total - answered} سؤال من غير إجابة. تقدر تسلّم عادي، بس الأسئلة دي
            هتتحسب غلط.
          </p>
        )}

        {/* ── Booked student ───────────────────────────────────────────── */}
        <div className="mt-5 rounded border border-gold/40 bg-gold/[0.07] p-4">
          <p className="font-extrabold text-ink">أنا حاجز مع مستر أنس</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            اكتب رقم التليفون اللي حجزت بيه، عشان الدرجة تتسجّل باسمك ومايتكتبش عليك إنك
            ماحلّتش الواجب.
          </p>

          <div className="mt-4 grid gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك (اختياري)"
              autoComplete="name"
              className={field}
            />
            <input
              type="tel"
              dir="ltr"
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                setError(null)
              }}
              placeholder="01xxxxxxxxx"
              autoComplete="tel"
              aria-label="رقم التليفون اللي حجزت بيه"
              className={`${field} text-start`}
            />
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={recordIt}
            disabled={sending}
            className="mt-4 flex min-h-[3rem] w-full items-center justify-center rounded bg-gold px-5 text-base font-extrabold text-navy transition-[background-color,opacity] duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
          >
            {sending ? 'بنصحّح…' : 'سلّم وسجّل درجتي'}
          </button>
        </div>

        {/* ── Everyone else ────────────────────────────────────────────── */}
        <div className="mt-4 border-t border-navy-line pt-4">
          <p className="text-sm font-bold text-ink">متابع من يوتيوب ومش حاجز؟</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            اتفضل شوف درجتك والإجابات الصحيحة على طول. مش هنسجّل أي بيانات.
          </p>

          <button
            type="button"
            onClick={() => onSubmit({})}
            disabled={sending}
            className="mt-3 flex min-h-[2.75rem] w-full items-center justify-center rounded border border-navy-line px-5 text-sm font-bold text-ink transition-colors duration-200 hover:border-gold/50 hover:text-gold disabled:opacity-60"
          >
            {sending ? 'بنصحّح…' : 'اظهر الإجابات من غير تسجيل'}
          </button>

          <Link
            href="/#start"
            data-cta="homework_submit"
            className="mt-3 block text-center text-xs font-bold text-gold transition-colors duration-200 hover:text-ink"
          >
            أو احجز دلوقتي عشان الواجب الجاي يتحسبلك
          </Link>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="mt-5 w-full text-center text-xs font-bold text-ink-faint transition-colors duration-200 hover:text-ink disabled:opacity-60"
        >
          رجوع للورقة
        </button>
      </div>
    </div>
  )
}
