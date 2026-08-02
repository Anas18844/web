import type { MetadataRoute } from 'next'
import { site } from '@/content/site'
import { byDate } from '@/content/knowledge'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/courses`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site.url}/platform`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${site.url}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${site.url}/parents`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    /**
     * The Knowledge Center is the only part of the site that grows on its own,
     * so it is also the only part crawlers have a reason to revisit often.
     * Each article carries its own publication date rather than "now" — a
     * lastModified that changes on every deploy teaches a crawler to ignore it.
     */
    { url: `${site.url}/knowledge`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...byDate.map((article) => ({
      url: `${site.url}/knowledge/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),

    { url: `${site.url}/links`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
