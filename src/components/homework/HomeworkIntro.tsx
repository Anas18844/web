'use client'

import Link from 'next/link'
import type { PublicHomework } from '@/content/homework'
import { Icon } from '@/components/ui/Icon'

/**
 * What a student reads BEFORE the first question.
 *
 * It exists for one reason: a student who has not booked yet needs to find out
 * now, not at the end. Discovering after forty questions that the score cannot
 * be attached to anyone is the moment a good result turns into a complaint —
 * and the moment we lose the chance to say "book, and it counts".
 *
 * It also states the honest position for the YouTube viewer, who is welcome to
 * sit the paper and owes us nothing. Being straight about that is what makes
 * the sentence above it credible.
 */
export function HomeworkIntro({
  homework,
  summarySlug,
  onStart,
}: {
  homework: PublicHomework
  /** The revision page for this lesson, when one exists. */
  summarySlug?: string
  onStart: () => void
}) {
  return (
    <div data-reveal className="mx-auto max-w-2xl">
      <div className="card p-6 sm:p-8">
        <span aria-hidden="true" className="trace-rule mb-5" />
        <p className="text-sm font-bold text-gold">{homework.lecture}</p>
        <h1 className="mt-2 text-title font-extrabold text-ink">{homework.title}</h1>
        <p className="mt-2 text-body text-ink-muted">{homework.lesson}</p>

        <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-navy-line py-4 text-center">
          <Fact label="اختيار" value={`${homework.mcq.length}`} />
          <Fact label="مقالي" value={`${homework.essay.length}`} />
          <Fact label="الدرجة" value={`${homework.totalMarks}`} />
        </dl>

        {/* ── The part that has to be read ─────────────────────────────── */}
        <div className="mt-6 rounded border border-gold/40 bg-gold/[0.07] p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-gold">
              <Icon name="shield" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-extrabold text-ink">اقرا ده قبل ما تبدأ</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                لو إنت <b className="text-ink">حاجز مع مستر أنس</b>، في آخر الواجب هيتطلب منك
                رقم التليفون اللي حجزت بيه — عشان درجتك تتسجّل باسمك، ومايتكتبش عليك إنك
                ماحلّتش الواجب.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                ولو <b className="text-ink">لسه ماحجزتش</b>، احجز دلوقتي قبل ما تبدأ عشان
                درجة النهاردة تتحسبلك.
              </p>
            </div>
          </div>

          <Link
            href="/#start"
            data-cta="homework_intro"
            className="mt-4 inline-flex min-h-[2.75rem] w-full items-center justify-center rounded bg-gold px-5 text-sm font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink"
          >
            احجز دلوقتي
          </Link>
        </div>

        {/*
          The way out for a student who is not ready. Offered BEFORE the start
          button, because the useful moment to say "go and revise" is while
          they are still deciding — not after a score they are unhappy with.
        */}
        {summarySlug && (
          <Link
            href={`/summary/${summarySlug}`}
            data-cta="homework_to_summary"
            className="mt-5 flex items-center justify-between gap-4 rounded border border-navy-line bg-navy-soft/40 p-4 transition-colors duration-200 hover:border-gold/50"
          >
            <span>
              <span className="block font-bold text-ink">لسه مذاكرتش الدرس؟</span>
              <span className="mt-1 block text-sm text-ink-muted">
                اقرا الملخص الأول — الدرس كله في صفحة واحدة.
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-lg text-gold">
              ←
            </span>
          </Link>
        )}

        <p className="mt-5 text-sm leading-relaxed text-ink-faint">
          ولو إنت متابع من على يوتيوب ومش حاجز — اتفضل حِل عادي. هتشوف درجتك والإجابات
          الصحيحة في الآخر، من غير ما تسجّل أي بيانات.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="shine mt-6 flex min-h-[3.25rem] w-full items-center justify-center rounded bg-gold px-6 text-base font-extrabold text-navy transition-[background-color,box-shadow] duration-200 hover:bg-gold-deep hover:text-ink hover:shadow-[0_0_28px_-8px_rgba(203,163,82,0.9)]"
        >
          ابدأ الواجب
        </button>
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
