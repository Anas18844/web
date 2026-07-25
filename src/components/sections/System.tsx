import Image from 'next/image'
import { Section, SectionHeading } from '@/components/ui/Section'
import { VideoFacade } from '@/components/VideoFacade'
import { home } from '@/content/copy'
import { assets } from '@/content/assets'

/**
 * Layer 2 — the persuasion body (Doc 07 §2).
 * Each pillar states a claim; media proof sits directly beside the claim it
 * serves (Doc 04 §1.1 — adjacency), and disappears entirely when absent.
 */
export function System() {
  const { teachingSample, platformDemo, platformStills } = assets

  return (
    <Section id="system">
      <SectionHeading title={home.system.title} intro={home.system.intro} />

      <div className="grid gap-10">
        {home.system.pillars.map((pillar) => (
          <article
            key={pillar.id}
            className="grid gap-6 border-t border-navy-line pt-8 md:grid-cols-[1fr_1.1fr] md:gap-10"
          >
            <div>
              <h3 className="text-xl font-extrabold text-ink sm:text-2xl">{pillar.title}</h3>
              <p className="mt-4 text-body text-ink-muted">{pillar.body}</p>
            </div>

            <div className="md:pt-1">
              {pillar.id === 'session' && teachingSample && (
                <VideoFacade
                  video={teachingSample}
                  proofName="teaching_sample"
                  caption="مقطع من شرح فعلي"
                />
              )}

              {pillar.id === 'platform' && platformDemo && (
                <VideoFacade
                  video={platformDemo}
                  proofName="platform_demo"
                  caption="المنصة أثناء الاستخدام: كتابة الكود، التشغيل، ثم التصحيح"
                />
              )}

              {pillar.id === 'platform' && !platformDemo && platformStills.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {platformStills.slice(0, 2).map((shot) => (
                    <Image
                      key={shot.src}
                      src={shot.src}
                      alt={shot.alt}
                      width={shot.width}
                      height={shot.height}
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="rounded border border-navy-line"
                    />
                  ))}
                </div>
              )}

              {pillar.id === 'followup' && assets.parentReportSample && (
                <figure>
                  <Image
                    src={assets.parentReportSample.src}
                    alt={assets.parentReportSample.alt}
                    width={assets.parentReportSample.width}
                    height={assets.parentReportSample.height}
                    sizes="(max-width: 768px) 100vw, 460px"
                    className="rounded border border-navy-line"
                  />
                  <figcaption className="mt-3 text-sm text-ink-faint">
                    نموذج من التقرير الأسبوعي اللي بيوصل لولي الأمر
                  </figcaption>
                </figure>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
