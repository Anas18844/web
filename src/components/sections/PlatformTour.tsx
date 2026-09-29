import { Section, SectionHeading } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { VideoFacade } from '@/components/VideoFacade'
import { home } from '@/content/copy'
import { site } from '@/content/site'

/**
 * فيديو تفاصيل المنصة — the whole platform walkthrough, on the home page.
 *
 * Added 2026-09-30 at the owner's request. It sits straight under the hero:
 * the hero states the promise, and this is the teacher explaining, in his own
 * voice, the system behind it — the month, the nine question levels, what is
 * free, the plans and how to join. The written version of the same video is
 * /platform, which the button below opens.
 *
 * Click-to-load like every video on the site: nothing heavy loads until the
 * visitor asks for it.
 */
export function PlatformTour() {
  const { platformTour } = home

  return (
    <Section id="platform-video">
      <SectionHeading
        eyebrow={platformTour.eyebrow}
        title={platformTour.title}
        intro={platformTour.lead}
      />

      <div data-reveal className="mx-auto max-w-4xl">
        <VideoFacade video={site.platform.guideVideo} proofName="home-platform-video" />
      </div>

      <div data-reveal className="mx-auto mt-8 flex max-w-4xl justify-center">
        <ButtonLink href="/platform" variant="secondary" data-cta="home-platform-video" className="px-8">
          {platformTour.cta}
        </ButtonLink>
      </div>
    </Section>
  )
}
