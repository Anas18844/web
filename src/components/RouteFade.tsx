'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Pages arrive instead of appearing.
 *
 * A client-routed navigation replaces the document body between two frames,
 * which reads as a flicker rather than a move. This fades the incoming page
 * over 260ms so the eye is told something changed.
 *
 * Two deliberate constraints:
 *
 *   • It never runs on first load. `first` is still true during the very first
 *     render, so no class is applied and the landing page paints at full
 *     opacity in frame one. Fading the first view would push back the largest
 *     contentful paint on every cold visit, which is a real cost paid for an
 *     effect nobody asked for.
 *   • Opacity only, no transform. Any transform here would make this element
 *     the containing block for every `position: fixed` descendant of the page
 *     below it. The spine and the dock live outside <main> partly for that
 *     reason, but the rule holds regardless of what a page adds later.
 *
 * `children` is passed straight through from the server layout, so marking
 * this file 'use client' does not pull a single page component into the
 * browser bundle.
 */
export function RouteFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    first.current = false
  }, [])

  return (
    <div key={pathname} className={first.current ? undefined : 'route-fade'}>
      {children}
    </div>
  )
}
