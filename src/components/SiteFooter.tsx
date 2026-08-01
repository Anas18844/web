import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { common } from '@/content/copy'
import { site } from '@/content/site'

/**
 * Footer links share one hover: a gold rule that grows from the RTL start edge
 * — the same trace the sections and cards use, at its smallest scale.
 */
const link =
  'relative inline-block text-ink-faint transition-colors duration-200 hover:text-ink ' +
  'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 ' +
  'after:bg-gold after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-navy-line bg-navy-deep py-12">
      <Container className="flex flex-col gap-6 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-ink">{site.name}</p>
          <p className="mt-1 flex items-center gap-2.5">
            <span aria-hidden="true" className="h-0.5 w-4 shrink-0 bg-gold/70" />
            {site.motto}
          </p>
        </div>

        <nav aria-label="روابط الموقع" className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/courses" className={link}>
            {common.nav.courses}
          </Link>
          <Link href="/platform" className={link}>
            {common.nav.platform}
          </Link>
          <Link href="/about" className={link}>
            {common.nav.about}
          </Link>
          <Link href="/links" className={link}>
            {common.footer.links}
          </Link>
          <Link href="/parents" className={link}>
            {common.nav.parents}
          </Link>
          <Link href="/privacy" className={link}>
            {common.footer.privacy}
          </Link>
          {/* Centres reach us directly, not through the public site (Doc 07 layer 4). */}
          <a
            href={`https://wa.me/${site.whatsapp.number}`}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            للسناتر: تواصل معنا
          </a>
        </nav>

        <p>© {year} — {common.footer.rights}</p>
      </Container>
    </footer>
  )
}
