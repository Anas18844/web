'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * The site's entire scroll-motion engine, in one client island.
 *
 * Sections opt in declaratively with `data-reveal` (the block arrives as one)
 * or `data-reveal-stagger` (its children arrive in sequence). This component
 * only hands out a class — every transition itself is CSS, so there is no
 * per-frame JavaScript and no scroll listener anywhere on the site.
 *
 * One observer serves the whole document, and each element is unobserved the
 * moment it lands: a page with forty revealable blocks costs forty callbacks
 * in total, not forty per scroll.
 */
export function Reveal() {
  const pathname = usePathname()

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-stagger]')
    if (nodes.length === 0) return

    const show = () => nodes.forEach((node) => node.classList.add('is-revealed'))

    // Someone who asked for less motion gets the finished page, not a faster
    // version of the animation. Same for browsers without the observer.
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      show()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      },
      // Bottom margin holds the reveal until the block is properly in the
      // frame, so content never animates while it is still half off-screen.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [pathname])

  return null
}
