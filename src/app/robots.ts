import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/posts'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: siteUrl('/sitemap.xml'),
    host: siteConfig.url,
  }
}