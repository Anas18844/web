'use client'

import { usePathname } from 'next/navigation'

/**
 * Keeps the marketing shell off the dashboard.
 *
 * The header, footer, floating call-to-action and page spine all exist to move
 * a visitor towards the capture form. Everyone inside /dashboard has already
 * signed in; a "سجّل معانا" button floating over a table of student records is
 * noise at best and a misclick at worst.
 *
 * Done as a client gate rather than by splitting the app into route groups
 * with separate root layouts, because that restructuring would move every page
 * in the project. And NOT by reading the pathname from headers() in the root
 * layout, which is the other obvious approach and the wrong one: touching
 * headers() there would make the entire site dynamic and cost all thirty-one
 * pages their static prerendering, to style one route that is dynamic anyway.
 *
 * The chrome is passed in as `children` — server components rendered by the
 * server layout — so this gate does not pull the header or footer into the
 * browser bundle.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/dashboard')) return null
  return <>{children}</>
}
