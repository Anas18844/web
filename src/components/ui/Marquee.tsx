import { cn } from '@/lib/utils'

/**
 * A seamless conveyor of items — the institution names in slow motion.
 *
 * The row is rendered twice inside one track that slides exactly one copy's
 * width, so the loop has no seam. Pure CSS animation (globals.css), pauses on
 * hover, fades at both edges, and collapses to a static row under reduced
 * motion. The duplicate copy is aria-hidden so screen readers hear each name
 * once.
 */
export function Marquee({
  children,
  className,
  itemClassName,
}: {
  children: readonly React.ReactNode[]
  className?: string
  itemClassName?: string
}) {
  const row = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center"
    >
      {children.map((child, i) => (
        <li key={i} className={cn('flex items-center whitespace-nowrap', itemClassName)}>
          {child}
          {/* The separator diamond — part of the rhythm, not punctuation. */}
          <span aria-hidden="true" className="mx-6 block h-1.5 w-1.5 rotate-45 bg-gold/40" />
        </li>
      ))}
    </ul>
  )

  return (
    <div className={cn('marquee', className)}>
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
