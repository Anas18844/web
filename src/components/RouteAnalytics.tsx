'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { events } from '@/lib/analytics'

/**
 * Page views for a single-page-app router.
 *
 * Next moves between pages without a document load, so nothing tells a tag
 * manager that the page changed — a visitor who lands on the home page and
 * reads four articles looks, by default, like one page view.
 *
 * ⚠️ IT DELIBERATELY DOES NOT FIRE ON FIRST LOAD.
 *
 * The GTM container fires on container load, which already covers the landing
 * page. Pushing our own `page_view` there as well would count every single
 * session's first page twice, and a page-view number inflated by exactly one
 * per session is the kind of wrong that survives for months because it looks
 * plausible. `first` is still true during the first render, so the effect
 * skips it and starts reporting from the first real navigation onwards.
 *
 * Whoever configures GTM has to know this: the GA4 tag stays on "container
 * load" for the initial view, and takes the custom `page_view` event as an
 * ADDITIONAL trigger for the rest. Both, not either.
 *
 * The path is read from `window.location` rather than `useSearchParams`, which
 * would force every page that renders this into client-side rendering and cost
 * the whole site its static prerendering — an unreasonable price for a query
 * string. This way the search parameters come along for free.
 */
export function RouteAnalytics() {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }

    events.pageView(window.location.pathname + window.location.search, document.title)
  }, [pathname])

  /**
   * Call-to-action clicks, delegated.
   *
   * One listener on the document catches every `[data-cta]` anywhere on the
   * site, which is what lets the header, the hero, the dock and the footer all
   * stay SERVER components — an `onClick` on any of them would drag that whole
   * subtree into the browser bundle for the sake of one analytics call.
   *
   * `closest` rather than a direct target check, because the click almost
   * always lands on the text inside the link, not the link itself.
   */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest?.<HTMLElement>('[data-cta]')
      if (target?.dataset.cta) events.ctaClicked(target.dataset.cta)
    }

    document.addEventListener('click', onClick, { passive: true })
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
