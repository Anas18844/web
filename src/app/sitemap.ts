import type { MetadataRoute } from 'next'
import { site } from '@/content/site'
import { byDate } from '@/content/knowledge'

/**
 * When the static pages last actually changed.
 *
 * NOT `new Date()`. A lastmod that moves on every deploy tells a crawler that
 * every page changed every time a typo was fixed somewhere else — and a crawler
 * that is told that a few times stops believing the field at all, which costs
 * the site the one signal that makes a REAL update get recrawled quickly.
 *
 * Bump this by hand when a page's content genuinely changes. Being a little
 * stale here is harmless; being wrong every deploy is not.
 */
const CONTENT_UPDATED = new Date('2026-08-17')

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${site.url}/about`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${site.url}/parents`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    /**
     * The Knowledge Center is the only part of the site that grows on its own,
     * so it is also the only part crawlers have a reason to revisit often.
     * Each article carries its own publication date rather than "now" — a
     * lastModified that changes on every deploy teaches a crawler to ignore it.
     */
    {
      url: `${site.url}/knowledge`,
      // The one page whose lastmod is genuinely derived: it changes exactly
      // when a new article is published, which is what the field means.
      lastModified: byDate[0] ? new Date(byDate[0].date) : CONTENT_UPDATED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...byDate.map((article) => ({
      url: `${site.url}/knowledge/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),

    {
      url: `${site.url}/links`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]
}
