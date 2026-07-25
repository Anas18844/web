import { Hero } from '@/components/sections/Hero'
import { Numbers } from '@/components/sections/Numbers'
import { System } from '@/components/sections/System'
import { Story } from '@/components/sections/Story'
import { Practical } from '@/components/sections/Practical'
import { Transparency } from '@/components/sections/Transparency'
import { ParentBridge } from '@/components/sections/ParentBridge'
import { Capture } from '@/components/sections/Capture'
import { JsonLd } from '@/components/JsonLd'
import { homeGraph } from '@/lib/schema-org'

/**
 * The home page carries the entire persuasion arc in one scroll, so a visitor
 * who never clicks anything can still travel from "who is this?" to the form
 * (Review §6.1). Ordered by the questions in the visitor's head (Doc 01),
 * not by what we most want to say.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      <Hero />
      <Numbers />
      <System />
      <Story />
      <Practical />
      <Transparency />
      <ParentBridge />
      <Capture intent="curriculum" pageContext="home" />
    </>
  )
}
