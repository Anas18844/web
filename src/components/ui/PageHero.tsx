import { Container } from './Container'
import { Circuit } from './Circuit'

/**
 * The opening block shared by every inner page.
 *
 * All four pages previously repeated the same markup by hand, which is how
 * four pages quietly drift apart. One component means the eyebrow, the trace,
 * the type scale and the entrance are identical everywhere — and the faint
 * gold wash behind it gives the top of each page the same weight as the home
 * hero without borrowing its photograph.
 *
 * The entrance runs on load rather than on scroll: this block is always in
 * view when the page opens, so waiting for an observer would only add a stall.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string
  title: string
  lead: string
}) {
  return (
    <section className="wash-start relative overflow-hidden border-b border-navy-line bg-navy-deep py-16 sm:py-24">
      {/* The brand circuit, drawing itself in the far corner as the page
          opens. `data-reveal` is already satisfied on load — the block is in
          view — so the traces animate immediately after the copy lands. */}
      <div
        data-reveal
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 start-0 hidden opacity-50 lg:block"
      >
        <Circuit className="h-52 w-auto" />
      </div>

      <Container width="prose" className="relative">
        <span aria-hidden="true" className="trace-rule hero-enter mb-6" />
        <p className="hero-enter mb-4 text-sm font-semibold text-gold">{eyebrow}</p>
        <h1 className="hero-enter text-display font-extrabold text-ink">{title}</h1>
        <p className="hero-enter-late mt-5 text-subtitle text-ink-muted">{lead}</p>
      </Container>
    </section>
  )
}
