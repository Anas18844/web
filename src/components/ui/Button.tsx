import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary'

const styles: Record<Variant, string> = {
  primary:
    'bg-gold text-navy hover:bg-gold-deep hover:text-ink focus-visible:ring-gold',
  secondary:
    'border border-navy-line bg-transparent text-ink hover:border-gold hover:text-gold',
}

const base =
  'inline-flex min-h-[3rem] items-center justify-center rounded px-6 py-3 text-base font-bold transition-colors duration-150'

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
