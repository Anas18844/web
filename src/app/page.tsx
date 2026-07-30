import { Hero } from '@/components/sections/Hero'
import { Audience } from '@/components/sections/Audience'
import { FreeFirst } from '@/components/sections/FreeFirst'
import { AboutTeaser } from '@/components/sections/AboutTeaser'
import { System } from '@/components/sections/System'
import { Practical } from '@/components/sections/Practical'
import { Transparency } from '@/components/sections/Transparency'
import { ParentBridge } from '@/components/sections/ParentBridge'
import { Capture } from '@/components/sections/Capture'
import { JsonLd } from '@/components/JsonLd'
import { homeGraph } from '@/lib/schema-org'

/**
 * The home page belongs to the student, not the founder: it answers
 * "is this for me?", "how does it work?", "what do I do now?".
 *
 * Everything about the founder is compressed into one short teaser that links
 * to /about — where the full credentials and their proof screenshots live.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      <Hero />
      <Audience />
      <FreeFirst />
      <AboutTeaser />
      <System />
      <Practical />
      <Transparency />
      <ParentBridge />
      <Capture intent="curriculum" pageContext="home" />
    </>
  )
}
