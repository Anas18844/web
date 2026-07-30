import { Section, SectionHeading } from '@/components/ui/Section'
import { LeadForm } from '@/components/LeadForm'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { SocialLinks } from '@/components/SocialLinks'
import { home } from '@/content/copy'
import type { Intent } from '@/content/site'

/**
 * The capture point (Doc 05). Placed after the proof has been shown, never
 * before it — and the WhatsApp route stays visible but secondary, because a
 * click that never becomes a message is a lead we lose without seeing it.
 */
export function Capture({
  intent = 'curriculum',
  pageContext = 'home',
  title = home.capture.title,
  body = home.capture.body,
}: {
  intent?: Intent
  pageContext?: string
  title?: string
  body?: string
}) {
  return (
    <Section id="start" tone="deep">
      <div className="grid gap-9 md:grid-cols-2 md:items-start md:gap-12">
        <div>
          <SectionHeading title={title} intro={body} />
          <WhatsAppButton context={pageContext}>كلّمنا على الواتساب</WhatsAppButton>

          {/* Fills the space beside the form, and gives the hesitant visitor
              a lower-commitment way to stay connected. */}
          <div className="mt-8">
            <SocialLinks />
          </div>
        </div>

        <LeadForm intent={intent} pageContext={pageContext} />
      </div>
    </Section>
  )
}
