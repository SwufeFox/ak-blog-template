import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AkBreadcrumb, AkDivider, AkHeading } from '@swufefox/ak-ui-react'

import { PostNewsList } from '@/components/post-news-list'
import { ui } from '@/lib/i18n'
import { kicker } from '@/lib/kickers'
import { getCategoryCounts, getPostsByTerm, getTags, termExists } from '@/lib/posts'
import { tagPath, tagsPath } from '@/lib/urls'
import { siteConfig, type Locale } from '@/site.config'

export async function getTermParams(locale: Locale) {
  const terms = new Set<string>()
  for (const tag of await getTags(locale)) terms.add(tag.name)
  for (const category of await getCategoryCounts(locale)) terms.add(category.name)
  return [...terms].map((tag) => ({ tag }))
}

/** Route segments arrive percent-decoded, but a hand-typed URL may not be. */
function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function getTermMetadata(resolved: Locale, tag: string): Promise<Metadata> {
  const term = decodeSegment(tag)
  const languages: Record<string, string> = {}
  for (const entry of siteConfig.locales) {
    if (await termExists(term, entry)) languages[entry] = tagPath(entry, term)
  }
  return {
    title: `#${term}`,
    description: siteConfig.description[resolved],
    alternates: {
      canonical: tagPath(resolved, term),
      languages,
    },
  }
}

export default async function TermPage({ locale: resolved, tag }: { locale: Locale; tag: string }) {
  const term = decodeSegment(tag)

  if (!(await termExists(term, resolved))) notFound()

  const copy = ui(resolved)
  const posts = await getPostsByTerm(term, resolved)

  return (
    <div className="route-page">
      <header className="route-head">
        <AkBreadcrumb
          ariaLabel={copy.breadcrumb}
          items={[
            { label: siteConfig.nav[resolved].tags, href: tagsPath(resolved) },
            { label: `#${term}` },
          ]}
        />
        <AkHeading
          title={`#${term}`}
          en={kicker(resolved, 'tags')}
          stack
          level={1}
          size="lg"
        />
        <p className="route-head__summary">{copy.postsCount(posts.length)}</p>
      </header>

      <AkDivider className="route-divider" variant="accent" aria-hidden="true" />
      <PostNewsList posts={posts} locale={resolved} label={copy.postsLabel} empty={copy.empty} />
    </div>
  )
}