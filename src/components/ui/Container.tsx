import { cn } from '@/lib/utils'

export function Container({
  children,
  className,
  width = 'content',
}: {
  children: React.ReactNode
  className?: string
  width?: 'content' | 'prose'
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        width === 'content' ? 'max-w-content' : 'max-w-prose',
        className,
      )}
    >
      {children}
    </div>
  )
}
