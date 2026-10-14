import { JsonLd } from '@/components/JsonLd'
import { homeGraph } from '@/lib/schema-org'
import { Hero } from '@/components/sections/Hero'
import { PlatformTour } from '@/components/sections/PlatformTour'
import { AboutTeaser } from '@/components/sections/AboutTeaser'
import { Audience } from '@/components/sections/Audience'
import { System } from '@/components/sections/System'
import { Outcome } from '@/components/sections/Outcome'
import { KnowledgeTeaser } from '@/components/sections/KnowledgeTeaser'
import { ParentBridge } from '@/components/sections/ParentBridge'
import { StartBand } from '@/components/sections/StartBand'

/**
 * The home page answers, in order: "who is teaching me?", "is this for me?",
 * "how does it hold me?", "what do I walk away with?", "where do I keep
 * learning?", "what do I do now?".
 *
 * Rebuilt in August 2026 around two grades and one promise. The free-content
 * teaser, the question list and the courses page all came out: the page now
 * argues the teaching, not the offer.
 *
 * September 2026: the full platform-details video went in straight under the
 * hero, at the owner's request — the teacher explaining his own system answers
 * "how does it hold me?" before any card does.
 *
 * October 2026: the booking form came off the site (students sign up on Code
 * Up), so the page now closes on where to start instead of a form.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      <Hero />
      <PlatformTour />
      <AboutTeaser />
      <Audience />
      <System />
      <Outcome />
      <KnowledgeTeaser />
      <ParentBridge />
      <StartBand pageContext="home" seam="fromLight" />
    </>
  )
}
