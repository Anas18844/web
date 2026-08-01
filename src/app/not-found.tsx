import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { common } from '@/content/copy'

/** Even the error state is designed — it is part of the signature (Principle 7). */
export default function NotFound() {
  return (
    <Section width="prose" space="lg" className="wash-top text-center">
      <div className="hero-enter">
        <p className="text-6xl font-black text-gold">٤٠٤</p>
        <span aria-hidden="true" className="trace-rule mx-auto mt-6 origin-center" />
        <h1 className="mt-6 text-title font-extrabold text-ink">{common.notFound.title}</h1>
        <p className="mt-3 text-body text-ink-muted">{common.notFound.body}</p>
        <ButtonLink href="/" className="mt-8">
          {common.notFound.cta}
        </ButtonLink>
      </div>
    </Section>
  )
}
