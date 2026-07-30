import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { common } from '@/content/copy'
import { site } from '@/content/site'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-navy-line bg-navy-deep py-10">
      <Container className="flex flex-col gap-6 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-ink">{site.name}</p>
          <p className="mt-1">{site.motto}</p>
        </div>

        <nav aria-label="روابط الموقع" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/courses" className="transition-colors hover:text-ink">
            {common.nav.courses}
          </Link>
          <Link href="/platform" className="transition-colors hover:text-ink">
            {common.nav.platform}
          </Link>
          <Link href="/about" className="transition-colors hover:text-ink">
            {common.nav.about}
          </Link>
          <Link href="/links" className="transition-colors hover:text-ink">
            {common.footer.links}
          </Link>
          <Link href="/parents" className="transition-colors hover:text-ink">
            {common.nav.parents}
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-ink">
            {common.footer.privacy}
          </Link>
          {/* Centres reach us directly, not through the public site (Doc 07 layer 4). */}
          <a
            href={`https://wa.me/${site.whatsapp.number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            للسناتر: تواصل معنا
          </a>
        </nav>

        <p>© {year} — {common.footer.rights}</p>
      </Container>
    </footer>
  )
}
