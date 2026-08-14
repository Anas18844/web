'use client'

import { useEffect } from 'react'
import { events } from '@/lib/analytics'

/**
 * Did anyone actually read it?
 *
 * An article page view says a headline worked. It says nothing about whether
 * the piece under it was any good — and for a Knowledge Center whose entire
 * argument is "the content itself is the proof", that is the only question
 * worth asking of it.
 *
 * So two events. `article_opened` fires on mount; `article_read` fires when the
 * end of the body scrolls into view. The ratio between them, per article, is a
 * straight answer about which pieces earn their place and which ones are being
 * abandoned in the third paragraph.
 *
 * The bottom sentinel is the honest place to measure from: a scroll-percentage
 * threshold rewards short articles and punishes thorough ones, so a 12-minute
 * piece would look worse than a 2-minute one for no reason but its length.
 *
 * Renders one zero-height element and nothing else. If the observer is missing,
 * `article_opened` still fires and only the completion signal is lost.
 */
export function ArticleAnalytics({ slug, category }: { slug: string; category: string }) {
  useEffect(() => {
    events.articleOpened(slug, category)
  }, [slug, category])

  useEffect(() => {
    const node = document.getElementById('article-end')
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      events.articleRead(slug, category)
      observer.disconnect()
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [slug, category])

  return null
}
