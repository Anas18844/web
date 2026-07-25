import Image from 'next/image'
import { Section, SectionHeading } from '@/components/ui/Section'
import { home } from '@/content/copy'
import { assets } from '@/content/assets'

/**
 * Identity content (Doc 03 — type 5). Told for its function ("what this means
 * for you"), never as a CV or a boast — Hero archetype stays out (Principle 9).
 */
export function Story() {
  const photo = assets.sessionPhoto

  return (
    <Section tone="raised">
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start">
        <div>
          <SectionHeading title={home.story.title} />
          <div className="grid gap-5">
            {home.story.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-body text-ink-muted">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-7 border-s-2 border-gold ps-4 font-bold text-ink">
            {home.story.motto}
          </p>
        </div>

        {photo && (
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 768px) 100vw, 420px"
            className="rounded border border-navy-line"
          />
        )}
      </div>
    </Section>
  )
}
