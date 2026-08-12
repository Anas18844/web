import { Section, SectionHeading } from '@/components/ui/Section'
import { IconPlate, type IconName } from '@/components/ui/Icon'
import { VideoFacade } from '@/components/VideoFacade'
import { home } from '@/content/copy'
import { assets } from '@/content/assets'

/** One glyph per mechanism, keyed to the pillar ids in copy.ts. */
const ICONS: Record<string, IconName> = {
  quiz: 'quiz',
  mentor: 'mentor',
  correction: 'pen',
  formats: 'formats',
  monthly: 'layers',
  support: 'shield',
}

/**
 * نظام الشرح — the teaching system.
 *
 * Six mechanisms, not six adjectives. Each card names something that actually
 * happens on a schedule: a test before every session, a supervisor with a
 * name, a correction method, an exam format, a monthly level split, three
 * support lines. That is the founder's whole argument — the system carries the
 * student, so the student does not have to carry themselves.
 *
 * A six-card grid rather than the old three stacked rows: at six items the
 * stacked layout ran the section past two screens, and mechanisms read better
 * scanned side by side than argued one after another.
 */
export function System() {
  const { teachingSample } = assets

  return (
    <Section id="system" tone="paper">
      <SectionHeading title={home.system.title} intro={home.system.intro} />

      {/* A real teaching clip outranks any description of the teaching. Shown
          the moment the asset exists, and absent entirely until then. */}
      {teachingSample && (
        <div data-reveal className="mb-10">
          <VideoFacade
            video={teachingSample}
            proofName="teaching_sample"
            caption="مقطع من شرح فعلي"
          />
        </div>
      )}

      <div data-reveal-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {home.system.pillars.map((pillar) => (
          <article key={pillar.id} className="group/card card flex flex-col p-6 sm:p-7">
            <IconPlate
              name={ICONS[pillar.id] ?? 'spark'}
              className="mb-5 group-hover/card:border-gold/60 group-hover/card:bg-gold/[0.12]"
            />
            <h3 className="text-lg font-extrabold leading-snug text-ink">{pillar.title}</h3>
            <p className="mt-3 flex-1 text-body text-ink-muted">{pillar.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
