'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export type NavItem = { href: string; label: string }

/**
 * Navigation state and the mobile menu.
 *
 * Two problems the static header could not solve, both worth the ~1KB island:
 *
 *  1. Nothing told you which page you were on. The active link now carries the
 *     same 2px gold trace the sections use, so "where am I" is answered by the
 *     same device as "where does this section start".
 *
 *  2. On a phone AND on a tablet, /about and /parents were unreachable from
 *     the header — they existed only in the footer. Every link is now one tap
 *     away at every width. No links were added or removed; they were already
 *     in the site.
 *
 * The panel stays mounted and is hidden with `invisible`, which keeps it out
 * of the tab order while still allowing both directions to animate.
 */
export function HeaderNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // A menu that survives navigation is a menu covering the page you asked for.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <>
      {/*
       * Physical CENTRE — links inside a glass capsule, from `lg` up.
       *
       * The capsule used to appear at `md` while quietly hiding /about until
       * `lg` and /parents until `xl`, so between 768px and 1279px those pages
       * had no route from the header at all. The menu below now covers every
       * width where the capsule cannot hold all five.
       */}
      <nav
        aria-label="التنقل الرئيسي"
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.04] p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] lg:flex"
      >
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative inline-flex items-center rounded px-3.5 py-1.5 text-sm font-bold transition-colors duration-150',
                active
                  ? 'bg-white/[0.07] text-ink'
                  : 'text-ink-muted hover:bg-white/[0.07] hover:text-ink',
              )}
            >
              {item.label}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3.5 -bottom-px h-0.5 bg-gold"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Mobile trigger. Three bars fold into a cross — the only place on the
          site where an icon animates, because the icon IS the state. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
        className="-me-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-white/[0.08] bg-white/[0.04] text-ink transition-colors duration-150 hover:border-gold/40 lg:hidden"
      >
        <span aria-hidden="true" className="relative block h-4 w-5">
          <span
            className={cn(
              'absolute inset-x-0 top-0 h-0.5 bg-current transition-transform duration-200',
              open && 'translate-y-[7px] rotate-45',
            )}
          />
          <span
            className={cn(
              'absolute inset-x-0 top-[7px] h-0.5 bg-current transition-opacity duration-200',
              open && 'opacity-0',
            )}
          />
          <span
            className={cn(
              'absolute inset-x-0 top-[14px] h-0.5 bg-current transition-transform duration-200',
              open && '-translate-y-[7px] -rotate-45',
            )}
          />
        </span>
      </button>

      <div
        id="site-menu"
        className={cn(
          'absolute inset-x-0 top-full border-b border-white/[0.08] bg-navy-deep/[0.98] backdrop-blur-xl lg:hidden',
          'transition-[opacity,transform] duration-200 ease-out',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
      >
        <nav aria-label="قائمة الموقع" className="mx-auto flex max-w-content flex-col px-5 py-2 sm:px-8">
          {items.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative border-b border-navy-line/60 py-3.5 text-base font-bold transition-colors duration-150 last:border-b-0',
                  active ? 'text-gold' : 'text-ink-muted hover:text-ink',
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-3 -start-3 w-0.5 bg-gold"
                  />
                )}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
