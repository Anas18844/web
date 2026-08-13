/**
 * THE PATH — one continuous trace down the reader's edge of the document.
 *
 * The site's signature device is a 2px conductor: it opens every section, edges
 * every card, and marks the active page. This is that same line at the scale of
 * the whole page. It fills cyan-to-gold as the reader descends, with a lit head
 * riding the leading edge — the reader is the current, the page is the board.
 *
 * Pinned to the inline start, which under RTL is the physical right: the edge
 * the eye already returns to at the end of every line.
 *
 * Server component, and it stays one. Everything it does is
 * `animation-timeline: scroll()` — no listener, no rAF, no state, and nothing
 * at all to hydrate. A browser without scroll-driven animation shows the faint
 * rail and no fill, which reads as a deliberate edge rule rather than a broken
 * feature.
 */
export function PageSpine() {
  return (
    <div className="page-spine" aria-hidden="true">
      <span className="page-spine-fill" />
      <span className="page-spine-head" />
    </div>
  )
}
