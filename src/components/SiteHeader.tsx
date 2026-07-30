import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { common } from '@/content/copy'
import { site } from '@/content/site'

const NAV = [
  { href: '/', label: common.nav.home, show: 'inline-flex' },
  { href: '/courses', label: common.nav.courses, show: 'inline-flex' },
  { href: '/platform', label: common.nav.platform, show: 'inline-flex' },
  { href: '/about', label: common.nav.about, show: 'hidden lg:inline-flex' },
  { href: '/parents', label: common.nav.parents, show: 'hidden xl:inline-flex' },
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
 * Server component: no menu, no hamburger, zero client JS.
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
            className="h-9 w-9 rounded border border-white/10 object-cover transition-opacity duration-200 group-hover:opacity-90"
          />
          <span className="hidden text-[0.95rem] font-extrabold text-ink sm:inline">
            {site.name}
          </span>
        </Link>

        {/* Physical CENTRE — links inside a glass capsule. */}
        <nav
          aria-label="التنقل الرئيسي"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.04] p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] md:flex"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${item.show} items-center rounded px-3.5 py-1.5 text-sm font-bold text-ink-muted transition-colors duration-150 hover:bg-white/[0.07] hover:text-ink`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile fallback: the key links, since the capsule is hidden. */}
        <div className="flex items-center gap-4 md:hidden">
          <Link
            href="/courses"
            className="text-sm font-bold text-ink-muted transition-colors hover:text-ink"
          >
            {common.nav.courses}
          </Link>
          <Link
            href="/platform"
            className="hidden text-sm font-bold text-ink-muted transition-colors hover:text-ink sm:inline"
          >
            {common.nav.platform}
          </Link>
        </div>

        {/* The logo already links home on every breakpoint, so the mobile row
            spends its limited width on pages the mark cannot reach. */}

        {/* RTL end — physical LEFT: the primary action. */}
        <Link
          href="/#start"
          className="shrink-0 rounded bg-gold px-4 py-2 text-sm font-extrabold text-navy transition-all duration-200 hover:bg-gold-deep hover:text-ink hover:shadow-[0_0_24px_-6px_rgba(203,163,82,0.8)] sm:px-5"
        >
          {common.nav.start}
        </Link>
      </Container>
    </header>
  )
}
