import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { HeaderNav, type NavItem } from '@/components/HeaderNav'
import { common } from '@/content/copy'
import { site } from '@/content/site'

const NAV: NavItem[] = [
  { href: '/', label: common.nav.home },
  { href: '/courses', label: common.nav.courses },
  { href: '/platform', label: common.nav.platform },
  { href: '/about', label: common.nav.about },
  { href: '/parents', label: common.nav.parents },
]

/**
 * Glass navigation bar.
 *
 * Layout follows the document's natural RTL flow: the mark sits at the start
 * (physical right), the primary action at the end (physical left), and the
 * links float in the middle.
 *
 * Centring uses `left-1/2 + -translate-x-1/2` — physical properties, because
 * the logical `start-*` would resolve to the right edge under RTL.
 *
 * Corners stay sharp (2px): the brand identity is built on angular cuts, so
 * "modern" here means glass, hairlines and restrained motion — not pills.
 *
 * The shell stays a server component; only the navigation itself is a client
 * island, because knowing the current page and opening a menu are the two
 * things that genuinely require the browser.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      {/* Glass: blur + saturation over translucent navy. */}
      <div className="absolute inset-0 border-b border-white/[0.08] bg-navy/60 backdrop-blur-xl backdrop-saturate-150" />
      {/* A gold hairline at low opacity — the finishing detail. */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold/25 to-transparent" />

      <Container className="relative flex h-16 items-center justify-between gap-3">
        {/* RTL start — physical RIGHT: the mark. */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label={`${site.name} — الصفحة الرئيسية`}
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={36}
            height={36}
            sizes="36px"
            priority
            className="h-9 w-9 rounded border border-white/10 object-cover transition-[border-color,transform] duration-200 group-hover:border-gold/50 group-hover:scale-[1.04]"
          />
          <span className="hidden text-[0.95rem] font-extrabold text-ink transition-colors duration-200 group-hover:text-gold sm:inline">
            {site.name}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <HeaderNav items={NAV} />

          {/* RTL end — physical LEFT: the primary action. */}
          <Link
            href="/#start"
            className="shrink-0 rounded bg-gold px-4 py-2 text-sm font-extrabold text-navy transition-[background-color,color,box-shadow,transform] duration-200 hover:bg-gold-deep hover:text-ink hover:shadow-[0_0_24px_-6px_rgba(203,163,82,0.8)] active:translate-y-px sm:px-5"
          >
            {common.nav.start}
          </Link>
        </div>
      </Container>
    </header>
  )
}
