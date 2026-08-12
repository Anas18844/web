import { Section, SectionHeading } from '@/components/ui/Section'
import { IconPlate, type IconName } from '@/components/ui/Icon'
import { Circuit } from '@/components/ui/Circuit'
import { home } from '@/content/copy'

/** One glyph per stage of preparation, in the copy's own order. */
const ICONS: readonly IconName[] = ['globe', 'translate', 'wrench', 'rehearse']

/**
 * The preparation behind one lecture.
 *
 * This is the section that answers "why not just watch a recorded video" —
 * and it answers it with WORK, not adjectives: what gets read, what gets
 * translated, what gets added, what gets rehearsed. Four steps in sequence,
 * numbered, because the order is the argument.
 *
 * Sits between "who this is for" and the system itself: the student has just
 * recognised themselves, and the next honest question is what they would
 * actually be paying attention to.
 */
export function Preparation() {
  return (
    <Section id="preparation" tone="deep" className="relative overflow-hidden">
      {/* The brand traces, drawn low in the far corner — this section is about
          engineering the lesson, so the circuit belongs to it. */}
      <div
        data-reveal
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 end-0 hidden opacity-40 lg:block"
      >
        <Circuit flip className="h-56 w-auto" />
      </div>

      <div className="relative">
        <SectionHeading title={home.preparation.title} intro={home.preparation.intro} />

        <ol data-reveal-stagger className="grid gap-5 md:grid-cols-2 lg:gap-6">
          {home.preparation.items.map((item, index) => (
            <li key={item.title} className="card p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <IconPlate name={ICONS[index] ?? 'spark'} />
                <div className="min-w-0">
                  <p className="text-xs font-black tracking-widest text-gold/70">
                    {'٠١٢٣٤٥٦٧٨٩'[index + 1]}
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold leading-snug text-ink">
                    {item.title}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-body text-ink-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
