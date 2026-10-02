'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Announcement } from '@/content/announcements'

/**
 * One announcement, in two shapes: a thin bar above the header on every page,
 * and a full card on the pages it belongs to.
 *
 * The pages are prerendered, so whether a time-boxed notice has closed is
 * decided here, in the browser, against the student's clock. It renders on the
 * server too — a student without JavaScript still sees it — and hides itself
 * after mount once `endsAt` has passed.
 */
export function Notice({
  notice,
  variant,
}: {
  notice: Announcement
  variant: 'bar' | 'card'
}) {
  const [over, setOver] = useState(false)

  useEffect(() => {
    if (notice.endsAt) setOver(Date.now() >= Date.parse(notice.endsAt))
  }, [notice.endsAt])

  if (over) return null

  if (variant === 'bar') {
    return (
      <Link
        href={notice.href}
        className="block border-b border-navy/15 bg-gold-brand px-4 py-2 text-center text-xs font-extrabold leading-relaxed text-navy transition-colors duration-200 hover:bg-gold-deep sm:text-sm"
      >
        📢 {notice.short}
      </Link>
    )
  }

  return (
    <div role="note" className="rounded border border-gold/50 bg-gold/10 p-4 sm:p-5">
      <p className="text-subtitle font-extrabold text-ink">📢 {notice.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{notice.body}</p>
      {notice.cta && (
        <Link
          href={notice.href}
          className="mt-4 inline-block rounded bg-gold px-4 py-2 text-sm font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink"
        >
          {notice.cta}
        </Link>
      )}
    </div>
  )
}
