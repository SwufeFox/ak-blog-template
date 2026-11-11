import { getPosts, siteUrl, toISODate } from '@/lib/posts'
import { feedPath, postPath } from '@/lib/urls'
import { isLocale, siteConfig } from '@/site.config'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return siteConfig.locales.map((locale) => ({ locale }))
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const resolved = isLocale(locale) ? locale : siteConfig.defaultLocale
  const posts = await getPosts(resolved)

  const items = posts
    .map((post) => {
      const url = escapeXml(siteUrl(postPath(resolved, post.slug)))
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(toISODate(post.updated ?? post.date)).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)} ${escapeXml(siteConfig.suffix)}</title>
    <link>${escapeXml(siteUrl())}</link>
    <description>${escapeXml(siteConfig.description[resolved])}</description>
    <language>${resolved}</language>
    <atom:link href="${escapeXml(siteUrl(feedPath(resolved)))}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}