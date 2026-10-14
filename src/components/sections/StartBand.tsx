import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { home } from '@/content/copy'

/**
 * The close of the page — where the booking form used to be.
 *
 * Booking came off the site in October 2026: students sign up and do
 * everything on Code Up. So the finale stops asking for details and says where
 * to go: the platform for the course, the free booklets and answer keys here,
 * and WhatsApp for a question.
 *
 * It keeps `id="start"`: `/#start` links have been shared on WhatsApp for
 * months, and they should still land on the place that tells a student how to
 * begin.
 */
export function StartBand({
  pageContext = 'home',
  seam,
}: {
  pageContext?: string
  /** Set by the page when the section above this one is a light surface. */
  seam?: 'fromLight'
}) {
  return (
    <Section
      id="start"
      tone="deep"
      space="lg"
      seam={seam}
      className="wash-top relative overflow-hidden border-t border-navy-line"
    >
      <div aria-hidden="true" className="aurora absolute inset-0" />

      <div data-reveal className="relative mx-auto w-full max-w-xl text-center">
        <span aria-hidden="true" className="trace-rule mx-auto mb-5 origin-center" />
        <h2 className="text-title font-extrabold text-ink">{home.start.title}</h2>
        <p className="mx-auto mt-4 max-w-prose text-body text-ink-muted">{home.start.body}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <ButtonLink href="/platform" data-cta={`${pageContext}_start_platform`}>
            {home.hero.primaryCta}
          </ButtonLink>
          <ButtonLink href="/booklets" variant="secondary" data-cta={`${pageContext}_start_booklets`}>
            {home.start.booksCta}
          </ButtonLink>
        </div>

        <WhatsAppButton context={pageContext} variant="whatsapp" className="mt-3">
          {home.start.whatsappCta}
        </WhatsAppButton>
      </div>
    </Section>
  )
}
