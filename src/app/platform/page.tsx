import type { Metadata } from 'next'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { VideoFacade } from '@/components/VideoFacade'
import { Capture } from '@/components/sections/Capture'
import { JsonLd } from '@/components/JsonLd'
import { pageGraph } from '@/lib/schema-org'
import { platform } from '@/content/copy'
import { assets } from '@/content/assets'
import { site } from '@/content/site'

export const metadata: Metadata = {
  title: platform.meta.title,
  description: platform.meta.description,
  alternates: { canonical: '/platform' },
  openGraph: {
    title: `${platform.meta.title} — ${site.name}`,
    description: platform.meta.description,
    url: '/platform',
  },
}

/**
 * "المنصة" — the optional paid layer.
 *
 * The page sells the platform without ever claiming it is required: the
 * "for whom" section filters people out on purpose, and the honesty block near
 * the end repeats that the free content is enough. That restraint is the point
 * — it is what makes the paid offer credible in the first place.
 */
export default function PlatformPage() {
  const { platformDemo, platformStills, parentReportSample } = assets

  return (
    <>
      <JsonLd data={pageGraph()} />

      <section className="border-b border-navy-line bg-navy-deep py-14 sm:py-20">
        <Container width="prose">
          <p className="mb-4 text-sm font-semibold text-gold">{platform.hero.eyebrow}</p>
          <h1 className="text-display font-extrabold text-ink">{platform.hero.title}</h1>
          <p className="mt-5 text-subtitle text-ink-muted">{platform.hero.lead}</p>
        </Container>
      </section>

      {/* Live proof slot — the platform is the strongest asset we own. */}
      {platformDemo && (
        <Section>
          <VideoFacade
            video={platformDemo}
            proofName="platform_demo"
            caption="المنصة أثناء الاستخدام: كتابة الكود، التشغيل، ثم التصحيح"
          />
        </Section>
      )}

      {/* Who it is for — and, explicitly, who it is not for. */}
      <Section tone="raised" width="prose">
        <SectionHeading title={platform.forWho.title} />
        <ul className="grid gap-3">
          {platform.forWho.items.map((item) => (
            <li key={item} className="flex gap-3 text-body text-ink-muted">
              <span aria-hidden="true" className="mt-1 shrink-0 text-gold">
                ▪
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-7 border-s-2 border-gold ps-4 text-body font-bold text-ink">
          {platform.forWho.note}
        </p>
      </Section>

      <Section>
        <SectionHeading title={platform.features.title} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {platform.features.items.map((feature) => (
            <article
              key={feature.title}
              className="border border-navy-line p-6 transition-colors hover:border-gold/40"
            >
              <h3 className="font-extrabold text-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
            </article>
          ))}
        </div>

        {/* Stills appear only when supplied; two maximum (Doc 04 §3.5). */}
        {platformStills.length > 0 && (
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {platformStills.slice(0, 2).map((shot) => (
              <Image
                key={shot.src}
                src={shot.src}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                sizes="(max-width: 640px) 100vw, 460px"
                className="w-full rounded border border-navy-line"
              />
            ))}
          </div>
        )}
      </Section>

      <Section tone="raised">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-title font-extrabold text-ink">{platform.followUp.title}</h2>
            <p className="mt-4 text-body text-ink-muted">{platform.followUp.body}</p>
            <p className="mt-4 text-body text-ink-muted">{platform.followUp.parent}</p>
          </div>

          {parentReportSample && (
            <figure>
              <Image
                src={parentReportSample.src}
                alt={parentReportSample.alt}
                width={parentReportSample.width}
                height={parentReportSample.height}
                sizes="(max-width: 768px) 100vw, 460px"
                className="w-full rounded border border-navy-line"
              />
              <figcaption className="mt-3 text-sm text-ink-faint">
                نموذج من التقرير الأسبوعي
              </figcaption>
            </figure>
          )}
        </div>
      </Section>

      <Section width="prose">
        <h2 className="text-title font-extrabold text-ink">{platform.cost.title}</h2>
        <p className="mt-4 text-body text-ink-muted">{platform.cost.body}</p>
      </Section>

      {/* The restraint that makes the offer credible. */}
      <Section tone="deep" width="prose">
        <div className="border-s-2 border-gold ps-5 sm:ps-7">
          <h2 className="text-title font-extrabold text-ink">{platform.honest.title}</h2>
          <p className="mt-4 text-body text-ink-muted">{platform.honest.body}</p>
        </div>
      </Section>

      <Capture
        intent="curriculum"
        pageContext="platform"
        title={platform.cta.title}
        body={platform.cta.body}
      />
    </>
  )
}
