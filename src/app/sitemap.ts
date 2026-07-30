import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/courses`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site.url}/platform`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${site.url}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${site.url}/parents`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/links`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
