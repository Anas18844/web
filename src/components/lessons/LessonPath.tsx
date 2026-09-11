import Link from 'next/link'
import type { LessonStep } from '@/content/lessons'
import { toArabicDigits } from '@/lib/arabic'

const ar = (n: number) => toArabicDigits(n)

/**
 * The four steps of a lesson, as one continuous track.
 *
 * This is the whole point of the reorganisation, so it is the one thing on the
 * page allowed to be loud. A student arriving mid-term needs to answer "what do
 * I do now?" in about a second, and a row of equal-looking cards does not
 * answer it — you have to read all four to find out which one is yours.
 *
 * So the steps sit on a literal line, numbered, with the state carried by the
 * NODE on that line rather than by a badge somewhere in the text: gold and
 * filled means go, hollow means it does not exist yet. The eye follows the line
 * down to the first hollow node and stops there, which is exactly the answer.
 *
 * The numbers are real order, not decoration — you cannot sit the exam before
 * the homework, and the homework assumes you watched the video. That is the one
 * case where numbering earns its place.
 */
export function LessonPath({ steps }: { steps: readonly LessonStep[] }) {
  return (
    <ol className="relative grid gap-3">
      {/*
        The spine. Inset to pass through the centre of the 2.5rem nodes, and
        stopped short at both ends so it does not stick out past the first and
        last node like a dangling wire.
      */}
      <span
        aria-hidden="true"
        className="absolute end-[1.25rem] top-6 bottom-6 w-px -translate-x-[0.5px] bg-gradient-to-b from-gold/40 via-navy-line to-navy-line"
      />

      {steps.map((step) => (
        <Step key={step.key} step={step} />
      ))}
    </ol>
  )
}

function Step({ step }: { step: LessonStep }) {
  /**
   * `locked` is OPEN, not absent — and the difference matters to the one
   * student it is about.
   *
   * The exam is gated on having done the homework, which the exam's own page
   * enforces by asking for the phone number it was submitted with. Rendering it
   * as an unclickable grey block made that gate look like an absence: a student
   * who HAD done the homework arrived at the one step that was theirs and found
   * no way in. So it links, it looks live, and the 🔑 line says what it wants.
   * The gate belongs on the gate, not in a missing anchor tag.
   */
  const open = Boolean(step.href) && (step.state === 'ready' || step.state === 'locked')
  const ready = open
  const isVideo = step.key === 'video'

  /** One element, two tags: a link when there is somewhere to go. */
  const Wrapper = ready ? Link : 'div'
  const wrapperProps = ready ? { href: step.href! } : {}

  return (
    <li className="relative">
      <Wrapper
        {...(wrapperProps as { href: string })}
        className={[
          'group flex items-start gap-4 rounded border p-4 transition-colors duration-200 sm:p-5',
          ready
            ? 'border-navy-line bg-navy-soft/30 hover:border-gold/50 hover:bg-navy-soft/60'
            : 'border-navy-line/60 bg-navy-soft/10',
        ].join(' ')}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3
              className={[
                'font-extrabold transition-colors duration-200',
                ready ? 'text-ink group-hover:text-gold' : 'text-ink-muted',
              ].join(' ')}
            >
              {step.title}
            </h3>
            {step.meta && (
              <span className="font-mono text-xs text-ink-faint">{step.meta}</span>
            )}
          </div>

          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{step.body}</p>

          {/*
            The reason, when there is one. A step that is simply greyed out
            reads as broken; a step that says when it arrives reads as planned.
          */}
          {step.note && (
            <p
              className={[
                'mt-2 text-xs leading-relaxed',
                step.state === 'locked' ? 'text-gold/90' : 'text-ink-faint',
              ].join(' ')}
            >
              {step.state === 'locked' ? '🔑 ' : '⏳ '}
              {step.note}
            </p>
          )}

          {ready && !isVideo && (
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold">
              ابدأ
              {/* Points the way the reader is going — left, in Arabic. */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>

        {/* The node on the spine. Above the line, so the line runs behind it. */}
        <span
          aria-hidden="true"
          className={[
            'relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border font-mono text-sm font-extrabold transition-colors duration-200',
            ready
              ? 'border-gold bg-gold text-navy'
              : 'border-navy-line bg-navy-deep text-ink-faint',
          ].join(' ')}
        >
          {ar(step.n)}
        </span>
      </Wrapper>
    </li>
  )
}
