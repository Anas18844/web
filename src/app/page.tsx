import { JsonLd } from '@/components/JsonLd'
import { homeGraph } from '@/lib/schema-org'
import { Hero } from '@/components/sections/Hero'
import { AboutTeaser } from '@/components/sections/AboutTeaser'
import { Audience } from '@/components/sections/Audience'
import { System } from '@/components/sections/System'
import { Outcome } from '@/components/sections/Outcome'
import { KnowledgeTeaser } from '@/components/sections/KnowledgeTeaser'
import { ParentBridge } from '@/components/sections/ParentBridge'
import { Capture } from '@/components/sections/Capture'

/**
 * The home page answers, in order: "who is teaching me?", "is this for me?",
 * "how does it hold me?", "what do I walk away with?", "where do I keep
 * learning?", "what do I do now?".
 *
 * Rebuilt in August 2026 around two grades and one promise. The free-content
 * teaser, the question list and the courses page all came out: the page now
 * argues the teaching, not the offer.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      <Hero />
      <AboutTeaser />
      <Audience />
      <System />
      <Outcome />
      <KnowledgeTeaser />
      <ParentBridge />
      <Capture intent="curriculum" pageContext="home" seam="fromLight" />
    </>
  )
}
