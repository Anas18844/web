import { cn } from '@/lib/utils'
import { Container } from './Container'

/**
 * Vertical rhythm is a hierarchy signal, not a constant. Ordinary sections
 * breathe at `base`; the closing capture section gets `lg` so the page opens
 * up as it approaches the one action it wants; dense utility blocks get `sm`.
 */
const spaces = {
  sm: 'py-12 sm:py-16',
  base: 'py-16 sm:py-24',
  lg: 'py-20 sm:py-28',
}

/**
 * The page runs on two surfaces: navy and white.
 *
 * The `paper` tones carry `surface-light`, which flips the ink, hairline,
 * card and accent tokens (globals.css) — so a section becomes a white section
 * by changing one prop, and everything inside it inverts without being
 * touched. `bg-paper` is pure white; `bg-paper-soft` is its quieter sibling,
 * for when two light sections sit next to each other and need separating.
 */
const tones = {
  base: 'bg-navy',
  raised: 'bg-navy-soft/40',
  deep: 'bg-navy-deep',
  paper: 'surface-light bg-paper',
  paperSoft: 'surface-light bg-paper-soft',
}

export function Section({
  children,
  id,
  className,
  tone = 'base',
  width = 'content',
  space = 'base',
}: {
  children: React.ReactNode
  id?: string
  className?: string
  tone?: keyof typeof tones
  width?: 'content' | 'prose'
  space?: keyof typeof spaces
}) {

  return (
    <section id={id} className={cn('scroll-mt-16', spaces[space], tones[tone], className)}>
      <Container width={width}>{children}</Container>
    </section>
  )
}

/**
 * Every section opens the same way: a trace, then the title.
 *
 * The trace draws itself as the heading arrives, which is what tells the eye
 * "a new idea starts here" before a single word is read — and it is the same
 * 2px gold mark that edges the cards below it, so the section reads as one
 * piece rather than a heading followed by unrelated boxes.
 */
export function SectionHeading({
  title,
  intro,
  eyebrow,
  className,
}: {
  title: string
  intro?: string
  eyebrow?: string
  className?: string
}) {
  return (
    <header data-reveal className={cn('mb-9 sm:mb-12', className)}>
      <span aria-hidden="true" className="trace-rule mb-5" />
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold tracking-wide text-gold">{eyebrow}</p>
      )}
      <h2 className="text-title font-extrabold text-ink">{title}</h2>
      {intro && <p className="mt-3 max-w-prose text-body text-ink-muted">{intro}</p>}
    </header>
  )
}
