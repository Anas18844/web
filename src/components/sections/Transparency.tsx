import { Section } from '@/components/ui/Section'
import { home } from '@/content/copy'

/**
 * The transparency statement (Doc 02 §2.6). This is the single most
 * differentiating paragraph on the site: admitting there are no absolute
 * guarantees in a brand-new system builds more trust than any promise could.
 * It must never be softened into a sales line.
 */
export function Transparency() {
  return (
    <Section tone="deep" width="prose">
      <div className="border-s-2 border-gold ps-5 sm:ps-7">
        <h2 className="text-title font-extrabold text-ink">{home.transparency.title}</h2>
        <p className="mt-4 text-body text-ink-muted">{home.transparency.body}</p>
      </div>
    </Section>
  )
}
