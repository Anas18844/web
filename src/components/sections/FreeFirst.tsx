import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { OrbitBadge } from '@/components/ui/OrbitBadge'
import { Icon } from '@/components/ui/Icon'
import { home } from '@/content/copy'

/**
 * The free-first model on the home page.
 *
 * This answers the loudest unasked question ("what will this cost me?") with
 * "mostly nothing" — which is both true and the strongest trust move available
 * (Principle 5: help before you sell). Kept short; the detail lives on /courses.
 *
 * This is also where the site's one sticker lives: the rotating «مجاني»
 * orbit badge. It belongs here and only here — the promise it carries is the
 * thing the whole brand stands on, and a sticker repeated anywhere else
 * would stop being a stamp and start being wallpaper.
 */
export function FreeFirst() {
  return (
    <Section id="free" tone="deep">
      <div className="grid gap-9 md:grid-cols-[1.25fr_1fr] md:items-center md:gap-12">
        <div data-reveal className="relative">
          <span aria-hidden="true" className="trace-rule mb-5" />
          <h2 className="text-title font-extrabold text-ink">{home.freeTeaser.title}</h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">{home.freeTeaser.body}</p>
          <ButtonLink href="/courses" variant="secondary" className="mt-7">
            {home.freeTeaser.cta}
          </ButtonLink>
        </div>

        <div data-reveal className="relative">
          {/* The stamp sits half off the list's corner, like a seal pressed
              over the page edge. Decorative twin of the section title, so
              assistive tech hears the promise once, not twice. */}
          <OrbitBadge
            title="٪١٠٠"
            sub="مجاني"
            className="absolute -top-14 z-10 ltr:right-2 rtl:left-2 max-md:hidden"
          />

          <ul className="grid grid-cols-2 gap-3">
            {home.freeTeaser.items.map((item) => (
              <li
                key={item}
                className="card card-lit flex items-center gap-2.5 bg-navy/40 px-4 py-3.5 text-sm font-bold text-ink"
              >
                <Icon name="check" size={18} className="text-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
