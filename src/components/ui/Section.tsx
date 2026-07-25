import { cn } from '@/lib/utils'
import { Container } from './Container'

export function Section({
  children,
  id,
  className,
  tone = 'base',
  width = 'content',
}: {
  children: React.ReactNode
  id?: string
  className?: string
  tone?: 'base' | 'raised' | 'deep'
  width?: 'content' | 'prose'
}) {
  const tones = {
    base: 'bg-navy',
    raised: 'bg-navy-soft/40',
    deep: 'bg-navy-deep',
  }

  return (
    <section
      id={id}
      className={cn('scroll-mt-16 py-14 sm:py-20', tones[tone], className)}
    >
      <Container width={width}>{children}</Container>
    </section>
  )
}

export function SectionHeading({
  title,
  intro,
  eyebrow,
}: {
  title: string
  intro?: string
  eyebrow?: string
}) {
  return (
    <header className="mb-9 sm:mb-12">
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold tracking-wide text-gold">{eyebrow}</p>
      )}
      <h2 className="text-title font-extrabold text-ink">{title}</h2>
      {intro && <p className="mt-3 max-w-prose text-body text-ink-muted">{intro}</p>}
    </header>
  )
}
