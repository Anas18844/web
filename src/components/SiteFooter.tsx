import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { SocialLinks } from '@/components/SocialLinks'
import { common } from '@/content/copy'
import { site } from '@/content/site'

/**
 * The footer now carries the contact block that used to sit beside the form.
 *
 * Beside the form it competed with the form — a visitor mid-signup was being
 * offered five other places to go. Down here it does the job a footer is for:
 * every official channel in one organised place, so the page ends with "here
 * is how to reach us" instead of "here is another thing to click".
 *
 * Four columns on desktop, stacking cleanly to one on mobile: the mark and
 * what we do, the site map, direct contact, then the channel grid.
 */

const link =
  'relative inline-block text-ink-faint transition-colors duration-200 hover:text-ink ' +
  'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 ' +
  'after:bg-gold after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100'

const PAGES = [
  { href: '/platform', label: common.nav.platform },
  { href: '/knowledge', label: common.nav.knowledge },
  { href: '/about', label: common.nav.about },
  { href: '/parents', label: common.nav.parents },
  { href: '/links', label: common.footer.links },
  { href: '/privacy', label: common.footer.privacy },
]

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-navy-line bg-navy-deep">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
          {/* ── The mark ──────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt=""
                width={44}
                height={44}
                sizes="44px"
                loading="lazy"
                className="h-11 w-11 rounded border border-navy-line object-cover"
              />
              <div>
                <p className="font-extrabold text-ink">{site.name}</p>
                <p className="text-xs text-ink-faint">{site.nameEn}</p>
              </div>
            </div>

            <p className="mt-5 flex items-center gap-2.5 text-sm text-ink-faint">
              <span aria-hidden="true" className="h-0.5 w-4 shrink-0 bg-gold/70" />
              {site.motto}
            </p>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-faint">
              {site.subject} — لطلاب أولى وتانية ثانوي.
            </p>
          </div>

          {/* ── Site map ──────────────────────────────────────────────────── */}
          <nav aria-label="روابط الموقع">
            <h2 className="text-xs font-extrabold tracking-wide text-ink">الموقع</h2>
            <ul className="mt-5 grid gap-3 text-sm">
              {PAGES.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={link}>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Direct contact ────────────────────────────────────────────── */}
          <div>
            <h2 className="text-xs font-extrabold tracking-wide text-ink">التواصل</h2>
            <ul className="mt-5 grid gap-3 text-sm">
              <li>
                <a
                  href={`https://wa.me/${site.whatsapp.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                  dir="ltr"
                >
                  {site.whatsapp.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className={`${link} break-all`} dir="ltr">
                  {site.email}
                </a>
              </li>
              {/* Centres reach us directly, not through the public site
                  (Doc 07 layer 4). */}
              <li>
                <a
                  href={`https://wa.me/${site.whatsapp.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  للسناتر: تواصل معنا
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Official channels ───────────────────────────────────────────── */}
        <div className="mt-12 border-t border-navy-line pt-10">
          <SocialLinks />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-navy-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} — {common.footer.rights}
          </p>
          <p>{site.nameEn}</p>
        </div>
      </Container>
    </footer>
  )
}
