import type { Metadata } from 'next'
import { AkHeading } from '@swufefox/ak-ui-react'

import { SearchClient } from '@/components/search-client'
import { ui } from '@/lib/i18n'
import { kicker } from '@/lib/kickers'
import { formatDate, getPosts } from '@/lib/posts'
import { searchPath } from '@/lib/urls'
import { siteConfig, type Locale } from '@/site.config'

export function getSearchMetadata(resolved: Locale): Metadata {
  return {
    title: siteConfig.nav[resolved].search,
    description: siteConfig.description[resolved],
    alternates: {
      canonical: searchPath(resolved),
      languages: Object.fromEntries(
        siteConfig.locales.map((entry) => [entry, searchPath(entry)]),
      ),
    },
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ locale: resolved }: { locale: Locale }) {
  const copy = ui(resolved)

  const posts = await getPosts(resolved)
  const items = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    tags: post.tags,
    category: post.category,
    date: post.date,
    time: formatDate(post.date, resolved),
  }))

  return (
    <section className="route-page search-page">
      <header className="route-head">
        <AkHeading
          title={siteConfig.nav[resolved].search}
          en={kicker(resolved, 'search')}
          stack
          level={1}
          size="lg"
        />
        <SearchClient
          items={items}
          locale={resolved}
          labels={{
            label: copy.searchLabel,
            placeholder: copy.searchPlaceholder,
            foundOne: copy.searchFoundOne,
            foundMany: copy.searchFoundMany,
            none: copy.searchNone,
            clear: copy.searchClear,
            hint: copy.searchHint,
          }}
        />
      </header>
    </section>
  )
}