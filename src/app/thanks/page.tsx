import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { WhatsAppChannel } from '@/components/WhatsAppChannel'
import { common, home } from '@/content/copy'
import { site } from '@/content/site'

export const metadata: Metadata = {
  title: common.form.successTitle,
  robots: { index: false, follow: true },
}

/**
 * Where a native form post lands.
 *
 * Only reached when the page's JavaScript never arrived and the browser
 * submitted the form the old-fashioned way. It exists so that path ends in a
 * confirmation rather than raw JSON or an error — the student cannot tell
 * anything unusual happened, which is the whole point.
 *
 * Static, so it renders even if everything else on the site is having a bad
 * day, and noindex because it is a destination, not a page.
 */
export default function ThanksPage() {
  return (
    <Section tone="deep" space="lg" width="prose" className="wash-top text-center">
      <span aria-hidden="true" className="trace-rule mx-auto mb-6 origin-center" />
      <h1 className="text-title font-extrabold text-gold">{common.form.successTitle}</h1>
      <p className="mx-auto mt-4 max-w-prose text-body text-ink-muted">
        {common.form.successBody} {site.responsePromise}.
      </p>

      <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
        <WhatsAppChannel context="thanks" />
        <WhatsAppButton context="thanks" variant="secondary">
          {home.capture.whatsappCta}
        </WhatsAppButton>
        <ButtonLink href="/" variant="secondary">
          {common.notFound.cta}
        </ButtonLink>
      </div>
    </Section>
  )
}
