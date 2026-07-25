import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/parents`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/links`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
