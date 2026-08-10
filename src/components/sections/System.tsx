import Image from 'next/image'
import { Section, SectionHeading } from '@/components/ui/Section'
import { IconPlate, type IconName } from '@/components/ui/Icon'
import { VideoFacade } from '@/components/VideoFacade'
import { home } from '@/content/copy'
import { assets } from '@/content/assets'
import { cn } from '@/lib/utils'

/** The pillar glyphs: lesson → platform → follow-up. */
const PILLAR_ICONS: Record<string, IconName> = {
  session: 'board',
  platform: 'terminal',
  followup: 'chart',
}

/**
 * Layer 2 — the persuasion body (Doc 07 §2).
 * Each pillar states a claim; media proof sits directly beside the claim it
 * serves (Doc 04 §1.1 — adjacency), and disappears entirely when absent.
 *
 * The three pillars are a sequence — explain, practise, follow up — so each
 * one arrives on its own rather than as a block. That staging is what makes
 * the section read as a system with steps instead of three parallel claims.
 *
 * LAYOUT: a pillar only splits into two columns when it actually has proof to
 * put in the second one. While the media slots are empty the pillar runs at
 * full width with the copy held to a readable measure — otherwise every row
 * reserves half the page for nothing, which is the single easiest way to make
 * a section look unfinished.
 */
export function System() {
  const { teachingSample, platformDemo, platformStills, parentReportSample } = assets

  const mediaFor = (id: string) => {
    if (id === 'session') return teachingSample ? 'video' : null
    if (id === 'platform') return platformDemo || platformStills.length > 0 ? 'platform' : null
    if (id === 'followup') return parentReportSample ? 'report' : null
    return null
  }

  return (
    <Section id="system">
      <SectionHeading title={home.system.title} />

      <div className="grid gap-10 sm:gap-12">
        {home.system.pillars.map((pillar) => {
          const media = mediaFor(pillar.id)

          return (
            <article
              key={pillar.id}
              data-reveal
              className={cn(
                'relative grid gap-6 border-t border-navy-line pt-8',
                media && 'md:grid-cols-[1fr_1.1fr] md:gap-10',
              )}
            >
              {/* The trace picks up where the section heading's left off: each
                  step lights its own rule as it arrives. */}
              <span aria-hidden="true" className="trace-rule absolute -top-px start-0 w-16" />

              <div>
                <div className="flex items-center gap-4">
                  <IconPlate name={PILLAR_ICONS[pillar.id] ?? 'spark'} />
                  <h3 className="text-xl font-extrabold text-ink sm:text-2xl">{pillar.title}</h3>
                </div>
                <p className={cn('mt-4 text-body text-ink-muted', !media && 'max-w-prose')}>
                  {pillar.body}
                </p>
              </div>

              {media && (
                <div className="md:pt-1">
                  {media === 'video' && teachingSample && (
                    <VideoFacade
                      video={teachingSample}
                      proofName="teaching_sample"
                      caption="مقطع من شرح فعلي"
                    />
                  )}

                  {media === 'platform' && platformDemo && (
                    <VideoFacade
                      video={platformDemo}
                      proofName="platform_demo"
                      caption="المنصة أثناء الاستخدام: كتابة الكود، التشغيل، ثم التصحيح"
                    />
                  )}

                  {media === 'platform' && !platformDemo && (
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

                  {media === 'report' && parentReportSample && (
                    <figure>
                      <Image
                        src={parentReportSample.src}
                        alt={parentReportSample.alt}
                        width={parentReportSample.width}
                        height={parentReportSample.height}
                        sizes="(max-width: 768px) 100vw, 460px"
                        className="rounded border border-navy-line"
                      />
                      <figcaption className="mt-3 text-sm text-ink-faint">
                        نموذج من التقرير الأسبوعي اللي بيوصل لولي الأمر
                      </figcaption>
                    </figure>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </Section>
  )
}
