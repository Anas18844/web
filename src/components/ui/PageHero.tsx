import { Container } from './Container'

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
    <section className="wash-start border-b border-navy-line bg-navy-deep py-16 sm:py-24">
      <Container width="prose">
        <span aria-hidden="true" className="trace-rule hero-enter mb-6" />
        <p className="hero-enter mb-4 text-sm font-semibold text-gold">{eyebrow}</p>
        <h1 className="hero-enter text-display font-extrabold text-ink">{title}</h1>
        <p className="hero-enter-late mt-5 text-subtitle text-ink-muted">{lead}</p>
      </Container>
    </section>
  )
}
