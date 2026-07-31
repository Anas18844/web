import { Hero } from '@/components/sections/Hero'
import { AboutTeaser } from '@/components/sections/AboutTeaser'
import { Audience } from '@/components/sections/Audience'
import { FreeFirst } from '@/components/sections/FreeFirst'
import { System } from '@/components/sections/System'
import { Practical } from '@/components/sections/Practical'
import { ParentBridge } from '@/components/sections/ParentBridge'
import { Capture } from '@/components/sections/Capture'
import { JsonLd } from '@/components/JsonLd'
import { homeGraph } from '@/lib/schema-org'

/**
 * The home page answers, in order: "who is teaching me?", "is this for me?",
 * "what does it cost?", "how does it work?", "what do I do now?".
 *
 * The founder block comes first, directly under the hero — the visitor arrives
 * from his video and wants the person named before anything else. It stays a
 * short teaser that links to /about, where the full credentials and their
 * proof screenshots live.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      <Hero />
      <AboutTeaser />
      <Audience />
      <FreeFirst />
      <System />
      <Practical />
      <ParentBridge />
      <Capture intent="curriculum" pageContext="home" />
    </>
  )
}
