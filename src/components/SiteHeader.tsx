import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { common } from '@/content/copy'
import { site } from '@/content/site'

/**
 * Deliberately minimal: three links, no menu, no hamburger, no client JS
 * (Principle 28 — simple surface, deep structure).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-line/60 bg-navy/90 backdrop-blur">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-ink">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center bg-gold text-sm font-black text-navy"
          >
            A
          </span>
          <span className="text-[0.95rem]">{site.name}</span>
        </Link>

        <nav aria-label="التنقل الرئيسي" className="flex items-center gap-4 text-sm">
          <Link href="/#system" className="text-ink-muted transition-colors hover:text-ink">
            {common.nav.system}
          </Link>
          <Link href="/parents" className="text-ink-muted transition-colors hover:text-ink">
            {common.nav.parents}
          </Link>
          <Link
            href="/#start"
            className="rounded bg-gold px-3 py-1.5 font-bold text-navy transition-colors hover:bg-gold-deep hover:text-ink"
          >
            {common.nav.start}
          </Link>
        </nav>
      </Container>
    </header>
  )
}
