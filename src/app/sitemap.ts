import type { MetadataRoute } from 'next'

import { getCategoryCounts, getPosts, getTags, siteUrl } from '@/lib/posts'
import { homePath, postPath, tagPath, tagsPath } from '@/lib/urls'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of siteConfig.locales) {
    entries.push({
      url: siteUrl(homePath(locale)),
      changeFrequency: 'weekly',
      priority: locale === siteConfig.defaultLocale ? 1 : 0.8,
    })
    entries.push({
      url: siteUrl(tagsPath(locale)),
      changeFrequency: 'weekly',
      priority: 0.6,
    })

    const terms = new Set([
      ...(await getTags(locale)).map((term) => term.name),
      ...(await getCategoryCounts(locale)).map((term) => term.name),
    ])
    for (const term of terms) {
      entries.push({
        url: siteUrl(tagPath(locale, term)),
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }

    for (const post of await getPosts(locale)) {
      entries.push({
        url: siteUrl(postPath(locale, post.slug)),
        lastModified: new Date(`${post.updated ?? post.date}T00:00:00Z`),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  return entries
}