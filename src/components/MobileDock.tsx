'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WhatsAppMark } from '@/components/WhatsAppButton'
import { events } from '@/lib/analytics'
import { whatsappLink } from '@/content/site'
import { common } from '@/content/copy'

/**
 * The action, kept within thumb's reach on a phone.
 *
 * A desktop visitor always has the header CTA in view. A phone visitor scrolls
 * past the hero button in about two swipes and then has no way to act for the
 * rest of a long page. The dock is that button, brought back on glass.
 *
 * Two rules make it a help rather than an obstacle, and both are the whole
 * reason this is a component and not a `position: fixed` div:
 *
 *   1. It never appears over the opening. The hero already has the button,
 *      larger and better placed, and a floating bar competing with it on first
 *      paint is the single most common way this pattern is done badly.
 *   2. It gets out of the way of the real form. Once #start is on screen the
 *      dock retreats — a "book now" bar sitting on top of the booking form is
 *      an obstruction, and worse, it hides a field.
 *
 * Both conditions are IntersectionObserver, not scroll handlers: two callbacks
 * per direction change, nothing per frame. The label is `common.nav.start`, the
 * same words as the header button, because the same action should never have
 * two names.
 */
export function MobileDock() {
  const pathname = usePathname()
  const [pastHero, setPastHero] = useState(false)
  const [formReached, setFormReached] = useState(false)

  useEffect(() => {
    setPastHero(false)
    setFormReached(false)

    if (typeof IntersectionObserver === 'undefined') return

    // The opening block of whatever page this is — the home hero, or an inner
    // page's PageHero. Both are the first <section> inside <main>.
    const opening = document.querySelector<HTMLElement>('#main section')
    const form = document.getElementById('start')
    const observers: IntersectionObserver[] = []

    if (opening) {
      const openingObserver = new IntersectionObserver(
        ([entry]) => {
          // Scrolled past, not merely out of view: a section can leave the
          // viewport upwards or downwards, and only upwards means "behind us".
          setPastHero(!entry.isIntersecting && entry.boundingClientRect.bottom < 0)
        },
        { threshold: 0 },
      )
      openingObserver.observe(opening)
      observers.push(openingObserver)
    }

    if (form) {
      const formObserver = new IntersectionObserver(
        ([entry]) => setFormReached(entry.isIntersecting),
        {
          /**
           * The root is stretched upwards without limit, which turns
           * `isIntersecting` into exactly the question being asked: has the
           * form's top edge reached the bottom of the screen — now, or at any
           * point above? So the dock retreats when the form arrives and stays
           * away for the footer, and comes back only if the reader scrolls up
           * far enough that the form is below the fold again.
           *
           * The margin is what makes it correct rather than merely tidy. An
           * observer notifies on threshold CROSSINGS, and a jump — a `#start`
           * link, a fling, a restored scroll position — can move the form from
           * far below to far above inside a single frame. Both of those states
           * are "not intersecting" for an ordinary observer, so it never
           * reports, and the dock is left sitting on top of the footer. With a
           * one-sided root the second state is "intersecting", so the crossing
           * exists and is always seen.
           */
          rootMargin: '100000px 0px 0px 0px',
          threshold: 0,
        },
      )
      formObserver.observe(form)
      observers.push(formObserver)
    }

    return () => observers.forEach((observer) => observer.disconnect())
  }, [pathname])

  // The confirmation page has already converted. Asking again there is noise.
  if (pathname === '/thanks') return null

  const shown = pastHero && !formReached

  return (
    <div
      className="dock md:hidden"
      data-shown={shown}
      /* Hidden from the accessibility tree and from tab order while it is off
         screen, so a keyboard user is never sent to a control they cannot see. */
      aria-hidden={!shown}
      inert={!shown}
    >
      <div className="flex items-center gap-2.5">
        <Link
          href="/#start"
          data-cta="dock"
          className="flex min-h-[3rem] flex-1 items-center justify-center rounded bg-gold px-5 text-base font-extrabold text-navy transition-[background-color,transform] duration-200 active:translate-y-px"
        >
          {common.nav.start}
        </Link>

        <a
          href={whatsappLink('dock')}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => events.whatsappClicked('dock')}
          aria-label="كلّمنا على واتساب"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#25D366] text-[#06301A] transition-[background-color,transform] duration-200 active:translate-y-px"
        >
          <WhatsAppMark size={22} />
        </a>
      </div>
    </div>
  )
}
