import { Fragment } from 'react'

/**
 * Code on a paper, drawn the way the Qureo platform draws it.
 *
 * White on black, monospace, left to right, every space and line kept — and no
 * syntax colouring, by the lecture's own decision: the student sits the real
 * exam in front of that plain screen, so the bank looks exactly like it.
 *
 * A line wider than a phone scrolls INSIDE its box rather than wrapping. Where a
 * space falls in a line of code is part of the question, so a wrapped line is a
 * different program. Whoever lays one of these out in a grid or flex row must
 * let it shrink (`min-w-0`, `grid-cols-1`), or one long line widens the page.
 */

/** The option letters, in the order the options are written. */
export const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'] as const

const ARABIC = /[؀-ۿ]/

/**
 * Whether a plain option in a code question should read left to right.
 *
 * Only when it has no Arabic at all: `5 + 3` laid out right to left shows as
 * `3 + 5`. «12 ثم Error» stays right to left — read LTR by an Arabic reader it
 * says the opposite, «Error ثم 12».
 */
export function readsLtr(text: string): boolean {
  return !ARABIC.test(text)
}

export function CodeBlock({
  code,
  size = 'md',
  className,
}: {
  code: string
  /** `sm` for an option, `md` for the program under a question. */
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <pre
      dir="ltr"
      className={[
        'overflow-x-auto whitespace-pre rounded border border-black bg-black text-left font-mono leading-relaxed text-white',
        size === 'sm' ? 'px-3 py-2 text-xs sm:text-[0.8125rem]' : 'p-4 text-[0.8125rem] sm:text-sm',
        className ?? '',
      ].join(' ')}
    >
      <code>{code}</code>
    </pre>
  )
}

/**
 * A question's text, with anything between backticks drawn as inline code —
 * left to right and isolated, or the full stop at the end of
 * `Please wait, Mr. Adel.` jumps to the start of the line. It moves to the
 * next line whole rather than breaking at a space, and scrolls if a line
 * cannot hold it. Text without a backtick pair comes back untouched.
 */
export function QuestionText({ text }: { text: string }) {
  const parts = text.split('`')
  if (parts.length < 3 || parts.length % 2 === 0) return <>{text}</>

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            dir="ltr"
            className="inline-block max-w-full overflow-x-auto whitespace-pre rounded-sm bg-black px-1.5 py-0.5 align-middle font-mono text-[0.9em] font-normal leading-normal text-white"
          >
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

/** Short enough that two options sit side by side on a wide screen. */
export function fitsTwoColumns(options: readonly string[]): boolean {
  return options.every((o) => o.split('\n').every((line) => line.length <= 28))
}
