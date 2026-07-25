import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { common } from '@/content/copy'

/** Even the error state is designed — it is part of the signature (Principle 7). */
export default function NotFound() {
  return (
    <Section width="prose" className="py-24 text-center">
      <p className="text-6xl font-black text-gold">٤٠٤</p>
      <h1 className="mt-6 text-title font-extrabold text-ink">{common.notFound.title}</h1>
      <p className="mt-3 text-body text-ink-muted">{common.notFound.body}</p>
      <ButtonLink href="/" className="mt-8">
        {common.notFound.cta}
      </ButtonLink>
    </Section>
  )
}
