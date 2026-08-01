import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary'

/**
 * Two variants, one interaction language.
 *
 * Primary carries a gold bloom on hover — the same glow the header's action
 * uses, so the site has exactly one way of saying "this is the thing to press".
 * Secondary answers with its border warming to gold instead of a fill, which
 * keeps it clearly subordinate at a glance.
 *
 * Both press: a 1px downward nudge on :active. It costs nothing and it is the
 * difference between a button that responds and a link that happens to be
 * rectangular.
 */
const styles: Record<Variant, string> = {
  primary:
    'bg-gold text-navy hover:bg-gold-deep hover:text-ink hover:shadow-[0_0_28px_-8px_rgba(203,163,82,0.9)] focus-visible:ring-gold',
  secondary:
    'border border-navy-line bg-transparent text-ink hover:border-gold hover:bg-gold/[0.06] hover:text-gold',
}

const base =
  'inline-flex min-h-[3rem] items-center justify-center rounded px-6 py-3 text-base font-bold ' +
  'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ' +
  'active:translate-y-px motion-reduce:active:translate-y-0'

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
  ...rest
}: {
  href: string
  children: React.ReactNode
  variant?: Variant
  className?: string
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link href={href} className={cn(base, styles[variant], className)} {...rest}>
      {children}
    </Link>
  )
}

export function buttonClasses(variant: Variant = 'primary', className?: string) {
  return cn(base, styles[variant], className)
}
