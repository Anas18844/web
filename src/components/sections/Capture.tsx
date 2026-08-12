import { Section } from '@/components/ui/Section'
import { LeadForm } from '@/components/LeadForm'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { home } from '@/content/copy'
import type { Intent } from '@/content/site'

/**
 * The capture point (Doc 05) — the form, and nothing else.
 *
 * The heading, the standfirst and the outline WhatsApp button all came out in
 * August 2026. Anything beside a form is something to read instead of filling
 * it in, and the form's own copy already says what it wants.
 *
 * What is left under it is the one alternative route, in WhatsApp's own green.
 * It sits BELOW the form at every breakpoint on purpose: a visitor willing to
 * type should meet the fields first, and the person who would rather talk
 * finds the green the moment they look past them.
 */
export function Capture({
  intent = 'curriculum',
  pageContext = 'home',
}: {
  intent?: Intent
  pageContext?: string
}) {
  return (
    <Section
      id="start"
      tone="deep"
      space="lg"
      className="wash-top relative overflow-hidden border-t border-navy-line"
    >
      {/* The atmosphere returns for the finale — the same living background
          that opened the page closes it, so start and finish rhyme. */}
      <div aria-hidden="true" className="aurora absolute inset-0" />

      <div className="relative mx-auto w-full max-w-xl">
        <LeadForm intent={intent} pageContext={pageContext} />

        <WhatsAppButton context={pageContext} variant="whatsapp" className="mt-4">
          {home.capture.whatsappCta}
        </WhatsAppButton>
      </div>
    </Section>
  )
}
