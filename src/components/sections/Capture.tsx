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
 *
 * This is the last beat on every page, so it is given the most room on the
 * site and the one gold wash: by the time a visitor reaches it the page should
 * feel like it has opened up rather than closed in.
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
    <Section
      id="start"
      tone="deep"
      space="lg"
      className="wash-top relative overflow-hidden border-t border-navy-line"
    >
      {/* The atmosphere returns for the finale — the same living background
          that opened the page closes it, so start and finish rhyme. */}
      <div aria-hidden="true" className="aurora absolute inset-0" />

      {/* On mobile the three blocks stack heading → form → contact: the form is
          the action we came for, and WhatsApp underneath it stays the fallback
          rather than the first thing a thumb reaches. On md+ the explicit
          row/column placement restores the two-column layout: heading and
          contact on one side, form beside them. */}
      <div className="relative grid gap-9 md:grid-cols-2 md:grid-rows-[auto_1fr] md:items-start md:gap-x-12 md:gap-y-8">
        {/* The heading's own bottom margin is dropped — the grid gap is what
            separates it from whatever follows it at this breakpoint. */}
        <div className="md:col-start-1 md:row-start-1 [&>header]:mb-0">
          <SectionHeading title={title} intro={body} />
        </div>

        <LeadForm
          intent={intent}
          pageContext={pageContext}
          className="md:col-start-2 md:row-start-1 md:row-span-2"
        />

        {/* Fills the space beside the form, and gives the hesitant visitor
            a lower-commitment way to stay connected. */}
        <div data-reveal className="md:col-start-1 md:row-start-2">
          <WhatsAppButton context={pageContext}>كلّمنا على الواتساب</WhatsAppButton>
          <div className="mt-8">
            <SocialLinks />
          </div>
        </div>
      </div>
    </Section>
  )
}
