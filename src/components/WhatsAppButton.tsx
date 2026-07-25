'use client'

import { events } from '@/lib/analytics'
import { buttonClasses } from '@/components/ui/Button'
import { whatsappLink } from '@/content/site'
import { cn } from '@/lib/utils'

/**
 * Secondary capture channel (Doc 05 §6.3). It carries a pre-filled message with
 * the page context so the reply starts informed, and it is tracked separately —
 * a WhatsApp click that never becomes a message is a lead we must be able to see.
 */
export function WhatsAppButton({
  context,
  children,
  variant = 'secondary',
  className,
}: {
  context: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}) {
  return (
    <a
      href={whatsappLink(context)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => events.whatsappClicked(context)}
      className={cn(buttonClasses(variant), className)}
    >
      {children}
    </a>
  )
}
